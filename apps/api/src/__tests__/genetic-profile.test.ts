import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import { buildApp } from '../app'

vi.mock('@helux/genetics', () => ({
  parseGeneraJson: vi.fn().mockReturnValue({
    metabolismo: 'moderado',
    recuperacaoMuscular: 'media',
    riscoCardiovascular: 'medio',
    predisposicao: 'misto',
    alertas: ['Predisposição para menor densidade óssea'],
  }),
}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({ fit: {}, escala_risco_genetico: {} })),
  }
})

describe('GET /genetic-profile', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna status 200 com GeneticProfile quando genera.json existe', async () => {
    const response = await app.inject({ method: 'GET', url: '/genetic-profile' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.metabolismo).toBe('moderado')
    expect(body.recuperacaoMuscular).toBe('media')
    expect(body.riscoCardiovascular).toBe('medio')
    expect(body.predisposicao).toBe('misto')
    expect(body.alertas).toBeInstanceOf(Array)
  })

  it('retorna 404 quando genera.json não existe', async () => {
    const { existsSync } = await import('node:fs')
    vi.mocked(existsSync).mockReturnValueOnce(false)
    const response = await app.inject({ method: 'GET', url: '/genetic-profile' })
    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toMatch(/genera\.json/)
  })
})
