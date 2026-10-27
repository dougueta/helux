# Data Model — 024 Treino adaptativo de verdade

Tudo aditivo; RLS `auth.uid() = user_id` em toda tabela nova. Migrations por fase (F1, F2, F3, F4, F5).

## Tabelas novas

### `genetic_reports` (F1)

| Campo | Tipo | Regras |
|---|---|---|
| `user_id` | uuid PK → auth.users | um laudo por usuário |
| `source` | text | `genera` |
| `raw` | jsonb | validado por `parseGeneraJson` antes de gravar |
| `uploaded_at` | timestamptz | default now() |

### `mesocycle_generation` (F1)

| Campo | Tipo | Regras |
|---|---|---|
| `user_id` | uuid PK | |
| `status` | text | `gerando` \| `falhou` \| `ok` |
| `started_at` | timestamptz | |
| `attempts` | smallint | zera em `ok`; para em 3 |
| `error_code` | text null | ex.: `constraints-unsatisfiable`, `incomplete-response`, `budget-exceeded`, `refusal`, `unknown` |
| `updated_at` | timestamptz | |

Transições: `ok|falhou → gerando` (disparo) → `ok` (mesociclo salvo) | `falhou` (erro). `gerando` há mais de 10 min é tratado como `falhou`.

### `health_conditions` (F2)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `catalog_key` | text null | chave de `CONDITION_CATALOG`; null = "outra" |
| `custom_label` | text null | obrigatório quando `catalog_key` é null; ≤ 120 |
| `region` | text | `joelho` \| `ombro` \| `lombar` \| `quadril` \| `tornozelo` \| `cotovelo` \| `punho` \| `sistemica` |
| `side` | text null | `esquerdo` \| `direito` \| `ambos` |
| `since` | date null | data aproximada |
| `count` | smallint default 1 | ex.: 3 cirurgias |
| `status` | text | `ativa` \| `controlada` \| `resolvida` |
| `notes` | text null | ≤ 500 |
| `flare_region` | text null | crise ativa (gota) |
| `flare_until` | date null | fim previsto da crise |
| `created_at` / `updated_at` | timestamptz | |

Check: `catalog_key is not null or custom_label is not null`; `flare_until` só com `flare_region`.

### `session_checkins` (F4)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `date` | date | |
| `phase` | text | `antes` \| `depois` |
| `workout_session_id` | uuid null → workout_sessions | preenchido ao salvar a sessão |
| `mesocycle_id` | uuid null → mesocycle_plans | |
| `session_index` | smallint null | índice em `sessions` |
| `energy`, `sleep`, `motivation` | smallint null 1–5 | só `antes` |
| `rpe` | smallint null 1–10 | só `depois` |
| `feeling` | smallint null 1–5 | só `depois` |
| `pains` | jsonb default `[]` | `[{ region, intensity: 1–3, exercise? }]` |
| `note` | text null ≤ 280 | |
| `created_at` | timestamptz | |

Único: (`user_id`, `date`, `phase`, `session_index`).

### `cycle_analyses` (F5)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `mesocycle_id` | uuid unique → mesocycle_plans | ciclo analisado |
| `summary` | jsonb | `CycleSummary` |
| `next_mesocycle_id` | uuid null | preenchido quando o próximo é gerado |
| `created_at` | timestamptz | |

## Colunas novas

| Tabela | Coluna | Tipo | Fase | Notas |
|---|---|---|---|---|
| `user_training_profile` | `goal_primary` | text null | F2 | `condicionamento`\|`hipertrofia`\|`forca`\|`emagrecimento`\|`corrida` |
| | `goal_secondary` | text null | F2 | mesmo enum, ≠ principal |
| | `goal_target` | text null | F2 | ≤ 140 |
| | `cardio_likes`, `cardio_avoid` | text[] default '{}' | F2 | ids de `CARDIO_BANK`, sem interseção |
| | `onboarding_step` | smallint null | F2 | retomada |
| | `onboarding_completed_at` | timestamptz null | F2 | gate da geração |
| `shared_guidance` | `condition_id` | uuid null → health_conditions on delete cascade | F2 | regras propostas para condição "outra" |
| `mesocycle_plans` | `format` | text default `rotacao` | F3 | `rotacao` \| `semanal` |
| | `weeks` | smallint null | F3 | 4–6 (1 para repetição de semana) |
| | `method` | jsonb null | F3 | `MethodPrescription` usada |
| | `goal_primary` | text null | F3 | snapshot do objetivo no momento da geração |
| `workout_sessions` | `review_status` | text null | F4 | null \| `confirmada` |

## Tipos (`@helux/types`)

