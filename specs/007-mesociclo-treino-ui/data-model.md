# Data Model: Visibilidade do Mesociclo na Home

Esta spec não introduz persistência nova — consome os tipos definidos em `006-mesociclo-treino-backend` (`packages/types`). Este documento descreve como cada componente novo mapeia esses dados para props de UI.

## Dados consumidos (de `@helux/types`, definidos por `006-mesociclo-treino-backend`)

- `AdjustedWorkoutPlanView` — resposta de `GET /workout/latest-plan` (ver `006-mesociclo-treino-backend/contracts/api.md`):
  - `today: AdjustedSession | null`
  - `upcoming: UpcomingSessionSummary[]` — `{ letter: string; focus: string }[]`
  - `progress: { completed: number; total: number } | null`
  - `status?: 'generating' | 'none'`

## View models locais (derivados, não persistidos)

Nenhum tipo novo precisa ser criado em `packages/types` para esta spec — os componentes consomem subconjuntos de `AdjustedWorkoutPlanView` diretamente via props:

| Componente | Props | Origem |
|---|---|---|
| `UpcomingSessionsList` | `sessions: UpcomingSessionSummary[]` | `AdjustedWorkoutPlanView.upcoming` |
| `RecoveryAdjustedBadge` | `reason?: string` (renderiza só quando presente) | `AdjustedWorkoutPlanView.today.adjustmentReason`, condicionado a `today.adjusted === true` |
| `MesocycleProgress` | `completed: number`, `total: number` | `AdjustedWorkoutPlanView.progress` |

## Estados de tela derivados em `HomeClient.tsx`

| Condição | Estado renderizado |
|---|---|
| `today` presente | Card de hoje normal (com `RecoveryAdjustedBadge` se `today.adjusted`) |
| `today === null` e `status === 'generating'` | Mensagem "Preparando seu próximo ciclo…" no lugar do card de hoje |
| `today === null` e `status` ausente/`'none'` | Mensagem atual "Nenhum plano gerado ainda" (primeiro uso) |
| `upcoming.length === 0` | `UpcomingSessionsList` não é renderizado (sem próximos treinos a mostrar — ciclo com 1 sessão ou última sessão do ciclo) |
| `progress === null` | `MesocycleProgress` não é renderizado |
