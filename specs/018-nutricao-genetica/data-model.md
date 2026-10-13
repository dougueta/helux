# Data Model: Módulo de Nutrição Esportiva Genética (018)

Migration única e aditiva: `supabase/migrations/20261013000000_nutrition.sql`. Todas as tabelas novas com RLS `auth.uid() = user_id` (padrão do projeto).

## Alterações em tabelas existentes

### `user_training_profile` (+3 colunas, opcionais)

| Coluna | Tipo | Regra |
|---|---|---|
| `height_cm` | numeric(5,1) | 120–230 |
| `birth_date` | date | idade 14–100 |
| `sex` | text | `masculino` \| `feminino` |

### `body_checkins` (+1 coluna, opcional)

| Coluna | Tipo | Regra |
|---|---|---|
| `neck_cm` | numeric(4,1) | 20–70 |

Validação na API (zod) com os mesmos limites. `body_fat_pct` digitado continua valendo; sem ele, o % vem da Marinha (calculado na leitura, R3).

## Tabelas novas

### `diet_phases`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk auth.users | |
| `goal` | text | `perder_gordura` \| `ganhar_massa` \| `recomposicao` \| `manutencao` |
| `started_on` | date | |
| `duration_weeks` | int | 4–52 |
| `status` | text | `ativa` \| `encerrada` |
| `base_targets` | jsonb | `DietTargets` atual (muda a cada recalibração) |
| `start_checkin_id` | uuid fk body_checkins | check-in usado no cálculo inicial |
| `created_at` / `ended_at` | timestamptz | |

Índice único parcial: no máximo **uma fase `ativa` por usuário**. Fase que passou de `started_on + duration_weeks` continua ativa até o usuário encerrar ou iniciar outra (a tela avisa "fase concluída — inicie a próxima").

### `diet_phase_calibrations`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `phase_id` | uuid fk diet_phases (cascade) | |
| `user_id` | uuid | |
| `checkin_id` | uuid fk body_checkins | |
| `action` | text | `inicial` \| `aumentar` \| `manter` \| `reduzir` \| `intervalo-curto` |
| `before` / `after` | jsonb | `DietTargets` (`before` nulo em `inicial`) |
| `reason` | text | pt-BR legível |
| `metrics` | jsonb | `{ weeks, weightFromKg, weightToKg, weeklyRatePct, waistDeltaCm?, bodyFatPct? }` |
| `created_at` | timestamptz | |

### `daily_nutrition_plans`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `date` | date | único com `user_id` |
| `phase_id` | uuid fk diet_phases | |
| `day_type` | text | `treino` \| `descanso` (efetivo) |
| `day_type_override` | text null | `descanso` quando o usuário marca; nulo = automático (R5) |
| `tiredness_level` | text null | nível efetivo usado no cálculo |
| `plan` | jsonb | `DayPlan` (última versão calculada) |
| `swaps` | jsonb | `MealSwap[]` aplicadas no dia |
| `status` | text | `ativo` \| `treino-nao-realizado` \| `concluido` |
| `updated_at` | timestamptz | |

### `nutrition_chat_messages`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `phase_id` | uuid fk diet_phases (cascade) | conversa = fase (clarify Q4) |
| `role` | text | `user` \| `agent` |
| `kind` | text | `chat` \| `nota-recuperacao` (nota determinística da US3) |
| `content` | text | 1–4000 caracteres |
| `day` | date | para agrupar o histórico por dia |
| `context` | jsonb | `{ dayType, tirednessLevel, workoutFocus? }` no envio |
| `created_at` | timestamptz | |

Índice `(user_id, phase_id, created_at)`.

## Tipos (`packages/types/src/nutrition.ts`)

