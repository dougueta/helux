# Data Model: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## UserTrainingProfile

Perfil situacional do usuário — uma linha por usuário, sempre editável.

**Supabase table**: `user_training_profile`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | não | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | não | FK `auth.users(id)`, `unique` — uma linha por usuário |
| `goal` | `text` | sim | Objetivo de treino atual, texto livre |
| `level` | `text` | sim | Um de `'iniciante' \| 'intermediario' \| 'avancado'` (mesmo enum de `PlanInput['userLevel']`) |
| `training_time` | `text` | sim | Tempo treinando, texto livre curto (ex.: "3 anos") |
| `time_off` | `text` | sim | Tempo parado sem treinar, texto livre curto — vazio quando não aplicável |
| `current_injury` | `text` | sim | Lesão/problema físico atual, texto livre — vazio quando não aplicável |
| `updated_at` | `timestamptz` | não | `default now()`, atualizado a cada upsert |

RLS: mesma política padrão do produto (`auth.uid() = user_id`, `for all`).

**TypeScript** (`packages/types/src/profile.ts`, novo arquivo):

```ts
export interface UserTrainingProfile {
  goal?: string | null
  level?: 'iniciante' | 'intermediario' | 'avancado' | null
  trainingTime?: string | null
  timeOff?: string | null
  currentInjury?: string | null
  updatedAt: string
}

export interface UserTrainingProfileInput {
  goal?: string
  level?: 'iniciante' | 'intermediario' | 'avancado'
  trainingTime?: string
  timeOff?: string
  currentInjury?: string
}
```

**Lifecycle**: criado/atualizado via upsert (`POST /api/profile`, mesmo padrão de `POST /api/checkins`). Nunca deletado pela aplicação. Ausência de linha = usuário nunca preencheu (estado válido, tratado por FR-005 com os defaults hoje fixos no código).

**Validation rules** (espelhando `CheckinBodySchema`):
- `goal`, `trainingTime`, `timeOff`, `currentInjury`: string, max ~300 caracteres cada.
- `level`: enum estrito, um dos 3 valores.
- Todos os campos opcionais (FR-011) — upsert parcial permitido.

---

## DailyTirednessSignal

Sinalização manual de cansaço para um dia específico.

**Supabase table**: `daily_tiredness_signals`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | não | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | não | FK `auth.users(id)` |
| `date` | `date` | não | Dia da sinalização (data local do usuário, formato `YYYY-MM-DD`) |
| `created_at` | `timestamptz` | não | `default now()` |
| — | — | — | `unique (user_id, date)` |

RLS: mesma política padrão (`auth.uid() = user_id`).

**Lifecycle**:
- Criada via upsert em `POST /api/tiredness-today` (idempotente — marcar duas vezes no mesmo dia não duplica).
- Removida via `DELETE /api/tiredness-today` (FR-008a, "desfazer").
- Nunca lida fora do dia corrente — nenhuma consulta a sinalizações passadas é necessária (ver research.md Decisão 4).
- Sem soft-delete; delete físico.

**TypeScript** (mesmo arquivo `packages/types/src/profile.ts`):

```ts
export interface DailyTirednessSignal {
  active: boolean
}
```
(Resposta simplificada — a API só precisa informar se hoje está sinalizado; não há necessidade de expor `id`/`created_at` ao cliente.)

---

## Alterações em tipos existentes

### `PlanInput` (`packages/types/src/plan.ts`)

Adiciona campos opcionais para os dados de perfil situacional, mantendo `userGoals`/`userLevel` como estão (continuam sendo os valores efetivos passados ao prompt — agora vindos do perfil real em vez de constantes fixas, ver research.md Decisão 7):

```ts
export interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]
  recoveryData: RecoveryData[]
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
  bodyCheckins?: BodyCheckin[]
  trainingTime?: string        // NOVO
  timeOff?: string             // NOVO
  currentInjury?: string       // NOVO
}
```

### `AdjustedSession` (`packages/types/src/mesocycle.ts`)

Nenhuma mudança de shape — `adjustmentReason` já é uma string livre; a razão do ajuste por cansaço manual usa o mesmo campo (ex.: `"Cansaço sinalizado manualmente hoje"` ou combinado com o motivo de HRV quando ambos se aplicam).

---

## Migration file

`supabase/migrations/<timestamp>_create_user_training_profile_and_tiredness_signals.sql` (nome exato definido em `/speckit-tasks`, seguindo o padrão `YYYYMMDDHHMMSS_description.sql` dos demais arquivos em `supabase/migrations/`):

```sql
create table user_training_profile (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  goal             text,
  level            text check (level in ('iniciante', 'intermediario', 'avancado')),
  training_time    text,
  time_off         text,
  current_injury   text,
  updated_at       timestamptz not null default now()
);

alter table user_training_profile enable row level security;

create policy "users manage own training profile" on user_training_profile
  for all using (auth.uid() = user_id);

create table daily_tiredness_signals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),
  constraint daily_tiredness_signals_user_date_unique unique (user_id, date)
);

alter table daily_tiredness_signals enable row level security;

create policy "users manage own tiredness signals" on daily_tiredness_signals
  for all using (auth.uid() = user_id);

create index daily_tiredness_signals_user_date_idx on daily_tiredness_signals (user_id, date desc);
```
