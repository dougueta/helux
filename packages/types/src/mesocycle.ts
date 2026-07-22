import type { PlannedExercise } from './workout'

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
