import type { GeneticProfile, WorkoutConstraints } from './genetic'
import type { WorkoutSession, PlannedExercise } from './workout'
import type { RecoveryData } from './recovery'

export interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]
  recoveryData: RecoveryData[]
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
}

export interface NextWorkoutPlan {
  generatedAt: string
  exercises: PlannedExercise[]
  rationale: string
}
