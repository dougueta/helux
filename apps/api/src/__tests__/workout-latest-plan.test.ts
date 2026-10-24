import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import type { MesocycleSession } from '@helux/types'

const mockGetActiveMesocycle = vi.fn()
const mockFindPendingSessionIndex = vi.fn()
vi.mock('../services/mesocycle.service', () => ({
  getActiveMesocycle: mockGetActiveMesocycle,
  findPendingSessionIndex: mockFindPendingSessionIndex,
}))

const mockGenerateAndSaveMesocycle = vi.fn().mockResolvedValue(undefined)
vi.mock('../services/plan-generation.service', () => ({
  generateAndSaveMesocycle: mockGenerateAndSaveMesocycle,
  triggerBackgroundPlanGeneration: vi.fn(),
}))

// Spec 024: estado da geração (as regras de nova tentativa são as reais).
const mockGetGenerationStatus = vi.fn().mockResolvedValue(null)
const mockMarkGenerating = vi.fn().mockResolvedValue(undefined)
vi.mock('../services/generation-status.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/generation-status.service')>()
  return { ...actual, getGenerationStatus: mockGetGenerationStatus, markGenerating: mockMarkGenerating }
})

// Spec 024: onboarding e condições de saúde.
const mockOnboardingComplete = vi.fn().mockResolvedValue(true)
vi.mock('../services/onboarding.service', () => ({ isOnboardingComplete: mockOnboardingComplete }))
const mockListConditions = vi.fn().mockResolvedValue([])
vi.mock('../services/conditions.service', () => ({ listConditions: mockListConditions }))

const mockHealthSamplesOrder = vi.fn().mockResolvedValue({ data: [], error: null })
const mockHealthSamplesGte = vi.fn(() => ({ order: mockHealthSamplesOrder }))
const mockHealthSamplesEq = vi.fn(() => ({ gte: mockHealthSamplesGte }))
const mockHealthSamplesSelect = vi.fn(() => ({ eq: mockHealthSamplesEq }))

const mockTirednessMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockTirednessEqDate = vi.fn(() => ({ maybeSingle: mockTirednessMaybeSingle }))
const mockTirednessEqUser = vi.fn(() => ({ eq: mockTirednessEqDate }))
const mockTirednessSelect = vi.fn(() => ({ eq: mockTirednessEqUser }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'daily_tiredness_signals') return { select: mockTirednessSelect }
  return { select: mockHealthSamplesSelect }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: mockFrom,
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutLatestPlanRoutes } = await import('../routes/workout-latest-plan')
  await app.register(workoutLatestPlanRoutes)
  return app
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

const UPCOMING_SESSION: MesocycleSession = {
  letter: 'C',
  focus: 'Pernas',
  completedAt: null,
  exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '6-8', weight: '100kg' }],
}

const MESOCYCLE_ROW = {
  id: 'meso-001',
  generated_at: '2026-07-21T09:00:00.000Z',
  days_per_week: 4,
  split_type: 'ABCD',
  sessions: [DONE_SESSION, PENDING_SESSION, UPCOMING_SESSION],
  rationale: 'Ciclo de hipertrofia.',
}

