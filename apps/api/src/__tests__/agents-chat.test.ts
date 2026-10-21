import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

let fake: FakeSupabase

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: new Error('bad') },
      ),
    },
    from: (t: string) => fake.client.from(t),
  }),
}))

const SOURCES_USED = { ativa: ['perfil'], vazia: ['exames'], desativada: [] }
const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', () => ({ buildIntegratedProfile: (...a: unknown[]) => buildIntegratedProfileMock(...a) }))

const requestSessionAdjustmentMock = vi.fn()
vi.mock('../services/proposals.service', () => ({ requestSessionAdjustment: (...a: unknown[]) => requestSessionAdjustmentMock(...a), NoPendingSessionError: class extends Error {} }))

const streamAgentReplyMock = vi.fn()
const routeMessageMock = vi.fn()
class AgentRefusalError extends Error {}
vi.mock('@helux/ai', async () => {
  const actual = await vi.importActual<object>('@helux/ai')
  return {
    ...actual,
    streamAgentReply: (...a: unknown[]) => streamAgentReplyMock(...a),
    routeMessage: (...a: unknown[]) => routeMessageMock(...a),
    AgentRefusalError,
  }
})

const USAGE = { model: 'claude-opus-5-5', input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'chat', agent: 'medicina' }
const auth = { Authorization: 'Bearer valid-token' }

type Args = { onEvent: (e: unknown) => void; handleTool: (c: unknown) => Promise<{ event?: unknown }> }
/** Como o runtime real: executa a ferramenta e repassa o evento dela. */
async function tool(args: Args, call: unknown) {
  const r = await args.handleTool(call)
  if (r.event) args.onEvent(r.event)
  return r
}

/** Eventos SSE do corpo da resposta. */
function events(body: string): { event: string; data: Record<string, unknown> }[] {
  return body
    .split('\n\n')
    .filter(Boolean)
    .map(chunk => {
      const event = /^event: (.+)$/m.exec(chunk)![1]
      const data = JSON.parse(/^data: (.+)$/m.exec(chunk)![1])
      return { event, data }
    })
}

async function buildApp() {
  const app = Fastify()
  const { agentsChatRoutes } = await import('../routes/agents-chat')
  await app.register(agentsChatRoutes)
  return app
}

