import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 024 T095 — revisar sessões suspeitas: listar, confirmar e excluir.

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

async function buildApp() {
  const app = Fastify()
  const { workoutReviewRoutes } = await import('../routes/workout-review')
  await app.register(workoutReviewRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }
const sets = (n: number) => Array.from({ length: n }, () => ({ reps: 8, weight: 60, effort: 8 }))

describe('revisão de treinos (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({
      workout_sessions: [
        { id: 'real', user_id: 'u1', date: '2026-10-20', duration_s: 3600, review_status: null, exercises: [{ name: 'Supino', sets: sets(3) }] },
        { id: 'teste', user_id: 'u1', date: '2026-09-23', duration_s: 124, review_status: null, exercises: [{ name: 'Supino', sets: sets(3) }] },
        { id: 'outro', user_id: 'u2', date: '2026-09-23', duration_s: 60, review_status: null, exercises: [] },
      ],
    })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/workouts/review' })).statusCode).toBe(401)
  })

  it('lista só as suspeitas do usuário, com os motivos', async () => {
    const body = (await app.inject({ method: 'GET', url: '/api/workouts/review', headers: AUTH })).json()
    expect(body.sessions).toEqual([expect.objectContaining({ id: 'teste', date: '2026-09-23', reasons: ['duração de 2 min'] })])
  })

  it('confirmar marca como real; some da lista', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/workouts/teste/confirm', headers: AUTH })).statusCode).toBe(200)
    expect(fake.db.workout_sessions.find(s => s.id === 'teste')!.review_status).toBe('confirmada')
    expect((await app.inject({ method: 'GET', url: '/api/workouts/review', headers: AUTH })).json().sessions).toEqual([])
  })

  it('excluir apaga só a sessão do próprio usuário', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/api/workouts/teste', headers: AUTH })).statusCode).toBe(204)
    expect(fake.db.workout_sessions.map(s => s.id)).toEqual(['real', 'outro'])
    expect((await app.inject({ method: 'DELETE', url: '/api/workouts/outro', headers: AUTH })).statusCode).toBe(404)
    expect(fake.db.workout_sessions.map(s => s.id)).toEqual(['real', 'outro'])
  })
})
