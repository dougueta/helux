# Data Model: Check-in de peso e medidas (029)

## Banco (Supabase/Postgres)

### `body_weights` (nova)

| Coluna | Tipo | Regras |
|:---|:---|:---|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid | FK `auth.users`, `on delete cascade` |
| `date` | date | não nula; não pode ser futura (validado na API, fuso `America/Sao_Paulo`) |
| `weight_kg` | numeric(5,2) | `check (weight_kg between 20 and 500)` |
| `created_at` / `updated_at` | timestamptz | `default now()` |

- `unique (user_id, date)`: uma pesagem por dia (FR-002); salvar de novo faz upsert.
- Índice `(user_id, date desc)`. RLS: `auth.uid() = user_id` para tudo.

### `body_checkins` (alterada → registro de medidas)

| Coluna | Tipo | Mudança |
|:---|:---|:---|
| `measured_on` | date not null | **nova** (backfill `created_at::date`) |
| `month` | — | **removida** (com o `unique (user_id, month)`) |
| `weight_kg` | — | **removida** (migra para `body_weights`) |
| `neck_cm`, `waist_cm`, `hip_cm` | numeric | sem mudança |
| `shoulders_cm` | numeric(5,1) | **nova**, `check 60–200` |
| `chest_cm` | numeric(5,1) | **nova**, `check 50–200` |
| `arm_left_cm` / `arm_right_cm` | numeric(5,1) | `arm_cm` → `arm_right_cm`; `arm_left_cm` **nova**, `check 10–100` |
| `leg_left_cm` / `leg_right_cm` | numeric(5,1) | `leg_cm` → `leg_right_cm`; `leg_left_cm` **nova**, `check 10–150` |
| `calf_left_cm` / `calf_right_cm` | numeric(5,1) | **novas**, `check 15–80` |
| `body_fat_navy_pct` | numeric(4,1) | **nova**, calculada no servidor (3–60) |
| `body_fat_device_pct` | numeric(4,1) | `body_fat_pct` renomeada (1–70) |
| `body_fat_device_source` | text | **nova**: `bioimpedancia` \| `adipometro` \| `dexa` \| `outro`; obrigatória quando `body_fat_device_pct` não é nula (`check`) |
| `squat_kg`, `bench_kg`, `deadlift_kg`, `notes` | — | sem mudança |
| `updated_at` | timestamptz | **nova** |

- Índice `(user_id, measured_on desc)` substitui `(user_id, month desc)`.
- Vários registros por dia são permitidos.

### `diet_phase_calibrations` (sem mudança de schema)

- `checkin_id` passa a apontar o registro de medidas usado na ponta "atual" (pode ser nulo).
- `metrics` (jsonb) ganha `trendFrom: { date, weightKg }` e `trendTo: { date, weightKg }`.
- Linhas `intervalo-curto` deixam de ser criadas (R6).

## Tipos (`@helux/types`)

```ts
// packages/types/src/checkin.ts
export interface BodyWeight {
  id: string
  date: string        // YYYY-MM-DD
  weight_kg: number
}

export type BodyFatSource = 'navy' | 'bioimpedancia' | 'adipometro' | 'dexa' | 'outro'
export type DeviceBodyFatSource = Exclude<BodyFatSource, 'navy'>

/** Registro de medidas (antes "BodyCheckin" mensal). */
export interface BodyMeasurement {
  id: string
  measured_on: string // YYYY-MM-DD
  neck_cm?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  shoulders_cm?: number | null
  chest_cm?: number | null
  arm_left_cm?: number | null
  arm_right_cm?: number | null
  leg_left_cm?: number | null
  leg_right_cm?: number | null
  calf_left_cm?: number | null
  calf_right_cm?: number | null
  body_fat_navy_pct?: number | null
  body_fat_device_pct?: number | null
  body_fat_device_source?: DeviceBodyFatSource | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
  notes?: string | null
  created_at: string
}

export type MeasurementInput = Omit<BodyMeasurement, 'id' | 'created_at' | 'body_fat_navy_pct'>

export type NavyStatus = 'ok' | 'sem-perfil' | 'sem-medidas' | 'inconsistente'
```

`BodyCheckin` e `CheckinInput` são removidos; todos os consumidores mudam no mesmo PR (Workflow da constituição).

`DietCalibrationMetrics` ganha `trendFrom?` e `trendTo?` (`{ date: string; weightKg: number }`).

## Funções puras (`@helux/nutrition`, novo `weight-trend.ts`)

| Função | Entrada | Saída | Regra |
|:---|:---|:---|:---|
| `trendAt` | pesagens, data | `number \| null` | média de `[d−6, d]` se ≥3 pesagens (FR-003) |
| `trendSeries` | pesagens | `{ date, weightKg, trendKg \| null }[]` | um ponto por pesagem |
| `weeklyChange` | pesagens, hoje | `{ kg, pct } \| null` | `trendAt(hoje) − trendAt(hoje−7)` (FR-004) |
| `referenceWeight` | pesagens, data | `number \| null` | tendência ou pesagem mais próxima em ≤3 dias (FR-016) |
| `needsConfirmation` | pesagens, novo peso, data | `boolean` | \|novo − última tendência\| > 3 kg (FR-005) |
| `bodyComposition` | peso, % | `{ fatKg, leanKg }` | 1 casa decimal (US5-1) |
| `waistHeightRatio` | cintura, altura | `number` | 2 casas (FR-017) |
| `effectiveBodyFat` | registros de medidas | `{ pct, source, measuredOn } \| null` | mais recente; empate no registro → navy (FR-022) |
| `measurementsDue` | registros, hoje | `boolean` | último registro > 28 dias ou nenhum (FR-018) |

`navyBodyFat` (já existe em `biometrics.ts`) ganha a validação de faixa 3–60% (FR-009), devolvendo `null` fora dela.

## Estados da recalibração (`diet-phase.service`)

```ts
type RecalibrationEvaluation =
  | { status: 'indisponivel'; missing: MissingField[] | ['sem-fase'] }
  | { status: 'intervalo-curto'; availableOn: string }
  | { status: 'faltam-pesagens'; at: ('inicio' | 'atual')[] }
  | { status: 'proposta'; action: CalibrationAction; before: DietTargets; after: DietTargets; reason: string; metrics: DietCalibrationMetrics }
```

Transição: `proposta` → (Aplicar) → linha em `diet_phase_calibrations` + `base_targets` atualizado; (Descartar) → nada muda.