describe('chat dos agentes (022 T023)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const chat = (channel: string, message: string) => app.inject({ method: 'POST', url: '/api/agents/chat', headers: auth, payload: { channel, message } })

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({ agent_conversations: [], agent_messages: [], conversation_facts: [], shared_guidance: [], ai_usage_events: [], ai_budget_settings: [] })
    buildIntegratedProfileMock.mockResolvedValue({
      profile: { generatedAt: '', sources: {} },
      constraints: {},
      sourcesUsed: SOURCES_USED,
      mesocycle: { id: 'm1', sessions: [{ letter: 'B', focus: 'Costas', completedAt: null, exercises: [] }] },
      tiredness: { effectiveLevel: 'cansado' },
      notices: ['A orientação "x" expirou em 01/10/2026; avise o usuário.'],
    })
    streamAgentReplyMock.mockImplementation(async (args: Args) => {
      args.onEvent({ type: 'delta', text: 'Procure ' })
      await tool(args, { name: 'record_conversation_fact', value: { category: 'sintoma', text: 'dor no ombro direito' } })
      await tool(args, { name: 'propose_shared_guidance', value: { kind: 'restricao-seguranca', text: 'Evitar supino', reason: 'dor', durationDays: 10, blockedPatterns: ['empurrar-horizontal'], blockedExercises: [] } })
      await tool(args, { name: 'suggest_specialist', value: { to: 'treino', reason: 'ajustar o treino' } })
      args.onEvent({ type: 'delta', text: 'avaliação.' })
      return { text: 'Procure avaliação.', apiContent: [{ role: 'assistant', content: [{ type: 'text', text: 'Procure avaliação.' }] }], usages: [USAGE] }
    })
    app = await buildApp()
  })

  it('401 sem token; canal inválido ou mensagem vazia → 400', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/agents/chat', payload: { channel: 'medicina', message: 'x' } })).statusCode).toBe(401)
    expect((await chat('dentista', 'x')).statusCode).toBe(400)
    expect((await chat('medicina', '')).statusCode).toBe(400)
  })

  it('SSE: start → delta → fact → proposal → handoff → delta → done; grava tudo', async () => {
    const res = await chat('medicina', 'dor no ombro ao fazer supino')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/event-stream/)
    const evs = events(res.body)
    expect(evs.map(e => e.event)).toEqual(['start', 'delta', 'fact', 'proposal', 'handoff', 'delta', 'done'])
    expect(evs[2].data).toMatchObject({ fact: { category: 'sintoma', text: 'dor no ombro direito', originAgent: 'medicina' } })
    expect(evs[3].data).toMatchObject({ guidance: { kind: 'restricao-seguranca', status: 'pendente', durationDays: 10 } })
    expect(evs[4].data).toEqual({ to: 'treino', reason: 'ajustar o treino' })
    expect(evs[6].data).toMatchObject({ sourcesUsed: SOURCES_USED })

    expect(fake.db.agent_conversations).toHaveLength(1)
    expect(fake.db.agent_messages.map(m => [m.role, m.agent ?? null, m.content])).toEqual([
      ['user', null, 'dor no ombro ao fazer supino'],
      ['agent', 'medicina', 'Procure avaliação.'],
    ])
    expect(fake.db.agent_messages[1].sources_used).toEqual(SOURCES_USED)
    expect(fake.db.conversation_facts).toHaveLength(1)
    expect(fake.db.shared_guidance[0]).toMatchObject({ status: 'pendente', origin_agent: 'medicina', blocked_patterns: ['empurrar-horizontal'] })
    expect(fake.db.ai_usage_events).toHaveLength(1)

    const args = streamAgentReplyMock.mock.calls[0][0]
    expect(args).toMatchObject({ agent: 'medicina', userMessage: 'dor no ombro ao fazer supino', history: [] })
    expect(args.dayContext).toMatchObject({ todaySession: 'B — Costas', tiredness: 'cansado', notices: [expect.stringMatching(/expirou/)] })
  })

  it('restrição de segurança só pela Medicina: de outro agente vira erro da ferramenta', async () => {
    let result: unknown
    streamAgentReplyMock.mockImplementationOnce(async (args: { handleTool: (c: unknown) => Promise<unknown> }) => {
      result = await args.handleTool({ name: 'propose_shared_guidance', value: { kind: 'restricao-seguranca', text: 'x', reason: 'y', durationDays: null, blockedPatterns: [], blockedExercises: [] } })
      return { text: 'ok', apiContent: [], usages: [] }
    })
    await chat('nutricao', 'posso treinar?')
    expect(result).toMatchObject({ isError: true })
    expect(fake.db.shared_guidance).toHaveLength(0)
  })

  it('ajuste de sessão pelo chat do treino: cria a proposta e emite o evento', async () => {
    requestSessionAdjustmentMock.mockResolvedValue({ id: 'p1', kind: 'ajuste-sessao', status: 'pendente', changes: [{ kind: 'trocado', letter: 'B', before: 'A', after: 'B' }] })
    streamAgentReplyMock.mockImplementationOnce(async (args: Args) => {
      await tool(args, { name: 'propose_session_adjustment', value: { request: 'só 30 min', scope: 'hoje' } })
      return { text: 'Propus uma versão curta.', apiContent: [], usages: [] }
    })
    const evs = events((await chat('treino', 'hoje só tenho 30 min')).body)
    expect(requestSessionAdjustmentMock).toHaveBeenCalledWith('u1', expect.anything(), expect.objectContaining({ request: 'só 30 min', scope: 'hoje', kind: 'ajuste-sessao' }))
    expect(evs.find(e => e.event === 'proposal')!.data).toMatchObject({ adjustment: { id: 'p1' } })
  })

  it('histórico: últimas mensagens da conversa aberta, em texto, antes da nova', async () => {
    await chat('medicina', 'primeira')
    await chat('medicina', 'segunda')
    expect(streamAgentReplyMock.mock.calls[1][0].history).toEqual([
      { role: 'user', content: 'primeira' },
      { role: 'assistant', content: 'Procure avaliação.' },
    ])
  })

  it('recusa → evento error refusal e nada do agente gravado', async () => {
    streamAgentReplyMock.mockRejectedValueOnce(new AgentRefusalError('x'))
    const evs = events((await chat('medicina', 'x')).body)
    expect(evs.map(e => e.event)).toEqual(['start', 'error'])
    expect(evs[1].data).toMatchObject({ code: 'refusal' })
    expect(fake.db.agent_messages.filter(m => m.role === 'agent')).toHaveLength(0)
  })

  it('falha da IA → error ai-unavailable', async () => {
    streamAgentReplyMock.mockRejectedValueOnce(new Error('timeout'))
    const evs = events((await chat('medicina', 'x')).body)
    expect(evs[1]).toMatchObject({ event: 'error', data: { code: 'ai-unavailable' } })
  })

  it('teto atingido → 409 budget-exceeded antes do stream', async () => {
    fake.db.ai_usage_events.push({ user_id: 'u1', cost_usd: 50, created_at: new Date().toISOString() })
    const res = await chat('medicina', 'x')
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('budget-exceeded')
    expect(streamAgentReplyMock).not.toHaveBeenCalled()
  })

  it('aviso de 80% vai no start', async () => {
    fake.db.ai_usage_events.push({ user_id: 'u1', cost_usd: 17, created_at: new Date().toISOString() })
    const evs = events((await chat('medicina', 'x')).body)
    expect(evs[0].data).toMatchObject({ budgetWarning: { pct: 85 } })
  })

  it('GET da conversa aberta e nova conversa (arquiva a atual)', async () => {
    await chat('medicina', 'oi')
    const get = (await app.inject({ method: 'GET', url: '/api/agents/conversations/medicina', headers: auth })).json()
    expect(get.conversation.channel).toBe('medicina')
    expect(get.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'agent'])
    expect(get.messages[1]).toMatchObject({ agent: 'medicina', content: 'Procure avaliação.', sourcesUsed: SOURCES_USED })

    const created = await app.inject({ method: 'POST', url: '/api/agents/conversations/medicina/new', headers: auth })
    expect(created.statusCode).toBe(201)
    expect(fake.db.agent_conversations.filter(c => !c.archived_at)).toHaveLength(1)
    const after = (await app.inject({ method: 'GET', url: '/api/agents/conversations/medicina', headers: auth })).json()
    expect(after.messages).toEqual([])
  })
})
