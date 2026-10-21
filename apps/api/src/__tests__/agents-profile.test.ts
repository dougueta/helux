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

const PROFILE = { generatedAt: '2026-10-20T10:00:00Z', sources: { perfil: { status: 'ativa', summary: 'x', updatedAt: null, data: null } } }
const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', () => ({ buildIntegratedProfile: (...a: unknown[]) => buildIntegratedProfileMock(...a) }))

const auth = { Authorization: 'Bearer valid-token' }

async function buildApp() {
  const app = Fastify()
  const { agentsProfileRoutes } = await import('../routes/agents-profile')
  await app.register(agentsProfileRoutes)
  return app
}

describe('Perfil Integrado e controle (022 T018)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({
      agent_source_settings: [],
      ai_usage_events: [{ user_id: 'u1', cost_usd: 5, created_at: new Date().toISOString() }],
      ai_budget_settings: [],
      conversation_facts: [{ id: 'f1', user_id: 'u1', category: 'sintoma', text: 'dor no ombro', origin_agent: 'medicina', created_at: '2026-10-19T10:00:00Z', updated_at: '2026-10-19T10:00:00Z', deleted_at: null }],
      shared_guidance: [{ id: 'g1', user_id: 'u1', kind: 'restricao-seguranca', text: 'evitar supino', reason: 'ombro', origin_agent: 'medicina', status: 'ativa' }],
    })
    buildIntegratedProfileMock.mockResolvedValue({ profile: PROFILE })
    app = await buildApp()
  })

  it('GET /api/agents/profile: perfil + teto e consumo do mês', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/agents/profile', headers: auth })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ...PROFILE, budget: { capUsd: 20, spentUsd: 5, pct: 25 } })
  })

  it('PUT /api/agents/sources/:source liga/desliga; fonte inválida → 400', async () => {
    expect((await app.inject({ method: 'PUT', url: '/api/agents/sources/exames', headers: auth, payload: { enabled: false } })).statusCode).toBe(204)
    expect(fake.db.agent_source_settings[0]).toMatchObject({ user_id: 'u1', source: 'exames', enabled: false })
    await app.inject({ method: 'PUT', url: '/api/agents/sources/exames', headers: auth, payload: { enabled: true } })
    expect(fake.db.agent_source_settings).toHaveLength(1)
    expect(fake.db.agent_source_settings[0].enabled).toBe(true)
    expect((await app.inject({ method: 'PUT', url: '/api/agents/sources/xpto', headers: auth, payload: { enabled: false } })).statusCode).toBe(400)
  })

  it('PUT /api/agents/budget: teto ≥ 1', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/agents/budget', headers: auth, payload: { monthlyCapUsd: 10 } })
    expect(res.json()).toEqual({ capUsd: 10, spentUsd: 5, pct: 50 })
    expect((await app.inject({ method: 'PUT', url: '/api/agents/budget', headers: auth, payload: { monthlyCapUsd: 0 } })).statusCode).toBe(400)
  })

  it('relatos: editar texto (3–280) e remover (lógico)', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/api/agents/facts/f1', headers: auth, payload: { text: 'dor no ombro direito' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: 'f1', text: 'dor no ombro direito' })
    expect((await app.inject({ method: 'PATCH', url: '/api/agents/facts/f1', headers: auth, payload: { text: 'x' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'DELETE', url: '/api/agents/facts/f1', headers: auth })).statusCode).toBe(204)
    expect(fake.db.conversation_facts[0].deleted_at).toBeTruthy()
    expect((await app.inject({ method: 'PATCH', url: '/api/agents/facts/nao-existe', headers: auth, payload: { text: 'abc' } })).statusCode).toBe(404)
  })

  it('DELETE /api/agents/guidance/:id: ativa → removida; já removida → 409', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/api/agents/guidance/g1', headers: auth })).statusCode).toBe(204)
    expect(fake.db.shared_guidance[0].status).toBe('removida')
    expect((await app.inject({ method: 'DELETE', url: '/api/agents/guidance/g1', headers: auth })).statusCode).toBe(409)
  })
})
