import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import type { PlanInput } from '@helux/types'

const MOCK_PLAN = {
  generatedAt: '2026-06-13T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
  rationale: 'Plano baseado no perfil genético.',
}

vi.mock('@helux/ai', () => ({
  generateWorkoutPlan: vi.fn(),
}))

import { buildApp } from '../app'
import { generateWorkoutPlan } from '@helux/ai'

const VALID_BODY: PlanInput = {
  geneticProfile: {
    metabolismo: 'moderado',
    recuperacaoMuscular: 'media',
    riscoCardiovascular: 'medio',
    predisposicao: 'misto',
    alertas: [],
  },
  constraints: {
    maxWeeklyFrequency: 4,
    preferredVolume: 'medio',
    restBetweenSets: '90-120s',
    forbiddenExerciseTypes: [],
    cardioIntensityLimit: 'moderado',
  },
  workoutHistory: [],
  recoveryData: [],
  userGoals: 'ganhar massa',
  userLevel: 'intermediario',
  availableDaysPerWeek: 4,
}

describe('POST /workout/generate', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateWorkoutPlan).mockResolvedValue(MOCK_PLAN)
  })

  it('retorna 200 com NextWorkoutPlan quando geração é bem-sucedida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/workout/generate',
      payload: VALID_BODY,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.generatedAt).toBe(MOCK_PLAN.generatedAt)
    expect(body.exercises).toHaveLength(1)
    expect(body.rationale).toBe(MOCK_PLAN.rationale)
  })

  it('retorna 500 com error quando generateWorkoutPlan lança AuthenticationError', async () => {
    const authError = Object.assign(new Error('invalid x-api-key'), { name: 'AuthenticationError', status: 401 })
    vi.mocked(generateWorkoutPlan).mockRejectedValueOnce(authError)

    const response = await app.inject({
      method: 'POST',
      url: '/workout/generate',
      payload: VALID_BODY,
    })

    expect(response.statusCode).toBe(500)
    const body = JSON.parse(response.body)
    expect(body.error).toMatch(/ANTHROPIC_API_KEY/)
  })
})
