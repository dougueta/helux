import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: new Error('bad') },
      ),
    },
  }),
}))

const loadNutritionGeneticsMock = vi.fn()
vi.mock('../services/nutrition-context.service', () => ({ loadNutritionGenetics: (raw: unknown) => loadNutritionGeneticsMock(raw) }))
// Spec 024: o laudo vem do banco por usuário.
const getGeneticRawMock = vi.fn()
vi.mock('../services/genetics.service', () => ({ getGeneticRaw: (...a: unknown[]) => getGeneticRawMock(...a) }))

const MCM6 = { gene: 'MCM6', snp: 'rs4988235', genotype: 'G,G', label: 'Intolerância à lactose', result: 'Intolerante', section: 'nutri', category: 'metabolismo', status: 'atencao' }

async function buildApp() {
  const app = Fastify()
  const { nutritionGeneticProfileRoutes } = await import('../routes/nutrition-genetic-profile')
  await app.register(nutritionGeneticProfileRoutes)
  return app
}

describe('GET /api/nutrition/genetic-profile (spec 018, US4)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/genetic-profile' })).statusCode).toBe(401)
  })

  it('devolve active e os marcadores classificados (sem as flags)', async () => {
    getGeneticRawMock.mockResolvedValue({ nutri: {} })
    loadNutritionGeneticsMock.mockReturnValue({ active: true, markers: [MCM6], flags: { intoleranciaLactose: true } })
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/genetic-profile', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ active: true, markers: [MCM6] })
    expect(getGeneticRawMock).toHaveBeenCalledWith('u1', expect.anything())
    expect(loadNutritionGeneticsMock).toHaveBeenCalledWith({ nutri: {} })
  })

  it('sem laudo genético → active false e lista vazia', async () => {
    loadNutritionGeneticsMock.mockReturnValue({ active: false, markers: [], flags: {} })
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/genetic-profile', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.json()).toEqual({ active: false, markers: [] })
  })

  it('erro ao ler o perfil → 500', async () => {
    loadNutritionGeneticsMock.mockImplementation(() => {
      throw new Error('boom')
    })
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/genetic-profile', headers: { Authorization: 'Bearer valid-token' } })
    expect(res.statusCode).toBe(500)
  })
})
