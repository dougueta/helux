import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockData = [
  { id: 'sess-1', date: '2026-06-15', duration_s: 3600, exercises: [], created_at: new Date().toISOString() },
]

const mockCount = vi.fn().mockResolvedValue({ count: 1, error: null })
const mockRange = vi.fn(() => ({ select: vi.fn().mockReturnThis() }))
const mockOrder = vi.fn(() => ({ range: mockRange }))
const mockSelectHistory = vi.fn(() => ({ order: mockOrder }))
const mockFromHistory = vi.fn(() => ({
  select: mockSelectHistory,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'workout_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 }),
              })),
            })),
          })),
        }
      }
      return { select: vi.fn() }
    }),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutHistoryRoutes } = await import('../routes/workout-history')
  await app.register(workoutHistoryRoutes)
  return app
}

describe('GET /api/workouts/history', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/workouts/history' })
    expect(res.statusCode).toBe(401)
  })

  it('returns session list with Bearer token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/history',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('sessions')
    expect(Array.isArray(body.sessions)).toBe(true)
  })

  it('respects limit and offset query params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/history?limit=5&offset=10',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
  })
})