```ts
type Goal = 'condicionamento' | 'hipertrofia' | 'forca' | 'emagrecimento' | 'corrida'
type Region = 'joelho' | 'ombro' | 'lombar' | 'quadril' | 'tornozelo' | 'cotovelo' | 'punho' | 'sistemica'
type SessionKind = 'forca' | 'cardio' | 'mobilidade'

interface HealthCondition { id; catalogKey: string | null; customLabel: string | null; region: Region; side; since; count; status: 'ativa' | 'controlada' | 'resolvida'; notes; flare: { region: Region; until: string } | null }

interface ConditionRules { maxJointStress: Partial<Record<'joelho'|'ombro'|'lombar', 0|1|2>>; blockedPatterns: string[]; blockedExercises: string[]; maxCardioImpact: 0|1|2 | null; minRir: number | null; cues: string[]; medicalNoteOnFlare: boolean }

interface HardConstraints { /* 022 */ availableEquipment; exercisesToAvoid; maxSessionMinutes; blockedPatterns; blockedExercises;
  /* 024 */ maxJointStress: Partial<Record<Joint, 0|1|2>>; maxCardioImpact: 0|1|2 | null; minRir: number | null }

ConstraintViolation['rule'] += 'carga-articular' | 'impacto' | 'esforco' | 'metodo-frequencia' | 'metodo-volume' | 'metodo-cardio' | 'metodo-mobilidade' | 'metodo-estrutura'

interface MethodPrescription {
  goal: Goal; weeks: number; deloadWeek: number
  strengthDays: number; cardioSessions: number; mobilitySessions: number
  allowedSplits: string[]; minFrequencyPerGroup: number
  weeklySetsPerGroup: { min: number; max: number }   // por semana de progressão
  weekly: Array<{ week: number; setsFactor: number; rirTarget: number; deload: boolean }>
  repRanges: { basicos: [number, number]; acessorios: [number, number] }
  cardio: { minutes: number; zone: 'leve' | 'moderada' | 'intervalado-leve'; maxImpact: 0|1|2; allowed: string[] }
  modifiers: Array<{ source: 'checkin' | 'ciclo' | 'condicao'; description: string }>
}

// MesocycleSession (mesocycle.ts) ganha opcionais:
week?: number; kind?: SessionKind; deload?: boolean
// PlannedExercise ganha opcionais:
rirTarget?: number; cardio?: { modality: string; minutes: number; zone: string }; region?: Region  // mobilidade

interface SessionCheckin { phase: 'antes' | 'depois'; energy?; sleep?; motivation?; rpe?; feeling?; pains: Array<{ region: Region; intensity: 1|2|3; exercise?: string }>; note? }

interface CycleFinding { kind: 'estagnacao' | 'dor-recorrente' | 'baixa-aderencia' | 'progresso' | 'cansaco-alto'; subject: string; evidence: string }
interface CycleSummary { mesocycleId; weeks; adherence: Record<SessionKind, { done: number; planned: number }>; exercises: Array<{ name; firstE1rm; lastE1rm; avgRpe; painReports }>; avgRpeByWeek: number[]; pains: Array<{ region; count }>; tirednessAvg: number | null; checkinTrend: CheckinTrend | null; findings: CycleFinding[]; missingData: string[] }

interface CheckinTrend { from: string; to: string; deltas: Record<string, number>; implausible: string[]; modifiers: string[]; suggestGoalChange: Goal | null }

type GenerationStatus = { status: 'gerando' | 'falhou' | 'ok'; attempts: number; errorCode: string | null; startedAt: string | null }
// AdjustedWorkoutPlanView ganha: week?: { current: number; total: number; deload: boolean }; kind?: SessionKind;
//   status?: 'generating' | 'onboarding-required' | 'generation-failed'; generation?: GenerationStatus
```

## Catálogos em código

- `CONDITION_CATALOG` (`packages/workouts/src/conditions.ts`): chave → rótulo, regiões permitidas, `rulesFor(status)` → `ConditionRules`. Ver tabela em research R1.
- `CARDIO_BANK` (`packages/ai/src/cardio-bank.ts`): id, nome, impacto 0–2, carga articular, equipamento/local.
- Força da evidência dos traços genéticos (`packages/genetics`): `forte` | `moderada` | `fraca` por traço.

## Regras de validação (resumo)

- Plano: cada exercício principal dentro do `maxJointStress`; cardio com impacto ≤ `maxCardioImpact`; `rirTarget` ≥ `minRir`; prescrição respeitada (frequência ≥ `minFrequencyPerGroup` por grupo principal nos dias de força; séries semanais por grupo dentro da faixa na semana-modelo; nº de sessões de cardio e mobilidade ≥ prescrito; nº de dias de força = `strengthDays`).
- Sessão válida (R9): ≥ 3 séries registradas e (`duration_s` ausente ou ≥ 600).
- Check-in implausível (R10): peso > 6 kg/mês, cintura > 8 cm/mês, gordura > 4 pp/mês.
