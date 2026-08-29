import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockUpsertSingle = vi.fn().mockResolvedValue({ data: { id: 'sig-1' }, error: null })
const mockUpsertSelect = vi.fn(() => ({ single: mockUpsertSingle }))
const mockUpsert = vi.fn((_payload: Record<string, unknown>) => ({ select: mockUpsertSelect }))

const mockDeleteEqDate = vi.fn().mockResolvedValue({ error: null })
const mockDeleteEqUser = vi.fn(() => ({ eq: mockDeleteEqDate }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEqUser }))

const mockFrom = vi.fn(() => ({ upsert: mockUpsert, delete: mockDelete }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: mockFrom,
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { tirednessTodayRoutes } = await import('../routes/tiredness-today')
  await app.register(tirednessTodayRoutes)
  return app
}

describe('POST /api/tiredness-today', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockUpsertSingle.mockResolvedValue({ data: { id: 'sig-1' }, error: null })
    app = await buildApp()
  })

  it('retorna 401 sem Bearer token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/tiredness-today' })
    expect(res.statusCode).toBe(401)
  })

  it('marca cansaço hoje e retorna { active: true }', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/tiredness-today',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ active: true })
  })

  it('é idempotente — upsert em (user_id, date), não falha ao chamar duas vezes', async () => {
    await app.inject({ method: 'POST', url: '/api/tiredness-today', headers: { Authorization: 'Bearer valid-token' } })
    const res = await app.inject({ method: 'POST', url: '/api/tiredness-today', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.statusCode).toBe(200)
    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload).toHaveProperty('user_id', 'user-123')
    expect(upsertPayload).toHaveProperty('date')
  })
})

describe('DELETE /api/tiredness-today', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockDeleteEqDate.mockResolvedValue({ error: null })
    app = await buildApp()
  })

  it('retorna 401 sem Bearer token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/tiredness-today' })
    expect(res.statusCode).toBe(401)
  })

  it('desfaz a sinalização e retorna { active: false }', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/tiredness-today',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ active: false })
  })

  it('é idempotente — sem sinalização ativa não falha (FR-008a)', async () => {
    mockDeleteEqDate.mockResolvedValueOnce({ error: null })
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/tiredness-today',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
  })
})
