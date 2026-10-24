import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

// Spec 024 T019 — envio e remoção do laudo genético (contracts/api.md).

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: new Error('bad') },
      ),
    },
  }),
}))

const saveMock = vi.fn()
const deleteMock = vi.fn()
vi.mock('../services/genetics.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/genetics.service')>()
  return { ...actual, saveGeneticReport: (...a: unknown[]) => saveMock(...a), deleteGeneticReport: (...a: unknown[]) => deleteMock(...a) }
})

async function buildApp() {
  const app = Fastify()
  const { geneticsReportRoutes } = await import('../routes/genetics-report')
  await app.register(geneticsReportRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }

describe('POST/DELETE /api/genetics/report (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/genetics/report', payload: { fit: {} } })).statusCode).toBe(401)
    expect((await app.inject({ method: 'DELETE', url: '/api/genetics/report' })).statusCode).toBe(401)
  })

  it('201 com a data e o número de traços', async () => {
    saveMock.mockResolvedValue({ traits: 3 })
    const res = await app.inject({ method: 'POST', url: '/api/genetics/report', headers: AUTH, payload: { fit: {} } })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ traits: 3, uploadedAt: expect.any(String) })
    expect(saveMock).toHaveBeenCalledWith('u1', { fit: {} }, expect.anything())
  })

  it('400 invalid-report quando o laudo não é reconhecido', async () => {
    const { InvalidGeneticReportError } = await import('../services/genetics.service')
    saveMock.mockRejectedValue(new InvalidGeneticReportError())
    const res = await app.inject({ method: 'POST', url: '/api/genetics/report', headers: AUTH, payload: { outro: 1 } })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ code: 'invalid-report' })
  })

  it('413 acima de 1 MB', async () => {
    const big = { fit: { x: 'a'.repeat(1_100_000) } }
    const res = await app.inject({ method: 'POST', url: '/api/genetics/report', headers: AUTH, payload: big })
    expect(res.statusCode).toBe(413)
    expect(saveMock).not.toHaveBeenCalled()
  })

  it('DELETE → 204', async () => {
    deleteMock.mockResolvedValue(undefined)
    const res = await app.inject({ method: 'DELETE', url: '/api/genetics/report', headers: AUTH })
    expect(res.statusCode).toBe(204)
    expect(deleteMock).toHaveBeenCalledWith('u1', expect.anything())
  })
})
