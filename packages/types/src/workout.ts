export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
  skipped?: boolean
  executedVariant?: { name: string; match: number }
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
  /** spec 013: equivalente de outro padrão de movimento sugerido por alerta genético articular */
  crossPattern?: boolean
  motion: string
  implement: string
  why: string
}

/** Fase do item na sessão (spec 014). Ausente = 'principal'. */
export type ExercisePhase = 'aquecimento' | 'principal' | 'volta-calma'

export type ProgressionAction = 'aumentar' | 'manter' | 'reduzir' | 'sem-dados'

/** Decisão determinística de carga entre mesociclos (spec 014). */
export interface LoadProgression {
  name: string
  action: ProgressionAction
  previousWeightKg: number | null
  nextWeightKg: number | null
  reason: string
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
  /** Spec 014: fase da sessão; ausente = principal (planos antigos). */
  phase?: ExercisePhase
  /** Spec 014: rótulo do biset — exatamente 2 itens consecutivos do principal. */
  supersetGroup?: string
  /** Spec 014: progressão de carga aplicada a partir do mesociclo anterior. */
  progression?: Omit<LoadProgression, 'name'>
}
