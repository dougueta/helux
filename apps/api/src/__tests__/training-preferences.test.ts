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

const SESSIONS = [
  { letter: 'A', focus: 'Peito', completedAt: '2026-10-18T10:00:00Z', exercises: [{ name: 'Supino Reto (Barra)', sets: 4, reps: '8', weight: '80 kg' }] },
  { letter: 'B', focus: 'Pernas', completedAt: null, exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '8', weight: '100 kg' }] },
  { letter: 'C', focus: 'Costas', completedAt: null, exercises: [{ name: 'Remada Unilateral (Halteres)', sets: 3, reps: '10', weight: '30 kg' }] },
]
const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', () => ({ buildIntegratedProfile: (...a: unknown[]) => buildIntegratedProfileMock(...a) }))

const requestSessionAdjustmentMock = vi.fn()
class NoPendingSessionError extends Error {}
vi.mock('../services/proposals.service', () => ({ requestSessionAdjustment: (...a: unknown[]) => requestSessionAdjustmentMock(...a), NoPendingSessionError }))

const auth = { Authorization: 'Bearer valid-token' }
const BASE = {
  availableDays: [1, 3, 5],
  maxSessionMinutes: 60,
  location: 'academia',
  availableEquipment: [],
  favoriteExercises: [],
  exercisesToAvoid: [],
  priorityMuscleGroups: ['gluteos'],
  trainingStyle: 'hipertrofia-classica',
  freeInstructions: null,
}

async function buildApp() {
  const app = Fastify()
  const { trainingPreferencesRoutes } = await import('../routes/training-preferences')
  await app.register(trainingPreferencesRoutes)
  return app
}

describe('preferências de treino (022 T009)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const put = (payload: object) => app.inject({ method: 'PUT', url: '/api/training-preferences', headers: auth, payload })

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({ training_preferences: [], training_preferences_history: [], ai_usage_events: [], ai_budget_settings: [] })
    buildIntegratedProfileMock.mockImplementation(async () => {
      const row = fake.db.training_preferences[0] as { available_equipment?: string[]; exercises_to_avoid?: string[]; max_session_minutes?: number | null } | undefined
      return {
        constraints: {
          availableEquipment: row?.available_equipment ?? [],
          exercisesToAvoid: row?.exercises_to_avoid ?? [],
          maxSessionMinutes: row?.max_session_minutes ?? null,
          blockedPatterns: [],
          blockedExercises: [],
        },
        mesocycle: { id: 'm1', sessions: SESSIONS },
      }
    })
    requestSessionAdjustmentMock.mockResolvedValue({ id: 'p1', kind: 'adaptacao-restricao', status: 'pendente' })
    app = await buildApp()
  })

  it('GET sem preferências → valores vazios', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/training-preferences', headers: auth })
    expect(res.json()).toMatchObject({ availableDays: [], availableEquipment: [], maxSessionMinutes: null, updatedAt: null })
  })

  it('validação: dia repetido, duração fora da faixa, equipamento inválido, favorito também em evitar', async () => {
    expect((await put({ ...BASE, availableDays: [1, 1] })).statusCode).toBe(400)
    expect((await put({ ...BASE, maxSessionMinutes: 10 })).statusCode).toBe(400)
    expect((await put({ ...BASE, availableEquipment: ['kettlebell'] })).statusCode).toBe(400)
    expect((await put({ ...BASE, favoriteExercises: ['leg-press-45'], exercisesToAvoid: ['leg-press-45'] })).statusCode).toBe(400)
    expect((await put({ ...BASE, exercisesToAvoid: ['nao-existe'] })).statusCode).toBe(400)
  })

  it('primeira gravação: salva, grava histórico e não propõe nada sem violação', async () => {
    const res = await put(BASE)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ preferences: { availableDays: [1, 3, 5], maxSessionMinutes: 60 }, proposal: null })
    expect(fake.db.training_preferences).toHaveLength(1)
    expect(fake.db.training_preferences_history).toHaveLength(1)
    expect(requestSessionAdjustmentMock).not.toHaveBeenCalled()
  })

  it('mudança só suave → vale a partir do próximo mesociclo (FR-011)', async () => {
    await put(BASE)
    const res = await put({ ...BASE, priorityMuscleGroups: ['costas'], freeInstructions: 'foco em posterior' })
    expect(res.json()).toMatchObject({ appliesFrom: 'proximo-mesociclo', proposal: null })
    expect(fake.db.training_preferences_history[1]).toMatchObject({ hard_change: false })
  })

  it('mudança rígida que viola sessões pendentes → proposta de adaptação só das afetadas', async () => {
    await put(BASE)
    const res = await put({ ...BASE, availableEquipment: ['halteres'] })
    expect(res.json()).toMatchObject({ appliesFrom: 'imediato', proposal: { id: 'p1' } })
    expect(fake.db.training_preferences_history[1]).toMatchObject({ hard_change: true })
    expect(requestSessionAdjustmentMock).toHaveBeenCalledWith('u1', expect.anything(), expect.objectContaining({ kind: 'adaptacao-restricao', sessionIndexes: [1] }))
  })

  it('teto atingido: preferências salvas, sem proposta, budgetBlocked', async () => {
    await put(BASE)
    const { BudgetExceededError } = await import('../services/ai-budget.service')
    requestSessionAdjustmentMock.mockRejectedValue(new BudgetExceededError({ capUsd: 20, spentUsd: 20, pct: 100 }))
    const res = await put({ ...BASE, availableEquipment: ['halteres'] })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ proposal: null, budgetBlocked: true })
    expect((fake.db.training_preferences[0] as { available_equipment: string[] }).available_equipment).toEqual(['halteres'])
  })
})
