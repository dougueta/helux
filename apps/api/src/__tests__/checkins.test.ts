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
const mockRange = vi.fn().mockResolvedValue({ data: [], error: null })
const mockFrom = vi.fn(() => ({ upsert: mockUpsert, select: vi.fn(() => ({ order: mockOrder })) }))

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
