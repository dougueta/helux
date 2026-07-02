import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlanInput, GeneticProfile, WorkoutConstraints, WorkoutSession, RecoveryData, BodyCheckin } from '@helux/types'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({ messages: { create: mockCreate } })),
}))

import { generateWorkoutPlan } from '../planner'
import { buildUserPrompt, buildSystemPrompt } from '../prompts'

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

const MOCK_PLAN = {
  generatedAt: '2026-06-13T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
  rationale: 'Plano baseado no perfil genético moderado com foco em hipertrofia.',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(MOCK_PLAN) }],
    usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 2500, cache_read_input_tokens: 0 },
  })
})

describe('generateWorkoutPlan', () => {
  it('retorna NextWorkoutPlan com generatedAt, exercises e rationale', async () => {
    const result = await generateWorkoutPlan(MOCK_INPUT)

    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].name).toBe('Supino Reto')
    expect(result.rationale).toBe(MOCK_PLAN.rationale)
  })

  it('inclui GeneticProfile e WorkoutConstraints no system prompt', async () => {
    await generateWorkoutPlan(MOCK_INPUT)

    const callArgs = mockCreate.mock.calls[0][0]
    const systemText: string = callArgs.system[0].text

    expect(systemText).toContain('moderado')
    expect(systemText).toContain('misto')
    expect(systemText).toContain('pliometria de alto impacto')
    expect(systemText).toContain('90-120s')
  })

  it('inclui workoutHistory, recoveryData e userGoals no user prompt', async () => {
    const inputWithData: PlanInput = {
      ...MOCK_INPUT,
      workoutHistory: [
        { id: 'w1', date: '2026-06-12', exercises: [{ name: 'Agachamento', sets: [{ reps: 8, weight: 100, effort: 7 }] }] },
      ],
      recoveryData: [
        { date: '2026-06-12', hrv: 45, restingHR: 58, activeCalories: 320, cardioRecovery: 99, source: 'healthkit' },
      ],
      userGoals: 'ganhar força',
    }

    await generateWorkoutPlan(inputWithData)

    const callArgs = mockCreate.mock.calls[0][0]
    const userContent: string = callArgs.messages[0].content

    expect(userContent).toContain('Agachamento')
    expect(userContent).toContain('45')
    expect(userContent).toContain('ganhar força')
    expect(userContent).toContain('99')
  })

  it('propaga erro quando API key inválida (AuthenticationError)', async () => {
    const authError = Object.assign(new Error('invalid x-api-key'), { name: 'AuthenticationError', status: 401 })
    mockCreate.mockRejectedValueOnce(authError)

    await expect(generateWorkoutPlan(MOCK_INPUT)).rejects.toThrow('invalid x-api-key')
  })
})

describe('buildUserPrompt — check-in sections', () => {
  const baseArgs: [WorkoutSession[], RecoveryData[], string, string, number] = [
    [],
    [],
    'Hipertrofia',
    'intermediario',
    4,
  ]

  it('omits check-in section when no checkins provided', () => {
    const prompt = buildUserPrompt(...baseArgs)
    expect(prompt).not.toContain('Tendência de Progresso')
    expect(prompt).not.toContain('Check-in Mensal')
  })

  it('shows current data without delta when only 1 check-in', () => {
    const checkin: BodyCheckin = {
      id: '1', month: '2026-06-01', weight_kg: 82, body_fat_pct: 19,
      squat_kg: 120, bench_kg: 90, deadlift_kg: 140, created_at: '2026-06-01T00:00:00Z',
    }
    const prompt = buildUserPrompt(...baseArgs, [checkin])
    expect(prompt).toContain('Check-in Mensal Atual')
    expect(prompt).toContain('Jun/2026')
    expect(prompt).toContain('82')
    expect(prompt).not.toContain('Tendência de Progresso')
  })

  it('shows delta section when 2 check-ins provided', () => {
    const prev: BodyCheckin = {
      id: '1', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0,
      squat_kg: 115, bench_kg: 90, deadlift_kg: 140, created_at: '2026-05-01T00:00:00Z',
    }
    const curr: BodyCheckin = {
      id: '2', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1,
      squat_kg: 120, bench_kg: 90, deadlift_kg: 145, created_at: '2026-06-01T00:00:00Z',
    }
    const prompt = buildUserPrompt(...baseArgs, [prev, curr])
    expect(prompt).toContain('Tendência de Progresso')
    expect(prompt).toContain('Mai/2026')
    expect(prompt).toContain('Jun/2026')
    expect(prompt).toContain('-1.2')
    expect(prompt).toContain('-0.9')
    expect(prompt).toContain('+5.0')
  })
})

describe('buildSystemPrompt — check-in rules', () => {
  it('includes check-in adjustment rules', () => {
    const profile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] } as any
    const constraints = {} as any
    const prompt = buildSystemPrompt(profile, constraints)
    expect(prompt).toContain('Ajuste por Tendência de Progresso')
    expect(prompt).toContain('Gordura aumentou')
    expect(prompt).toContain('lifts estagnados')
  })
})
