# Tasks: Módulo de rotinas diárias e complementares (alongamento, abdominal e cardio)

**Input**: Design documents from `specs/030-rotinas-complementares/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/ui.md, quickstart.md

**Tests**: Obrigatórios (Constituição II — TDD). Em cada tarefa de teste: escrever, rodar e confirmar que falha (red) antes de implementar o código correspondente (green).

**Organization**: Por user story (`spec.md`). US1, US2 e US3 são P1; US4 e US5 são P2.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Criar a migração `supabase/migrations/20261109000000_030_complementary_routines.sql` conforme `data-model.md`: tabela `complementary_routine_logs` (`id`, `user_id`, `category`, `performed_on`, `performed_at`, `duration_minutes`, `modality`, `zone`, `effort`, `items`, `notes`, `created_at`), checks de domínio, índice `(user_id, performed_on desc, performed_at desc)`, RLS `auth.uid() = user_id` e coluna `complementary_preferences jsonb not null default '{}'::jsonb` em `user_training_profile`

---

## Phase 2: Foundational (bloqueia todas as stories)

**Purpose**: Tipos compartilhados, catálogo de alongamento/mobilidade e enriquecimento de cardio/core em `@helux/types`, além da base do motor determinístico em `@helux/workouts`.

- [X] T002 [P] Criar os tipos `ComplementaryCategory`, `StretchMobilityEntry`, `ComplementaryRoutineItem`, `ComplementaryRoutine`, `CategoryPreference`, `ComplementaryPreferences`, `ComplementaryRoutineLog`, `ComplementaryCategoryProgress` e `ComplementaryRoutinesView`, além do catálogo `STRETCH_MOBILITY_BANK` (16 movimentos cobrindo todas as `Region`s com `stress`, `mode`, `unilateral`, `defaultSeconds`/`defaultReps`, `cues` e `motion`) e metadados `CORE_ROUTINE_ITEMS` em `packages/types/src/routines.ts`; exportar em `packages/types/src/index.ts`
- [X] T003 [P] Adicionar orientações estruturadas (`cues` e `zoneGuidance`) às entradas de `CARDIO_BANK` em `packages/types/src/cardio.ts` e o campo opcional `complementaryAdherence` em `CycleSummary` em `packages/types/src/cycle.ts`
- [X] T004 [P] Escrever testes de invariantes do catálogo `STRETCH_MOBILITY_BANK` e `CORE_ROUTINE_ITEMS` (identidades únicas, todas as regiões cobertas, `cues` não vazios, `motion` definido, limites de `stress` 0–2) em `packages/workouts/src/__tests__/complementary-routines.test.ts`
- [X] T005 Implementar a validação e helpers base do catálogo em `packages/workouts/src/complementary-routines.ts` e exportar em `packages/workouts/src/index.ts`

**Checkpoint**: `pnpm --filter @helux/types typecheck` e testes base do catálogo em `packages/workouts` verdes.

---

## Phase 3: User Story 2 — Prescrição determinística para potencializar o treino e proteger articulações (Priority: P1) 🎯 MVP Core

**Goal**: Montar instantaneamente, por regra determinística (0 chamadas de IA), 1 rotina fixa de Alongamento & Mobilidade, 1 de Core / Abdominal e 1 de Cardio para o ciclo, respeitando condições articulares, crise ativa e foco do mesociclo, e migrar as sessões dedicadas de cardio/mobilidade da fila `A/B/C/D` para o módulo complementar.

**Independent Test**: Passar um perfil com reconstrução de LCA/artrose no joelho e mesociclo ativo para `prescribeComplementaryRoutines` e verificar que: (1) nenhum item viola `maxJointStress` ou `maxCardioImpact`; (2) a rotina de alongamento prioriza quadril, tornozelo e posterior; (3) o core respeita a coluna; (4) cada rotina traz `purpose`, duração e frequência; e (5) `prescribeMethod` + `validateAgainstMethod` mantêm a fila `A/B/C/D` exclusiva para sessões de força.

### Tests

- [X] T006 [P] [US2] Escrever testes unitários de `prescribeComplementaryRoutines` em `packages/workouts/src/__tests__/complementary-routines.test.ts`: respeito a `maxJointStress` (joelho, ombro, lombar) e `maxCardioImpact`, exclusão de `flaredRegions` em crise ativa, priorização de regiões de condições ativas e grupos do mesociclo, aplicação de `ComplementaryPreferences` (`daysPerWeek`, `targetMinutes`, `preferredModality`, `focusRegions`) e determinismo (mesma entrada → mesma saída em < 10 ms)
- [X] T007 [P] [US2] Atualizar e adicionar testes em `packages/workouts/src/__tests__/method.test.ts` e `packages/ai/src/__tests__/agents/method-validation.test.ts` para refletir `FR-002a`: fila `A/B/C/D` da `weekTemplate` exclusiva para sessões de força (`strengthDays = Math.min(daysAvailable, 6)`), sem falhar por ausência de sessões avulsas de `cardio` ou `mobilidade` na fila, mantendo `cardioSessions` e `mobilitySessions` na prescrição para as rotinas complementares

### Implementation

- [X] T008 [US2] Implementar `prescribeComplementaryRoutines` em `packages/workouts/src/complementary-routines.ts`
- [X] T009 [US2] Atualizar `allocate` em `packages/workouts/src/method.ts`, `validateAgainstMethod` em `packages/ai/src/agents/method-validation.ts` e o prompt em `packages/ai/src/mesocycle-prompts.ts` para manter a fila `A/B/C/D` exclusiva para os treinos de academia (`FR-002a`), preservando compatibilidade com planos antigos já salvos

**Checkpoint**: `pnpm --filter @helux/workouts test` e `pnpm --filter @helux/ai test` verdes.

---

## Phase 4: User Story 1 — Executar rotinas complementares no mesmo dia do treino de academia (Priority: P1) 🎯 MVP API & Persistência

**Goal**: Expor `/api/routines`, salvar execuções em `complementary_routine_logs` e manter o estado ativo da rotina complementar (`helux:active-routine`) 100% isolado do treino de academia (`helux:active-workout`) e do `current_session_index`.

**Independent Test**: Com um treino de academia pendente (e uma sessão de academia iniciada em `helux:active-workout`), registrar a conclusão de uma rotina de Cardio e uma de Alongamento via API e hook `useActiveRoutine`, verificando que ambas entram como feitas hoje sem alterar `current_session_index` nem `helux:active-workout`.

### Tests

- [X] T010 [P] [US1] Escrever testes de `computeWeeklyRoutineProgress` e `completedComplementaryCategoriesToday` em `packages/workouts/src/__tests__/complementary-routines.test.ts`: contagem na semana (segunda a domingo), `doneToday`, múltiplas categorias no mesmo dia e `lastPerformedOn`
- [X] T011 [P] [US1] Escrever testes das rotas `/api/routines` em `apps/api/src/__tests__/routines.test.ts`: 401 sem token; `GET /api/routines` retorna as 3 rotinas fixas, `progress`, `recentLogs` e `completedToday`; `POST /api/routines/logs` salva execução sem tocar em `mesocycle_plans` nem `workout_sessions` e rejeita data futura (`400 future-date`); `PUT /api/routines/preferences` salva e recalcula; `DELETE /api/routines/logs/:id` retorna 204/404
- [X] T012 [P] [US1] Escrever testes de `useActiveRoutine` em `apps/web/src/__tests__/hooks/useActiveRoutine.test.ts`: isolamento total da chave `'helux:active-routine'` em relação a `'helux:active-workout'` (iniciar, avançar item/série e finalizar rotina complementar mantém `'helux:active-workout'` intacto — `SC-001`)

### Implementation

- [X] T013 [US1] Implementar `computeWeeklyRoutineProgress` e `completedComplementaryCategoriesToday` em `packages/workouts/src/complementary-routines.ts`
- [X] T014 [US1] Criar `apps/api/src/services/routines.service.ts` e `apps/api/src/routes/routines.ts` (`GET /api/routines`, `PUT /api/routines/preferences`, `POST /api/routines/logs`, `DELETE /api/routines/logs/:id`) e registrar em `apps/api/src/app.ts`
- [X] T015 [P] [US1] Criar `apps/web/src/services/routines.service.ts` (`getRoutinesView`, `updateRoutinePreferences`, `logRoutineCompletion`, `deleteRoutineLog`) e `apps/web/src/hooks/useRoutines.ts`
- [X] T016 [US1] Criar `apps/web/src/hooks/useActiveRoutine.ts` usando a chave `'helux:active-routine'` no `localStorage`

**Checkpoint**: Rotas `/api/routines` e hooks testados e verdes (`pnpm --filter @helux/api test`).

---

## Phase 5: User Story 3 — Execução rápida e guiada por tipo de rotina (Priority: P1) 🎯 MVP UI Execução

**Goal**: Tela `/treinos/rotina/[category]` com execução adaptada a cada categoria: cronômetro regressivo de sustentação e troca de lado em Alongamento & Mobilidade, séries por repetições/isometria com descanso curto em Core / Abdominal, e conclusão rápida (< 15 s) com escolha de modalidade compatível e esforço em Cardio.

**Independent Test**: Abrir `/treinos/rotina/alongamento-mobilidade`, iniciar o timer de sustentação e concluir os itens sem digitar carga; abrir `/treinos/rotina/core-abdominal`, marcar séries e finalizar; abrir `/treinos/rotina/cardio`, informar minutos e esforço e concluir em menos de 15 s.

### Tests

- [X] T017 [P] [US3] Escrever testes de `RoutineExecutionClient` em `apps/web/src/__tests__/components/routines/RoutineExecutionClient.test.tsx`: (a) `alongamento-mobilidade` renderiza `ExerciseDemo`, `cues`, indicador de lado quando `unilateral: true`, cronômetro regressivo e conclui item com 1 toque sem campo de kg; (b) `core-abdominal` marca séries por repetições/tempo sem campo de kg e aciona descanso curto; (c) `cardio` exibe modalidade, zona, permite trocar por outra modalidade permitida, recebe minutos + esforço e chama `POST /api/routines/logs`

### Implementation

- [X] T018 [US3] Criar `apps/web/src/components/routines/RoutineExecutionClient.tsx` cobrindo os 3 modos de execução (`alongamento-mobilidade`, `core-abdominal`, `cardio`) com suporte a `ExerciseDemo` para movimentos do `STRETCH_MOBILITY_BANK`, `EXERCISE_BANK` e `CARDIO_BANK`
- [X] T019 [US3] Criar a página `apps/web/src/app/treinos/rotina/[category]/page.tsx`

**Checkpoint**: Execução guiada das 3 categorias funcionando de ponta a ponta.

---

## Phase 6: User Story 4 — Visão na Home, sub-aba em Treinos e ajuste instantâneo (Priority: P2)

**Goal**: Seção **Rotinas do Dia** na **Home** abaixo do treino principal e seletor `Segmented` (`Academia | Rotinas`) na aba **Treinos**, com ajuste instantâneo de frequência semanal, duração e foco/modalidade via `RoutinePreferencesSheet`.

**Independent Test**: Abrir a Home e ver a seção "Rotinas do Dia" com status hoje e placar semanal (`concluídas / meta`); abrir `/treinos`, alternar para a sub-aba `Rotinas`, abrir `Ajustar`, mudar duração/frequência e verificar recálculo imediato.

### Tests

- [X] T020 [P] [US4] Escrever testes de `DailyRoutinesSection` em `apps/web/src/__tests__/components/routines/DailyRoutinesSection.test.tsx` (exibe as 3 rotinas, status `Feito hoje` vs. pendente, placar `x/y sem.` e links diretos para `/treinos/rotina/[category]`)
- [X] T021 [P] [US4] Escrever testes de `RoutinesTab` e `RoutinePreferencesSheet` em `apps/web/src/__tests__/components/routines/RoutinesTab.test.tsx` (alternância `Academia | Rotinas` em `TreinosClient`, exibição de `purpose`, abertura do sheet de preferências e chamada a `PUT /api/routines/preferences`)

### Implementation

- [X] T022 [P] [US4] Criar `apps/web/src/components/routines/DailyRoutinesSection.tsx` e integrá-lo em `apps/web/src/app/page.tsx` e `apps/web/src/app/HomeClient.tsx` logo abaixo do cartão do treino de academia
- [X] T023 [US4] Criar `apps/web/src/components/routines/RoutinePreferencesSheet.tsx` e `apps/web/src/components/routines/RoutinesTab.tsx`, e integrar o `Segmented` (`Academia` | `Rotinas`, respeitando `?aba=rotinas`) em `apps/web/src/app/treinos/page.tsx` e `apps/web/src/app/treinos/TreinosClient.tsx`

**Checkpoint**: Home e `/treinos?aba=rotinas` exibindo e ajustando as 3 rotinas complementares.

---

## Phase 7: User Story 5 — Sinergia com o treino da noite e com a análise do mesociclo (Priority: P2)

**Goal**: Alertar no cardio complementar quando há treino de membros inferiores pendente hoje (`FR-015`), sinalizar na sessão de academia (`TreinosClient`, `ProximoTreinoClient`, `/workout`) quando o cardio ou alongamento da volta à calma já foi cumprido hoje nas rotinas (`FR-014`), e incluir a aderência das 3 rotinas na análise de ciclo e no Perfil Integrado (`FR-016`).

**Independent Test**: Concluir Cardio e Alongamento pela manhã num dia com treino de pernas pendente; verificar o alerta de pernas no Cardio, o selo `"Já cumprido hoje nas Rotinas"` nos itens da volta à calma da sessão da noite e a presença de `complementaryAdherence` no `analyzeCycle`.

### Tests

- [X] T024 [P] [US5] Escrever testes de `checkCardioLegDayConflict` e `isCooldownSatisfiedByRoutines` em `packages/workouts/src/__tests__/complementary-routines.test.ts` e de `complementaryAdherence` em `packages/workouts/src/__tests__/cycle-analysis.test.ts`
- [X] T025 [P] [US5] Escrever testes da exibição do selo `"Já cumprido hoje nas Rotinas"` na lista de exercícios da sessão (`PlanExerciseList` / `ProximoTreinoClient`) e na tela de treino ativo (`/workout`) quando `completedToday` contém `'cardio'` ou `'alongamento-mobilidade'`

### Implementation

- [X] T026 [US5] Implementar `checkCardioLegDayConflict` e `isCooldownSatisfiedByRoutines` em `packages/workouts/src/complementary-routines.ts` e a agregação `complementaryAdherence` em `packages/workouts/src/cycle-analysis.ts`
- [X] T027 [P] [US5] Atualizar `apps/api/src/services/cycle-analysis.service.ts` e `apps/api/src/services/integrated-profile.service.ts` (e `packages/ai/src/agents/render-profile.ts`) para carregar os logs de `complementary_routine_logs` e expor a aderência complementar
- [X] T028 [US5] Exibir o selo `"Já cumprido hoje nas Rotinas"` nos itens de volta à calma/cardio da sessão de academia em `apps/web/src/components/workout/PlanExerciseList.tsx`, `apps/web/src/app/treinos/proximo/ProximoTreinoClient.tsx` e `apps/web/src/app/workout/page.tsx` quando a categoria correspondente estiver em `completedToday`

**Checkpoint**: Sinergia manhã/noite e análise de ciclo funcionando e testadas.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T029 Atualizar o ambiente de mocks (spec 021): adicionar fixtures e estado de `complementaryPreferences` e `complementaryRoutineLogs` em `apps/web/src/mocks/types.ts`, `apps/web/src/mocks/fixtures/personas.ts` e rotas `/api/routines*` em `apps/web/src/mocks/routes.ts`, com testes em `apps/web/src/__tests__/mocks/mock-mutations.test.ts`
- [X] T030 Rodar a suíte completa de testes e tipos na worktree (`pnpm --filter @helux/types typecheck`, `pnpm --filter @helux/workouts test`, `pnpm --filter @helux/ai test`, `pnpm --filter @helux/api test`, `pnpm --filter @helux/web test` e `pnpm -r typecheck`) e confirmar 100% verde

---

## Dependencies & Execution Order

- **Phase 1 (Setup — T001)** e **Phase 2 (Foundational — T002–T005)**: bloqueiam as demais fases.
- **Phase 3 (US2 — T006–T009)**: depende da Phase 2; define `prescribeComplementaryRoutines` e o ajuste da fila `A/B/C/D`.
- **Phase 4 (US1 — T010–T016)**: depende da Phase 3 (`prescribeComplementaryRoutines` é usado por `GET /api/routines`).
- **Phase 5 (US3 — T017–T019)**: depende da Phase 4 (`useRoutines` e `useActiveRoutine`).
- **Phase 6 (US4 — T020–T023)**: depende da Phase 4 e Phase 5.
- **Phase 7 (US5 — T024–T028)**: depende da Phase 3 e Phase 4.
- **Phase 8 (Polish — T029–T030)**: depende de todas as fases anteriores.

## Parallel Execution Examples

- **Foundational**: `T002` e `T003` em paralelo.
- **US2**: `T006` e `T007` em paralelo.
- **US1**: `T010`, `T011` e `T012` em paralelo; depois `T015` e `T016` em paralelo.
- **US4**: `T020` e `T021` em paralelo.
- **US5**: `T024` e `T025` em paralelo; `T027` e `T028` em paralelo.

## Implementation Strategy

1. **MVP Funcional (Phases 1 a 5 — US2 + US1 + US3)**: Catálogo + prescrição determinística + API `/api/routines` + estado isolado `useActiveRoutine` + execução guiada em `/treinos/rotina/[category]`.
2. **Descoberta e Hábito Diário (Phase 6 — US4)**: Seção `Rotinas do Dia` na Home + sub-aba `Rotinas` em `/treinos` + ajuste instantâneo de preferências.
3. **Sinergia Completa e Mocks (Phases 7 e 8 — US5 + Polish)**: Dispensa de volta à calma duplicada no treino da noite, alerta de cardio em dia de pernas, análise de ciclo e suporte completo ao modo mock.
