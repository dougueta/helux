export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ExerciseSet[]
}

export interface Variant {
  id: string
  name: string
  equip: string
  level: string
  match: number
  rec?: boolean
  betterFit?: boolean
  motion: string
  implement: string
  why: string
}

export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
  cues?: string[]
  muscle?: string
  muscles?: { primary: string[]; secondary: string[] }
  tempo?: string
  match?: number
  variants?: Variant[]
}
