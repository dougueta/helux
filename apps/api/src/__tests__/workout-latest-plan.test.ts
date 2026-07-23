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

const mockHealthSamplesOrder = vi.fn().mockResolvedValue({ data: [], error: null })
const mockHealthSamplesGte = vi.fn(() => ({ order: mockHealthSamplesOrder }))
const mockHealthSamplesEq = vi.fn(() => ({ gte: mockHealthSamplesGte }))
const mockHealthSamplesSelect = vi.fn(() => ({ eq: mockHealthSamplesEq }))
const mockFrom = vi.fn(() => ({ select: mockHealthSamplesSelect }))

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
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockHealthSamplesOrder.mockResolvedValue({ data: [], error: null })
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

  it('quando o mesociclo ativo existe mas está 100% completo, retorna status generating sem novo disparo', async () => {
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
})
