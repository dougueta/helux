import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 029 (US1): pesagens — uma por dia, sem datas futuras.

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

async function buildApp() {
  const app = Fastify()
  const { weightsRoutes } = await import('../routes/weights')
  await app.register(weightsRoutes)
  return app
}

describe('rotas de pesagem (spec 029, US1)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({
      body_weights: [
        { id: 'w1', user_id: 'u1', date: '2026-11-06', weight_kg: 82.4 },
        { id: 'w0', user_id: 'u1', date: '2026-07-01', weight_kg: 85 },
        { id: 'w2', user_id: 'u1', date: '2026-11-05', weight_kg: 82.9 },
        { id: 'wx', user_id: 'outro', date: '2026-11-06', weight_kg: 60 },
      ],
    })
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/weights' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'PUT', url: '/api/weights/2026-11-08', payload: { weight_kg: 80 } })).statusCode).toBe(401)
  })

  it('GET lista as pesagens da janela em ordem crescente, só do usuário', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/weights?days=30', headers: auth })
    expect(res.statusCode).toBe(200)
    expect(res.json().weights.map((w: { date: string }) => w.date)).toEqual(['2026-11-05', '2026-11-06'])
  })

  it('GET com days fora de 1–730 → 400', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/weights?days=0', headers: auth })).statusCode).toBe(400)
  })

  it('PUT cria a pesagem do dia (replaced: false)', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/weights/2026-11-08', headers: auth, payload: { weight_kg: 82.1 } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ weight: { date: '2026-11-08', weight_kg: 82.1 }, replaced: false })
    expect(fake.db.body_weights.filter(w => w.user_id === 'u1' && w.date === '2026-11-08')).toHaveLength(1)
  })

  it('PUT no mesmo dia substitui (replaced: true) e mantém uma pesagem', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/weights/2026-11-06', headers: auth, payload: { weight_kg: 82 } })
    expect(res.json()).toMatchObject({ weight: { date: '2026-11-06', weight_kg: 82 }, replaced: true })
    expect(fake.db.body_weights.filter(w => w.user_id === 'u1' && w.date === '2026-11-06')).toHaveLength(1)
  })

  it('PUT com data futura → 400 future-date', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/weights/2026-11-09', headers: auth, payload: { weight_kg: 82 } })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('future-date')
  })

  it('PUT com data inválida ou peso fora de 20–500 → 400', async () => {
    expect((await app.inject({ method: 'PUT', url: '/api/weights/08-11-2026', headers: auth, payload: { weight_kg: 82 } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'PUT', url: '/api/weights/2026-11-08', headers: auth, payload: { weight_kg: 19 } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'PUT', url: '/api/weights/2026-11-08', headers: auth, payload: { weight_kg: 501 } })).statusCode).toBe(400)
  })

  it('DELETE apaga a pesagem do dia (204) e 404 quando não existe', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/weights/2026-11-06', headers: auth })
    expect(res.statusCode).toBe(204)
    expect(fake.db.body_weights.find(w => w.user_id === 'u1' && w.date === '2026-11-06')).toBeUndefined()
    expect(fake.db.body_weights.find(w => w.user_id === 'outro')).toBeDefined()
    expect((await app.inject({ method: 'DELETE', url: '/api/weights/2026-11-01', headers: auth })).statusCode).toBe(404)
  })
})
