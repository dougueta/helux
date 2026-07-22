import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MesocycleSession } from '@helux/types'

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

const MOCK_MESOCYCLE = {
  generatedAt: '2026-07-22T10:00:00.000Z',
  daysPerWeek: 4,
  splitType: 'ABCD',
  rationale: 'Novo ciclo gerado automaticamente.',
  sessions: [{ letter: 'A', focus: 'Peito + Tríceps', completedAt: null, exercises: [] }],
}

const PENDING_SESSION: MesocycleSession = {
  letter: 'B',
  focus: 'Costas + Bíceps',
  completedAt: null,
  exercises: [{ name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '60kg' }],
}

const DONE_SESSION: MesocycleSession = {
  letter: 'A',
  focus: 'Peito + Tríceps',
  completedAt: '2026-07-20T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
}

const gatherPlanInputMock = vi.fn()
vi.mock('../services/plan-context.service', () => ({
  gatherPlanInput: gatherPlanInputMock,
}))

const generateMesocyclePlanMock = vi.fn()
const generateWorkoutPlanMock = vi.fn()
vi.mock('@helux/ai', () => ({
  generateWorkoutPlan: generateWorkoutPlanMock,
  generateMesocyclePlan: generateMesocyclePlanMock,
}))

const getActiveMesocycleMock = vi.fn()
vi.mock('../services/mesocycle.service', () => ({
  getActiveMesocycle: getActiveMesocycleMock,
  findPendingSessionIndex: (sessions: MesocycleSession[]) => sessions.findIndex((s) => s.completedAt === null),
  markSessionCompleted: (sessions: MesocycleSession[], index: number) =>
    sessions.map((s, i) => (i === index && s.completedAt === null ? { ...s, completedAt: '2026-07-22T09:00:00.000Z' } : s)),
  isMesocycleComplete: (sessions: MesocycleSession[]) => sessions.length > 0 && sessions.every((s) => s.completedAt !== null),
}))

const insertMock = vi.fn().mockResolvedValue({ error: null })
const updateEqMock = vi.fn().mockResolvedValue({ error: null })
const updateMock = vi.fn(() => ({ eq: updateEqMock }))
const fromMock = vi.fn(() => ({ insert: insertMock, update: updateMock }))
const supabase = { from: fromMock } as never

const logger = { error: vi.fn(), info: vi.fn() }

describe('generateAndSaveMesocycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    gatherPlanInputMock.mockResolvedValue(MOCK_PLAN_INPUT)
    generateMesocyclePlanMock.mockResolvedValue(MOCK_MESOCYCLE)
  })

  it('gera e salva o mesociclo quando há perfil genético disponível', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(gatherPlanInputMock).toHaveBeenCalledWith('user-123', 'token-abc')
    expect(generateMesocyclePlanMock).toHaveBeenCalledWith(MOCK_PLAN_INPUT)
    expect(fromMock).toHaveBeenCalledWith('mesocycle_plans')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-123',
      generated_at: MOCK_MESOCYCLE.generatedAt,
      days_per_week: MOCK_MESOCYCLE.daysPerWeek,
      split_type: MOCK_MESOCYCLE.splitType,
      sessions: MOCK_MESOCYCLE.sessions,
      rationale: MOCK_MESOCYCLE.rationale,
    }))
  })

  it('não faz nada quando não há perfil genético (gatherPlanInput retorna null)', async () => {
    gatherPlanInputMock.mockResolvedValue(null)
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('loga o erro e não lança quando a geração falha', async () => {
    generateMesocyclePlanMock.mockRejectedValue(new Error('Claude indisponível'))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await expect(
      generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never),
    ).resolves.not.toThrow()
    expect(logger.error).toHaveBeenCalled()
  })

  it('loga o erro e não lança quando o insert no Supabase falha', async () => {
    insertMock.mockResolvedValue({ error: new Error('insert failed') })
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await expect(
      generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never),
    ).resolves.not.toThrow()
    expect(logger.error).toHaveBeenCalled()
  })
})

describe('triggerBackgroundPlanGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    updateEqMock.mockResolvedValue({ error: null })
    gatherPlanInputMock.mockResolvedValue(MOCK_PLAN_INPUT)
    generateMesocyclePlanMock.mockResolvedValue(MOCK_MESOCYCLE)
  })

  it('não faz nada quando o usuário não tem mesociclo ativo (bootstrap é responsabilidade do GET)', async () => {
    getActiveMesocycleMock.mockResolvedValue(null)
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)

    expect(updateMock).not.toHaveBeenCalled()
    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
  })

  it('marca a sessão pendente como concluída e NÃO gera um novo mesociclo quando ainda restam sessões pendentes', async () => {
    getActiveMesocycleMock.mockResolvedValue({
      id: 'meso-001',
      generated_at: '2026-07-20T10:00:00.000Z',
      days_per_week: 4,
      split_type: 'ABCD',
      rationale: 'Ciclo atual',
      sessions: [DONE_SESSION, PENDING_SESSION, { ...PENDING_SESSION, letter: 'C', focus: 'Pernas' }],
    })
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)

    expect(fromMock).toHaveBeenCalledWith('mesocycle_plans')
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      sessions: expect.arrayContaining([expect.objectContaining({ letter: 'B', completedAt: expect.any(String) })]),
    }))
    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
  })

  it('gera um novo mesociclo quando a marcação faz o ciclo atual ficar 100% completo', async () => {
    getActiveMesocycleMock.mockResolvedValue({
      id: 'meso-001',
      generated_at: '2026-07-20T10:00:00.000Z',
      days_per_week: 4,
      split_type: 'ABCD',
      rationale: 'Ciclo atual',
      sessions: [DONE_SESSION, PENDING_SESSION],
    })
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)

    expect(generateMesocyclePlanMock).toHaveBeenCalledWith(MOCK_PLAN_INPUT)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-123' }))
  })

  it('loga o erro e não lança quando falha ao marcar a sessão como concluída', async () => {
    getActiveMesocycleMock.mockResolvedValue({
      id: 'meso-001',
      generated_at: '2026-07-20T10:00:00.000Z',
      days_per_week: 4,
      split_type: 'ABCD',
      rationale: 'Ciclo atual',
      sessions: [DONE_SESSION, PENDING_SESSION],
    })
    updateEqMock.mockResolvedValue({ error: new Error('update failed') })
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')

    await expect(
      triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never),
    ).resolves.not.toThrow()
    expect(logger.error).toHaveBeenCalled()
    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
  })
})
