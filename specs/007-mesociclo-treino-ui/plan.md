# Implementation Plan: Visibilidade do Mesociclo na Home

**Branch**: `007-mesociclo-treino-ui` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/007-mesociclo-treino-ui/spec.md`

## Summary

Atualizar a home (`apps/web`) para consumir o novo formato de resposta de `GET /workout/latest-plan` (`AdjustedWorkoutPlanView`, definido em `006-mesociclo-treino-backend`) e exibir três elementos novos abaixo do card do treino de hoje: lista/carrossel dos próximos treinos do mesociclo, badge de ajuste por recovery quando aplicável, e indicador de progresso do ciclo. Reaproveita os primitivos visuais já existentes em `apps/web/src/components/ui/` (Chip, Icon) em vez de introduzir um novo sistema visual, seguindo o padrão estabelecido pelo plano `design-system-foundation`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18, Next.js 14 App Router — mesma stack de `004-web-mvp`
**Primary Dependencies**: `@testing-library/react` + `@testing-library/user-event` + `vitest`; `@helux/types` para os tipos `AdjustedWorkoutPlanView`/`UpcomingSessionSummary` (definidos em `006-mesociclo-treino-backend`)
**Storage**: N/A — este spec só consome dados via API, não persiste nada novo no cliente (o cache local em `localStorage` do plano do dia é mantido, mesmo padrão de `useWorkoutPlan.ts` hoje)
**Testing**: Vitest + React Testing Library, um teste por componente novo antes da implementação (Red → Green → Refactor)
**Target Platform**: Web — otimizado para iPhone Safari, mesmo público de `004-web-mvp`
**Project Type**: Web application (`apps/web` dentro do monorepo) — nenhum workspace novo
**Performance Goals**: Nenhuma renderização adicional bloqueante — os dados novos (`upcoming`, `progress`, `today.adjusted`) já vêm na mesma resposta de `GET /workout/latest-plan` consumida hoje, sem chamada extra
**Constraints**: Totalmente utilizável em uma mão em iPhone (mesmo padrão de `004-web-mvp`: alvo de toque ≥44×44pt, sem scroll horizontal na página — a lista de próximos treinos pode ter seu próprio scroll horizontal interno, contido)
**Scale/Scope**: Usuário único, uso pessoal — mesmo padrão do projeto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Mudanças contidas em `apps/web`; tipos consumidos de `packages/types` (já definidos por `006-mesociclo-treino-backend`) |
| II. Test-First (TDD) | ✅ PASS | Cada componente novo (`UpcomingSessionsList`, `RecoveryAdjustedBadge`, `MesocycleProgress`) ganha teste antes da implementação, seguindo `design-system-foundation` |
| III. Independent Deployability | ✅ PASS | `apps/web` continua chamando `apps/api` só via HTTP; nenhum import direto de workspace entre apps |
| IV. Shared Code via Packages | ✅ PASS | Nenhuma duplicação de tipos — reaproveita `AdjustedWorkoutPlanView`/`UpcomingSessionSummary` de `@helux/types` (adicionados por `006-mesociclo-treino-backend`) |
| V. Simplicity (YAGNI) | ✅ PASS | Reaproveita primitivos existentes (`Chip`, `Icon`) e o padrão visual já usado para os "dots" de progresso semanal (`HomeClient.tsx`, card "Semana"), em vez de criar um sistema novo |

## Project Structure

### Documentation (this feature)

```text
specs/007-mesociclo-treino-ui/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 findings
├── data-model.md         ← view-model definitions (client-side)
├── contracts/
│   └── ui-contracts.md   ← contratos de props dos componentes novos
├── checklists/
│   └── requirements.md   ← spec quality checklist
└── tasks.md               ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
apps/web/src/
├── app/
│   └── HomeClient.tsx                        ← MODIFICADO: consome AdjustedWorkoutPlanView;
│                                                  renderiza os 3 elementos novos abaixo do
│                                                  card de hoje; trata o estado "sem mesociclo ativo"
├── components/
│   └── workout/
│       ├── UpcomingSessionsList.tsx           ← NOVO: lista/carrossel horizontal dos próximos
│       │                                          treinos (letra + foco, sem datas)
│       ├── RecoveryAdjustedBadge.tsx          ← NOVO: badge "Ajustado pelo recovery de hoje",
│       │                                          composição de Chip + Icon
│       └── MesocycleProgress.tsx              ← NOVO: indicador "N de M treinos concluídos"
│                                                  (dots), extraído do padrão já usado no
│                                                  card "Semana" de HomeClient.tsx
├── hooks/
│   └── useWorkoutPlan.ts                      ← MODIFICADO: tipagem e leitura ajustadas para
│                                                  AdjustedWorkoutPlanView; cache local mantido
├── services/
│   └── workout.service.ts                     ← MODIFICADO: getLatestPlan() retorna
│                                                  AdjustedWorkoutPlanView
└── __tests__/
    ├── components/
    │   └── workout/
    │       ├── UpcomingSessionsList.test.tsx
    │       ├── RecoveryAdjustedBadge.test.tsx
    │       └── MesocycleProgress.test.tsx
    └── hooks/
        └── useWorkoutPlan.test.ts             ← atualizado para o novo shape
```

**Structure Decision**: Estende `apps/web` conforme o layout já estabelecido em `004-web-mvp` e `design-system-foundation` — componentes novos vivem em `components/workout/` (mesmo diretório dos componentes de treino existentes: `WorkoutCard.tsx`, `ExerciseList.tsx`), não em `components/ui/` (que é reservado a primitivos genéricos sem lógica de domínio).

## Complexity Tracking

*Sem violações da constituição a justificar.*

**Dependência explícita**: esta spec só pode ser implementada depois (ou em paralelo avançado) de `006-mesociclo-treino-backend`, pois consome o tipo `AdjustedWorkoutPlanView` e o novo formato de `GET /workout/latest-plan` definidos lá. Durante o desenvolvimento, os componentes novos podem ser construídos e testados isoladamente com dados mockados (ver `contracts/ui-contracts.md`), mas a integração em `HomeClient.tsx`/`useWorkoutPlan.ts` depende do endpoint real.

**Gap herdado de `006`**: o botão "Gerar Novo Plano" (chama `POST /workout/generate`) continua fora do escopo de ambas as specs — ficará exibindo um fluxo de sessão única desalinhado com a nova visão de mesociclo até ser tratado como débito técnico separado.
