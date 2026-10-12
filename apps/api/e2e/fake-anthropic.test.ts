import { describe, it, expect, afterEach } from 'vitest'
import { generateMesocyclePlan } from '@helux/ai'
import type { PlanInput } from '@helux/types'
import { startFakeAnthropic, type FakeAnthropic } from './fake-anthropic'

const PLAN_INPUT: PlanInput = {
  geneticProfile: { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] },
  constraints: { maxWeeklyFrequency: 4, preferredVolume: 'medio', restBetweenSets: '90-120s', cardioIntensityLimit: 'moderado', forbiddenExerciseTypes: [] },
  workoutHistory: [],
  recoveryData: [],
  userGoals: 'Hipertrofia',
  userLevel: 'intermediario',
  availableDaysPerWeek: 4,
}

describe('startFakeAnthropic', () => {
  let fake: FakeAnthropic | undefined
  const originalEnv = { base: process.env.ANTHROPIC_BASE_URL, key: process.env.ANTHROPIC_API_KEY }

  afterEach(async () => {
    await fake?.close()
    fake = undefined
    process.env.ANTHROPIC_BASE_URL = originalEnv.base
    process.env.ANTHROPIC_API_KEY = originalEnv.key
    if (originalEnv.base === undefined) delete process.env.ANTHROPIC_BASE_URL
    if (originalEnv.key === undefined) delete process.env.ANTHROPIC_API_KEY
  })

  it('serve um mesociclo que o SDK real e o parser do @helux/ai aceitam, com exercícios do banco', async () => {
    fake = await startFakeAnthropic()
    process.env.ANTHROPIC_BASE_URL = fake.url
    process.env.ANTHROPIC_API_KEY = 'fake-key'

    const plan = await generateMesocyclePlan(PLAN_INPUT)

    expect(plan.sessions.map((s) => s.letter)).toEqual(['A', 'B', 'C', 'D'])
    expect(plan.sessions.every((s) => s.completedAt === null)).toBe(true)
    for (const exercise of plan.sessions.flatMap((s) => s.exercises)) {
      // `muscle` só é preenchido quando o nome existe no EXERCISE_BANK.
      expect(exercise.muscle, exercise.name).toBeTruthy()
      expect(exercise.sets).toBeGreaterThanOrEqual(3)
      expect(exercise.weight).toMatch(/^\d+kg$/)
    }
  })

  it('conta as chamadas a POST /v1/messages', async () => {
    fake = await startFakeAnthropic()
    expect(fake.calls).toBe(0)
    await fetch(`${fake.url}/v1/messages`, { method: 'POST', body: '{}' })
    await fetch(`${fake.url}/v1/messages`, { method: 'POST', body: '{}' })
    expect(fake.calls).toBe(2)
  })

  it('responde 404 em outras rotas sem contar chamada', async () => {
    fake = await startFakeAnthropic()
    const res = await fetch(`${fake.url}/v1/outra`, { method: 'POST', body: '{}' })
    expect(res.status).toBe(404)
    expect(fake.calls).toBe(0)
  })

  it('libera a porta ao fechar', async () => {
    fake = await startFakeAnthropic()
    const url = fake.url
    await fake.close()
    fake = undefined
    await expect(fetch(`${url}/v1/messages`, { method: 'POST', body: '{}' })).rejects.toThrow()
  })
})
