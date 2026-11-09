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
  const { routinesRoutes } = await import('../routes/routines')
  await app.register(routinesRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }
const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

describe('rotinas complementares API (030)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({
      user_training_profile: [
        {
          user_id: 'u1',
          goal_primary: 'hipertrofia',
          level: 'intermediario',
          cardio_likes: ['bike'],
          cardio_avoid: [],
          complementary_preferences: {},
        },
      ],
      training_preferences: [
        {
          user_id: 'u1',
          available_days: [1, 3, 5],
          max_session_minutes: 60,
          location: 'academia',
          available_equipment: ['peso-corporal', 'halteres'],
          favorite_exercises: [],
          exercises_to_avoid: [],
          priority_muscle_groups: [],
          training_style: 'hipertrofia-classica',
          free_instructions: null,
        },
      ],
      health_conditions: [],
      shared_guidance: [],
      mesocycle_plans: [
        {
          id: 'meso-1',
          user_id: 'u1',
          generated_at: '2026-11-01T10:00:00Z',
          created_at: '2026-11-01T10:00:00Z',
          days_per_week: 3,
          split_type: 'Upper/Lower',
          rationale: 'Foco em hipertrofia',
          sessions: [
            {
              letter: 'A',
              focus: 'Inferiores — Quadríceps e Glúteos',
              completedAt: null,
              exercises: [
                { name: 'Agachamento Livre', sets: 4, reps: '8', weight: '60 kg', restSeconds: 120, muscle: 'quadriceps', phase: 'principal' },
              ],
            },
            {
              letter: 'B',
              focus: 'Superiores — Peito e Costas',
              completedAt: null,
              exercises: [],
            },
          ],
        },
      ],
      workout_sessions: [],
      complementary_routine_logs: [],
    })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/routines' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'PUT', url: '/api/routines/preferences', payload: {} })).statusCode).toBe(401)
    expect((await app.inject({ method: 'POST', url: '/api/routines/logs', payload: {} })).statusCode).toBe(401)
    expect((await app.inject({ method: 'DELETE', url: '/api/routines/logs/log-1' })).statusCode).toBe(401)
  })

  it('GET /api/routines devolve as 3 rotinas prescritas, progresso semanal e alerta de pernas no cardio', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/routines', headers: AUTH })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Object.keys(body.routines)).toEqual([
      'alongamento-mobilidade',
      'core-abdominal',
      'cardio',
    ])
    expect(body.progress['alongamento-mobilidade']).toMatchObject({
      category: 'alongamento-mobilidade',
      doneToday: false,
      completedThisWeek: 0,
    })
    expect(body.completedToday).toEqual([])
    expect(body.routines.cardio.legDayWarning).toMatch(/membros inferiores/i)
    expect(body.routines.cardio.items[0].id).toBe('bike')
  })

  it('PUT /api/routines/preferences grava preferências e recalcula as rotinas na hora sem chamadas de IA', async () => {
    const prefs = {
      'alongamento-mobilidade': { daysPerWeek: 7, targetMinutes: 15, focusRegions: ['quadril', 'lombar'] },
      'core-abdominal': { daysPerWeek: 4, targetMinutes: 15 },
      cardio: { daysPerWeek: 3, targetMinutes: 25, preferredModality: 'remo' },
    }
    const res = await app.inject({
      method: 'PUT',
      url: '/api/routines/preferences',
      headers: AUTH,
      payload: prefs,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.preferences['alongamento-mobilidade'].daysPerWeek).toBe(7)
    expect(body.routines['alongamento-mobilidade'].daysPerWeek).toBe(7)
    expect(body.routines['alongamento-mobilidade'].estimatedMinutes).toBe(15)
    expect(body.routines.cardio.items[0].id).toBe('remo')
  })

  it('PUT /api/routines/preferences rejeita modalidade incompatível com condição ativa (400 invalid-modality)', async () => {
    fake.db.health_conditions.push({
      id: 'c1',
      user_id: 'u1',
      catalog_key: 'artrose',
      custom_label: null,
      region: 'joelho',
      side: 'esquerdo',
      since: null,
      count: 1,
      status: 'controlada',
      notes: null,
      flare_region: null,
      flare_until: null,
    })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/routines/preferences',
      headers: AUTH,
      payload: {
        cardio: { preferredModality: 'corrida-esteira' },
      },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: 'invalid-modality' })
  })

  it('POST /api/routines/logs registra execução, atualiza progresso semanal e NÃO toca mesocycle_plans nem workout_sessions (FR-002)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/routines/logs',
      headers: AUTH,
      payload: {
        category: 'cardio',
        performed_on: TODAY,
        duration_minutes: 25,
        modality: 'bike',
        zone: 'leve',
        effort: 6,
        items: [{ id: 'bike', name: 'Bike ergométrica', setsCompleted: 1, secondsOrReps: '25 min' }],
        notes: 'Cardio matinal leve',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.log).toMatchObject({
      category: 'cardio',
      performed_on: TODAY,
      duration_minutes: 25,
      modality: 'bike',
      zone: 'leve',
      effort: 6,
    })
    expect(body.view.completedToday).toContain('cardio')
    expect(body.view.progress.cardio.completedThisWeek).toBe(1)
    expect(body.view.progress.cardio.doneToday).toBe(true)

    // Garantia explícita FR-002 / SC-001: zero mutações em mesocycle_plans ou workout_sessions
    const touchedMesoOrWorkouts = fake.calls.filter(
      c => c.table === 'mesocycle_plans' || c.table === 'workout_sessions',
    )
    expect(touchedMesoOrWorkouts).toHaveLength(0)
    expect((fake.db.mesocycle_plans[0].sessions as unknown[])[0]).toMatchObject({ letter: 'A', completedAt: null })
  })

  it('POST /api/routines/logs rejeita data futura com 400 future-date', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/routines/logs',
      headers: AUTH,
      payload: {
        category: 'alongamento-mobilidade',
        performed_on: TOMORROW,
        duration_minutes: 10,
        items: [{ id: 'gato-camelo', name: 'Gato-Camelo', setsCompleted: 1, secondsOrReps: '10 reps' }],
      },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: 'future-date' })
  })

  it('DELETE /api/routines/logs/:id remove registro próprio (204) e retorna 404 para registro inexistente ou de outro usuário', async () => {
    fake.db.complementary_routine_logs.push(
      {
        id: 'log-u1',
        user_id: 'u1',
        category: 'core-abdominal',
        performed_on: TODAY,
        performed_at: new Date().toISOString(),
        duration_minutes: 10,
        modality: null,
        zone: null,
        effort: 7,
        items: [],
        notes: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'log-other',
        user_id: 'u2',
        category: 'cardio',
        performed_on: TODAY,
        performed_at: new Date().toISOString(),
        duration_minutes: 20,
        modality: 'bike',
        zone: 'leve',
        effort: 5,
        items: [],
        notes: null,
        created_at: new Date().toISOString(),
      },
    )

    expect((await app.inject({ method: 'DELETE', url: '/api/routines/logs/log-other', headers: AUTH })).statusCode).toBe(404)
    expect((await app.inject({ method: 'DELETE', url: '/api/routines/logs/nao-existe', headers: AUTH })).statusCode).toBe(404)
    expect((await app.inject({ method: 'DELETE', url: '/api/routines/logs/log-u1', headers: AUTH })).statusCode).toBe(204)
    expect(fake.db.complementary_routine_logs.find(r => r.id === 'log-u1')).toBeUndefined()
  })
})
