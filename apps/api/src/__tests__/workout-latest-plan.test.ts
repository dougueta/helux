import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'

const MOCK_PLAN = {
  generatedAt: '2026-06-13T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
  rationale: 'Plano baseado no perfil genético.',
}

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
})

import { buildApp } from '../app'
import { existsSync, readFileSync } from 'node:fs'

describe('GET /workout/latest-plan', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(MOCK_PLAN))
  })

  it('retorna 200 com NextWorkoutPlan quando latest-plan.json existe', async () => {
    const response = await app.inject({ method: 'GET', url: '/workout/latest-plan' })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.generatedAt).toBe(MOCK_PLAN.generatedAt)
    expect(body.exercises).toHaveLength(1)
    expect(body.rationale).toBe(MOCK_PLAN.rationale)
  })

  it('retorna 404 com error quando latest-plan.json não existe', async () => {
    vi.mocked(existsSync).mockReturnValueOnce(false)

    const response = await app.inject({ method: 'GET', url: '/workout/latest-plan' })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toMatch(/nenhum plano/i)
  })
})
