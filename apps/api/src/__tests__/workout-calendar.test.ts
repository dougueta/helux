import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

let fake: FakeSupabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token'
          ? { data: { user: { id: 'u1' } }, error: null }
          : { data: { user: null }, error: new Error('bad') },
      ),
    },
    from: (t: string) => fake.client.from(t),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutCalendarRoutes } = await import('../routes/workout-calendar')
  await app.register(workoutCalendarRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }

describe('GET /api/workouts/calendar (spec 031 - T008)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({
      user_training_profile: [
        {
          user_id: 'u1',
          goal_primary: 'hipertrofia',
          level: 'intermediario',
          days_per_week: 4,
        },
      ],
      training_preferences: [
        {
          user_id: 'u1',
          available_days: [1, 2, 4, 5],
        },
      ],
      workout_sessions: [
        {
          id: 'sess-prev',
          user_id: 'u1',
          date: '2026-10-20',
          duration_s: 2700,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 10, weight: 70, effort: 7 }] },
          ],
          created_at: '2026-10-20T18:00:00Z',
        },
        {
          id: 'sess-1',
          user_id: 'u1',
          date: '2026-11-16',
          duration_s: 3120,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 8, weight: 80, effort: 8 }, { reps: 8, weight: 80, effort: 8 }] },
            { name: 'Remada curvada', sets: [{ reps: 10, weight: 60, effort: 8 }] },
          ],
          created_at: '2026-11-16T18:00:00Z',
        },
        {
          id: 'sess-2',
          user_id: 'u1',
          date: '2026-11-18',
          duration_s: 3600,
          exercises: [
            { name: 'Agachamento Livre', sets: [{ reps: 8, weight: 100, effort: 9 }, { reps: 8, weight: 100, effort: 9 }] },
          ],
          created_at: '2026-11-18T18:00:00Z',
        },
      ],
      session_checkins: [
        {
          id: 'chk-1',
          user_id: 'u1',
          session_id: 'sess-1',
          phase: 'depois',
          rpe: 8,
        },
      ],
      complementary_routine_logs: [
        {
          id: 'rout-1',
          user_id: 'u1',
          category: 'cardio',
          performed_on: '2026-11-16',
          performed_at: '2026-11-16T08:00:00Z',
          duration_minutes: 25,
          modality: 'bike',
          zone: 'leve',
          effort: 7,
          items: [],
          notes: null,
          created_at: '2026-11-16T08:00:00Z',
        },
      ],
      body_weights: [
        {
          id: 'w-1',
          user_id: 'u1',
          date: '2026-11-10',
          weight_kg: 82.0,
        },
        {
          id: 'w-2',
          user_id: 'u1',
          date: '2026-11-17',
          weight_kg: 81.6,
        },
      ],
    })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('retorna 401 sem token Bearer', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/workouts/calendar' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 400 invalid-month quando o formato do mês é inválido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/calendar?month=2026-13',
      headers: AUTH,
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: 'invalid-month' })
  })

  it('retorna 400 future-month quando o mês solicitado está no futuro', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/calendar?month=2099-01',
      headers: AUTH,
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: 'future-month' })
  })

  it('retorna a visão completa do calendário mensal com grade, saldo semanal, deltas de peso e curiosidades', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/calendar?month=2026-11',
      headers: AUTH,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()

    expect(body.month).toBe('2026-11')
    expect(body.monthLabel).toBe('Novembro 2026')
    expect(body.monthTotals).toMatchObject({
      activeDays: 2,
      gymDays: 2,
      complementaryCount: 1,
    })

    // Semana de 2026-11-16
    const weekBalance = body.weeklyBalances['2026-11-16']
    expect(weekBalance).toBeDefined()
    expect(weekBalance.gymDays).toBe(2)
    expect(weekBalance.targetGymDays).toBe(4)
    expect(weekBalance.complementaryCount).toBe(1)
    expect(weekBalance.avgWeightKg).toBe(81.6)
    expect(weekBalance.deltas.avgWeightKgDelta).toBe(-0.4)

    // Dia 2026-11-16 tem academia e rotina complementar
    const weekRow = body.weeks.find((w: { weekStart: string }) => w.weekStart === '2026-11-16')
    const day16 = weekRow.days.find((d: { date: string }) => d.date === '2026-11-16')
    expect(day16.hasGymWorkout).toBe(true)
    expect(day16.hasComplementaryRoutine).toBe(true)
    expect(day16.gymSessions).toHaveLength(1)
    expect(day16.routines).toHaveLength(1)

    // Curiosidades geradas deterministicamente
    expect(body.monthCuriosities.length).toBeGreaterThanOrEqual(2)
    expect(body.weeklyCuriosities['2026-11-16'].length).toBeGreaterThanOrEqual(2)
  })
})
