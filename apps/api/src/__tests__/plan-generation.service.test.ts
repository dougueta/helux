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
const fetchSessionsSinceMock = vi.fn()
vi.mock('../services/plan-context.service', () => ({
  gatherPlanInput: gatherPlanInputMock,
  fetchSessionsSince: fetchSessionsSinceMock,
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

  it('spec 014 (FR-003/FR-009): normaliza fases e bisets antes de gravar', async () => {
    generateMesocyclePlanMock.mockResolvedValue({
      ...MOCK_MESOCYCLE,
      sessions: [{
        letter: 'A', focus: 'Peito', completedAt: null,
        exercises: [
          { name: 'Alongamento', sets: 1, reps: '30s', weight: '—', phase: 'volta-calma' },
          { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg', supersetGroup: 'b1' },
          { name: 'Esteira', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
        ],
      }],
    })
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    const saved = insertMock.mock.calls[0][0].sessions[0].exercises
    expect(saved.map((e: { name: string }) => e.name)).toEqual(['Esteira', 'Supino Reto', 'Alongamento'])
    expect(saved.map((e: { phase: string }) => e.phase)).toEqual(['aquecimento', 'principal', 'volta-calma'])
    expect(saved[1].supersetGroup).toBeUndefined()
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

  it('US3 (FR-010): usa o perfil mais recente a cada chamada, sem reaproveitar um PlanInput de uma geração anterior', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    gatherPlanInputMock.mockResolvedValueOnce({ ...MOCK_PLAN_INPUT, userGoals: 'Hipertrofia', userLevel: 'intermediario' })
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(generateMesocyclePlanMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ userGoals: 'Hipertrofia', userLevel: 'intermediario' }),
    )

    // Perfil atualizado pelo usuário entre a criação do mesociclo anterior e esta nova geração
    gatherPlanInputMock.mockResolvedValueOnce({ ...MOCK_PLAN_INPUT, userGoals: 'Resistência para maratona', userLevel: 'avancado' })
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(generateMesocyclePlanMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ userGoals: 'Resistência para maratona', userLevel: 'avancado' }),
    )
    expect(gatherPlanInputMock).toHaveBeenCalledTimes(2)
  })
})

describe('triggerBackgroundPlanGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    updateEqMock.mockResolvedValue({ error: null })
    fetchSessionsSinceMock.mockResolvedValue([])
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

  it('não faz nada quando o mesociclo ativo já está 100% completo (ex.: POST retido/duplicado após o ciclo já ter avançado)', async () => {
    getActiveMesocycleMock.mockResolvedValue({
      id: 'meso-001',
      generated_at: '2026-07-20T10:00:00.000Z',
      days_per_week: 4,
      split_type: 'ABCD',
      rationale: 'Ciclo atual',
      sessions: [DONE_SESSION, { ...PENDING_SESSION, completedAt: '2026-07-21T10:00:00.000Z' }],
    })
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

  it('spec 014 (US3): passa o mesociclo concluído para calcular a progressão a partir do seu generated_at', async () => {
    fetchSessionsSinceMock.mockResolvedValue([])
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

    expect(fetchSessionsSinceMock).toHaveBeenCalledWith('user-123', supabase, '2026-07-20')
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

describe('generateAndSaveMesocycle — progressão de carga (spec 014, US3)', () => {
  const previous = {
    generated_at: '2026-09-28T10:00:00.000Z',
    sessions: [{ ...DONE_SESSION, exercises: [{ name: 'Supino Reto', sets: 3, reps: '8-10', weight: '80kg' }] }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    gatherPlanInputMock.mockResolvedValue(MOCK_PLAN_INPUT)
    fetchSessionsSinceMock.mockResolvedValue([
      { id: 's1', date: '2026-10-05', exercises: [{ name: 'Supino Reto', sets: [{ reps: 10, weight: 80, effort: 7 }, { reps: 10, weight: 80, effort: 7 }, { reps: 10, weight: 80, effort: 7 }] }] },
    ])
    generateMesocyclePlanMock.mockResolvedValue({
      ...MOCK_MESOCYCLE,
      sessions: [{
        letter: 'A', focus: 'Peito', completedAt: null,
        exercises: [
          { name: 'Esteira', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
          { name: 'Supino Reto', sets: 3, reps: '8-10', weight: '85kg', phase: 'principal' },
        ],
      }],
    })
  })

  it('calcula as decisões, envia à IA e aplica a carga depois da geração, independente do que a IA sugeriu', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never, previous)

    expect(fetchSessionsSinceMock).toHaveBeenCalledWith('user-123', supabase, '2026-09-28')
    const input = generateMesocyclePlanMock.mock.calls[0][0]
    expect(input.loadProgression).toEqual([
      expect.objectContaining({ name: 'Supino Reto', action: 'aumentar', previousWeightKg: 80, nextWeightKg: 82.5 }),
    ])
    const saved = insertMock.mock.calls[0][0].sessions[0].exercises
    expect(saved[0].weight).toBe('—')
    expect(saved[1]).toMatchObject({
      weight: '82.5kg',
      progression: { action: 'aumentar', previousWeightKg: 80, nextWeightKg: 82.5 },
    })
  })

  it('bootstrap (sem mesociclo anterior) não aplica progressão (FR-020)', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(fetchSessionsSinceMock).not.toHaveBeenCalled()
    expect(generateMesocyclePlanMock.mock.calls[0][0].loadProgression).toBeUndefined()
    expect(insertMock.mock.calls[0][0].sessions[0].exercises[1]).toMatchObject({ weight: '85kg' })
    expect(insertMock.mock.calls[0][0].sessions[0].exercises[1].progression).toBeUndefined()
  })

  it('sem nenhuma decisão com carga, não envia loadProgression', async () => {
    fetchSessionsSinceMock.mockResolvedValue([])
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never, previous)

    expect(generateMesocyclePlanMock.mock.calls[0][0].loadProgression).toBeUndefined()
  })
})
