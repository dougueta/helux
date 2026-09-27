# Tasks: Motor de Geração de Treino 2.0

**Input**: Design documents from `specs/014-motor-treino-2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD obrigatório (constituição, princípio II) — em cada tarefa, escrever/atualizar o teste primeiro, vê-lo falhar e só então implementar.

**Organization**: por user story; cada story é entregável e testável sozinha.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 Confirmar `.specify/feature.json` apontando para `specs/014-motor-treino-2` e rodar a suíte de `packages/workouts` como linha de base (`pnpm --filter @helux/workouts test`)

---

## Phase 2: Foundational (bloqueia as stories)

- [ ] T002 Adicionar em `packages/types/src/workout.ts` os tipos `ExercisePhase`, `ProgressionAction`, `LoadProgression` e os campos opcionais `phase?`, `supersetGroup?`, `progression?` em `PlannedExercise`; adicionar `loadProgression?: LoadProgression[]` em `PlanInput` (`packages/types/src/plan.ts`); exportar via `packages/types/src/index.ts` (data-model.md)

---

## Phase 3: User Story 1 — Treino em 3 fases (Priority: P1) 🎯 MVP

**Goal**: plano com aquecimento/principal/volta à calma, gerado pela IA, normalizado, exibido e executado; histórico e cansaço só no principal.

**Independent Test**: mesociclo mockado com 3 fases → Treinos mostra 3 seções; treino ativo conclui aquecimento sem descanso; histórico salvo só com o principal; plano antigo continua funcionando.

- [ ] T003 [P] [US1] Testes + implementação de `exercisePhase`, `isMainExercise`, `groupByPhase` e `normalizeSessionExercises` (parte de fases: desconhecido→principal, ordem estável aquecimento→principal→volta-calma) em `packages/workouts/src/plan-structure.ts` com testes em `packages/workouts/src/__tests__/plan-structure.test.ts`; exportar em `packages/workouts/src/index.ts`
- [ ] T004 [US1] Ajuste de cansaço só no principal: testes em `packages/workouts/src/__tests__/tiredness.test.ts` e mudança em `adjustExercisesForLevel` (`packages/workouts/src/tiredness.ts`) — itens de aquecimento/volta-calma nunca mudam (FR-007)
- [ ] T005 [P] [US1] Prompt do mesociclo pede `phase` (aquecimento 2–4 itens livres, principal do catálogo, volta à calma 2–4 itens livres respeitando limite de cardio) em `packages/ai/src/mesocycle-prompts.ts`, com testes em `packages/ai/src/__tests__/mesocycle-prompts.test.ts` (contracts/llm-response.md)
- [ ] T006 [US1] Planner repassa `phase` e enriquece (cues/músculo/variantes) só itens do principal em `packages/ai/src/mesocycle-planner.ts`, testes em `packages/ai/src/__tests__/mesocycle-planner.test.ts`
- [ ] T007 [US1] `generateAndSaveMesocycle` normaliza as sessões (`normalizeSessionExercises`) antes do insert em `apps/api/src/services/plan-generation.service.ts`, teste em `apps/api/src/__tests__/plan-generation.service.test.ts`
- [ ] T008 [US1] `useActiveWorkout`: `getSkippedExercises` e payload de `finishWorkout` só com o principal (FR-006), testes em `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`, código em `apps/web/src/hooks/useActiveWorkout.ts`
- [ ] T009 [P] [US1] Componente `PlanExerciseList` (lista agrupada por fase com `SectionHeader` por fase quando houver mais de uma; plano só principal igual ao atual) em `apps/web/src/components/workout/PlanExerciseList.tsx` com testes em `apps/web/src/__tests__/components/workout/PlanExerciseList.test.tsx`; usar em `apps/web/src/app/treinos/TreinosClient.tsx` (FR-004)
- [ ] T010 [US1] Treino ativo: tag da fase (Aquecimento/Musculação/Volta à calma); itens fora do principal com linhas de um toque (sem kg/reps editáveis, sem descanso, sem card de variantes) em `apps/web/src/app/workout/page.tsx`, testes em `apps/web/src/__tests__/app/workout-page.test.tsx` (FR-005)
- [ ] T011 [US1] Home: destaque e contagem usam o principal e indicam "inclui aquecimento e volta à calma" em `apps/web/src/app/HomeClient.tsx`, com teste em `apps/web/src/__tests__/app/` (FR-023)

**Checkpoint**: US1 entregável (commit).

---

## Phase 4: User Story 2 — Biset (Priority: P2)

**Goal**: dois exercícios consecutivos do principal alternados sem descanso entre eles.

**Independent Test**: plano com biset → concluir série de A1 leva a A2 sem descanso; série de A2 inicia descanso e volta a A1.

- [ ] T012 [US2] Validação de biset em `normalizeSessionExercises` (exatamente 2 consecutivos do principal; senão remove `supersetGroup`) e `supersetPartnerIndex` em `packages/workouts/src/plan-structure.ts`, testes em `packages/workouts/src/__tests__/plan-structure.test.ts`
- [ ] T013 [P] [US2] `DEFAULT_REST_SECONDS`, `restSecondsAfterSet`, `nextStepAfterSet` em `packages/workouts/src/workout-flow.ts` com testes em `packages/workouts/src/__tests__/workout-flow.test.ts` (contracts/workout-flow.md; FR-011, FR-013)
- [ ] T014 [P] [US2] Prompt permite bisets (≤ 2 por sessão, pares adequados, mesmo nº de séries, `supersetGroup`) em `packages/ai/src/mesocycle-prompts.ts`; planner repassa `supersetGroup` em `packages/ai/src/mesocycle-planner.ts`; testes nos respectivos `__tests__`
- [ ] T015 [US2] Treino ativo usa `nextStepAfterSet` (descanso e navegação automática) e mostra "Biset · alterna com X" em `apps/web/src/app/workout/page.tsx`, testes em `apps/web/src/__tests__/app/workout-page.test.tsx`
- [ ] T016 [US2] `PlanExerciseList` marca os pares de biset em `apps/web/src/components/workout/PlanExerciseList.tsx`, testes em `apps/web/src/__tests__/components/workout/PlanExerciseList.test.tsx` (FR-012)

**Checkpoint**: US2 entregável (commit).

---

## Phase 5: User Story 3 — Progressão de carga (Priority: P2)

**Goal**: próximo mesociclo com cargas decididas por regra determinística a partir do desempenho e do esforço relatado.

**Independent Test**: histórico 3×10 @40 kg, faixa 8-10, moderado → próximo mesociclo com carga > 40 kg e motivo; 3×6 no limite → carga reduzida.

- [ ] T017 [P] [US3] `EFFORT_LEVELS`/`EFFORT_VALUE`/`effortBand`, `parseRepRange`, `parseKg`, `loadIncrement`, `decideProgression` em `packages/workouts/src/progression.ts` com testes em `packages/workouts/src/__tests__/progression.test.ts` (research R6/R7; FR-016, FR-017)
- [ ] T018 [US3] `computeMesocycleProgression({ previousSessions, history, userLevel })` (execução mais recente por nome; variante/pulado/sem carga → sem-dados) e `applyProgression(sessions, decisions)` (sobrescreve `weight` e grava `progression` só no principal) em `packages/workouts/src/progression.ts`, testes no mesmo arquivo de teste (FR-015, FR-018, FR-019)
- [ ] T019 [P] [US3] `EffortPicker` (Segmented de 4 níveis) em `apps/web/src/components/workout/EffortPicker.tsx` com teste em `apps/web/src/__tests__/components/workout/EffortPicker.test.tsx`
- [ ] T020 [US3] `useActiveWorkout`: `effortByExerciseIndex` (opcional no carregamento), `setEffort`, `effort` do payload = valor do nível ou 8, em `apps/web/src/hooks/useActiveWorkout.ts`, testes em `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts` (FR-014)
- [ ] T021 [US3] Treino ativo mostra `EffortPicker` no exercício do principal com ≥ 1 série concluída em `apps/web/src/app/workout/page.tsx`, teste em `apps/web/src/__tests__/app/workout-page.test.tsx`
- [ ] T022 [P] [US3] Seção "Progressão de carga calculada — OBRIGATÓRIO" no prompt do usuário quando `input.loadProgression` tiver decisões ≠ sem-dados, em `packages/ai/src/mesocycle-prompts.ts` / `packages/ai/src/mesocycle-planner.ts`, testes nos `__tests__` do pacote
- [ ] T023 [US3] `fetchSessionsSince(userId, supabase, sinceDate)` em `apps/api/src/services/plan-context.service.ts` (teste em `apps/api/src/__tests__/plan-context.service.test.ts`); `triggerBackgroundPlanGeneration` passa o mesociclo concluído a `generateAndSaveMesocycle`, que calcula decisões, envia em `loadProgression` e aplica `applyProgression` após normalizar, em `apps/api/src/services/plan-generation.service.ts` (teste em `apps/api/src/__tests__/plan-generation.service.test.ts`); bootstrap sem progressão (FR-020)
- [ ] T024 [US3] `PlanExerciseList` mostra delta de carga ("+2 kg"/"−4 kg") e o motivo da progressão em `apps/web/src/components/workout/PlanExerciseList.tsx`, testes correspondentes (FR-019)

**Checkpoint**: US3 entregável (commit).

---

## Phase 6: Polish & Cross-Cutting

- [ ] T025 Rodar guard do design system (`apps/web/src/__tests__/design-system-guard.test.ts`) e corrigir qualquer classe/cor fora do v2
- [ ] T026 Verificação final única: `pnpm test`, `pnpm typecheck`, `pnpm build`; registrar números no relatório
- [ ] T027 Atualizar `specs/014-motor-treino-2/quickstart.md` com observações finais e notas para a spec 015 (ponto de extensão `restSecondsAfterSet`)

---

## Dependencies & Execution Order

- T002 bloqueia tudo. US1 (T003–T011) antes de US2/US3 por tocarem os mesmos arquivos (plan-structure, workout page, PlanExerciseList).
- US2 depende de T003 (plan-structure) e T009/T010 (componentes). US3 depende de T002; seu núcleo puro (T017–T018) é independente de US1/US2.
- Dentro de cada story: testes → módulo puro → API/AI → web.

## Parallel Opportunities

- US1: T003, T005 e T009 em paralelo (arquivos diferentes).
- US2: T013 e T014 em paralelo.
- US3: T017, T019 e T022 em paralelo.

## Implementation Strategy

MVP = Phase 1–3 (US1). Depois US2 e US3, cada um com commit próprio e suíte direcionada verde. Suíte completa + typecheck + build uma única vez no fim (T026), por restrição de RAM.
