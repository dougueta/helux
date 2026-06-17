import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

// Mock Supabase — chain: from().insert().select().single()
const mockSingle = vi.fn().mockResolvedValue({
  data: { id: 'session-456', created_at: new Date().toISOString() },
  error: null,
})
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({ insert: mockInsert })),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutSessionsRoutes } = await import('../routes/workout-sessions')
  await app.register(workoutSessionsRoutes)
  return app
}

describe('POST /api/workouts/sessions', () => {
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
      url: '/api/workouts/sessions',
      payload: { date: '2026-06-15', exercises: [] },
    })
    expect(res.statusCode).toBe(401)
  })

  it('saves session and returns 201 with id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts/sessions',
      headers: { Authorization: 'Bearer valid-token' },
      payload: {
        date: '2026-06-15',
        duration_s: 3600,
        exercises: [{ name: 'Agachamento', sets: [{ reps: 8, weight: 80, effort: 8 }] }],
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body).toHaveProperty('id')
  })

  it('returns 400 for missing date', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts/sessions',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { exercises: [] },
    })
    expect(res.statusCode).toBe(400)
  })
})
