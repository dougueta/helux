// Spec 024 — objetivo estruturado e condições de saúde (data-model.md).

export const GOALS = ['condicionamento', 'hipertrofia', 'forca', 'emagrecimento', 'corrida'] as const
export type Goal = (typeof GOALS)[number]

export const REGIONS = ['joelho', 'ombro', 'lombar', 'quadril', 'tornozelo', 'cotovelo', 'punho', 'sistemica'] as const
export type Region = (typeof REGIONS)[number]

/** Articulações com carga estimada no banco de exercícios (spec 013). */
export type Joint = 'joelho' | 'ombro' | 'lombar'
export type StressLevel = 0 | 1 | 2

export type ConditionStatus = 'ativa' | 'controlada' | 'resolvida'
export type Side = 'esquerdo' | 'direito' | 'ambos'

export interface HealthCondition {
  id: string
  /** Chave do catálogo; null = condição "outra" (texto livre). */
  catalogKey: string | null
  customLabel: string | null
  region: Region
  side: Side | null
  since: string | null
  count: number
  status: ConditionStatus
  notes: string | null
  /** Crise ativa (gota). */
  flare: { region: Region; until: string } | null
}

export type HealthConditionInput = Omit<HealthCondition, 'id' | 'flare'>

/** Regras de treino derivadas de uma condição (R1). */
export interface ConditionRules {
  maxJointStress: Partial<Record<Joint, StressLevel>>
  blockedPatterns: string[]
  blockedExercises: string[]
  /** Impacto máximo do cardio; null = sem limite. */
  maxCardioImpact: StressLevel | null
  /** Repetições na reserva mínimas; null = sem limite. */
  minRir: number | null
  cues: string[]
  medicalNoteOnFlare: boolean
}
