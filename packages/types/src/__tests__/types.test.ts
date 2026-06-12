import { describe, it, expect } from 'vitest'
import type {
  GeneticProfile,
  WorkoutConstraints,
  WorkoutSession,
  ExerciseSet,
  RecoveryData,
  PlanInput,
  NextWorkoutPlan,
  PlannedExercise,
} from '../index'

describe('GeneticProfile', () => {
  it('aceita todos os valores válidos de metabolismo', () => {
    const perfis: GeneticProfile[] = [
      { metabolismo: 'rapido', recuperacaoMuscular: 'alta', riscoCardiovascular: 'baixo', predisposicao: 'forca', alertas: [] },
      { metabolismo: 'lento', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'alto', predisposicao: 'endurance', alertas: ['evitar impacto alto'] },
      { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [] },
    ]
    expect(perfis).toHaveLength(3)
    expect(perfis[0].metabolismo).toBe('rapido')
    expect(perfis[1].alertas[0]).toBe('evitar impacto alto')
  })
})

describe('WorkoutSession', () => {
  it('armazena exercícios com séries, reps e esforço', () => {
    const sessao: WorkoutSession = {
      id: 'sess-001',
      date: '2026-06-12T10:00:00Z',
      exercises: [
        {
          name: 'Supino Reto',
          sets: [
            { reps: 10, weight: 80, effort: 7 },
            { reps: 8, weight: 82.5, effort: 8 },
          ],
        },
      ],
    }
    expect(sessao.exercises[0].name).toBe('Supino Reto')
    expect(sessao.exercises[0].sets[1].weight).toBe(82.5)
  })
})

describe('RecoveryData', () => {
  it('captura dados do HealthKit', () => {
    const recuperacao: RecoveryData = {
      date: '2026-06-12',
      hrv: 45,
      restingHR: 62,
      activeCalories: 420,
      source: 'healthkit',
    }
    expect(recuperacao.source).toBe('healthkit')
    expect(recuperacao.hrv).toBeGreaterThan(0)
  })
})

describe('PlanInput', () => {
  it('combina todos os dados necessários para gerar um plano', () => {
    const input: PlanInput = {
      geneticProfile: {
        metabolismo: 'moderado',
        recuperacaoMuscular: 'media',
        riscoCardiovascular: 'baixo',
        predisposicao: 'forca',
        alertas: [],
      },
      constraints: {
        maxWeeklyFrequency: 4,
        preferredVolume: 'medio',
        restBetweenSets: '90-120s',
        forbiddenExerciseTypes: [],
        cardioIntensityLimit: 'moderado',
      },
      workoutHistory: [],
      recoveryData: [],
      userGoals: 'ganhar massa muscular e perder gordura',
      userLevel: 'intermediario',
      availableDaysPerWeek: 4,
    }
    expect(input.userLevel).toBe('intermediario')
    expect(input.availableDaysPerWeek).toBe(4)
  })
})

describe('NextWorkoutPlan', () => {
  it('contém exercícios planejados e rationale da IA', () => {
    const plano: NextWorkoutPlan = {
      generatedAt: '2026-06-12T10:00:00Z',
      exercises: [
        {
          name: 'Supino Reto',
          sets: 4,
          reps: '8-10',
          weight: '82.5kg',
          notes: 'Foco na contração no topo',
        },
      ],
      rationale: 'Com base no seu HRV de 45ms e predisposição genética para força, recomendo volume moderado com foco em hipertrofia.',
    }
    expect(plano.exercises[0].reps).toBe('8-10')
    expect(plano.rationale).toBeTruthy()
  })
})
