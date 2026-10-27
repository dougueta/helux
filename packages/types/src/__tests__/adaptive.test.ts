import { describe, it, expect } from 'vitest'
import {
  GOALS,
  REGIONS,
  SESSION_KINDS,
  type Goal,
  type HealthCondition,
  type ConditionRules,
  type MethodPrescription,
  type SessionCheckin,
  type CycleSummary,
  type CheckinTrend,
  type GenerationStatus,
  type HardConstraints,
  type MesocycleSession,
  type PlannedExercise,
  type AdjustedWorkoutPlanView,
} from '../index'

// Spec 024 — tipos do treino adaptativo (data-model.md).

describe('enums da 024', () => {
  it('objetivos, regiões e tipos de sessão', () => {
    expect(GOALS).toEqual(['condicionamento', 'hipertrofia', 'forca', 'emagrecimento', 'corrida'])
    expect(REGIONS).toContain('joelho')
    expect(REGIONS).toContain('sistemica')
    expect(SESSION_KINDS).toEqual(['forca', 'cardio', 'mobilidade'])
  })
})

describe('formas dos tipos', () => {
  it('condição, regras, prescrição, check-in, ciclo, tendência e estado de geração', () => {
    const goal: Goal = 'corrida'
    const condition: HealthCondition = {
      id: 'c1', catalogKey: 'lca-reconstrucao', customLabel: null, region: 'joelho', side: 'esquerdo',
      since: '2015-01-01', count: 2, status: 'controlada', notes: null, flare: null,
    }
    const rules: ConditionRules = {
      maxJointStress: { joelho: 1 }, blockedPatterns: [], blockedExercises: [], maxCardioImpact: 1, minRir: null, cues: ['joelho alinhado'], medicalNoteOnFlare: false,
    }
    const method: MethodPrescription = {
      goal, weeks: 4, deloadWeek: 4, strengthDays: 3, cardioSessions: 2, mobilitySessions: 1,
      allowedSplits: ['full-body'], minFrequencyPerGroup: 2, weeklySetsPerGroup: { min: 6, max: 10 },
      weekly: [{ week: 1, setsFactor: 1, rirTarget: 3, deload: false }],
      repRanges: { basicos: [6, 10], acessorios: [10, 15] },
      cardio: { minutes: 25, zone: 'leve', maxImpact: 0, allowed: ['bike'] }, modifiers: [],
    }
    const checkin: SessionCheckin = { phase: 'antes', energy: 3, sleep: 4, motivation: 4, pains: [{ region: 'joelho', intensity: 2 }] }
    const trend: CheckinTrend = { from: '2026-09', to: '2026-10', deltas: { weight_kg: -1 }, implausible: [], modifiers: [], suggestGoalChange: null }
    const summary: CycleSummary = {
      mesocycleId: 'm1', weeks: 4, adherence: { forca: { done: 10, planned: 12 }, cardio: { done: 2, planned: 8 }, mobilidade: { done: 4, planned: 4 } },
      exercises: [], avgRpeByWeek: [7, 8], pains: [], tirednessAvg: null, checkinTrend: trend, findings: [{ kind: 'baixa-aderencia', subject: 'cardio', evidence: '2 de 8' }], missingData: [],
    }
    const status: GenerationStatus = { status: 'falhou', attempts: 3, errorCode: 'incomplete-response', startedAt: null }
    const constraints: HardConstraints = {
      availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [],
      maxJointStress: { joelho: 1 }, maxCardioImpact: 0, minRir: 2,
    }
    const exercise: PlannedExercise = { name: 'Bike', sets: 1, reps: '25 min', weight: '—', cardio: { modality: 'bike', minutes: 25, zone: 'leve' } }
    const mobility: PlannedExercise = { name: 'Mobilidade de quadril', sets: 1, reps: '5 min', weight: '—', phase: 'principal', region: 'quadril' }
    const strength: PlannedExercise = { name: 'Leg Press 45°', sets: 3, reps: '10-12', weight: '100kg', rirTarget: 2 }
    const session: MesocycleSession = { letter: 'A', focus: 'Superior', exercises: [strength, exercise, mobility], completedAt: null, week: 1, kind: 'forca', deload: false }
    const view: AdjustedWorkoutPlanView = {
      mesocycleId: 'm1', generatedAt: null, today: null, upcoming: [], progress: null,
      status: 'onboarding-required', week: { current: 1, total: 4, deload: false }, kind: 'cardio', generation: status,
    }
    expect([condition, rules, method, checkin, summary, constraints, session, view].every(Boolean)).toBe(true)
  })
})
