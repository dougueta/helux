import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MesocycleSession } from '@helux/types'

const CONSTRAINTS = { availableEquipment: ['halteres'], exercisesToAvoid: [], maxSessionMinutes: 45, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null }
const SOURCES_USED = { ativa: ['perfil'], vazia: ['exames'], desativada: [] }
const GENETICS_DATA = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [], traits: [] }
const BUILD = {
  profile: { generatedAt: '2026-10-20T10:00:00Z', sources: { perfil: { status: 'ativa', data: { level: 'intermediario' } }, genetica: { status: 'ativa', data: GENETICS_DATA } } },
  constraints: CONSTRAINTS,
  sourcesUsed: SOURCES_USED,
  preferences: { availableDays: [1, 3, 5] },
  mesocycle: null,
  tiredness: null,
  notices: [],
  // Spec 024: resumo estruturado do treino e condições.
  training: { goal: 'hipertrofia', level: 'intermediario', timeOffMonths: 0, cardioLikes: ['bike'], cardioAvoid: [] },
  conditions: [{ id: 'h1', catalogKey: 'artrose', customLabel: null, region: 'joelho', side: 'esquerdo', since: null, count: 1, status: 'controlada', notes: null, flare: null }],
}
const DECISIONS = [{ topic: 'divisao', choice: 'ABC', sources: ['preferencias'], reason: '3 dias' }]
const USAGES = [{ model: 'claude-opus-5-5', input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'mesociclo', agent: 'treino' }]

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

// Spec 024 F5: análise do ciclo concluído.
const runCycleAnalysisMock = vi.fn()
const linkNextMesocycleMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../services/cycle-analysis.service', () => ({ runCycleAnalysis: runCycleAnalysisMock, linkNextMesocycle: linkNextMesocycleMock }))

const fetchSessionsSinceMock = vi.fn()
vi.mock('../services/plan-context.service', () => ({ fetchSessionsSince: fetchSessionsSinceMock }))

const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/integrated-profile.service')>()
  return { ...actual, buildIntegratedProfile: buildIntegratedProfileMock }
})

class BudgetExceededError extends Error {}
const assertBudgetMock = vi.fn()
const recordUsageMock = vi.fn()
vi.mock('../services/ai-budget.service', () => ({ assertBudget: assertBudgetMock, recordUsage: recordUsageMock, BudgetExceededError }))

class ConstraintsUnsatisfiableError extends Error {
  constructor(public violations: unknown[], public usages: unknown[]) {
    super('x')
  }
}
class IncompleteResponseError extends Error {
  constructor(public usages: unknown[]) {
    super('cortada')
  }
}
class AgentRefusalError extends Error {}
const generateMesocyclePlanMock = vi.fn()
vi.mock('@helux/ai', () => ({ generateMesocyclePlan: generateMesocyclePlanMock, ConstraintsUnsatisfiableError, IncompleteResponseError, AgentRefusalError }))

const onboardingCompleteMock = vi.fn().mockResolvedValue(true)
vi.mock('../services/onboarding.service', () => ({ isOnboardingComplete: onboardingCompleteMock }))

