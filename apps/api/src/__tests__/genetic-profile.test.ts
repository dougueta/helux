import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

// Spec 020 + 024: o perfil genético vem do laudo do usuário no banco e exige login.

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: new Error('bad') },
      ),
    },
  }),
}))

const getReportMock = vi.fn()
vi.mock('../services/genetics.service', () => ({ getGeneticReport: (...a: unknown[]) => getReportMock(...a) }))

const REPORT = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'medio',
  predisposicao: 'misto',
  alertas: ['Predisposição para menor densidade óssea'],
  traits: [{ key: 'rs2707466:densidade-ossea', gene: 'WNT16', genotype: 'C,T', label: 'Densidade óssea', level: 0.9, note: 'Menor densidade óssea', warn: true, evidence: 'fraca' }],
}

async function buildApp() {
  const app = Fastify()
  const { geneticProfileRoutes } = await import('../routes/genetic-profile')
  await app.register(geneticProfileRoutes)
  return app
}

describe('GET /genetic-profile', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token (024: o laudo é dado pessoal)', async () => {
    expect((await app.inject({ method: 'GET', url: '/genetic-profile' })).statusCode).toBe(401)
  })

  it('200 com o resumo e os marcadores do laudo do usuário', async () => {
    getReportMock.mockResolvedValue(REPORT)
    const res = await app.inject({ method: 'GET', url: '/genetic-profile', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(REPORT)
    expect(getReportMock).toHaveBeenCalledWith('u1', expect.anything())
  })

  it('404 no-genetic-report quando o usuário não enviou laudo', async () => {
    getReportMock.mockResolvedValue(null)
    const res = await app.inject({ method: 'GET', url: '/genetic-profile', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 'no-genetic-report' })
  })
})
