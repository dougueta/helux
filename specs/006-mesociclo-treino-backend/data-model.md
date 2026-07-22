# Data Model: Geração de Mesociclo de Treino com Ajuste por Recovery

## MesocyclePlan (nova tabela `mesocycle_plans`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID (PK) | `gen_random_uuid()` |
| `user_id` | UUID (FK → `auth.users`) | RLS por `auth.uid() = user_id`, mesmo padrão de `workout_plans`/`workout_sessions` |
| `generated_at` | TIMESTAMPTZ | Timestamp retornado pela IA na geração |
| `days_per_week` | INT | Dias/semana usados para determinar a divisão (2/3/4 → Upper-Lower / PPL / ABCD) |
| `split_type` | TEXT | Rótulo da divisão aplicada (ex.: `"ABCD"`, `"PPL"`, `"upper_lower"`) — informativo, não usado em lógica |
| `sessions` | JSONB | Array ordenado de `MesocycleSession` (ver abaixo) — a ordem do array é a ordem de execução |
| `rationale` | TEXT | Justificativa geral do ciclo (equivalente ao `rationale` de `NextWorkoutPlan` hoje, mas para o ciclo todo) |
| `created_at` | TIMESTAMPTZ | `now()` |

Índice: `(user_id, created_at DESC)` — para localizar rapidamente o mesociclo ativo mais recente (mesmo padrão de `workout_plans`).

**"Mesociclo ativo"** = a linha mais recente de `mesocycle_plans` para o `user_id` (mesma regra de "latest" já usada hoje).

### MesocycleSession (elemento do array `sessions`, não é tabela própria)

| Campo | Tipo | Notas |
|---|---|---|
| `letter` | string | Posição no ciclo (ex.: `"A"`, `"B"`, `"C"`, `"D"`) |
| `focus` | string | Grupo(s) muscular(es) da sessão (ex.: `"Peito + Tríceps"`) — usado tanto na resposta da API quanto (via spec 007) na UI |
| `exercises` | `PlannedExercise[]` | Mesmo formato hoje usado em `NextWorkoutPlan.exercises` (nome, séries, reps, carga, notas, cues, músculo, variantes) |
| `completed_at` | string (ISO 8601) \| `null` | `null` = pendente. Preenchido quando a sessão correspondente é registrada em `workout_sessions` |

**Regra de derivação**: a "sessão pendente atual" é o primeiro elemento de `sessions` (na ordem do array) com `completed_at === null`. Se todos tiverem `completed_at` preenchido, o mesociclo está completo (dispara geração do próximo, ver `research.md` Decisão 5). Se `sessions` estiver vazio ou nenhum mesociclo existir, não há sessão pendente (estado tratado pela spec de UI, 007).

## AdjustedSession (tipo de retorno, não persistido)

Resultado de `applyRecoveryAdjustment(session: MesocycleSession, recovery: RecoveryData[]): AdjustedSession` — computado a cada chamada de `GET /workout/latest-plan`, nunca gravado.

| Campo | Tipo | Notas |
|---|---|---|
| `letter` | string | Herdado da sessão original |
| `focus` | string | Herdado da sessão original |
| `exercises` | `PlannedExercise[]` | Exercícios com `sets` possivelmente reduzidos e `notes` anotadas quando há redução de carga (ver `research.md` Decisão 4) |
| `adjusted` | boolean | `true` quando qualquer alteração foi aplicada em relação à sessão original — consumido pela spec 007 para o badge "Ajustado pelo recovery de hoje" |
| `adjustmentReason` | string \| `undefined` | Texto curto explicando o motivo (ex.: `"HRV moderado (52ms)"`), presente só quando `adjusted === true` |

## Alterações em entidades existentes

- **`workout_sessions`** (tabela existente, sem migração de schema necessária): ao inserir uma sessão concluída, o serviço passa a também localizar e marcar a `MesocycleSession` correspondente dentro do `mesocycle_plans.sessions` ativo (`completed_at = now()`), via `UPDATE` no JSONB. Nenhuma coluna nova é necessária em `workout_sessions` — a referência é resolvida por posição (a sessão pendente atual no momento do registro é a que foi concluída).
- **`workout_plans`** (tabela existente): congelada — nenhum novo insert a partir desta feature. Mantida apenas para histórico de planos gerados antes da migração.
- **`PlanInput`** (`packages/types`): inalterado — `generateMesocyclePlan` usa a mesma entrada que `generateWorkoutPlan` usa hoje.

## Validação / regras de negócio

- Uma sessão só pode ser marcada concluída uma vez (idempotência: se `completed_at` já estiver preenchido, uma segunda tentativa não deve sobrescrever a data original).
- `sessions` nunca deve ser um array vazio para um mesociclo recém-gerado — se a IA retornar um ciclo sem sessões, isso é tratado como erro de geração (mesma family de erro de "JSON malformado" já tratada em `parseJsonResponse` hoje).
- O ajuste por recovery nunca reduz `sets` abaixo de 2 por exercício (piso de segurança, ver `research.md` Decisão 4).
