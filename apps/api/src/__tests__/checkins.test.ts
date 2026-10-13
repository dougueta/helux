import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockSingle = vi.fn().mockResolvedValue({
  data: {
    id: 'c-1', user_id: 'user-123', month: '2026-06-01',
    weight_kg: 82, body_fat_pct: 18.5, squat_kg: 120,
    created_at: new Date().toISOString(),
  },
  error: null,
})
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockUpsert = vi.fn(() => ({ select: mockSelect }))
const mockOrder = vi.fn(() => ({ range: vi.fn().mockResolvedValue({ data: [], error: null }) }))
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockFrom = vi.fn(() => ({ upsert: mockUpsert, select: vi.fn(() => ({ eq: mockEq })) }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: mockFrom,
  }),
}))

// Spec 018: recalibração da fase depois de gravar o check-in.
const loadNutritionContextMock = vi.fn().mockResolvedValue({ phase: null })
const recalibrateOnCheckinMock = vi.fn().mockResolvedValue(null)
vi.mock('../services/nutrition-context.service', () => ({ loadNutritionContext: loadNutritionContextMock }))
vi.mock('../services/diet-phase.service', () => ({ recalibrateOnCheckin: recalibrateOnCheckinMock }))

async function buildApp() {
  const app = Fastify()
  const { checkinsRoutes } = await import('../routes/checkins')
  await app.register(checkinsRoutes)
  return app
}

describe('POST /api/checkins', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      payload: { month: '2026-06-01', weight_kg: 82 },
    })
    expect(res.statusCode).toBe(401)
  })

  it('saves check-in and returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { month: '2026-06-01', weight_kg: 82, squat_kg: 120 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
  })

  it('returns 400 when month is not day 01', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { month: '2026-06-15', weight_kg: 82 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when month is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { weight_kg: 82 },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/checkins', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/checkins' })
    expect(res.statusCode).toBe(401)
  })

  it('returns checkins array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/checkins?limit=2',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('checkins')
    expect(Array.isArray(body.checkins)).toBe(true)
  })
})

describe('spec 018 — pescoço e recalibração da fase', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const auth = { Authorization: 'Bearer valid-token' }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    loadNutritionContextMock.mockResolvedValue({ phase: { id: 'phase-1' } })
    recalibrateOnCheckinMock.mockResolvedValue(null)
    app = await buildApp()
  })

  it('aceita neck_cm e grava', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/checkins', headers: auth, payload: { month: '2026-10-01', weight_kg: 80, neck_cm: 40 } })
    expect(res.statusCode).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ neck_cm: 40 }), expect.anything())
  })

  it.each([[19], [71]])('400 com neck_cm fora de 20–70 (%s)', async (neck) => {
    const res = await app.inject({ method: 'POST', url: '/api/checkins', headers: auth, payload: { month: '2026-10-01', neck_cm: neck } })
    expect(res.statusCode).toBe(400)
  })

  it('depois de gravar, recalibra a fase com o check-in salvo e devolve a calibração junto', async () => {
    const calibration = { id: 'k2', action: 'reduzir', before: { kcal: 2180 }, after: { kcal: 2030 }, reason: 'x', metrics: {}, createdAt: 'now' }
    recalibrateOnCheckinMock.mockResolvedValue(calibration)

    const res = await app.inject({ method: 'POST', url: '/api/checkins', headers: auth, payload: { month: '2026-10-01', weight_kg: 80 } })

    expect(res.statusCode).toBe(200)
    expect(recalibrateOnCheckinMock).toHaveBeenCalledWith('user-123', expect.anything(), expect.objectContaining({ id: 'c-1' }), { phase: { id: 'phase-1' } })
    expect(res.json()).toMatchObject({ id: 'c-1', weight_kg: 82, calibration })
  })

  it('sem fase ativa → calibration null', async () => {
    loadNutritionContextMock.mockResolvedValue({ phase: null })
    const res = await app.inject({ method: 'POST', url: '/api/checkins', headers: auth, payload: { month: '2026-10-01', weight_kg: 80 } })
    expect(res.json().calibration).toBeNull()
    expect(recalibrateOnCheckinMock).not.toHaveBeenCalled()
  })

  it('falha na recalibração não falha o check-in', async () => {
    recalibrateOnCheckinMock.mockRejectedValue(new Error('boom'))
    const res = await app.inject({ method: 'POST', url: '/api/checkins', headers: auth, payload: { month: '2026-10-01', weight_kg: 80 } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: 'c-1', calibration: null })
  })
})
