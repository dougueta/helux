import type { AgentKey, AgentMessage, Channel, ConversationFact, SharedGuidance } from '@helux/types'
import { agentsOf, mockId, mockIntegratedProfile } from './agents'
import { getBrowserMock } from './runtime'

// Chat simulado do modo mock (spec 021 + 022 R12): respostas pré-gravadas por
// especialista, entregues como SSE, sem chamar a IA. Grava a conversa, o relato
// e a orientação no dataset local, como a API faria.

/** Roteamento por palavras-chave, só para o mock (a API usa o roteador de IA). */
function routeMock(message: string): AgentKey {
  const t = message.toLowerCase()
  if (/dor|les[aã]o|machuc|peito|inchad|torç|tontur/.test(t)) return 'medicina'
  if (/comer|aliment|dieta|suplement|caf[eé]|whey|lactose|refei/.test(t)) return 'nutricao'
  return 'treino'
}

const REPLIES: Record<AgentKey, (message: string) => string> = {
  treino: () =>
    'Hoje é a sessão B do seu mesociclo. Pelo seu cansaço normal e pelo histórico de cargas, dá para manter o volume planejado. Se o tempo estiver curto, use "Ajustar o treino de hoje" e eu monto uma versão enxuta para você confirmar. (Resposta simulada do modo mock.)',
  medicina: () =>
    'Dor na frente do ombro durante o supino costuma ter relação com a carga e a amplitude. Algumas perguntas: a dor aparece só no movimento ou também em repouso? Houve inchaço ou perda de força? Por enquanto, proponho evitar empurrar acima da cabeça e reduzir a carga do supino. Isto não substitui avaliação médica presencial. (Resposta simulada do modo mock.)',
  nutricao: () =>
    'No pré-treino de hoje, 60 a 90 minutos antes: banana com aveia e whey isolado zero lactose (seu MCM6 G,G pede nada com lactose). O café está liberado: seu ADORA2A indica boa tolerância. Para dose de suplementos, converse com médico ou nutricionista. (Resposta simulada do modo mock.)',
}

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

/** `Response` com o stream SSE simulado (o leitor de SSE da web funciona igual). */
export async function mockChatResponse(body: string): Promise<Response> {
  const { channel, message } = JSON.parse(body) as { channel: Channel; message: string }
  const { store } = getBrowserMock()
  const data = store.getDataset()
  if (data.failReads) return new Response(JSON.stringify({ error: 'O serviço de IA não respondeu.', code: 'ai-unavailable' }), { status: 503 })

  const agent = channel === 'equipe' ? routeMock(message) : channel
  const now = () => new Date().toISOString()
  const userMsg: AgentMessage = { id: mockId('mock-msg'), role: 'user', agent: null, content: message, sourcesUsed: null, createdAt: now() }
  const text = REPLIES[agent](message)
  const sourcesUsed = (() => {
    const p = mockIntegratedProfile(data)
    const keys = Object.keys(p.sources) as (keyof typeof p.sources)[]
    return { ativa: keys.filter(k => p.sources[k].status === 'ativa'), vazia: keys.filter(k => p.sources[k].status === 'vazia'), desativada: keys.filter(k => p.sources[k].status === 'desativada') }
  })()

  const chunks: string[] = [sse('start', { userMessageId: userMsg.id })]
  if (channel === 'equipe') chunks.push(sse('routed', { agent, reason: 'roteamento simulado por palavras-chave' }))
  const words = text.split(/(?<= )/)
  const half = Math.ceil(words.length / 2)
  chunks.push(sse('delta', { text: words.slice(0, half).join('') }))

  let fact: ConversationFact | null = null
  let guidance: SharedGuidance | null = null
  if (agent === 'medicina') {
    fact = { id: mockId('mock-fact'), category: 'sintoma', text: message.slice(0, 280), originAgent: 'medicina', createdAt: now(), updatedAt: now() }
    guidance = {
      id: mockId('mock-guidance'),
      kind: 'restricao-seguranca',
      text: 'Evitar empurrar acima da cabeça por 10 dias',
      reason: 'Dor no ombro relatada na conversa',
      originAgent: 'medicina',
      status: 'pendente',
      startsAt: null,
      expiresAt: null,
      durationDays: 10,
      blockedPatterns: ['empurrar-vertical'],
      blockedExercises: [],
      createdAt: now(),
    }
    chunks.push(sse('fact', { fact }), sse('proposal', { guidance }))
  }
  chunks.push(sse('delta', { text: words.slice(half).join('') }))

  const agentMsg: AgentMessage = { id: mockId('mock-msg'), role: 'agent', agent, content: text, sourcesUsed, createdAt: now() }
  chunks.push(sse('done', { agentMessageId: agentMsg.id, agent, sourcesUsed }))

  store.updateDataset(d => {
    const a = agentsOf(d)
    return {
      agents: {
        ...a,
        conversations: { ...a.conversations, [channel]: [...(a.conversations[channel] ?? []), userMsg, agentMsg] },
        facts: fact ? [...a.facts, fact] : a.facts,
        guidance: guidance ? [...a.guidance, guidance] : a.guidance,
        spentUsd: Math.round((a.spentUsd + 0.03) * 100) / 100,
      },
    }
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}
