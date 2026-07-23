import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlanInput, GeneticProfile, WorkoutConstraints } from '@helux/types'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({ messages: { create: mockCreate } })),
}))

import { generateMesocyclePlan } from '../mesocycle-planner'
import { buildMesocycleSystemPrompt } from '../mesocycle-prompts'

const MOCK_PROFILE: GeneticProfile = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'medio',
  predisposicao: 'misto',
  alertas: ['risco de lesão no ligamento'],
}

const MOCK_CONSTRAINTS: WorkoutConstraints = {
  maxWeeklyFrequency: 4,
  preferredVolume: 'medio',
  restBetweenSets: '90-120s',
  forbiddenExerciseTypes: ['pliometria de alto impacto'],
  cardioIntensityLimit: 'moderado',
}

const MOCK_INPUT: PlanInput = {
  geneticProfile: MOCK_PROFILE,
  constraints: MOCK_CONSTRAINTS,
  workoutHistory: [],
  recoveryData: [],
  userGoals: 'ganhar massa muscular',
  userLevel: 'intermediario',
  availableDaysPerWeek: 4,
}

const MOCK_MESOCYCLE = {
  generatedAt: '2026-07-21T10:00:00.000Z',
  daysPerWeek: 4,
  splitType: 'ABCD',
  rationale: 'Mesociclo de 4 semanas com divisão ABCD, focado em hipertrofia.',
  sessions: [
    { letter: 'A', focus: 'Peito + Tríceps', exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }] },
    { letter: 'B', focus: 'Costas + Bíceps', exercises: [{ name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '60kg' }] },
    { letter: 'C', focus: 'Pernas', exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '6-8', weight: '100kg' }] },
    { letter: 'D', focus: 'Ombro + Core', exercises: [{ name: 'Desenvolvimento Militar', sets: 3, reps: '8-10', weight: '40kg' }] },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(MOCK_MESOCYCLE) }],
    usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 2500, cache_read_input_tokens: 0 },
  })
})

describe('generateMesocyclePlan', () => {
  it('retorna MesocyclePlan com uma sessão por letra da divisão esperada para os dias/semana', async () => {
    const result = await generateMesocyclePlan(MOCK_INPUT)

    expect(result.sessions).toHaveLength(4)
    expect(result.sessions.map((s) => s.letter)).toEqual(['A', 'B', 'C', 'D'])
    expect(result.daysPerWeek).toBe(4)
  })

  it('retorna todas as sessões com completedAt null (recém-geradas)', async () => {
    const result = await generateMesocyclePlan(MOCK_INPUT)

    expect(result.sessions.every((s) => s.completedAt === null)).toBe(true)
  })

  it('o system prompt reaproveita o catálogo de exercícios e as restrições de treino, pedindo o ciclo inteiro', async () => {
    await generateMesocyclePlan(MOCK_INPUT)

    const callArgs = mockCreate.mock.calls[0][0]
    const systemText: string = callArgs.system[0].text

    expect(systemText).toContain('Catálogo de Exercícios')
    expect(systemText).toContain('pliometria de alto impacto')
    expect(systemText).toMatch(/mesociclo|ciclo completo/i)
  })

  it('propaga erro quando API key inválida (AuthenticationError)', async () => {
    const authError = Object.assign(new Error('invalid x-api-key'), { name: 'AuthenticationError', status: 401 })
    mockCreate.mockRejectedValueOnce(authError)

    await expect(generateMesocyclePlan(MOCK_INPUT)).rejects.toThrow('invalid x-api-key')
  })
})

describe('buildMesocycleSystemPrompt', () => {
  it('inclui o catálogo de exercícios e pede explicitamente um array de sessões cobrindo o ciclo completo', () => {
    const prompt = buildMesocycleSystemPrompt(MOCK_PROFILE, MOCK_CONSTRAINTS)

    expect(prompt).toContain('Catálogo de Exercícios')
    expect(prompt).toMatch(/mesociclo|ciclo completo/i)
    expect(prompt).toContain('"sessions"')
  })
})
