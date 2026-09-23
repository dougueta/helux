import type { PlannedExercise } from './workout'
import type { ExerciseAdjustmentChange, TirednessAssessment } from './tiredness'

export interface MesocycleSession {
  letter: string
  focus: string
  exercises: PlannedExercise[]
  completedAt: string | null
}

export interface MesocyclePlan {
  id: string
  generatedAt: string
  daysPerWeek: number
  splitType: string
  sessions: MesocycleSession[]
  rationale: string
}

export interface AdjustedSession {
  letter: string
  focus: string
  exercises: PlannedExercise[]
  adjusted: boolean
  adjustmentReason?: string
  /** Exercícios do mesociclo antes de qualquer ajuste do dia (spec 011). */
  plannedExercises?: PlannedExercise[]
  /** Diferenças planejado → ajustado (spec 011). */
  changes?: ExerciseAdjustmentChange[]
  /** Avaliação de cansaço do dia usada no ajuste (spec 011). */
  tiredness?: TirednessAssessment
}

export interface UpcomingSessionSummary {
  letter: string
  focus: string
}

export interface AdjustedWorkoutPlanView {
  mesocycleId: string | null
  generatedAt: string | null
  today: AdjustedSession | null
  upcoming: UpcomingSessionSummary[]
  progress: { completed: number; total: number } | null
  status?: 'generating'
}
