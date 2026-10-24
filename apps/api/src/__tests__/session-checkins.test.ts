import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 024 T088 — check-in de sensações antes e depois do treino (FR-017/018).

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
  const { sessionCheckinsRoutes } = await import('../routes/session-checkins')
  await app.register(sessionCheckinsRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }
const TODAY = new Date().toISOString().slice(0, 10)
const post = (app: Awaited<ReturnType<typeof buildApp>>, payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/api/session-checkins', headers: AUTH, payload })

describe('check-ins de sensação (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({ session_checkins: [], daily_tiredness_signals: [], health_conditions: [] })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/session-checkins', payload: {} })).statusCode).toBe(401)
  })

  it('antes: grava energia, sono, motivação e dores; sem dor relevante não adapta', async () => {
    const res = await post(app, { phase: 'antes', date: TODAY, sessionIndex: 2, energy: 4, sleep: 3, motivation: 5, pains: [{ region: 'ombro', intensity: 1 }] })
    expect(res.statusCode).toBe(201)
    expect(fake.db.session_checkins[0]).toMatchObject({ user_id: 'u1', phase: 'antes', session_index: 2, energy: 4, sleep: 3, motivation: 5, pains: [{ region: 'ombro', intensity: 1 }] })
    expect(res.json().adjustment).toBeUndefined()
  })

  it('valida as faixas por fase', async () => {
    expect((await post(app, { phase: 'antes', date: TODAY, energy: 7, pains: [] })).statusCode).toBe(400)
    expect((await post(app, { phase: 'antes', date: TODAY, rpe: 8, pains: [] })).statusCode).toBe(400)
    expect((await post(app, { phase: 'depois', date: TODAY, energy: 3, pains: [] })).statusCode).toBe(400)
    expect((await post(app, { phase: 'depois', date: TODAY, rpe: 11, pains: [] })).statusCode).toBe(400)
    expect((await post(app, { phase: 'depois', date: TODAY, pains: [{ region: 'pescoço', intensity: 2 }] })).statusCode).toBe(400)
  })

  it('antes: energia baixa marca o cansaço do dia quando ainda não foi marcado; não sobrescreve escolha manual', async () => {
    await post(app, { phase: 'antes', date: TODAY, energy: 1, pains: [] })
    expect(fake.db.daily_tiredness_signals[0]).toMatchObject({ user_id: 'u1', date: TODAY, level: 'exausto' })
    fake.db.daily_tiredness_signals[0].level = 'normal'
    await post(app, { phase: 'antes', date: TODAY, energy: 2, pains: [] })
    expect(fake.db.daily_tiredness_signals[0].level).toBe('normal')
  })

  it('antes: dor forte numa articulação (ou dor numa região com condição) devolve a adaptação do dia', async () => {
    const strong = await post(app, { phase: 'antes', date: TODAY, pains: [{ region: 'joelho', intensity: 2 }] })
    expect(strong.json().adjustment).toMatchObject({ regions: ['joelho'], reason: expect.stringMatching(/joelho/) })
    fake.db.health_conditions.push({ id: 'h1', user_id: 'u1', catalog_key: 'tendinopatia-ombro', custom_label: null, region: 'ombro', side: null, since: null, count: 1, status: 'controlada', notes: null, flare_region: null, flare_until: null })
    const mild = await post(app, { phase: 'antes', date: TODAY, pains: [{ region: 'ombro', intensity: 1 }] })
    expect(mild.json().adjustment).toMatchObject({ regions: ['ombro'] })
  })

  it('o mesmo check-in do dia é substituído, não duplicado', async () => {
    await post(app, { phase: 'depois', date: TODAY, sessionIndex: 1, rpe: 7, feeling: 4, pains: [] })
    await post(app, { phase: 'depois', date: TODAY, sessionIndex: 1, rpe: 9, feeling: 2, pains: [{ region: 'lombar', intensity: 2 }] })
    expect(fake.db.session_checkins).toHaveLength(1)
    expect(fake.db.session_checkins[0]).toMatchObject({ rpe: 9, feeling: 2 })
  })
})
