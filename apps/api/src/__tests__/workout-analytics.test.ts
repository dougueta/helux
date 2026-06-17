import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockSessions = [
  {
    date: '2026-06-15',
    exercises: [
      { name: 'Agachamento', sets: [{ reps: 8, weight: 100 }, { reps: 8, weight: 100 }] },
    ],
  },
  {
    date: '2026-06-10',
    exercises: [
      { name: 'Supino', sets: [{ reps: 6, weight: 80 }] },
    ],
  },
]

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
        })),
      })),
    })),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutAnalyticsRoutes } = await import('../routes/workout-analytics')
  await app.register(workoutAnalyticsRoutes)
  return app
}

describe('GET /api/workouts/analytics', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/workouts/analytics' })
    expect(res.statusCode).toBe(401)
  })

  it('returns analytics shape with Bearer token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/analytics',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('weeklyVolume')
    expect(body).toHaveProperty('personalRecords')
    expect(body).toHaveProperty('totalSessions')
    expect(body).toHaveProperty('currentStreakWeeks')
    expect(body).toHaveProperty('thisWeekSessions')
  })

  it('weeklyVolume always has 8 entries', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/analytics',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const body = res.json()
    expect(body.weeklyVolume).toHaveLength(8)
  })

  it('personalRecords finds max weight per exercise', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/analytics',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const body = res.json()
    const squat = body.personalRecords.find((pr: any) => pr.exerciseName === 'Agachamento')
    expect(squat?.maxWeight).toBe(100)
  })
})
