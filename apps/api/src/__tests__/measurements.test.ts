import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 029 (US2): registros de medidas datados; % pela fita calculado no servidor.

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

vi.mock('../services/local-date', async () => {
  const actual = await vi.importActual<typeof import('../services/local-date')>('../services/local-date')
  return { ...actual, localToday: () => '2026-11-08' }
})

const auth = { Authorization: 'Bearer valid-token' }
const PROFILE = { user_id: 'u1', height_cm: 180, sex: 'masculino' }

async function buildApp() {
  const app = Fastify()
  const { measurementsRoutes } = await import('../routes/measurements')
  await app.register(measurementsRoutes)
  return app
}

function seed(profile: Record<string, unknown> | null = PROFILE) {
  fake = fakeSupabase({
    user_training_profile: profile ? [profile] : [],
    body_checkins: [
      { id: 'm1', user_id: 'u1', measured_on: '2026-10-01', waist_cm: 92, neck_cm: 40, created_at: '2026-10-01T10:00:00Z' },
      { id: 'm2', user_id: 'u1', measured_on: '2026-11-01', waist_cm: 90, neck_cm: 40, created_at: '2026-11-01T10:00:00Z' },
      { id: 'mx', user_id: 'outro', measured_on: '2026-11-02', waist_cm: 70, neck_cm: 30, created_at: '2026-11-02T10:00:00Z' },
    ],
  })
}

const post = (app: Awaited<ReturnType<typeof buildApp>>, payload: unknown) =>
  app.inject({ method: 'POST', url: '/api/measurements', headers: auth, payload: payload as Record<string, unknown> })

describe('rotas de medidas (spec 029, US2)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    seed()
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/measurements' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'POST', url: '/api/measurements', payload: {} })).statusCode).toBe(401)
  })

  it('GET lista do usuário, do mais recente para o mais antigo', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/measurements?limit=5', headers: auth })
    expect(res.statusCode).toBe(200)
    expect(res.json().measurements.map((m: { id: string }) => m.id)).toEqual(['m2', 'm1'])
  })

  it('POST calcula e salva o % pela fita com o perfil (navy_status ok)', async () => {
    const res = await post(app, { measured_on: '2026-11-08', waist_cm: 90, neck_cm: 40, arm_left_cm: 38, arm_right_cm: 38.5 })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.navy_status).toBe('ok')
    expect(body.measurement).toMatchObject({ measured_on: '2026-11-08', body_fat_navy_pct: 18.4, arm_left_cm: 38, arm_right_cm: 38.5 })
    const saved = fake.db.body_checkins.find(r => r.measured_on === '2026-11-08')
    expect(saved).toMatchObject({ user_id: 'u1', body_fat_navy_pct: 18.4 })
  })

  it('POST ignora body_fat_navy_pct enviado pelo cliente', async () => {
    const res = await post(app, { measured_on: '2026-11-08', chest_cm: 100, body_fat_navy_pct: 5 })
    expect(res.statusCode).toBe(201)
    expect(res.json().measurement.body_fat_navy_pct ?? null).toBeNull()
  })

  it('POST sem altura/sexo no perfil → navy_status sem-perfil, medidas salvas', async () => {
    seed(null)
    app = await buildApp()
    const res = await post(app, { measured_on: '2026-11-08', waist_cm: 90, neck_cm: 40 })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ navy_status: 'sem-perfil', measurement: { waist_cm: 90 } })
  })

  it('POST sem cintura ou pescoço → sem-medidas; pescoço ≥ cintura → inconsistente', async () => {
    expect((await post(app, { measured_on: '2026-11-08', chest_cm: 100 })).json().navy_status).toBe('sem-medidas')
    const res = await post(app, { measured_on: '2026-11-08', waist_cm: 40, neck_cm: 41 })
    expect(res.statusCode).toBe(201)
    expect(res.json().navy_status).toBe('inconsistente')
    expect(res.json().measurement.body_fat_navy_pct ?? null).toBeNull()
  })

  it('POST com % de aparelho exige a origem', async () => {
    expect((await post(app, { measured_on: '2026-11-08', body_fat_device_pct: 18 })).statusCode).toBe(400)
    const ok = await post(app, { measured_on: '2026-11-08', body_fat_device_pct: 18, body_fat_device_source: 'bioimpedancia' })
    expect(ok.statusCode).toBe(201)
    expect(ok.json().measurement).toMatchObject({ body_fat_device_pct: 18, body_fat_device_source: 'bioimpedancia' })
  })

  it('POST vazio → 400 empty; data futura → 400; medida fora do limite → 400', async () => {
    const empty = await post(app, { measured_on: '2026-11-08' })
    expect(empty.statusCode).toBe(400)
    expect(empty.json().error).toBe('empty')
    expect((await post(app, { measured_on: '2026-11-09', waist_cm: 90 })).statusCode).toBe(400)
    expect((await post(app, { measured_on: '2026-11-08', calf_left_cm: 10 })).statusCode).toBe(400)
    expect((await post(app, { measured_on: '2026-11-08', shoulders_cm: 201 })).statusCode).toBe(400)
  })

  it('PUT recalcula a fita com o perfil atual e 404 para registro de outro usuário', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/measurements/m2', headers: auth, payload: { measured_on: '2026-11-01', waist_cm: 90, neck_cm: 40 } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ navy_status: 'ok', measurement: { id: 'm2', body_fat_navy_pct: 18.4 } })
    const other = await app.inject({ method: 'PUT', url: '/api/measurements/mx', headers: auth, payload: { measured_on: '2026-11-02', waist_cm: 70 } })
    expect(other.statusCode).toBe(404)
  })

  it('DELETE apaga (204) e 404 quando não existe ou é de outro usuário', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/api/measurements/m1', headers: auth })).statusCode).toBe(204)
    expect(fake.db.body_checkins.find(r => r.id === 'm1')).toBeUndefined()
    expect((await app.inject({ method: 'DELETE', url: '/api/measurements/mx', headers: auth })).statusCode).toBe(404)
    expect((await app.inject({ method: 'DELETE', url: '/api/measurements/nao', headers: auth })).statusCode).toBe(404)
  })
})
