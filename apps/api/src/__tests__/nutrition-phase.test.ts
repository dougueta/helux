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

const loadNutritionContextMock = vi.fn()
vi.mock('../services/nutrition-context.service', () => ({ loadNutritionContext: loadNutritionContextMock }))

const createPhaseMock = vi.fn()
const endPhaseMock = vi.fn()
vi.mock('../services/diet-phase.service', async () => {
  const actual = await vi.importActual<typeof import('../services/diet-phase.service')>('../services/diet-phase.service')
  return { ...actual, createPhase: createPhaseMock, endPhase: endPhaseMock }
})

const PHASE = { id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-09-01', durationWeeks: 8, status: 'ativa', baseTargets: { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 } }
const CTX = {
  today: '2026-10-13',
  profile: { heightCm: 180, birthDate: '1991-01-10', sex: 'masculino' },
  checkins: [{ id: 'c2', weight_kg: 79.6, waist_cm: 90, neck_cm: 40, created_at: '2026-10-01T09:00:00Z' }],
  phase: PHASE,
  lastCalibration: null,
  missing: [],
}
const auth = { Authorization: 'Bearer valid-token' }

async function buildApp() {
  const app = Fastify()
  const { nutritionPhaseRoutes } = await import('../routes/nutrition-phase')
  await app.register(nutritionPhaseRoutes)
  return app
}

describe('rotas da fase de dieta (spec 018, US0)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({
      diet_phase_calibrations: [
        { id: 'k1', phase_id: 'phase-1', user_id: 'u1', action: 'inicial', before: null, after: PHASE.baseTargets, reason: 'início', metrics: {}, created_at: '2026-09-01T10:00:00Z' },
        { id: 'k2', phase_id: 'phase-1', user_id: 'u1', action: 'reduzir', before: PHASE.baseTargets, after: { ...PHASE.baseTargets, kcal: 2030 }, reason: 'lento', metrics: {}, created_at: '2026-10-01T10:00:00Z' },
        { id: 'kx', phase_id: 'outra', user_id: 'u1', action: 'inicial', before: null, after: PHASE.baseTargets, reason: 'x', metrics: {}, created_at: '2026-08-01T10:00:00Z' },
      ],
    })
    loadNutritionContextMock.mockResolvedValue(CTX)
    app = await buildApp()
  })

  it('401 sem token válido', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/phase' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/phase', headers: { Authorization: 'Bearer x' } })).statusCode).toBe(401)
  })

  it('GET devolve a fase ativa, as calibrações (mais recentes primeiro), o % de gordura e o que falta', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/phase', headers: auth })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.phase).toEqual(PHASE)
    expect(body.calibrations.map((c: { id: string }) => c.id)).toEqual(['k2', 'k1'])
    expect(body.calibrations[0]).toMatchObject({ action: 'reduzir', after: { kcal: 2030 }, createdAt: '2026-10-01T10:00:00Z' })
    expect(body.bodyFatPct).toBe(18.4)
    expect(body.missing).toEqual([])
  })

  it('GET sem fase → phase null e lista vazia', async () => {
    loadNutritionContextMock.mockResolvedValue({ ...CTX, phase: null, checkins: [], missing: ['checkinWeight'] })
    const body = (await app.inject({ method: 'GET', url: '/api/nutrition/phase', headers: auth })).json()
    expect(body).toEqual({ phase: null, calibrations: [], bodyFatPct: null, missing: ['checkinWeight'] })
  })

  it('POST cria a fase → 201', async () => {
    createPhaseMock.mockResolvedValue({ phase: PHASE, calibration: { id: 'k1' } })
    const res = await app.inject({ method: 'POST', url: '/api/nutrition/phase', headers: auth, payload: { goal: 'perder_gordura', durationWeeks: 8 } })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ phase: PHASE, calibration: { id: 'k1' } })
    expect(createPhaseMock).toHaveBeenCalledWith('u1', expect.anything(), { goal: 'perder_gordura', durationWeeks: 8 }, CTX)
  })

  it('POST com pré-requisito faltando → 409 needs-profile', async () => {
    createPhaseMock.mockResolvedValue({ error: 'needs-profile', missing: ['sex'] })
    const res = await app.inject({ method: 'POST', url: '/api/nutrition/phase', headers: auth, payload: { goal: 'perder_gordura', durationWeeks: 8 } })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toEqual({ error: 'needs-profile', missing: ['sex'] })
  })

  it.each([
    [{ goal: 'emagrecer', durationWeeks: 8 }],
    [{ goal: 'perder_gordura', durationWeeks: 3 }],
    [{ goal: 'perder_gordura', durationWeeks: 53 }],
    [{ goal: 'perder_gordura', durationWeeks: 8.5 }],
  ])('POST 400 com corpo inválido: %o', async (payload) => {
    expect((await app.inject({ method: 'POST', url: '/api/nutrition/phase', headers: auth, payload })).statusCode).toBe(400)
  })

  it('POST /end encerra → 200; sem fase → 404', async () => {
    endPhaseMock.mockResolvedValueOnce({ ...PHASE, status: 'encerrada' })
    const ok = await app.inject({ method: 'POST', url: '/api/nutrition/phase/end', headers: auth })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().phase.status).toBe('encerrada')

    endPhaseMock.mockResolvedValueOnce(null)
    expect((await app.inject({ method: 'POST', url: '/api/nutrition/phase/end', headers: auth })).statusCode).toBe(404)
  })
})
