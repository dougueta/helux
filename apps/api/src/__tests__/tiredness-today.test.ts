import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import type { TirednessAssessment } from '@helux/types'

const ASSESSMENT: TirednessAssessment = {
  date: '2026-09-22',
  manualLevel: 'exausto',
  overrideAutomatic: false,
  automaticLevel: null,
  automaticHrv: null,
  effectiveLevel: 'exausto',
  source: 'manual',
  conflict: false,
}

const mockGetAssessment = vi.fn()
vi.mock('../services/tiredness.service', () => ({
  getTodayTirednessAssessment: mockGetAssessment,
  todaySlug: () => '2026-09-22',
}))

const mockUpsert = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: vi.fn(() => ({ upsert: mockUpsert })),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { tirednessTodayRoutes } = await import('../routes/tiredness-today')
  await app.register(tirednessTodayRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }

describe('/api/tiredness-today', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockGetAssessment.mockResolvedValue(ASSESSMENT)
    mockUpsert.mockResolvedValue({ error: null })
    app = await buildApp()
  })

  describe('GET', () => {
    it('retorna 401 sem Bearer token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/tiredness-today' })
      expect(res.statusCode).toBe(401)
    })

    it('retorna a avaliação do dia', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/tiredness-today', headers: AUTH })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual(ASSESSMENT)
      expect(mockGetAssessment).toHaveBeenCalledWith('user-123', expect.anything())
    })

    it('retorna 500 se a leitura falhar', async () => {
      mockGetAssessment.mockRejectedValueOnce(new Error('boom'))
      const res = await app.inject({ method: 'GET', url: '/api/tiredness-today', headers: AUTH })
      expect(res.statusCode).toBe(500)
    })
  })

  describe('PUT', () => {
    it('retorna 401 sem Bearer token', async () => {
      const res = await app.inject({ method: 'PUT', url: '/api/tiredness-today', payload: { level: 'normal' } })
      expect(res.statusCode).toBe(401)
    })

    it('retorna 400 para nível inválido', async () => {
      const res = await app.inject({ method: 'PUT', url: '/api/tiredness-today', headers: AUTH, payload: { level: 'muito' } })
      expect(res.statusCode).toBe(400)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('salva nível e override (upsert por usuário+dia) e devolve a avaliação recalculada', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/tiredness-today',
        headers: AUTH,
        payload: { level: 'exausto', overrideAutomatic: true },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual(ASSESSMENT)
      const [payload, options] = mockUpsert.mock.calls[0]
      expect(payload).toMatchObject({ user_id: 'user-123', date: '2026-09-22', level: 'exausto', override_automatic: true })
      expect(payload).toHaveProperty('updated_at')
      expect(options).toEqual({ onConflict: 'user_id,date' })
    })

    it('override é false por padrão', async () => {
      await app.inject({ method: 'PUT', url: '/api/tiredness-today', headers: AUTH, payload: { level: 'cansado' } })
      expect(mockUpsert.mock.calls[0][0]).toMatchObject({ level: 'cansado', override_automatic: false })
    })

    it('retorna 500 se o upsert falhar', async () => {
      mockUpsert.mockResolvedValueOnce({ error: { message: 'boom' } })
      const res = await app.inject({ method: 'PUT', url: '/api/tiredness-today', headers: AUTH, payload: { level: 'normal' } })
      expect(res.statusCode).toBe(500)
    })
  })

  it('não expõe mais POST/DELETE binários', async () => {
    const post = await app.inject({ method: 'POST', url: '/api/tiredness-today', headers: AUTH })
    const del = await app.inject({ method: 'DELETE', url: '/api/tiredness-today', headers: AUTH })
    expect(post.statusCode).toBe(404)
    expect(del.statusCode).toBe(404)
  })
})
