import type {
  AdjustedWorkoutPlanView,
  BodyCheckin,
  DayType,
  DietCalibration,
  DietPhase,
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
}

/** Estado da nutrição (018); o plano do dia é recalculado na leitura por `buildDayPlan`. */
export interface MockNutrition {
  phase: DietPhase | null
  calibrations: DietCalibration[]
  dayTypeOverride: DayType | null
  swaps: MealSwap[]
  history: { date: string; dayType: DayType; status: 'concluido' | 'treino-nao-realizado'; kcal: number }[]
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
  bodyCheckins: BodyCheckin[]
  genetics: GeneticProfileView | null
  nutrition: MockNutrition
  /** Persona `network-error` (R-H): toda leitura falha. */
  failReads?: boolean
}

export interface MockLocalStorageState {
  version: 1
  personaId: string
  dataset: MockDataset
  updatedAt: string
}