```ts
export type DietGoal = 'perder_gordura' | 'ganhar_massa' | 'recomposicao' | 'manutencao'
export type Sex = 'masculino' | 'feminino'
export type DayType = 'treino' | 'descanso'
export type CalibrationAction = 'inicial' | 'aumentar' | 'manter' | 'reduzir' | 'intervalo-curto'

export interface DietTargets { kcal: number; proteinG: number; carbsG: number; fatG: number }

export interface DietPhase {
  id: string; goal: DietGoal; startedOn: string; durationWeeks: number
  status: 'ativa' | 'encerrada'; baseTargets: DietTargets
}

export interface DietCalibration {
  id: string; action: CalibrationAction; before: DietTargets | null; after: DietTargets
  reason: string; createdAt: string
  metrics: { weeks: number; weightFromKg: number; weightToKg: number; weeklyRatePct: number; waistDeltaCm?: number; bodyFatPct?: number }
}

export type FoodGroup = 'proteina' | 'carboidrato' | 'gordura' | 'fruta-vegetal' | 'bebida'
export type FoodTag = 'contem-lactose' | 'zero-lactose' | 'vegetal' | 'rico-b6' | 'fonte-calcio-nao-lactea'
  | 'fonte-vitamina-d' | 'cafeina' | 'anti-inflamatorio' | 'rapida-digestao'

export interface FoodItem {
  id: string; name: string; group: FoodGroup
  portion: { grams: number; household: string }   // ex.: 100 g · "1 filé médio"
  macros: { kcal: number; proteinG: number; carbsG: number; fatG: number } // por porção
  tags: FoodTag[]
}

export type MealSlot = 'cafe' | 'almoco' | 'pre-treino' | 'pos-treino' | 'lanche' | 'jantar' | 'ceia'

export interface MealItem { foodId: string; name: string; portions: number; household: string; macros: DietTargets }
export interface Meal {
  id: string            // `${date}:${slot}`
  slot: MealSlot; title: string
  timing: { kind: 'relativo' | 'relogio'; label: string; from?: string; to?: string; highlight?: boolean }
  items: MealItem[]; totals: DietTargets
  geneticTags: string[]  // ex.: "Sem lactose", "Rico em B6"
  rationale: string[]    // justificativa nutrigenômica (US1 cenário 3)
}

export interface RecoveryAdjustment { level: 'cansado' | 'exausto'; extraWaterMl: number; notes: string[] }

export interface DayPlan {
  date: string; dayType: DayType; targets: DietTargets; waterMl: number
  meals: Meal[]; recovery: RecoveryAdjustment | null
  genetics: { active: boolean; badges: string[] }
}

export interface MealSwap { mealId: string; fromFoodId: string; toFoodId: string }

export type NutriMarkerStatus = 'atencao' | 'neutro' | 'favoravel'
export type NutriMarkerCategory = 'metabolismo-sensibilidades' | 'micronutrientes-vitaminas' | 'perfil-muscular-dieta'
export interface NutriMarker {
  gene: string; genotype?: string; label: string; result: string
  category: NutriMarkerCategory; status: NutriMarkerStatus
  conduct?: { recommend: string[]; avoid: string[] }
}

export interface NutritionChatMessage {
  id: string; role: 'user' | 'agent'; kind: 'chat' | 'nota-recuperacao'
  content: string; day: string; createdAt: string
}
```

`UserTrainingProfile` ganha `heightCm?`, `birthDate?`, `sex?`; `BodyCheckin` ganha `neck_cm?`.

## Transições

- **Fase**: (nenhuma) → `ativa` ao criar (cálculo `inicial` com o último check-in) → recalibrada a cada check-in (`aumentar`/`manter`/`reduzir`/`intervalo-curto`) → `encerrada` ao encerrar ou ao iniciar outra fase (a anterior encerra no mesmo ato).
- **Dia**: `ativo` (dia corrente) → `concluido` (dia passado com treino salvo ou dia de descanso) | `treino-nao-realizado` (dia passado de tipo treino sem sessão). A marcação de dias passados acontece na leitura do histórico, sem recalcular o plano.
- **Tipo do dia**: automático `treino` → `descanso` por override do usuário → volta a `treino` se um treino do dia for salvo.

## Regras de validação (do spec)

- Nenhum item com `contem-lactose` em `DayPlan`, troca ou sugestão aplicada quando `intoleranciaLactose` (SC-002).
- Total do dia: calorias ±5%, cada macro ±10% das metas do dia (R7).
- Pré-requisitos para iniciar fase: altura, data de nascimento, sexo e um check-in com peso. Faltando → API responde `needs-profile` com a lista do que falta.
