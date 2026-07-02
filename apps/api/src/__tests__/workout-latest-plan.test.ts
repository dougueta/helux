import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const MOCK_ROW = {
  generated_at: '2026-06-13T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
  rationale: 'Plano baseado no perfil genético.',
}

const mockMaybeSingle = vi.fn()
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockOrder = vi.fn(() => ({ limit: mockLimit }))
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

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
  const { workoutLatestPlanRoutes } = await import('../routes/workout-latest-plan')
  await app.register(workoutLatestPlanRoutes)
  return app
}

describe('GET /workout/latest-plan', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockMaybeSingle.mockResolvedValue({ data: MOCK_ROW, error: null })
    app = await buildApp()
  })

  it('retorna 401 sem Bearer token', async () => {
    const response = await app.inject({ method: 'GET', url: '/workout/latest-plan' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna 200 com NextWorkoutPlan quando existe um plano salvo para o usuário', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.generatedAt).toBe(MOCK_ROW.generated_at)
    expect(body.exercises).toHaveLength(1)
    expect(body.rationale).toBe(MOCK_ROW.rationale)
    expect(mockFrom).toHaveBeenCalledWith('workout_plans')
  })

  it('retorna 404 quando o usuário ainda não tem plano salvo', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const response = await app.inject({
      method: 'GET',
      url: '/workout/latest-plan',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toMatch(/nenhum plano/i)
  })
})
