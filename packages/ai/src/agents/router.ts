import { AGENT_KEYS, type AgentKey, type UsageRecord } from '@helux/types'
import { AGENT_MODEL, anthropic, FALLBACK_PARAMS, messageText, usagesFromMessage } from './client'

// Roteamento do chat "Equipe Helux" (022 R4). Atalho determinístico de
// segurança: sinais de alerta médico (R10) vão direto para a Medicina Esportiva.

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Um padrão por sinal da lista fechada `MEDICAL_RED_FLAGS` (personas.ts), sobre texto sem acento. */
const RED_FLAG_PATTERNS: RegExp[] = [
  /\b(dor|aperto|pressao)( forte| muito forte)? (no|na|do) peito/,
  /falta de ar.{0,40}(desproporcional|muito forte|em repouso|nao passa)/,
  /\b(quase )?desmai/,
  /(palpitac\w*.{0,40}tontur|tontur\w*.{0,40}palpitac)/,
  /perd\w*.{0,30}(forca|sensibilidade).{0,40}(subit|de repente|repentin)|(subit|de repente|repentin)\w*.{0,30}perd\w*.{0,30}(forca|sensibilidade)|perda subita/,
  /(dormencia|dormente|formigamento).{0,40}(nao passa|persist|um lado|lado do corpo|braco esquerdo)/,
  /dor de cabeca.{0,30}(subita|intensa|muito forte|explosiva)/,
  /inch\w*.{0,40}(muito|deform)|deformad/,
  /estalo.{0,60}(nao consig|sem conseguir|incapaz).{0,20}(apoiar|mover|andar|pisar)/,
  /urina.{0,20}(escura|marrom|cor de coca|coca-cola)/,
  /febre.{0,40}dor muscular.{0,15}(intensa|forte)|dor muscular (intensa|forte).{0,40}febre/,
]

/** Mensagem com sinal de alerta médico? Puro; usado antes do roteador (pula a chamada de IA). */
export function matchesMedicalRedFlag(message: string): boolean {
  const text = normalize(message)
  return RED_FLAG_PATTERNS.some(p => p.test(text))
}

/** Turno recente da conversa Equipe (texto), para dar contexto ao roteador. */
export interface RecentTurn {
  role: 'user' | 'agent'
  content: string
}

const ROUTER_SYSTEM = `Você é o roteador do chat "Equipe Helux". Escolha qual especialista deve responder à mensagem nova do usuário:
- treino: prescrição e ajuste de treino, exercícios, volume, cargas, descanso, periodização, execução.
- medicina: dor, lesão, sintomas, prevenção, aquecimento e mobilidade, retorno após lesão ou pausa, sinais de risco, biomarcadores de desgaste e recuperação.
- nutricao: alimentação, timing peri-treino, substituições de alimentos, suplementação, genética nutricional, fase de dieta.
Na dúvida entre treino e medicina por causa de um sintoma, escolha medicina. Use as mensagens recentes só como contexto. Responda com o especialista e um motivo curto.`

const ROUTER_SCHEMA = {
  type: 'object',
  properties: {
    agent: { type: 'string', enum: [...AGENT_KEYS] },
    reason: { type: 'string' },
  },
  required: ['agent', 'reason'],
  additionalProperties: false,
} as const

/**
 * Roteador do chat Equipe (R4): chamada curta com saída estruturada. Recusa
 * ou resposta inválida caem no Agente de Treino (que encaminha se precisar).
 */
export async function routeMessage(args: { message: string; recent: RecentTurn[] }): Promise<{ agent: AgentKey; reason: string; usage: UsageRecord }> {
  const context = args.recent.map(t => `${t.role === 'user' ? 'Usuário' : 'Especialista'}: ${t.content}`).join('\n')
  const message = await anthropic().beta.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1000,
    ...FALLBACK_PARAMS,
    betas: [...FALLBACK_PARAMS.betas],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ROUTER_SCHEMA } },
    system: [{ type: 'text', text: ROUTER_SYSTEM, cache_control: { type: 'ephemeral', ttl: '1h' } }],
    messages: [{ role: 'user', content: `${context ? `Mensagens recentes:\n${context}\n\n` : ''}Mensagem nova: ${args.message}` }],
  })
  const [usage] = usagesFromMessage(message, 'roteamento', null)
  if (message.stop_reason !== 'refusal') {
    try {
      const out = JSON.parse(messageText(message)) as { agent: AgentKey; reason: string }
      if (AGENT_KEYS.includes(out.agent)) return { agent: out.agent, reason: out.reason, usage }
    } catch {
      // cai no padrão
    }
  }
  return { agent: 'treino', reason: 'roteamento indisponível', usage }
}
