import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 024 T044 — onboarding antes do primeiro mesociclo (FR-001..004).

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
  const { onboardingRoutes } = await import('../routes/onboarding')
  await app.register(onboardingRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }
const PROFILE = { user_id: 'u1', goal: 'Voltar a correr 5km sem dor no joelho', level: 'intermediario', training_time: '3 anos', time_off: '8 meses', current_injury: '3 cirurgias de LCA; artrose no joelho esquerdo', updated_at: '2026-08-29T10:00:00Z' }
const PREFS = { user_id: 'u1', available_days: [1, 2, 4, 5], max_session_minutes: 60, location: 'academia', available_equipment: [], favorite_exercises: [], exercises_to_avoid: [], priority_muscle_groups: [], training_style: null, free_instructions: null, updated_at: '2026-10-20T10:00:00Z' }

describe('onboarding (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({ user_training_profile: [{ ...PROFILE }], training_preferences: [{ ...PREFS }], health_conditions: [] })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/onboarding' })).statusCode).toBe(401)
  })

  it('GET pré-preenche com o que o Helux já sabe e sugere a conversão dos textos livres (FR-002, FR-003)', async () => {
    const body = (await app.inject({ method: 'GET', url: '/api/onboarding', headers: AUTH })).json()
    expect(body).toMatchObject({
      step: null,
      completedAt: null,
      profile: { level: 'intermediario', timeOff: '8 meses' },
      preferences: { availableDays: [1, 2, 4, 5], maxSessionMinutes: 60 },
      conditions: [],
      suggestions: { goalText: PROFILE.goal, injuryText: PROFILE.current_injury },
    })
  })

  it('PUT salva o passo e os campos enviados (perfil, objetivo, cardio e disponibilidade)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/onboarding',
      headers: AUTH,
      payload: {
        step: 2,
        goal: { primary: 'condicionamento', secondary: 'corrida', target: 'correr 5 km sem dor' },
        experience: { level: 'intermediario', trainingTime: '3 anos', timeOff: '8 meses' },
        cardio: { likes: ['bike', 'eliptico'], avoid: ['corrida'] },
        availability: { availableDays: [1, 3, 5], maxSessionMinutes: 50, location: 'academia', availableEquipment: ['barra', 'halteres', 'maquina-cabo', 'peso-corporal'] },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(fake.db.user_training_profile[0]).toMatchObject({ onboarding_step: 2, goal_primary: 'condicionamento', goal_secondary: 'corrida', goal_target: 'correr 5 km sem dor', cardio_likes: ['bike', 'eliptico'], cardio_avoid: ['corrida'] })
    expect(fake.db.training_preferences[0]).toMatchObject({ available_days: [1, 3, 5], max_session_minutes: 50 })
    expect(res.json().profile.goalPrimary).toBe('condicionamento')
  })

  it('PUT valida objetivo, secundário diferente, cardio e dias', async () => {
    const put = (payload: Record<string, unknown>) => app.inject({ method: 'PUT', url: '/api/onboarding', headers: AUTH, payload })
    expect((await put({ step: 1, goal: { primary: 'ficar-forte' } })).statusCode).toBe(400)
    expect((await put({ step: 1, goal: { primary: 'forca', secondary: 'forca' } })).statusCode).toBe(400)
    expect((await put({ step: 4, cardio: { likes: ['bike'], avoid: ['bike'] } })).statusCode).toBe(400)
    expect((await put({ step: 3, availability: { availableDays: [9] } })).statusCode).toBe(400)
    expect((await put({ step: 4, cardio: { likes: ['pular-corda'], avoid: [] } })).statusCode).toBe(400)
  })

  it('POST complete exige objetivo, nível e dias; depois grava a data', async () => {
    const missing = await app.inject({ method: 'POST', url: '/api/onboarding/complete', headers: AUTH })
    expect(missing.statusCode).toBe(400)
    expect(missing.json()).toMatchObject({ code: 'onboarding-incomplete', missing: ['goalPrimary'] })

    await app.inject({ method: 'PUT', url: '/api/onboarding', headers: AUTH, payload: { step: 5, goal: { primary: 'condicionamento' } } })
    const done = await app.inject({ method: 'POST', url: '/api/onboarding/complete', headers: AUTH })
    expect(done.statusCode).toBe(200)
    expect(done.json().completedAt).toEqual(expect.any(String))
    expect(fake.db.user_training_profile[0].onboarding_completed_at).toEqual(done.json().completedAt)
  })
})
