export type TirednessLevel = 'otimo' | 'normal' | 'cansado' | 'exausto'

export type TirednessSource = 'manual' | 'automatic' | 'none'

/**
 * Avaliação consolidada do cansaço do dia (spec 011). Conceito único e
 * reaproveitável por outras features (ex.: descanso personalizado, spec 015).
 */
export interface TirednessAssessment {
  /** YYYY-MM-DD (UTC) */
  date: string
  manualLevel: TirednessLevel | null
  overrideAutomatic: boolean
  automaticLevel: TirednessLevel | null
  automaticHrv: number | null
  effectiveLevel: TirednessLevel | null
  source: TirednessSource
  /** Nível manual e automático presentes e levam a ajustes diferentes. */
  conflict: boolean
}

export interface ExerciseAdjustmentChange {
  name: string
  setsBefore: number
  setsAfter: number
  weightBefore: string
  weightAfter: string
}
