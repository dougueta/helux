import type {
  AdjustedWorkoutPlanView,
  BodyMeasurement,
  BodyWeight,
  DayType,
  DietCalibration,
  DietPhase,
  DietTargets,
  ExerciseSet,
  GeneticProfileView,
  MealSwap,
  NutriMarker,
  RecoveryData,
  TirednessAssessment,
  UserTrainingProfile,
  WorkoutAnalytics,
} from '@helux/types'
import type { NutritionFlags } from '@helux/nutrition'

/** Linha de `workout_sessions` como a API devolve em `/api/workouts/history`. */
export interface MockSessionRow {
  id: string
  date: string
  duration_s: number | null
  exercises: ExerciseSet[]
  created_at: string
  /** Spec 024: sessão suspeita confirmada como real. */
  review_status?: 'confirmada' | null
}

/** Estado da nutrição (018); o plano do dia é recalculado na leitura por `buildDayPlan`. */
export interface MockNutrition {
  phase: DietPhase | null
  calibrations: DietCalibration[]
  dayTypeOverride: DayType | null
  swaps: MealSwap[]
  /** Dias anteriores (formato de `/api/nutrition/history`, sem o dia ativo). */
  history: { date: string; dayType: DayType; status: 'concluido' | 'treino-nao-realizado'; targets: DietTargets }[]
  genetics: { active: boolean; markers: NutriMarker[]; flags: NutritionFlags }
}

/** Snapshot de todo o domínio servido em modo mock (data-model da 021, revisão R-D/R-E). */
export interface MockDataset {
  profile: UserTrainingProfile | null
  latestPlan: AdjustedWorkoutPlanView | null
  workoutHistory: MockSessionRow[]
  workoutAnalytics: WorkoutAnalytics
  tirednessToday: TirednessAssessment
  recovery: RecoveryData | null
  /** Spec 029: registros de medidas (mais recentes primeiro). */
  bodyCheckins: BodyMeasurement[]
  /** Spec 029: pesagens diárias (ordem crescente). */
  bodyWeights?: BodyWeight[]
  genetics: GeneticProfileView | null
  nutrition: MockNutrition
  /** Spec 022: preferências, Perfil Integrado, conversas e propostas (ausente em datasets antigos). */
  agents?: import('./agents').MockAgents
  /** Spec 024: condições de saúde (ausente em datasets antigos). */
  conditions?: import('@helux/types').HealthCondition[]
  /** Spec 030: histórico e preferências das rotinas complementares. */
  complementaryLogs?: import('@helux/types').ComplementaryRoutineLog[]
  complementaryPreferences?: import('@helux/types').ComplementaryPreferences
  /** Persona `network-error` (R-H): toda leitura falha. */
  failReads?: boolean
}

export interface MockLocalStorageState {
  version: number
  personaId: string
  dataset: MockDataset
  updatedAt: string
}
