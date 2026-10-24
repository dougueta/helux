import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 024 T057 — condições de saúde: catálogo, "outra" com regras propostas, crise de gota.

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

const proposeMock = vi.fn()
vi.mock('@helux/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@helux/ai')>()
  return { ...actual, proposeConditionRules: (...a: unknown[]) => proposeMock(...a) }
})

class BudgetExceededError extends Error {}
const assertBudgetMock = vi.fn()
const recordUsageMock = vi.fn()
vi.mock('../services/ai-budget.service', () => ({
  assertBudget: (...a: unknown[]) => assertBudgetMock(...a),
  recordUsage: (...a: unknown[]) => recordUsageMock(...a),
  BudgetExceededError,
}))

async function buildApp() {
  const app = Fastify()
  const { conditionsRoutes } = await import('../routes/conditions')
  await app.register(conditionsRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }
const NOW_PLUS = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

describe('condições de saúde (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({ health_conditions: [], shared_guidance: [] })
    assertBudgetMock.mockResolvedValue({ warning: null })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/conditions' })).statusCode).toBe(401)
  })

  it('GET: condições do usuário com regras e o catálogo', async () => {
    fake.db.health_conditions.push(
      { id: 'c1', user_id: 'u1', catalog_key: 'artrose', custom_label: null, region: 'joelho', side: 'esquerdo', since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null },
      { id: 'c2', user_id: 'outro', catalog_key: 'gota', custom_label: null, region: 'sistemica', side: null, since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null },
    )
    const body = (await app.inject({ method: 'GET', url: '/api/conditions', headers: AUTH })).json()
    expect(body.conditions).toEqual([expect.objectContaining({ id: 'c1', catalogKey: 'artrose', side: 'esquerdo', flare: null, rules: expect.objectContaining({ maxJointStress: { joelho: 1 }, maxCardioImpact: 0 }) })])
    expect(body.catalog.map((c: { key: string }) => c.key)).toContain('lca-reconstrucao')
  })

  it('POST do catálogo: grava e devolve as regras', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { catalogKey: 'lca-reconstrucao', region: 'joelho', side: 'esquerdo', count: 2, status: 'controlada' } })
    expect(res.statusCode).toBe(201)
    expect(res.json().rules).toMatchObject({ maxJointStress: { joelho: 1 } })
    expect(fake.db.health_conditions[0]).toMatchObject({ user_id: 'u1', catalog_key: 'lca-reconstrucao', count: 2 })
    expect(proposeMock).not.toHaveBeenCalled()
  })

  it('POST valida catálogo e região', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { catalogKey: 'inexistente', region: 'joelho', status: 'controlada' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { catalogKey: 'lca-reconstrucao', region: 'ombro', status: 'controlada' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { region: 'joelho', status: 'controlada' } })).statusCode).toBe(400)
  })

  it('POST "outra": regras propostas pela Medicina viram orientações pendentes ligadas à condição', async () => {
    proposeMock.mockResolvedValue({
      rules: [{ text: 'Sem saltos', reason: 'impacto', blockedPatterns: ['agachar'], blockedExercises: [] }],
      usages: [{ model: 'claude-opus-5-5', input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'condicao', agent: 'medicina' }],
    })
    const res = await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { customLabel: 'Fascite plantar', region: 'tornozelo', status: 'ativa' } })
    expect(res.statusCode).toBe(201)
    const { condition, proposedGuidance } = res.json()
    expect(proposedGuidance).toEqual([expect.objectContaining({ text: 'Sem saltos', status: 'pendente', kind: 'restricao-seguranca', blockedPatterns: ['agachar'] })])
    expect(fake.db.shared_guidance[0]).toMatchObject({ condition_id: condition.id, origin_agent: 'medicina', status: 'pendente' })
    expect(recordUsageMock).toHaveBeenCalled()
  })

  it('POST "outra" no teto de IA: grava a condição sem regras e avisa', async () => {
    assertBudgetMock.mockRejectedValue(new BudgetExceededError('teto'))
    const res = await app.inject({ method: 'POST', url: '/api/conditions', headers: AUTH, payload: { customLabel: 'Fascite plantar', region: 'tornozelo', status: 'ativa' } })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ proposedGuidance: [], notice: expect.stringMatching(/teto/i) })
  })

  it('PATCH e DELETE só da própria condição', async () => {
    fake.db.health_conditions.push({ id: 'c1', user_id: 'u1', catalog_key: 'lca-reconstrucao', custom_label: null, region: 'joelho', side: null, since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null })
    const patched = await app.inject({ method: 'PATCH', url: '/api/conditions/c1', headers: AUTH, payload: { status: 'resolvida' } })
    expect(patched.statusCode).toBe(200)
    expect(patched.json().rules.maxJointStress).toEqual({})
    expect((await app.inject({ method: 'PATCH', url: '/api/conditions/nao-existe', headers: AUTH, payload: { status: 'ativa' } })).statusCode).toBe(404)
    expect((await app.inject({ method: 'DELETE', url: '/api/conditions/c1', headers: AUTH })).statusCode).toBe(204)
    expect(fake.db.health_conditions).toEqual([])
  })

  it('crise de gota: marca com prazo padrão de 5 dias e encerra; só para gota', async () => {
    fake.db.health_conditions.push(
      { id: 'g1', user_id: 'u1', catalog_key: 'gota', custom_label: null, region: 'sistemica', side: null, since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null },
      { id: 'l1', user_id: 'u1', catalog_key: 'lombalgia', custom_label: null, region: 'lombar', side: null, since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null },
    )
    const res = await app.inject({ method: 'POST', url: '/api/conditions/g1/flare', headers: AUTH, payload: { region: 'joelho' } })
    expect(res.statusCode).toBe(200)
    expect(res.json().condition.flare).toEqual({ region: 'joelho', until: NOW_PLUS(5) })
    expect(res.json().rules).toMatchObject({ maxJointStress: { joelho: 0 }, maxCardioImpact: 0 })
    expect((await app.inject({ method: 'POST', url: '/api/conditions/l1/flare', headers: AUTH, payload: { region: 'lombar' } })).statusCode).toBe(400)
    const ended = await app.inject({ method: 'DELETE', url: '/api/conditions/g1/flare', headers: AUTH })
    expect(ended.json().condition.flare).toBeNull()
  })
})
