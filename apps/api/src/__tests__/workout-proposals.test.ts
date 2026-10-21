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

const SESSION = (letter: string, name: string, completedAt: string | null = null) => ({
  letter,
  focus: `Foco ${letter}`,
  completedAt,
  exercises: [{ name, sets: 4, reps: '8', weight: '80 kg' }],
})
const SESSIONS = [SESSION('A', 'Supino Reto (Barra)', '2026-10-18T10:00:00Z'), SESSION('B', 'Remada Curvada (Barra)'), SESSION('C', 'Agachamento Livre (Barra)')]
const CONSTRAINTS = { availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [] }

const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', () => ({ buildIntegratedProfile: (...a: unknown[]) => buildIntegratedProfileMock(...a) }))

const proposeSessionAdjustmentMock = vi.fn()
class ConstraintsUnsatisfiableError extends Error {
  code = 'constraints-unsatisfiable'
  constructor(
    public violations: unknown[],
    public usages: unknown[],
  ) {
    super('x')
  }
}
class AgentRefusalError extends Error {}
vi.mock('@helux/ai', async () => {
  const actual = await vi.importActual<object>('@helux/ai')
  return { ...actual, proposeSessionAdjustment: (...a: unknown[]) => proposeSessionAdjustmentMock(...a), ConstraintsUnsatisfiableError, AgentRefusalError }
})

const USAGE = { model: 'claude-opus-5-5', input_tokens: 1000, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'ajuste-sessao', agent: 'treino' }
const AFTER_B = { ...SESSION('B', 'Remada Unilateral (Halteres)') }
const auth = { Authorization: 'Bearer valid-token' }

async function buildApp() {
  const app = Fastify()
  const { workoutProposalsRoutes } = await import('../routes/workout-proposals')
  await app.register(workoutProposalsRoutes)
  return app
}

describe('propostas de ajuste de treino (022 T015)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({
      mesocycle_plans: [{ id: 'm1', user_id: 'u1', sessions: structuredClone(SESSIONS), generated_at: '2026-10-10T10:00:00Z', created_at: '2026-10-10T10:00:00Z' }],
      workout_adjustment_proposals: [],
      ai_usage_events: [],
      ai_budget_settings: [],
    })
    buildIntegratedProfileMock.mockResolvedValue({
      profile: { generatedAt: '', sources: {} },
      constraints: CONSTRAINTS,
      mesocycle: { id: 'm1', sessions: structuredClone(SESSIONS) },
    })
    proposeSessionAdjustmentMock.mockResolvedValue({
      after: [AFTER_B],
      changes: [{ sessionIndex: 1, letter: 'B', kind: 'trocado', before: 'Remada Curvada (Barra)', after: 'Remada Unilateral (Halteres)' }],
      reason: 'Só halteres no hotel.',
      usages: [USAGE],
    })
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/workout/adjust', payload: { request: 'x' } })).statusCode).toBe(401)
  })

  it('POST /api/workout/adjust: propõe para a sessão pendente de hoje, grava pendente e o uso', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'hotel com halteres' } })
    expect(res.statusCode).toBe(200)
    expect(proposeSessionAdjustmentMock).toHaveBeenCalledWith(expect.objectContaining({ sessionIndexes: [1], request: 'hotel com halteres', operation: 'ajuste-sessao' }))
    const { proposal } = res.json()
    expect(proposal).toMatchObject({ kind: 'ajuste-sessao', status: 'pendente', sessionIndexes: [1], mesocycleId: 'm1', reason: 'Só halteres no hotel.' })
    expect(proposal.before[0].exercises[0].name).toBe('Remada Curvada (Barra)')
    expect(fake.db.workout_adjustment_proposals).toHaveLength(1)
    expect(fake.db.ai_usage_events).toHaveLength(1)
  })

  it('validação falha 2× → 422 constraints-unsatisfiable (uso registrado)', async () => {
    proposeSessionAdjustmentMock.mockRejectedValue(new ConstraintsUnsatisfiableError([{ rule: 'duracao', message: 'longa' }], [USAGE]))
    const res = await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })
    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ code: 'constraints-unsatisfiable', violations: [{ rule: 'duracao' }] })
    expect(fake.db.ai_usage_events).toHaveLength(1)
  })

  it('teto atingido → 409 budget-exceeded sem chamar a IA', async () => {
    fake.db.ai_usage_events.push({ user_id: 'u1', cost_usd: 25, created_at: new Date().toISOString() })
    const res = await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('budget-exceeded')
    expect(proposeSessionAdjustmentMock).not.toHaveBeenCalled()
  })

  it('aceitar aplica nas sessões pendentes; aceitar de novo → 409', async () => {
    const { proposal } = (await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })).json()
    const res = await app.inject({ method: 'POST', url: `/api/workout/proposals/${proposal.id}/accept`, headers: auth })
    expect(res.statusCode).toBe(200)
    expect((fake.db.mesocycle_plans[0].sessions as any[])[1].exercises[0].name).toBe('Remada Unilateral (Halteres)')
    expect((fake.db.mesocycle_plans[0].sessions as any[])[0].completedAt).toBe('2026-10-18T10:00:00Z')
    expect(fake.db.workout_adjustment_proposals[0].status).toBe('aceita')
    expect((await app.inject({ method: 'POST', url: `/api/workout/proposals/${proposal.id}/accept`, headers: auth })).statusCode).toBe(409)
  })

  it('aceitar quando as sessões mudaram depois → 409 obsolete e nada aplicado', async () => {
    const { proposal } = (await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })).json()
    ;(fake.db.mesocycle_plans[0].sessions as { exercises: { sets: number }[] }[])[1].exercises[0].sets = 5
    const res = await app.inject({ method: 'POST', url: `/api/workout/proposals/${proposal.id}/accept`, headers: auth })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('obsolete')
    expect(fake.db.workout_adjustment_proposals[0].status).toBe('obsoleta')
    expect((fake.db.mesocycle_plans[0].sessions as any[])[1].exercises[0].name).toBe('Remada Curvada (Barra)')
  })

  it('recusar descarta', async () => {
    const { proposal } = (await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })).json()
    const res = await app.inject({ method: 'POST', url: `/api/workout/proposals/${proposal.id}/reject`, headers: auth })
    expect(res.statusCode).toBe(200)
    expect(fake.db.workout_adjustment_proposals[0].status).toBe('recusada')
    expect((fake.db.mesocycle_plans[0].sessions as any[])[1].exercises[0].name).toBe('Remada Curvada (Barra)')
  })

  it('sem sessão pendente → 409 no-pending-session', async () => {
    buildIntegratedProfileMock.mockResolvedValue({ profile: {}, constraints: CONSTRAINTS, mesocycle: { id: 'm1', sessions: [SESSION('A', 'x', '2026-10-18T10:00:00Z')] } })
    const res = await app.inject({ method: 'POST', url: '/api/workout/adjust', headers: auth, payload: { request: 'x' } })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('no-pending-session')
  })
})
