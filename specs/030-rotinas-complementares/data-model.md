# Data Model: Módulo de rotinas diárias e complementares (030)

## Banco de Dados (Supabase / Postgres)

Migração: `supabase/migrations/20261109000000_030_complementary_routines.sql`

### 1. `complementary_routine_logs` (nova tabela)

Registra cada conclusão de rotina complementar pelo usuário. Múltiplos registros no mesmo dia (inclusive da mesma categoria ou de categorias diferentes) são permitidos (FR-003, FR-013).

| Coluna | Tipo | Regras |
|:---|:---|:---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `category` | `text` | `not null check (category in ('alongamento-mobilidade', 'core-abdominal', 'cardio'))` |
| `performed_on` | `date` | `not null` (data local do treino, `YYYY-MM-DD`, sem datas futuras) |
| `performed_at` | `timestamptz` | `not null default now()` |
| `duration_minutes` | `integer` | `not null check (duration_minutes between 1 and 240)` |
| `modality` | `text` | opcional; id de `CARDIO_BANK` quando `category = 'cardio'` |
| `zone` | `text` | opcional; `'leve' \| 'moderada' \| 'intervalado-leve'` |
| `effort` | `integer` | opcional; `check (effort between 1 and 10)` |
| `items` | `jsonb` | `not null default '[]'::jsonb` — itens/séries concluídos na execução |
| `notes` | `text` | opcional; `check (char_length(notes) <= 500)` |
| `created_at` | `timestamptz` | `not null default now()` |

- **Índices**: `idx_complementary_routine_logs_user_date` em `(user_id, performed_on desc, performed_at desc)`.
- **RLS**: habilitado com policy `auth.uid() = user_id` para `select`, `insert`, `update`, `delete`.

### 2. `user_training_profile` (alterada)

| Coluna | Tipo | Mudança |
|:---|:---|:---|
| `complementary_preferences` | `jsonb not null default '{}'::jsonb` | **nova** — armazena `ComplementaryPreferences` por categoria (`daysPerWeek`, `targetMinutes`, `preferredModality`, `focusRegions`) |

---

## Tipos Compartilhados (`@helux/types`)

Novo arquivo `packages/types/src/routines.ts` (reexportado em `packages/types/src/index.ts`):

```ts
import type { CardioZone } from './method'
import type { Region, StressLevel } from './conditions'

export type ComplementaryCategory = 'alongamento-mobilidade' | 'core-abdominal' | 'cardio'

export const COMPLEMENTARY_CATEGORIES: readonly ComplementaryCategory[] = [
  'alongamento-mobilidade',
  'core-abdominal',
  'cardio',
] as const

export interface StretchMobilityEntry {
  id: string
  name: string
  regions: Region[]
  mode: 'tempo' | 'repeticoes'
  unilateral: boolean
  defaultSeconds?: number
  defaultReps?: string
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel }
  cues: string[]
  motion: string
}

export interface ComplementaryRoutineItem {
  id: string
  name: string
  mode: 'tempo' | 'repeticoes' | 'cardio'
  sets: number
  /** Segundos por série/sustentação quando mode === 'tempo'. */
  seconds?: number
  /** Repetições prescritas quando mode === 'repeticoes' (ex.: '12', '10 por lado'). */
  reps?: string
  unilateral?: boolean
  restSeconds: number
  cues: string[]
  motion: string
  regions?: Region[]
  /** Apenas para category === 'cardio'. */
  cardio?: {
    modality: string
    minutes: number
    zone: CardioZone
    allowedModalities: string[]
  }
}

export interface ComplementaryRoutine {
  category: ComplementaryCategory
  title: string
  subtitle: string
  /** Explicação curta de como potencializa os treinos e protege articulações (FR-007). */
  purpose: string
  daysPerWeek: number
  estimatedMinutes: number
  items: ComplementaryRoutineItem[]
  /** Aviso contextual quando há treino de membros inferiores pendente hoje (FR-015). */
  legDayWarning?: string | null
}

export interface CategoryPreference {
  daysPerWeek?: number
  targetMinutes?: number
  /** Para cardio: id de CARDIO_BANK. */
  preferredModality?: string
  /** Para alongamento-mobilidade: regiões prioritárias. */
  focusRegions?: Region[]
}

export type ComplementaryPreferences = Partial<Record<ComplementaryCategory, CategoryPreference>>

export interface ComplementaryRoutineLogItem {
  id: string
  name: string
  setsCompleted: number
  secondsOrReps?: string
}

export interface ComplementaryRoutineLog {
  id: string
  category: ComplementaryCategory
  performed_on: string // YYYY-MM-DD
  performed_at: string // ISO
  duration_minutes: number
  modality?: string | null
  zone?: CardioZone | null
  effort?: number | null
  items: ComplementaryRoutineLogItem[]
  notes?: string | null
}

export interface ComplementaryCategoryProgress {
  category: ComplementaryCategory
  doneToday: boolean
  completedThisWeek: number
  targetPerWeek: number
  lastPerformedOn: string | null
}

export interface ComplementaryRoutinesView {
  routines: Record<ComplementaryCategory, ComplementaryRoutine>
  progress: Record<ComplementaryCategory, ComplementaryCategoryProgress>
  recentLogs: ComplementaryRoutineLog[]
  preferences: ComplementaryPreferences
  /** Categorias concluídas na data de hoje (para sinalizar dispensa na volta à calma, FR-014). */
  completedToday: ComplementaryCategory[]
}
```

---

## Funções Puras (`@helux/workouts`, novo `complementary-routines.ts`)

| Função | Entrada | Saída | Regra |
|:---|:---|:---|:---|
| `prescribeComplementaryRoutines` | `{ goal, level, constraints, conditionRegions, flaredRegions, mesocycleGroups, preferences, todayGymSession }` | `Record<ComplementaryCategory, ComplementaryRoutine>` | Monta deterministicamente as 3 rotinas fixas do ciclo respeitando condições articulares, equipamento e preferências (FR-001a, FR-005, FR-006). |
| `computeWeeklyRoutineProgress` | `(logs, routines, todayDate)` | `Record<ComplementaryCategory, ComplementaryCategoryProgress>` | Calcula `doneToday`, `completedThisWeek` (segunda a domingo da semana de `todayDate`) e `targetPerWeek` (FR-012). |
| `checkCardioLegDayConflict` | `(todayGymSession, cardioRoutine)` | `string \| null` | Se a sessão pendente da academia treina `quadriceps`, `posterior` ou `gluteo`, retorna recomendação para manter cardio leve/sem impacto antes do treino (FR-015). |
| `isCooldownSatisfiedByRoutines` | `(exercise, completedToday)` | `{ satisfied: boolean; label?: string }` | Para itens de `volta-calma` ou `cardio` na sessão de academia: devolve `satisfied: true` quando `cardio` ou `alongamento-mobilidade` correspondente já foi concluído hoje (FR-014). |
