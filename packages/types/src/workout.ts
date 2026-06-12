export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ExerciseSet[]
}

export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
}