describe('GET /workout/latest-plan', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetGenerationStatus.mockResolvedValue(null)
    mockOnboardingComplete.mockResolvedValue(true)
    mockListConditions.mockResolvedValue([])
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockHealthSamplesOrder.mockResolvedValue({ data: [], error: null })
    mockTirednessMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockGenerateAndSaveMesocycle.mockResolvedValue(undefined)
    app = await buildApp()
  })

  it('retorna 401 sem Bearer token', async () => {
    const response = await app.inject({ method: 'GET', url: '/workout/latest-plan' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna today ajustado, upcoming e progress quando há mesociclo ativo com sessão pendente', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockHealthSamplesOrder.mockResolvedValue({
      data: [{ type: 'hrv', value: 65, unit: 'ms', start_at: '2026-07-21T08:00:00.000Z' }],
      error: null,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.mesocycleId).toBe('meso-001')
    expect(body.today.letter).toBe('B')
    expect(body.upcoming).toEqual([{ letter: 'C', focus: 'Pernas' }])
    expect(body.progress).toEqual({ completed: 1, total: 3 })
  })

  it('022: devolve a justificativa por decisão e as fontes usadas quando existem', async () => {
    const decisions = [{ topic: 'divisao', choice: 'ABC', sources: ['preferencias'], reason: '3 dias' }]
    const sourcesUsed = { ativa: ['perfil'], vazia: ['exames'], desativada: [] }
    mockGetActiveMesocycle.mockResolvedValue({ ...MESOCYCLE_ROW, rationale_decisions: decisions, sources_used: sourcesUsed })
    const app = await buildApp()
    const body = (await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { authorization: 'Bearer valid-token' } })).json()
    expect(body.rationaleDecisions).toEqual(decisions)
    expect(body.sourcesUsed).toEqual(sourcesUsed)
  })

  it('reduz o volume da sessão de hoje quando o HRV indica recuperação comprometida', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockHealthSamplesOrder.mockResolvedValue({
      data: [{ type: 'hrv', value: 30, unit: 'ms', start_at: '2026-07-21T08:00:00.000Z' }],
      error: null,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    const body = JSON.parse(response.body)
    expect(body.today.adjusted).toBe(true)
    expect(body.today.exercises[0].sets).toBeLessThan(4)
  })

  it('quando o usuário não tem nenhum mesociclo, retorna status generating e dispara a geração (bootstrap)', async () => {
    mockGetActiveMesocycle.mockResolvedValue(null)

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.today).toBeNull()
    expect(body.status).toBe('generating')
    expect(mockGenerateAndSaveMesocycle).toHaveBeenCalledWith('user-123', 'valid-token', expect.anything(), expect.anything())
  })

  it('024 (T081): mesociclo semanal informa semana atual, total, deload e o tipo do dia', async () => {
    const weekly = (week: number, letter: string, completedAt: string | null, kind: 'forca' | 'cardio' = 'forca') => ({ letter, focus: letter, completedAt, week, kind, deload: week === 4, exercises: [{ name: 'Supino Reto (Barra)', sets: 3, reps: '8', weight: '60kg' }] })
    mockGetActiveMesocycle.mockResolvedValue({ ...MESOCYCLE_ROW, sessions: [weekly(1, 'A', '2026-10-01'), weekly(1, 'B', '2026-10-02', 'cardio'), weekly(2, 'A', null), weekly(2, 'B', null, 'cardio'), weekly(4, 'A', null), weekly(4, 'B', null, 'cardio')] })
    mockFindPendingSessionIndex.mockReturnValue(2)
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.week).toEqual({ current: 2, total: 4, deload: false })
    expect(body.kind).toBe('forca')
  })

  it('024: plano antigo (rotação) não tem semana', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.week).toBeUndefined()
  })

  it('024 (FR-001): sem sessão pendente e onboarding não concluído → onboarding-required, sem gerar', async () => {
    mockGetActiveMesocycle.mockResolvedValue({ ...MESOCYCLE_ROW, sessions: [DONE_SESSION] })
    mockFindPendingSessionIndex.mockReturnValue(-1)
    mockOnboardingComplete.mockResolvedValue(false)
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.status).toBe('onboarding-required')
    expect(mockGenerateAndSaveMesocycle).not.toHaveBeenCalled()
  })

  it('024 (FR-009): crise de gota no joelho adapta o treino do dia, mesmo num ciclo antigo', async () => {
    mockGetActiveMesocycle.mockResolvedValue({
      ...MESOCYCLE_ROW,
      sessions: [{ letter: 'C', focus: 'Pernas', completedAt: null, exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '8-10', weight: '80kg' }, { name: 'Supino Reto (Barra)', sets: 3, reps: '8', weight: '60kg' }] }],
    })
    mockFindPendingSessionIndex.mockReturnValue(0)
    const until = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)
    mockListConditions.mockResolvedValue([{ id: 'g', catalogKey: 'gota', customLabel: null, region: 'sistemica', side: null, since: null, count: 1, status: 'controlada', notes: null, flare: { region: 'joelho', until } }])
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.today.exercises.map((e: { name: string }) => e.name)).not.toContain('Agachamento Livre (Barra)')
    expect(body.today.adjusted).toBe(true)
    expect(body.today.adjustmentReason).toMatch(/crise/i)
    expect(body.today.changes).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Agachamento Livre (Barra)' })]))
  })

  it('024: sem sessão pendente e geração em andamento → generating sem disparar de novo', async () => {
    mockGetActiveMesocycle.mockResolvedValue(null)
    mockGetGenerationStatus.mockResolvedValue({ status: 'gerando', attempts: 0, errorCode: null, startedAt: new Date().toISOString() })
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.status).toBe('generating')
    expect(mockGenerateAndSaveMesocycle).not.toHaveBeenCalled()
  })

  it('024 (FR-031): ciclo concluído sem próximo e sem geração em andamento → dispara de novo', async () => {
    mockGetActiveMesocycle.mockResolvedValue({ ...MESOCYCLE_ROW, sessions: [DONE_SESSION] })
    mockFindPendingSessionIndex.mockReturnValue(-1)
    mockGetGenerationStatus.mockResolvedValue({ status: 'falhou', attempts: 1, errorCode: 'unknown', startedAt: null })
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.status).toBe('generating')
    expect(mockMarkGenerating).toHaveBeenCalled()
    expect(mockGenerateAndSaveMesocycle).toHaveBeenCalledWith('user-123', 'valid-token', expect.anything(), expect.anything(), expect.objectContaining({ generated_at: MESOCYCLE_ROW.generated_at }))
  })

  it('024 (FR-031): 3 falhas seguidas → generation-failed com o estado, sem disparar', async () => {
    mockGetActiveMesocycle.mockResolvedValue({ ...MESOCYCLE_ROW, sessions: [DONE_SESSION] })
    mockFindPendingSessionIndex.mockReturnValue(-1)
    mockGetGenerationStatus.mockResolvedValue({ status: 'falhou', attempts: 3, errorCode: 'incomplete-response', startedAt: null })
    const body = JSON.parse((await app.inject({ method: 'GET', url: '/workout/latest-plan', headers: { Authorization: 'Bearer valid-token' } })).body)
    expect(body.status).toBe('generation-failed')
    expect(body.generation).toMatchObject({ status: 'falhou', attempts: 3, errorCode: 'incomplete-response' })
    expect(mockGenerateAndSaveMesocycle).not.toHaveBeenCalled()
  })

  it('quando o mesociclo ativo existe mas está 100% completo e o próximo está sendo gerado, retorna generating sem novo disparo', async () => {
    mockGetGenerationStatus.mockResolvedValue({ status: 'gerando', attempts: 0, errorCode: null, startedAt: new Date().toISOString() })
    const allDoneRow = {
      ...MESOCYCLE_ROW,
      sessions: [DONE_SESSION, { ...PENDING_SESSION, completedAt: '2026-07-21T10:00:00.000Z' }, { ...UPCOMING_SESSION, completedAt: '2026-07-22T10:00:00.000Z' }],
    }
    mockGetActiveMesocycle.mockResolvedValue(allDoneRow)
    mockFindPendingSessionIndex.mockReturnValue(-1)

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.today).toBeNull()
    expect(body.status).toBe('generating')
    expect(body.progress).toEqual({ completed: 3, total: 3 })
    expect(mockGenerateAndSaveMesocycle).not.toHaveBeenCalled()
  })

  async function getToday() {
    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(response.statusCode).toBe(200)
    return JSON.parse(response.body).today
  }

  it('011: today traz tiredness, plannedExercises e changes vazios quando não há ajuste', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)

    const today = await getToday()
    expect(today.adjusted).toBe(false)
    expect(today.plannedExercises).toEqual(PENDING_SESSION.exercises)
    expect(today.changes).toEqual([])
    expect(today.tiredness).toMatchObject({ manualLevel: null, automaticLevel: null, effectiveLevel: null, source: 'none' })
  })

  it('011: nível manual "exausto" sem relógio reduz séries e carga, com motivo e changes', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockTirednessMaybeSingle.mockResolvedValue({ data: { level: 'exausto', override_automatic: false }, error: null })

    const today = await getToday()
    expect(today.adjusted).toBe(true)
    expect(today.exercises[0]).toMatchObject({ sets: 3, weight: '54kg' })
    expect(today.adjustmentReason).toBe('Você marcou "exausto" hoje')
    expect(today.changes).toEqual([
      { name: 'Remada Curvada', setsBefore: 4, setsAfter: 3, weightBefore: '60kg', weightAfter: '54kg' },
    ])
  })

  it('011: nível manual "cansado" reduz só séries', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockTirednessMaybeSingle.mockResolvedValue({ data: { level: 'cansado', override_automatic: false }, error: null })

    const today = await getToday()
    expect(today.exercises[0]).toMatchObject({ sets: 3, weight: '60kg' })
  })

  it('011: HRV prevalece sobre o manual quando não há sobreposição confirmada', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockHealthSamplesOrder.mockResolvedValue({
      data: [{ type: 'hrv', value: 45, unit: 'ms', start_at: '2026-07-21T08:00:00.000Z' }],
      error: null,
    })
    mockTirednessMaybeSingle.mockResolvedValue({ data: { level: 'otimo', override_automatic: false }, error: null })

    const today = await getToday()
    expect(today.adjusted).toBe(true)
    expect(today.exercises[0].sets).toBe(3)
    expect(today.adjustmentReason).toBe('Relógio indica "cansado" (HRV 45 ms)')
    expect(today.tiredness).toMatchObject({ source: 'automatic', conflict: true })
  })

  it('011: sobreposição manual confirmada prevalece sobre o HRV', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockHealthSamplesOrder.mockResolvedValue({
      data: [{ type: 'hrv', value: 45, unit: 'ms', start_at: '2026-07-21T08:00:00.000Z' }],
      error: null,
    })
    mockTirednessMaybeSingle.mockResolvedValue({ data: { level: 'otimo', override_automatic: true }, error: null })

    const today = await getToday()
    expect(today.adjusted).toBe(false)
    expect(today.exercises[0].sets).toBe(4)
    expect(today.tiredness).toMatchObject({ source: 'manual', effectiveLevel: 'otimo' })
  })

  it('011: retorna 500 se a leitura do sinal de cansaço falhar', async () => {
    mockGetActiveMesocycle.mockResolvedValue(MESOCYCLE_ROW)
    mockFindPendingSessionIndex.mockReturnValue(1)
    mockTirednessMaybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(response.statusCode).toBe(500)
  })
})

