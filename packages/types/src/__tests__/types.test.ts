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
  Variant,
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

describe('Variant', () => {
  it('descreve uma variante de exercício com fit genético', () => {
    const variante: Variant = {
      id: 'e1b',
      name: 'Supino reto com halteres',
      equip: 'Halteres',
      level: 'Intermediário',
      match: 90,
      betterFit: true,
      motion: 'press-flat',
      implement: 'dumbbell',
      why: 'Maior amplitude e estabilização; corrige assimetrias.',
    }
    expect(variante.betterFit).toBe(true)
    expect(variante.rec).toBeUndefined()
  })
})

describe('PlannedExercise — campos opcionais de variantes', () => {
  it('aceita muscle, muscles, tempo, match e variants além dos campos originais', () => {
    const exercicio: PlannedExercise = {
      name: 'Supino reto com barra',
      sets: 4,
      reps: '6-8',
      weight: '80kg',
      muscle: 'Peito',
      muscles: { primary: ['peito'], secondary: ['ombro', 'triceps'] },
      tempo: '2 · 0 · 1',
      match: 96,
      variants: [
        {
          id: 'e1',
          name: 'Supino reto com barra',
          equip: 'Barra',
          level: 'Avançado',
          match: 96,
          rec: true,
          motion: 'press-flat',
          implement: 'barbell',
          why: 'Cargas altas casam com seu perfil de força.',
        },
      ],
    }
    expect(exercicio.variants).toHaveLength(1)
    expect(exercicio.muscles?.primary).toEqual(['peito'])
  })

  it('continua válido sem nenhum dos novos campos (compatibilidade retroativa)', () => {
    const exercicio: PlannedExercise = { name: 'Agachamento', sets: 3, reps: '8-10', weight: '100kg' }
    expect(exercicio.variants).toBeUndefined()
    expect(exercicio.muscle).toBeUndefined()
  })
})
