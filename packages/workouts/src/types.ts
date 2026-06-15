export interface Variant {
  id: string
  name: string
  equip: string
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  match: number
  rec?: boolean
  betterFit?: boolean
  motion: string
  implement: string
  why: string
}

export interface MuscleMap {
  primary: string[]
  secondary: string[]
}

export interface SuggestedSet {
  prev: string
  w: number
  r: number
}

export interface ActiveExercise {
  id: string
  name: string
  muscle: string
  scheme: string
  rest: number
  match: number
  tempo?: string
  gene?: string
  muscles: MuscleMap
  cues: string[]
  variants: Variant[]
  suggestedSets: SuggestedSet[]
}

export interface SetState {
  w: number
  r: number
  prev: string
  done: boolean
}

export interface ActiveSession {
  workoutId: string
  workoutName: string
  exercises: ActiveExercise[]
  sets: Record<string, SetState[]>
  variantById: Record<string, string>
  startedAt: number
}

export interface PersonalRecord {
  exerciseName: string
  value: string
  delta: string
}

export interface WorkoutSummary {
  workoutId: string
  workoutName: string
  startedAt: number
  finishedAt: number
  durationMinutes: number
  totalSets: number
  totalVolumeKg: number
  newRecords: PersonalRecord[]
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
