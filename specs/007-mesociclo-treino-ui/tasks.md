# Tasks: Visibilidade do Mesociclo na Home

**Input**: Design documents from `/specs/007-mesociclo-treino-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅
**Depende de**: `006-mesociclo-treino-backend` (tipos `AdjustedWorkoutPlanView`/`UpcomingSessionSummary`/`AdjustedSession` em `@helux/types` e o novo formato de `GET /workout/latest-plan`)

**TDD**: A constituição exige TDD obrigatório. Testes DEVEM ser escritos e falhar antes de cada implementação.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirmar que os tipos de `006-mesociclo-treino-backend` estão disponíveis — nenhuma dependência nova é necessária nesta spec.

- [X] T001 Confirmar que `AdjustedWorkoutPlanView`, `UpcomingSessionSummary` e `AdjustedSession` estão exportados por `@helux/types` (`pnpm --filter @helux/types build` se necessário); os componentes desta spec podem ser desenvolvidos com props mockadas (`contracts/ui-contracts.md`) mesmo antes do endpoint real estar pronto

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Atualizar o hook e o serviço que alimentam `HomeClient.tsx` para o novo formato de resposta — bloqueia a integração final de todas as user stories (os componentes isolados não dependem disso, só a integração).

**⚠️ CRÍTICO**: A integração em `HomeClient.tsx` de qualquer user story não pode começar sem esta fase. Desenvolvimento isolado de componente (com props mockadas) pode acontecer em paralelo.

- [X] T002 [P] Atualizar teste em `apps/web/src/__tests__/services/workout.service.test.ts`: `getLatestPlan()` retorna `AdjustedWorkoutPlanView` (`today`/`upcoming`/`progress`) em vez do `NextWorkoutPlan` antigo — **confirmar FAIL**
- [X] T003 [P] Atualizar teste em `apps/web/src/__tests__/hooks/useWorkoutPlan.test.ts`: hook expõe `plan` tipado como `AdjustedWorkoutPlanView | null` — **confirmar FAIL**
- [X] T004 Rodar `pnpm --filter @helux/web test` — confirmar que os testes atualizados falham (RED)
- [X] T005 Atualizar `apps/web/src/services/workout.service.ts`: `getLatestPlan()` tipado como `Promise<AdjustedWorkoutPlanView | null>`
- [X] T006 Atualizar `apps/web/src/hooks/useWorkoutPlan.ts`: estado `plan` tipado como `AdjustedWorkoutPlanView | null`; cache local (`localStorage`) mantido com o novo shape
- [X] T007 Rodar `pnpm --filter @helux/web test` — confirmar que os testes passam (GREEN)

**Nota descoberta durante a implementação**: `useWorkoutPlan` tinha um segundo consumidor não mapeado no plano — `apps/web/src/app/treinos/TreinosClient.tsx` (rota `/treinos`). Foi ajustado para ler `plan.today` em vez do formato antigo, e o botão manual "Gerar Novo Plano" (`generatePlan`, fora de escopo) passou a ter seu resultado envolvido num `AdjustedWorkoutPlanView` mínimo (`mesocycleId: null`, sem `upcoming`/`progress`) para continuar compilando e funcionando — documentado inline no hook como o mesmo gap de `006-mesociclo-treino-backend`.

**Checkpoint**: Hook e serviço prontos para o novo formato — a integração final de qualquer user story pode começar.

---

## Phase 3: User Story 1 — Ver o treino de hoje e saber se foi ajustado por recovery (Priority: P1) 🎯 MVP

**Goal**: Badge visível no card de hoje quando `today.adjusted === true`; e tratamento claro do estado em que não há sessão de hoje (mesociclo ainda não gerado ou em transição).

**Independent Test**: Renderizar `RecoveryAdjustedBadge` isoladamente com e sem `reason` e confirmar a presença/ausência do badge; renderizar `HomeClient` com `plan.today: null` e confirmar que uma mensagem de estado aparece em vez de um card quebrado.

### TDD — Testes para User Story 1 (escrever e confirmar FAIL antes de implementar)

- [X] T008 [P] [US1] Escrever teste em `apps/web/src/__tests__/components/workout/RecoveryAdjustedBadge.test.tsx`: retorna `null` (nada renderizado) quando `reason` é `undefined` — **confirmar FAIL**
- [X] T009 [P] [US1] Escrever teste em `apps/web/src/__tests__/components/workout/RecoveryAdjustedBadge.test.tsx`: renderiza um `Chip` com ícone `bolt` e texto quando `reason` está presente — **confirmar FAIL**
- [X] T010 [US1] Rodar `pnpm --filter @helux/web test -- RecoveryAdjustedBadge` — confirmar que os testes falham (RED)

### Implementação — User Story 1

- [X] T011 [P] [US1] Criar `apps/web/src/components/workout/RecoveryAdjustedBadge.tsx` (`Chip` `accent` + `Icon name="bolt"`), conforme `contracts/ui-contracts.md`
- [X] T012 [US1] Rodar `pnpm --filter @helux/web test -- RecoveryAdjustedBadge` — confirmar que os testes passam (GREEN)
- [X] T013 [US1] Modificar `apps/web/src/app/HomeClient.tsx`: consumir `plan.today` (novo shape) no card de hoje; renderizar `RecoveryAdjustedBadge` com `reason={plan.today.adjustmentReason}` quando `plan.today.adjusted`
- [X] T014 [US1] Modificar `apps/web/src/app/HomeClient.tsx`: quando `plan.today === null`, exibir mensagem de estado diferenciando `status === 'generating'` ("Preparando seu próximo ciclo…") de primeiro uso ("Nenhum plano gerado ainda"), reaproveitando o card vazio já existente
- [ ] T015 [US1] Verificar manualmente no navegador (`pnpm --filter @helux/web dev`) os três estados: com ajuste, sem ajuste, sem `today` — **bloqueado neste ambiente**: exige login Supabase real + `apps/api` rodando contra um banco com dados; cobertura automatizada (T008-T009, RTL) já exercita os três estados dos componentes isoladamente

**Checkpoint**: User Story 1 funcional e testável independentemente — o treino de hoje comunica corretamente se foi ajustado, e o estado vazio nunca aparece quebrado.

---

## Phase 4: User Story 2 — Ver os próximos treinos do mesociclo (Priority: P1)

**Goal**: Lista/carrossel dos próximos treinos do ciclo atual, sem datas, abaixo do card de hoje.

**Independent Test**: Renderizar `UpcomingSessionsList` isoladamente com um array de sessões e confirmar a ordem e o texto de cada item; confirmar que nenhum texto de data aparece.

### TDD — Testes para User Story 2 (escrever e confirmar FAIL antes de implementar)

- [ ] T016 [P] [US2] Escrever teste em `apps/web/src/__tests__/components/workout/UpcomingSessionsList.test.tsx`: retorna `null` quando `sessions` está vazio — **confirmar FAIL**
- [ ] T017 [P] [US2] Escrever teste em `apps/web/src/__tests__/components/workout/UpcomingSessionsList.test.tsx`: renderiza um `Chip` por sessão com o texto `"Treino {letter} — {focus}"`, na ordem do array — **confirmar FAIL**
- [ ] T018 [US2] Rodar `pnpm --filter @helux/web test -- UpcomingSessionsList` — confirmar que os testes falham (RED)

### Implementação — User Story 2

- [ ] T019 [US2] Criar `apps/web/src/components/workout/UpcomingSessionsList.tsx` (lista horizontal, `overflow-x: auto` contido, sem scroll horizontal na página), conforme `contracts/ui-contracts.md`
- [ ] T020 [US2] Rodar `pnpm --filter @helux/web test -- UpcomingSessionsList` — confirmar que os testes passam (GREEN)
- [ ] T021 [US2] Modificar `apps/web/src/app/HomeClient.tsx`: renderizar `UpcomingSessionsList` com `plan.upcoming` abaixo do card de hoje, quando `plan.upcoming.length > 0`
- [ ] T022 [US2] Verificar manualmente em viewport de iPhone que a lista rola horizontalmente sem afetar o scroll vertical da página

**Checkpoint**: User Stories 1 e 2 funcionais — usuário vê hoje + próximos treinos.

---

## Phase 5: User Story 3 — Ver o progresso dentro do mesociclo (Priority: P2)

**Goal**: Indicador "N de M treinos concluídos" visível na home.

**Independent Test**: Renderizar `MesocycleProgress` isoladamente com `completed`/`total` variados e confirmar que o número de dots preenchidos e o texto acessível estão corretos.

### TDD — Testes para User Story 3 (escrever e confirmar FAIL antes de implementar)

- [ ] T023 [P] [US3] Escrever teste em `apps/web/src/__tests__/components/workout/MesocycleProgress.test.tsx`: renderiza `total` dots, com os primeiros `completed` no estado preenchido — **confirmar FAIL**
- [ ] T024 [P] [US3] Escrever teste em `apps/web/src/__tests__/components/workout/MesocycleProgress.test.tsx`: renderiza o texto `"{completed} de {total} treinos concluídos"` — **confirmar FAIL**
- [ ] T025 [US3] Rodar `pnpm --filter @helux/web test -- MesocycleProgress` — confirmar que os testes falham (RED)

### Implementação — User Story 3

- [ ] T026 [US3] Criar `apps/web/src/components/workout/MesocycleProgress.tsx`, extraindo o padrão visual de "dots" já usado inline no card "Semana" de `HomeClient.tsx`
- [ ] T027 [US3] Rodar `pnpm --filter @helux/web test -- MesocycleProgress` — confirmar que os testes passam (GREEN)
- [ ] T028 [US3] Modificar `apps/web/src/app/HomeClient.tsx`: renderizar `MesocycleProgress` com `plan.progress.completed`/`plan.progress.total` quando `plan.progress !== null`

**Checkpoint**: Todas as user stories funcionais — home completa com hoje, próximos treinos e progresso do ciclo.

---

## Phase 6: Polish & Validação Final

**Purpose**: Garantir que toda a pipeline do monorepo está limpa e o fluxo manual funciona de ponta a ponta.

- [ ] T029 [P] Rodar `pnpm typecheck --filter @helux/web` — confirmar 0 erros
- [ ] T030 Rodar `pnpm test --filter @helux/web` — confirmar que todos os testes passam
- [ ] T031 Seguir o fluxo manual de `quickstart.md` de ponta a ponta (badge de ajuste, lista de próximos treinos sem datas, estado de transição, progresso, viewport iPhone)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da Phase 1 — **bloqueia a integração em `HomeClient.tsx` de todas as user stories** (desenvolvimento isolado de componente pode acontecer em paralelo, usando `contracts/ui-contracts.md`)
- **US1 (Phase 3)**: Componente (`RecoveryAdjustedBadge`) pode ser construído em paralelo com a Phase 2; integração em `HomeClient.tsx` depende da Phase 2
- **US2 (Phase 4)**: Mesmo padrão de US1 — componente independente, integração depende da Phase 2
- **US3 (Phase 5)**: Mesmo padrão — componente independente, integração depende da Phase 2
- **Polish (Phase 6)**: Depende de US1 + US2 + US3 completas

### User Story Dependencies

- **US1 (P1)**: Independente das outras stories — só compõe `Chip`/`Icon`
- **US2 (P1)**: Independente — nenhuma dependência de US1/US3
- **US3 (P2)**: Independente — nenhuma dependência de US1/US2

Os três componentes são visualmente compostos na mesma tela (`HomeClient.tsx`), mas não dependem uns dos outros em código — cada `Modificar HomeClient.tsx` (T013/T014, T021, T028) é um ponto de integração aditivo, sem conflito de lógica entre si (podem gerar conflito textual de merge se feitos em paralelo no mesmo arquivo — ver Notes).

### Dentro de Cada User Story (ordem obrigatória)

```
Testes (RED) → Implementação do componente (GREEN) → Integração em HomeClient.tsx → Verificação manual
```

### Parallel Opportunities

```bash
# Phase 2 — testes em paralelo:
T002 (workout.service.test.ts) | T003 (useWorkoutPlan.test.ts)

