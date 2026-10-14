# Contrato: motor determinístico (`@helux/nutrition`)

Funções puras, sem I/O. Mesmas entradas → mesma saída.

```ts
// biometria (R2, R3)
export function ageOn(birthDate: string, today: string): number
export function bmrMifflin(p: { weightKg: number; heightCm: number; age: number; sex: Sex }): number
export function navyBodyFat(p: { sex: Sex; heightCm: number; waistCm?: number; neckCm?: number; hipCm?: number }): number | null
export function activityFactor(daysPerWeek: number | null): number

// fase (FR-014, FR-015 — R2, R4)
export function phaseTargets(p: { goal: DietGoal; weightKg: number; heightCm: number; age: number; sex: Sex; daysPerWeek: number | null }): DietTargets
export function recalibrate(p: {
  goal: DietGoal; current: DietTargets
  from: { weightKg: number; waistCm?: number; at: string }
  to:   { weightKg: number; waistCm?: number; at: string; bodyFatPct?: number }
  profile: { heightCm: number; age: number; sex: Sex; daysPerWeek: number | null }
}): { action: CalibrationAction; after: DietTargets; reason: string; metrics: DietCalibration['metrics'] }

// genética (FR-001, FR-006, US4 — R10)
export interface NutritionFlags {
  intoleranciaLactose: boolean; vitaminaDBaixa: boolean; b6Baixa: boolean; densidadeOsseaBaixa: boolean
  lowCarbEficaz: boolean; cafeinaTolerada: boolean; perfilPotencia: boolean
}
export function classifyMarkers(entries: GeneraNutritionEntry[]): NutriMarker[]
export function nutritionFlags(markers: NutriMarker[]): NutritionFlags

// o dia (FR-002, FR-002a, FR-003, FR-005, FR-011 — R5, R6, R7)
export function dayTargets(base: DietTargets, p: { dayType: DayType; weightKg: number; flags: NutritionFlags; tiredness: TirednessLevel | null }):
  { targets: DietTargets; waterMl: number; recovery: RecoveryAdjustment | null }
export function buildDayPlan(p: {
  date: string; dayType: DayType; base: DietTargets; weightKg: number; flags: NutritionFlags
  geneticsActive: boolean; tiredness: TirednessLevel | null; swaps: MealSwap[]
}): DayPlan

// trocas (FR-010)
export function swapOptions(plan: DayPlan, mealId: string, foodId: string, flags: NutritionFlags):
  Array<{ food: FoodItem; portions: number; macros: DietTargets }>

// horários (FR-004 — R8)
export function anchorMealTimes(plan: DayPlan, p: { startedAt?: string; finishedAt?: string; now: string }): DayPlan

// nota de recuperação (US3 cenário 2)
export function recoveryNote(p: { tiredness: TirednessLevel; dayType: DayType }): string | null
```

`GeneraNutritionEntry` vem de `parseGeneraNutrition(raw)` em `@helux/genetics` (`{ gene, snp, genotype, label, result, section }`).

Invariantes testados:
- `buildDayPlan` nunca devolve item `contem-lactose` com `intoleranciaLactose` (SC-002);
- totais do dia dentro de ±5% kcal e ±10% por macro das metas do dia;
- `buildDayPlan` é estável (mesma data/entradas → mesmo plano) e varia entre datas diferentes;
- descanso tem menos carboidrato que treino com a mesma fase; com `lowCarbEficaz`, ainda menos;
- `exausto` não corta o carboidrato do dia de descanso (fica no da fase);
- `navyBodyFat` devolve `null` com medida faltando ou resultado fora de 3–60%.
