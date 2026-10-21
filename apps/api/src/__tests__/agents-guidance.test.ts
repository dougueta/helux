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
})
