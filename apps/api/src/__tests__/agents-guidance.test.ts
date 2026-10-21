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

const detectGuidanceConflictMock = vi.fn()
vi.mock('@helux/ai', async () => {
  const actual = await vi.importActual<object>('@helux/ai')
  return { ...actual, detectGuidanceConflict: (...a: unknown[]) => detectGuidanceConflictMock(...a) }
})

const auth = { Authorization: 'Bearer valid-token' }
const G = (over: Record<string, unknown> = {}) => ({
  id: 'g1',
  user_id: 'u1',
  kind: 'restricao-seguranca',
  text: 'Evitar empurrar acima da cabeça',
  reason: 'dor no ombro',
  origin_agent: 'medicina',
  status: 'pendente',
  starts_at: null,
  expires_at: null,
  duration_days: 10,
  blocked_patterns: ['empurrar-vertical'],
  blocked_exercises: [],
  created_at: '2026-10-20T10:00:00Z',
  ...over,
})

async function buildApp() {
  const app = Fastify()
  const { agentsGuidanceRoutes } = await import('../routes/agents-guidance')
  await app.register(agentsGuidanceRoutes)
  return app
}

describe('aceite de orientações compartilhadas (022 T025, FR-018/019)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({ shared_guidance: [G()], ai_usage_events: [], ai_budget_settings: [] })
    app = await buildApp()
  })

  it('aceitar: pendente → ativa com início e prazo pelo duration_days', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/agents/guidance/g1/accept', headers: auth })
    expect(res.statusCode).toBe(200)
    const g = res.json()
    expect(g).toMatchObject({ id: 'g1', status: 'ativa', durationDays: 10 })
    expect(Date.parse(g.expiresAt) - Date.parse(g.startsAt)).toBe(10 * 24 * 60 * 60 * 1000)
    expect(fake.db.shared_guidance[0].status).toBe('ativa')
  })

  it('sem prazo: ativa sem expiração', async () => {
    fake.db.shared_guidance[0].duration_days = null
    const g = (await app.inject({ method: 'POST', url: '/api/agents/guidance/g1/accept', headers: auth })).json()
    expect(g.expiresAt).toBeNull()
  })

  it('recusar: pendente → recusada; repetir → 409; inexistente → 404', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/agents/guidance/g1/reject', headers: auth })).json()).toMatchObject({ status: 'recusada' })
    expect((await app.inject({ method: 'POST', url: '/api/agents/guidance/g1/accept', headers: auth })).statusCode).toBe(409)
    expect((await app.inject({ method: 'POST', url: '/api/agents/guidance/xx/accept', headers: auth })).statusCode).toBe(404)
  })

  it('recomendação que conflita com restrição ativa: ambas ativas, conflito avisado e gravado (FR-021)', async () => {
    fake.db.shared_guidance = [
      G({ id: 'r1', status: 'ativa', text: 'Sem carga axial', starts_at: '2026-10-19T10:00:00Z' }),
      G({ id: 'c1', kind: 'recomendacao', origin_agent: 'nutricao', text: 'Treinar perna pesado para usar o carboidrato', duration_days: null, blocked_patterns: [] }),
    ]
    detectGuidanceConflictMock.mockResolvedValue({ conflictWith: 'r1', usage: { model: 'claude-opus-5-5', input_tokens: 10, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'conflito', agent: null } })
    const res = await app.inject({ method: 'POST', url: '/api/agents/guidance/c1/accept', headers: auth })
    expect(res.json()).toMatchObject({ status: 'ativa', conflictsWith: 'r1', conflict: { guidanceId: 'r1', text: 'Sem carga axial' } })
    expect(fake.db.shared_guidance[1]).toMatchObject({ status: 'ativa', conflicts_with: 'r1' })
    expect(fake.db.ai_usage_events).toHaveLength(1)
  })

  it('restrição de segurança ou sem restrições ativas: não consulta a IA', async () => {
    await app.inject({ method: 'POST', url: '/api/agents/guidance/g1/accept', headers: auth })
    expect(detectGuidanceConflictMock).not.toHaveBeenCalled()
  })
})