// Spec 024: estado da geração.
const markGeneratingMock = vi.fn()
const markOkMock = vi.fn()
const markFailedMock = vi.fn()
vi.mock('../services/generation-status.service', () => ({ markGenerating: markGeneratingMock, markOk: markOkMock, markFailed: markFailedMock }))
const planResult = (plan: unknown) => ({ plan, decisions: DECISIONS, usages: USAGES })

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
    buildIntegratedProfileMock.mockResolvedValue(BUILD)
    assertBudgetMock.mockResolvedValue({ warning: null })
    generateMesocyclePlanMock.mockResolvedValue(planResult(MOCK_MESOCYCLE))
  })

  it('gera e salva o mesociclo quando há perfil genético disponível', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(buildIntegratedProfileMock).toHaveBeenCalledWith('user-123', supabase)
    expect(generateMesocyclePlanMock).toHaveBeenCalledWith({
      profile: BUILD.profile,
      constraints: CONSTRAINTS,
      method: expect.objectContaining({ goal: 'hipertrofia', strengthDays: 3, weeks: 5 }),
      conditions: [expect.objectContaining({ label: expect.stringMatching(/Artrose/), rules: expect.any(Array) })],
      geneticProfile: GENETICS_DATA,
    })
    expect(generateMesocyclePlanMock.mock.calls[0][0].method.cardio.allowed[0]).toBe('bike')
    // 45 min por sessão (restrições): o volume semanal do método cabe no tempo.
    expect(generateMesocyclePlanMock.mock.calls[0][0].method.modifiers.some((m: { source: string }) => m.source === 'tempo')).toBe(true)
    expect(recordUsageMock).toHaveBeenCalledWith('user-123', USAGES, supabase)
    expect(fromMock).toHaveBeenCalledWith('mesocycle_plans')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-123',
      generated_at: MOCK_MESOCYCLE.generatedAt,
      days_per_week: MOCK_MESOCYCLE.daysPerWeek,
      split_type: MOCK_MESOCYCLE.splitType,
      rationale: MOCK_MESOCYCLE.rationale,
      rationale_decisions: DECISIONS,
      sources_used: SOURCES_USED,
      format: 'semanal',
      weeks: 5,
      goal_primary: 'hipertrofia',
      method: expect.objectContaining({ weeks: 5 }),
    }))
  })

  it('024 (T109): o log da geração só tem métricas — nada de condições, dores, sensações ou genética', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    const logged = logger.info.mock.calls.map(c => c[0] as Record<string, unknown>)
    expect(logged.length).toBeGreaterThan(0)
    for (const entry of logged) {
      expect(Object.keys(entry).sort()).toEqual(['agent', 'attempts', 'cacheReadTokens', 'inputTokens', 'model', 'operation', 'outputTokens'])
      expect(JSON.stringify(entry)).not.toMatch(/joelho|artrose|gota|dor|COL1A1|ACTN3/i)
    }
  })

  it('024 (R7): expande a semana-modelo em todas as semanas, com deload na última', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    const saved = insertMock.mock.calls[0][0].sessions as Array<{ week: number; deload: boolean; letter: string }>
    expect(saved).toHaveLength(MOCK_MESOCYCLE.sessions.length * 5)
    expect(saved.map(s => s.week)).toEqual([1, 2, 3, 4, 5].flatMap(w => MOCK_MESOCYCLE.sessions.map(() => w)))
    expect(saved.filter(s => s.deload).every(s => s.week === 5)).toBe(true)
  })

  it('024: sem objetivo estruturado usa condicionamento geral', async () => {
    buildIntegratedProfileMock.mockResolvedValue({ ...BUILD, training: { ...BUILD.training, goal: null } })
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(generateMesocyclePlanMock.mock.calls[0][0].method.goal).toBe('condicionamento')
  })

  it('spec 014 (FR-003/FR-009): normaliza fases e bisets antes de gravar', async () => {
    generateMesocyclePlanMock.mockResolvedValue(planResult({
      ...MOCK_MESOCYCLE,
      sessions: [{
        letter: 'A', focus: 'Peito', completedAt: null,
        exercises: [
          { name: 'Alongamento', sets: 1, reps: '30s', weight: '—', phase: 'volta-calma' },
          { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg', supersetGroup: 'b1' },
          { name: 'Esteira', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
        ],
      }],
    }))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    const saved = insertMock.mock.calls[0][0].sessions[0].exercises
    expect(saved.map((e: { name: string }) => e.name)).toEqual(['Esteira', 'Supino Reto', 'Alongamento'])
    expect(saved.map((e: { phase: string }) => e.phase)).toEqual(['aquecimento', 'principal', 'volta-calma'])
    expect(saved[1].supersetGroup).toBeUndefined()
  })

  it('teto de IA atingido: não gera e o mesociclo atual continua (FR-026)', async () => {
    assertBudgetMock.mockRejectedValue(new BudgetExceededError('teto'))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('restrições impossíveis: registra o uso, loga e não grava (FR-024)', async () => {
    generateMesocyclePlanMock.mockRejectedValue(new ConstraintsUnsatisfiableError([{ rule: 'duracao' }], USAGES))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(recordUsageMock).toHaveBeenCalledWith('user-123', USAGES, supabase)
    expect(insertMock).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
  })

  it('sem dias nas preferências usa 4 dias e sem genética usa perfil neutro', async () => {
    buildIntegratedProfileMock.mockResolvedValue({ ...BUILD, preferences: { availableDays: [] }, profile: { ...BUILD.profile, sources: { perfil: { status: 'vazia', data: null }, genetica: { status: 'desativada', data: null } } } })
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)

    expect(generateMesocyclePlanMock).toHaveBeenCalledWith(expect.objectContaining({ method: expect.objectContaining({ strengthDays: 4 }), geneticProfile: null }))
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

  it('024 (FR-031): marca gerando ao começar e ok ao salvar', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(markGeneratingMock).toHaveBeenCalledWith('user-123', supabase)
    expect(markOkMock).toHaveBeenCalledWith('user-123', supabase)
    expect(markFailedMock).not.toHaveBeenCalled()
    expect(markGeneratingMock.mock.invocationCallOrder[0]).toBeLessThan(markOkMock.mock.invocationCallOrder[0])
  })

  it.each([
    ['teto', () => assertBudgetMock.mockRejectedValue(new BudgetExceededError('teto')), 'budget-exceeded'],
    ['restrições', () => generateMesocyclePlanMock.mockRejectedValue(new ConstraintsUnsatisfiableError([], USAGES)), 'constraints-unsatisfiable'],
    ['resposta cortada', () => generateMesocyclePlanMock.mockRejectedValue(new IncompleteResponseError(USAGES)), 'incomplete-response'],
    ['recusa', () => generateMesocyclePlanMock.mockRejectedValue(new AgentRefusalError('não')), 'refusal'],
    ['erro qualquer', () => generateMesocyclePlanMock.mockRejectedValue(new Error('boom')), 'unknown'],
    ['falha ao gravar', () => insertMock.mockResolvedValue({ error: new Error('insert failed') }), 'unknown'],
  ])('024 (FR-031): %s → falhou com o código', async (_n, arrange, code) => {
    arrange()
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(markFailedMock).toHaveBeenCalledWith('user-123', code, supabase)
    expect(markOkMock).not.toHaveBeenCalled()
  })

  it('024: resposta cortada também registra o uso', async () => {
    generateMesocyclePlanMock.mockRejectedValue(new IncompleteResponseError(USAGES))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(recordUsageMock).toHaveBeenCalledWith('user-123', USAGES, supabase)
  })

  it('US3 (FR-010): remonta o Perfil Integrado a cada geração', async () => {
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never)
    expect(buildIntegratedProfileMock).toHaveBeenCalledTimes(2)
  })
})

describe('triggerBackgroundPlanGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ error: null })
    updateEqMock.mockResolvedValue({ error: null })
    fetchSessionsSinceMock.mockResolvedValue([])
    buildIntegratedProfileMock.mockResolvedValue(BUILD)
    assertBudgetMock.mockResolvedValue({ warning: null })
    generateMesocyclePlanMock.mockResolvedValue(planResult(MOCK_MESOCYCLE))
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

    expect(generateMesocyclePlanMock).toHaveBeenCalledWith(expect.objectContaining({ profile: BUILD.profile }))
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-123' }))
  })

  it('024 (FR-002): ciclo completo sem onboarding → marca a sessão mas não gera', async () => {
    onboardingCompleteMock.mockResolvedValueOnce(false)
    getActiveMesocycleMock.mockResolvedValue({ id: 'meso-001', generated_at: '2026-07-20T10:00:00.000Z', days_per_week: 4, split_type: 'ABCD', rationale: '', sessions: [DONE_SESSION, PENDING_SESSION] })
    const { triggerBackgroundPlanGeneration } = await import('../services/plan-generation.service')
    await triggerBackgroundPlanGeneration('user-123', 'token-abc', supabase, logger as never)
    expect(updateMock).toHaveBeenCalled()
    expect(generateMesocyclePlanMock).not.toHaveBeenCalled()
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
    // 024: o ciclo concluído vai com o id para a análise.
    expect(runCycleAnalysisMock).toHaveBeenCalledWith('user-123', supabase, expect.objectContaining({ id: 'meso-001' }), 'hipertrofia', null)
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
    buildIntegratedProfileMock.mockResolvedValue(BUILD)
    assertBudgetMock.mockResolvedValue({ warning: null })
    fetchSessionsSinceMock.mockResolvedValue([
      { id: 's1', date: '2026-10-05', exercises: [{ name: 'Supino Reto', sets: [{ reps: 10, weight: 80, effort: 7 }, { reps: 10, weight: 80, effort: 7 }, { reps: 10, weight: 80, effort: 7 }] }] },
    ])
    generateMesocyclePlanMock.mockResolvedValue(planResult({
      ...MOCK_MESOCYCLE,
      sessions: [{
        letter: 'A', focus: 'Peito', completedAt: null,
        exercises: [
          { name: 'Esteira', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
          { name: 'Supino Reto', sets: 3, reps: '8-10', weight: '85kg', phase: 'principal' },
        ],
      }],
    }))
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

  it('024 T103: ciclo concluído → analisa, aplica os achados e a tendência no método, bloqueia exercício com dor e liga o próximo', async () => {
    const SUMMARY = {
      mesocycleId: 'meso-prev', weeks: 4, adherence: {}, exercises: [], avgRpeByWeek: [], pains: [], tirednessAvg: 3.4, checkinTrend: null, missingData: [],
      findings: [
        { kind: 'cansaco-alto', subject: 'cansaço', evidence: 'cansaço médio 3.4' },
        { kind: 'dor-recorrente', subject: 'Leg Press 45°', evidence: '2 relatos' },
      ],
    }
    const TREND = { from: '2026-09', to: '2026-10', deltas: {}, implausible: [], modifiers: ['+1 cardio'], suggestGoalChange: null, methodModifiers: [{ source: 'checkin', cardioSessionsDelta: 1, description: '+1 cardio' }] }
    runCycleAnalysisMock.mockResolvedValue({ summary: SUMMARY, trend: TREND })
    buildIntegratedProfileMock.mockResolvedValue({ ...BUILD, training: { ...BUILD.training, goalTarget: 'chegar a 80 kg' } })
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')

    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never, { ...previous, id: 'meso-prev' })

    expect(runCycleAnalysisMock).toHaveBeenCalledWith('user-123', supabase, expect.objectContaining({ id: 'meso-prev', generated_at: previous.generated_at }), 'hipertrofia', 'chegar a 80 kg')
    const input = generateMesocyclePlanMock.mock.calls[0][0]
    expect(input.cycle).toBe(SUMMARY)
    expect(input.checkinTrend).toBe(TREND)
    expect(input.constraints.blockedExercises).toContain('Leg Press 45°')
    expect(input.method.modifiers.map((m: { source: string }) => m.source)).toEqual(expect.arrayContaining(['checkin', 'ciclo']))
    const row = insertMock.mock.calls[0][0]
    expect(row.id).toEqual(expect.any(String))
    expect(linkNextMesocycleMock).toHaveBeenCalledWith('user-123', supabase, 'meso-prev', row.id)
  })

  it('024: falha na análise do ciclo não impede a geração', async () => {
    runCycleAnalysisMock.mockRejectedValue(new Error('boom'))
    const { generateAndSaveMesocycle } = await import('../services/plan-generation.service')
    await generateAndSaveMesocycle('user-123', 'token-abc', supabase, logger as never, { ...previous, id: 'meso-prev' })
    expect(insertMock).toHaveBeenCalled()
    expect(generateMesocyclePlanMock.mock.calls[0][0].cycle).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'cycle analysis failed')
    expect(linkNextMesocycleMock).not.toHaveBeenCalled()
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
