// Spec 018 — módulo de nutrição esportiva genética (data-model.md).

export type DietGoal = 'perder_gordura' | 'ganhar_massa' | 'recomposicao' | 'manutencao'
export type Sex = 'masculino' | 'feminino'
export type DayType = 'treino' | 'descanso'
export type CalibrationAction = 'inicial' | 'aumentar' | 'manter' | 'reduzir' | 'intervalo-curto'

export interface DietTargets {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface DietPhase {
  id: string
  goal: DietGoal
  startedOn: string
  durationWeeks: number
  status: 'ativa' | 'encerrada'
  baseTargets: DietTargets
}

export interface DietCalibrationMetrics {
  weeks: number
  weightFromKg: number
  weightToKg: number
  weeklyRatePct: number
  waistDeltaCm?: number
  bodyFatPct?: number
}

export interface DietCalibration {
  id: string
  action: CalibrationAction
  before: DietTargets | null
  after: DietTargets
  reason: string
  metrics: DietCalibrationMetrics
  createdAt: string
}

export type FoodGroup = 'proteina' | 'carboidrato' | 'gordura' | 'fruta-vegetal' | 'bebida'

export type FoodTag =
  | 'contem-lactose'
  | 'zero-lactose'
  | 'vegetal'
  | 'rico-b6'
  | 'fonte-calcio-nao-lactea'
  | 'fonte-vitamina-d'
  | 'cafeina'
  | 'anti-inflamatorio'
  | 'rapida-digestao'

export interface FoodItem {
  id: string
  name: string
  group: FoodGroup
  /** Porção de referência: gramas (ou ml) e a medida caseira. */
  portion: { grams: number; household: string }
  /** Macros por porção de referência. */
  macros: DietTargets
  tags: FoodTag[]
}

export type MealSlot = 'cafe' | 'almoco' | 'pre-treino' | 'pos-treino' | 'lanche' | 'jantar' | 'ceia'

export interface MealItem {
  foodId: string
  name: string
  portions: number
  household: string
  macros: DietTargets
}

export interface MealTiming {
  kind: 'relativo' | 'relogio'
  label: string
  from?: string
  to?: string
  highlight?: boolean
}

export interface Meal {
  /** `${date}:${slot}` */
  id: string
  slot: MealSlot
  title: string
  timing: MealTiming
  items: MealItem[]
  totals: DietTargets
  /** Ex.: "Sem lactose", "Rico em B6". */
  geneticTags: string[]
  /** Justificativa nutrigenômica (US1, cenário 3). */
  rationale: string[]
}

export interface RecoveryAdjustment {
  level: 'cansado' | 'exausto'
  extraWaterMl: number
  notes: string[]
  /** Orientação de recuperação do dia `exausto` (US3); `null` nos demais. */
  note: string | null
}

export interface DayPlan {
  date: string
  dayType: DayType
  targets: DietTargets
  waterMl: number
  meals: Meal[]
  recovery: RecoveryAdjustment | null
  genetics: { active: boolean; badges: string[] }
}

export interface MealSwap {
  mealId: string
  fromFoodId: string
  toFoodId: string
}

export type NutriMarkerStatus = 'atencao' | 'neutro' | 'favoravel'
export type NutriMarkerCategory = 'metabolismo-sensibilidades' | 'micronutrientes-vitaminas' | 'perfil-muscular-dieta'

export interface NutriMarker {
  gene: string
  genotype?: string
  label: string
  result: string
  category: NutriMarkerCategory
  status: NutriMarkerStatus
  conduct?: { recommend: string[]; avoid: string[] }
}

export interface NutritionChatMessage {
  id: string
  role: 'user' | 'agent'
  kind: 'chat' | 'nota-recuperacao'
  content: string
  day: string
  createdAt: string
}

/** Marcador lido do `genera.json` para nutrição (`nutri.*` + WNT16/ACTN3/FTO de `fit`). */
export interface GeneraNutritionEntry {
  gene: string
  snp: string
  genotype?: string
  label: string
  result: string
  section: 'pontos_de_atencao' | 'cuidados_relevantes' | 'curiosidades' | 'achados_adicionais'
  source: 'nutri' | 'fit'
}
