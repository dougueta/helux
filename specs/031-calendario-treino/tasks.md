# Tasks: Calendário visual de treino, saldo semanal e curiosidades do período

**Input**: Design documents from `specs/031-calendario-treino/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/ui.md, quickstart.md

**Tests**: Obrigatórios (Constituição II — TDD). Em cada tarefa de teste: escrever, rodar e confirmar que falha (red) antes de implementar o código correspondente (green).

**Organization**: Por user story (`spec.md`). US1 e US2 são P1; US3 e US4 são P2.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Tipos e Geometria Base do Calendário)

**Purpose**: Contratos compartilhados em `@helux/types` e funções puras de calendário (segunda a domingo, semanas que cruzam a virada do mês) em `@helux/workouts`.

- [X] T001 [P] Criar os tipos `EffortClassification`, `CalendarGymSessionItem`, `CalendarRoutineItem`, `CalendarDaySummary`, `CalendarWeekRow`, `WeeklyBalanceDeltas`, `WeeklyBalance`, `CuriosityScope`, `CuriosityCategory`, `PeriodCuriosity` e `TrainingCalendarMonthView` em `packages/types/src/calendar.ts` e reexportar em `packages/types/src/index.ts`
- [X] T002 [P] Escrever testes unitários de geometria mensal e agrupamento por dia (`buildCalendarGridWeeks`: semanas segunda–domingo, dias adjacentes com `inCurrentMonth: false`, `isToday`, `isFuture`, `defaultSelectedWeekStart`, `defaultSelectedDate` e agrupamento por data local `YYYY-MM-DD`) em `packages/workouts/src/__tests__/training-calendar.test.ts`
- [X] T003 Implementar a geometria base da grade mensal e agrupamento por dia em `packages/workouts/src/training-calendar.ts` e reexportar em `packages/workouts/src/index.ts`

**Checkpoint**: `pnpm --filter @helux/types typecheck` e testes base de geometria em `packages/workouts` verdes.

---

## Phase 2: User Story 2 & User Story 3 — Motor Determinístico de Saldo da Semana e Curiosidades (Priority: P1/P2) 🎯 Core Engine

**Goal**: Calcular deterministicamente o `WeeklyBalance` (assiduidade academia + rotinas, esforço médio `1–10` + faixa qualitativa, peso médio da semana + deltas `vs. semana anterior`, volume/séries/tempo ativo) e as `PeriodCuriosity[]` (`Semana` e `Mês`: equivalência de tonelagem em carros/pianos/malas, PRs/maior carga, dia mais fiel, exercício dominante e tempo investido) em `< 10 ms` e `0` chamadas de IA.

**Independent Test**: Passar sessões de academia (com e sem `rpe`/séries), rotinas complementares e pesagens em duas semanas consecutivas de um mês para `buildTrainingCalendarMonth` e verificar que: (1) `WeeklyBalance` calcula assiduidade, esforço médio e faixa (`leve | moderado | forte | muito-forte`), média de peso e todos os deltas contra a semana anterior; (2) semana cruzando a virada do mês soma os 7 dias completos; e (3) `computePeriodCuriosities` devolve 3–5 cartões reais para `semana` e `mes` sem exibir curiosidades com zeros.

### Tests

- [X] T004 [P] [US2] Escrever testes unitários de `classifyEffort` e `computeWeeklyBalance` em `packages/workouts/src/__tests__/training-calendar.test.ts`: combinação de `checkins.depois.rpe` e `set.effort`, sessão antiga sem esforço (`avgEffort: null`), média de pesagens da semana e delta de peso (`avgWeightKgDelta`), semana sem pesagens (`avgWeightKg: null`), semana que cruza a virada do mês e deltas contra a semana anterior
- [X] T005 [P] [US3] Escrever testes unitários de `formatTonnageEquivalent` e `computePeriodCuriosities` (`scope: 'semana' | 'mes'`) em `packages/workouts/src/__tests__/training-calendar.test.ts`: escalas de equivalência (malas, pianos, carros populares), detecção de PRs e maior carga, dia da semana mais fiel no mês, exercício dominante, tempo ativo total e ausência de curiosidades zeradas quando o período está vazio (`SC-004`)

### Implementation

- [X] T006 [US2] Implementar `classifyEffort` e `computeWeeklyBalance` (integrado a `buildTrainingCalendarMonth`) em `packages/workouts/src/training-calendar.ts`
- [X] T007 [US3] Implementar `formatTonnageEquivalent` e `computePeriodCuriosities` (integrado a `buildTrainingCalendarMonth`) em `packages/workouts/src/training-calendar.ts`

**Checkpoint**: `pnpm --filter @helux/workouts test` 100% verde.

---

## Phase 3: User Story 1 — Endpoint `GET /api/workouts/calendar` e Hook de Calendário (Priority: P1) 🎯 MVP API

**Goal**: Expor `GET /api/workouts/calendar?month=YYYY-MM` lendo `workout_sessions` (+ `session_checkins`), `complementary_routine_logs`, `body_weights` e `user_training_profile` e retornando `TrainingCalendarMonthView`.

**Independent Test**: Chamar `GET /api/workouts/calendar?month=2026-11` autenticado e verificar que retorna a grade do mês, `weeklyBalances` (incluindo delta da 1ª semana usando os 7 dias anteriores ao início da grade), `weeklyCuriosities` e `monthCuriosities`, além de rejeitar mês inválido (`400 invalid-month`) ou futuro (`400 future-month`).

### Tests

- [X] T008 [P] [US1] Escrever testes da rota `GET /api/workouts/calendar` em `apps/api/src/__tests__/workout-calendar.test.ts`: `401` sem token, `400 invalid-month` e `400 future-month`, retorno `200` com sessões de academia, rotinas complementares, pesagens e deltas da primeira semana do mês

### Implementation

- [X] T009 [US1] Criar `apps/api/src/services/workout-calendar.service.ts` e `apps/api/src/routes/workout-calendar.ts`, e registrar `workoutCalendarRoutes` em `apps/api/src/app.ts`
- [X] T010 [P] [US1] Criar `apps/web/src/hooks/useWorkoutCalendar.ts` com cache em memória por `month` (`YYYY-MM`), estado de `selectedWeekStart` e `selectedDate` sincronizados sem salto de layout

**Checkpoint**: `pnpm --filter @helux/api test` 100% verde.

---

## Phase 4: User Story 1, User Story 2 & User Story 3 — Experiência Visual do Calendário, Saldo da Semana e Curiosidades (Priority: P1/P2) 🎯 MVP UI & UX Excellence

**Goal**: Construir os componentes visuais no Design System v2 (`CalendarMonthGrid`, `CalendarDayDetail`, `WeeklyBalanceCard`, `PeriodCuriositiesSection` e `WorkoutCalendarView`) com leitura imediata por contraste (`--accent` academia, `--success` rotinas, dupla marcação em dias combo), destaque contínuo na linha da semana selecionada, tipografia tabular (`.n-lg`, `.n-md`, `.n-sm`) e zero layout shift (`FR-011`).

**Independent Test**: Renderizar `WorkoutCalendarView` com dados de um mês, verificar os marcadores de dias de academia, rotinas e ambos, tocar em um dia para ver `CalendarDayDetail` (com link para `/history/[id]` e peso do dia), tocar em outra semana para atualizar `WeeklyBalanceCard` e alternar `PeriodCuriositiesSection` entre `Semana` e `Mês`.

### Tests

- [X] T011 [P] [US1] Escrever testes de `CalendarMonthGrid` e `CalendarDayDetail` em `apps/web/src/__tests__/components/calendar/WorkoutCalendarView.test.tsx`: marcadores distintos para academia, rotina complementar e ambos; seleção de dia atualizando o detalhe do dia (sessões com link `/history/[id]`, rotinas e peso) e seleção da semana correspondente; navegação entre meses e bloqueio de mês futuro
- [X] T012 [P] [US2] Escrever testes de `WeeklyBalanceCard` em `apps/web/src/__tests__/components/calendar/WeeklyBalanceCard.test.tsx`: exibição de assiduidade (`gymDays/targetGymDays` + rotinas), esforço médio qualitativo + numérico + delta, peso médio da semana + delta (e estado `"Sem pesagem"` com link `/checkin/peso`), volume/séries/tempo ativo
- [X] T013 [P] [US3] Escrever testes de `PeriodCuriositiesSection` em `apps/web/src/__tests__/components/calendar/PeriodCuriositiesSection.test.tsx`: alternância instantânea `Semana | Mês`, renderização dos cartões determinísticos e estado vazio encorajador sem números zerados

### Implementation

- [X] T014 [P] [US1] Criar `apps/web/src/components/calendar/CalendarMonthGrid.tsx` e `apps/web/src/components/calendar/CalendarDayDetail.tsx` seguindo `contracts/ui.md` e `FR-011`
- [X] T015 [P] [US2] Criar `apps/web/src/components/calendar/WeeklyBalanceCard.tsx` seguindo `contracts/ui.md`
- [X] T016 [P] [US3] Criar `apps/web/src/components/calendar/PeriodCuriositiesSection.tsx` seguindo `contracts/ui.md`
- [X] T017 [US1] Criar `apps/web/src/components/calendar/WorkoutCalendarView.tsx` orquestrando cabeçalho do mês, `CalendarMonthGrid`, `CalendarDayDetail`, `WeeklyBalanceCard` e `PeriodCuriositiesSection`

**Checkpoint**: Todos os testes unitários dos componentes de calendário verdes.

---

## Phase 5: User Story 4 — Integração em `/history`, Tira Semanal na `Home` e Modo Mock (Priority: P2)

**Goal**: Integrar o seletor `Segmented` (`Calendário | Lista`, padrão `Calendário`) em `/history`, adicionar a tira compacta dos 7 dias da semana (`WeeklyCalendarStrip`) na `Home` com navegação de 1 toque para `/history`, e suportar `GET /api/workouts/calendar` no modo mock (spec 021).

**Independent Test**: Abrir a Home, conferir `WeeklyCalendarStrip` com os 7 dias da semana atual marcados e tocar nela para abrir `/history` na visão `Calendário`; alternar entre `Calendário` e `Lista` em `/history`.

### Tests

- [X] T018 [P] [US4] Escrever testes de `WeeklyCalendarStrip` e da página `/history` (`Calendário | Lista`) em `apps/web/src/__tests__/components/calendar/WeeklyCalendarStrip.test.tsx` e `apps/web/src/__tests__/app/history-page.test.tsx`

### Implementation

- [X] T019 [P] [US4] Criar `apps/web/src/components/calendar/WeeklyCalendarStrip.tsx` e integrá-lo em `apps/web/src/app/HomeClient.tsx`
- [X] T020 [US4] Atualizar `apps/web/src/app/history/page.tsx` com o `Segmented` (`Calendário | Lista`, padrão `Calendário`) e atualizar o link em `apps/web/src/app/treinos/TreinosClient.tsx`
- [X] T021 [US4] Adicionar suporte a `GET /api/workouts/calendar` no mock router (`apps/web/src/mocks/routes.ts`) reutilizando `buildTrainingCalendarMonth` sobre os dados da persona ativa

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 Rodar toda a suíte de testes e checagem de tipos do monorepo (`pnpm --filter @helux/types typecheck`, `pnpm --filter @helux/workouts test`, `pnpm --filter @helux/api test`, `pnpm --filter @helux/web test` e `pnpm -r typecheck`) e garantir 100% verde