# Componentes das 3 user stories podem ser desenvolvidos em paralelo entre si
# (arquivos diferentes, props mockadas conforme contracts/ui-contracts.md):
T008-T009 (RecoveryAdjustedBadge) | T016-T017 (UpcomingSessionsList) | T023-T024 (MesocycleProgress)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Concluir Phase 1: Setup
2. Concluir Phase 2: Foundational
3. Concluir Phase 3: User Story 1 — treino de hoje com badge de ajuste + estado vazio tratado
4. **PARAR e VALIDAR**: `pnpm test --filter @helux/web`, verificar manualmente os três estados do card de hoje
5. MVP entregue — já resolve o risco principal (estado vazio nunca quebrado) e o valor mais visível (saber se o treino foi ajustado)

### Incremental Delivery

1. Setup + Foundational → hook/serviço prontos para o novo formato
2. US1 → badge de ajuste + estado vazio ✅ (MVP)
3. US2 → lista de próximos treinos ✅
4. US3 → indicador de progresso ✅ (completo)

---

## Notes

- `[P]` = arquivos diferentes, sem dependências pendentes — podem rodar em paralelo
- `[USN]` = rastreabilidade com a user story de `spec.md`
- TDD obrigatório: RED antes de GREEN, sempre
- As três tarefas de integração em `HomeClient.tsx` (T013/T014, T021, T028) tocam o mesmo arquivo — se forem trabalhadas em paralelo por pessoas/agentes diferentes, façam sequencialmente ou resolvam conflito de merge manualmente; o desenvolvimento dos componentes em si (Phases 3-5, seção de testes/implementação) é totalmente paralelizável
- Esta spec não pode ser validada de ponta a ponta (T031) sem `006-mesociclo-treino-backend` implementada e rodando — até lá, valide com os testes de componente isolados (mocks) e `pnpm typecheck`
- Commit após cada fase ou grupo lógico de tarefas concluídas
