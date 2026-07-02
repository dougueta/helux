import { describe, it, expect, vi, beforeEach } from 'vitest'

const MOCK_PLAN_INPUT = {
  geneticProfile: { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [] },
  constraints: { maxWeeklyFrequency: 4, preferredVolume: 'medio', restBetweenSets: '90-120s', forbiddenExerciseTypes: [], cardioIntensityLimit: 'moderado' },
  workoutHistory: [],
  recoveryData: [],
  userGoals: 'Hipertrofia e condicionamento geral',
  userLevel: 'intermediario' as const,
  availableDaysPerWeek: 4,
  bodyCheckins: [],
}

const MOCK_PLAN = {
  generatedAt: '2026-07-02T10:00:00.000Z',
  exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '8-10', weight: '80kg' }],
  rationale: 'Plano gerado automaticamente após a sessão.',
}

const gatherPlanInputMock = vi.fn()
vi.mock('../services/plan-context.service', () => ({
  gatherPlanInput: gatherPlanInputMock,
}))

const generateWorkoutPlanMock = vi.fn()
vi.mock('@helux/ai', () => ({
  generateWorkoutPlan: generateWorkoutPlanMock,
}))

const insertMock = vi.fn().mockResolvedValue({ error: null })
const fromMock = vi.fn(() => ({ insert: insertMock }))
const supabase = { from: fromMock } as never

const logger = { error: vi.fn(), info: vi.fn() }

describe('triggerBackgroundPlanGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    gatherPlanInputMock.mockResolvedValue(MOCK_PLAN_INPUT)
    generateWorkoutPlanMock.mockResolvedValue(MOCK_PLAN)
  })

  it('gera e salva o plano quando há perfil genético disponível', async () => {
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)

    expect(gatherPlanInputMock).toHaveBeenCalledWith('user-123', 'token-abc')
    expect(generateWorkoutPlanMock).toHaveBeenCalledWith(MOCK_PLAN_INPUT)
    expect(fromMock).toHaveBeenCalledWith('workout_plans')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-123',
      generated_at: MOCK_PLAN.generatedAt,
      exercises: MOCK_PLAN.exercises,
      rationale: MOCK_PLAN.rationale,
    }))
  })

  it('não faz nada quando não há perfil genético (gatherPlanInput retorna null)', async () => {
    gatherPlanInputMock.mockResolvedValue(null)
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)

    expect(generateWorkoutPlanMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('loga o erro e não lança quando a geração falha', async () => {
    generateWorkoutPlanMock.mockRejectedValue(new Error('Claude indisponível'))
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await expect(
      triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never),
    ).resolves.not.toThrow()
    expect(logger.error).toHaveBeenCalled()
  })

  it('loga o erro e não lança quando o insert no Supabase falha', async () => {
    insertMock.mockResolvedValue({ error: new Error('insert failed') })
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await expect(
      triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never),
    ).resolves.not.toThrow()
    expect(logger.error).toHaveBeenCalled()
  })
})
