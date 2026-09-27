import type { GeneticProfile, WorkoutConstraints } from './genetic'
import type { WorkoutSession, PlannedExercise, LoadProgression } from './workout'
import type { RecoveryData } from './recovery'
import type { BodyCheckin } from './checkin'

export interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]
  recoveryData: RecoveryData[]
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
  bodyCheckins?: BodyCheckin[]
  trainingTime?: string
  timeOff?: string
  currentInjury?: string
  /** Spec 014: decisões de progressão calculadas a partir do mesociclo anterior. */
  loadProgression?: LoadProgression[]
}

export interface NextWorkoutPlan {
  generatedAt: string
  exercises: PlannedExercise[]
  rationale: string
}
