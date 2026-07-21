# Tasks: Geração de Mesociclo de Treino com Ajuste por Recovery

**Input**: Design documents from `/specs/006-mesociclo-treino-backend/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**TDD**: A constituição exige TDD obrigatório. Testes DEVEM ser escritos e falhar antes de cada implementação.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Criar o schema novo no banco.

- [ ] T001 Criar `supabase/migrations/20260722000000_create_mesocycle_plans.sql` com a tabela `mesocycle_plans` (`id`, `user_id`, `generated_at`, `days_per_week`, `split_type`, `sessions` JSONB, `rationale`, `created_at`), RLS (`auth.uid() = user_id`) e índice `(user_id, created_at DESC)` — conforme `data-model.md`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Tipos compartilhados e schema aplicado — bloqueiam todas as user stories.

**⚠️ CRÍTICO**: Nenhuma tarefa das user stories pode começar sem esta fase.

- [ ] T002 [P] Escrever teste em `packages/types/src/__tests__/types.test.ts` (novo `describe('MesocyclePlan')`): aceita `sessions` com `completed_at: null` e com `completed_at` preenchido — **confirmar FAIL**
- [ ] T003 [P] Escrever teste em `packages/types/src/__tests__/types.test.ts` (novo `describe('AdjustedWorkoutPlanView')`): aceita `today` presente e `today: null` com `status: 'generating'`, e `upcoming` como array de `{letter, focus}` — **confirmar FAIL**
- [ ] T004 Rodar `pnpm test --filter @helux/types` — confirmar que os novos testes falham (RED)
- [ ] T005 Criar `packages/types/src/mesocycle.ts` com `MesocycleSession`, `MesocyclePlan`, `AdjustedSession`, `UpcomingSessionSummary`, `AdjustedWorkoutPlanView` conforme `data-model.md` e `contracts/api.md`
- [ ] T006 Exportar os novos tipos em `packages/types/src/index.ts`
- [ ] T007 Rodar `pnpm test --filter @helux/types` — confirmar que todos os testes passam (GREEN)
- [ ] T008 Aplicar a migração localmente (`supabase migration up`) e confirmar que a tabela `mesocycle_plans` foi criada

**Checkpoint**: Tipos e schema prontos — user stories podem começar.

---

## Phase 3: User Story 1 — Gerar um mesociclo completo de treino (Priority: P1) 🎯 MVP

**Goal**: `generateMesocyclePlan(input: PlanInput): Promise<MesocyclePlan>` funcional, retornando o ciclo completo (todas as sessões da divisão muscular aplicável) numa única chamada à IA.

**Independent Test**:
```ts
// packages/ai/src/__tests__/mesocycle-planner.test.ts, com SDK mockado
const plan = await generateMesocyclePlan(planInputComDias4)
expect(plan.sessions.length).toBe(4) // ABCD
expect(plan.sessions.every(s => s.completed_at === null)).toBe(true)
```

### TDD — Testes para User Story 1 (escrever e confirmar FAIL antes de implementar)

- [ ] T009 [P] [US1] Escrever teste em `packages/ai/src/__tests__/mesocycle-planner.test.ts`: `generateMesocyclePlan()` com SDK mockado retorna `MesocyclePlan` com `sessions.length` igual ao número de dias/semana da divisão esperada (ex.: 4 dias → 4 sessões ABCD) — **confirmar FAIL**
- [ ] T010 [P] [US1] Escrever teste em `packages/ai/src/__tests__/mesocycle-planner.test.ts`: cada sessão retornada tem `completed_at: null` e `letter`/`focus` preenchidos — **confirmar FAIL**
- [ ] T011 [P] [US1] Escrever teste em `packages/ai/src/__tests__/mesocycle-planner.test.ts`: o system prompt (`buildMesocycleSystemPrompt`) reaproveita o catálogo de exercícios e as restrições de treino já usados em `prompts.ts`, e pede explicitamente o ciclo inteiro — **confirmar FAIL**
- [ ] T012 [P] [US1] Escrever teste em `packages/ai/src/__tests__/mesocycle-planner.test.ts`: lança erro descritivo quando `ANTHROPIC_API_KEY` ausente (mesmo padrão de `planner.test.ts`) — **confirmar FAIL**
- [ ] T013 [US1] Rodar `pnpm test --filter @helux/ai` — confirmar que os novos testes falham (RED)

### Implementação — User Story 1

- [ ] T014 [P] [US1] Criar `packages/ai/src/mesocycle-prompts.ts` com `buildMesocycleSystemPrompt(profile, constraints)` e `buildMesocycleUserPrompt(history, recovery, goals, level, daysPerWeek, checkins?)` — adapta `prompts.ts` para pedir um array de sessões cobrindo o ciclo completo, mantendo a mesma metodologia de periodização (divisão A/B/C/D, catálogo de exercícios, regras de progressão)
- [ ] T015 [US1] Criar `packages/ai/src/mesocycle-planner.ts` com `generateMesocyclePlan(input: PlanInput): Promise<MesocyclePlan>` (1 chamada Claude, mesmo padrão de cache do `planner.ts`, parse do array de sessões, `completed_at: null` em todas)
- [ ] T016 [US1] Exportar `generateMesocyclePlan` em `packages/ai/src/index.ts`
- [ ] T017 [US1] Rodar `pnpm test --filter @helux/ai` — confirmar que todos os testes passam (GREEN)

**Checkpoint**: `generateMesocyclePlan` funcional e testado isoladamente (sem integração com API ainda).

---

## Phase 4: User Story 2 — Consultar o treino do dia ajustado pelo recovery (Priority: P1)

**Goal**: `GET /workout/latest-plan` retorna a sessão pendente atual já ajustada por recovery, mais a lista de próximos treinos e o progresso do ciclo — sem chamada de IA. Inclui o bootstrap: quando o usuário nunca teve nenhum mesociclo gerado, o endpoint dispara a primeira geração automaticamente (fecha a lacuna do fluxo de primeiro uso, que hoje dependia do botão manual fora de escopo — ver `plan.md`).

**Independent Test**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/workout/latest-plan
# Com mesociclo ativo e sessão pendente: 200 com {today, upcoming, progress}
# Sem nenhum mesociclo: 200 com {today: null, status: "generating"} e geração disparada em background
```

### TDD — Testes para User Story 2 (escrever e confirmar FAIL antes de implementar)

- [ ] T018 [P] [US2] Escrever teste em `packages/ai/src/__tests__/recovery-adjustment.test.ts`: HRV ≥60 → sessão retornada sem alteração, `adjusted: false` — **confirmar FAIL**
- [ ] T019 [P] [US2] Escrever teste em `packages/ai/src/__tests__/recovery-adjustment.test.ts`: HRV 40–59 → reduz 1 série por exercício composto (mínimo 2), `adjusted: true` — **confirmar FAIL**
- [ ] T020 [P] [US2] Escrever teste em `packages/ai/src/__tests__/recovery-adjustment.test.ts`: HRV <40 → reduz série (mínimo 2) e adiciona nota de redução de carga, `adjusted: true` — **confirmar FAIL**
- [ ] T021 [P] [US2] Escrever teste em `packages/ai/src/__tests__/recovery-adjustment.test.ts`: sem dado de HRV disponível → sessão original sem alteração, `adjusted: false` — **confirmar FAIL**
- [ ] T022 [P] [US2] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `getActiveMesocycle` retorna `null` quando o usuário não tem nenhum `mesocycle_plans` (mock Supabase) — **confirmar FAIL**
- [ ] T023 [P] [US2] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `findPendingSession` retorna a primeira sessão do array sem `completed_at` — **confirmar FAIL**
- [ ] T024 [P] [US2] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `findPendingSession` retorna `null` quando todas as sessões têm `completed_at` — **confirmar FAIL**
- [ ] T025 [P] [US2] Escrever teste em `apps/api/src/__tests__/workout-latest-plan.test.ts`: retorna 200 com `today` ajustado, `upcoming` e `progress` quando há mesociclo ativo com sessão pendente — **confirmar FAIL**
- [ ] T026 [P] [US2] Escrever teste em `apps/api/src/__tests__/workout-latest-plan.test.ts`: quando o usuário não tem nenhum `mesocycle_plans`, retorna `{today: null, status: 'generating'}` **e** dispara `generateMesocyclePlan` em background (mock) — **confirmar FAIL**
- [ ] T027 [P] [US2] Escrever teste em `apps/api/src/__tests__/workout-latest-plan.test.ts`: quando o mesociclo ativo existe mas está 100% completo, retorna `{today: null, status: 'generating'}` **sem** disparar nova geração (a geração já foi disparada pelo write-path da US3) — **confirmar FAIL**
- [ ] T028 [US2] Rodar `pnpm test --filter @helux/ai` e `pnpm test --filter @helux/api` — confirmar que os novos testes falham (RED)

### Implementação — User Story 2

- [ ] T029 [P] [US2] Criar `packages/ai/src/recovery-adjustment.ts` com `applyRecoveryAdjustment(session: MesocycleSession, recovery: RecoveryData[]): AdjustedSession`, reaproveitando os limiares de HRV (`>=60`/`40-59`/`<40`) já usados em `prompts.ts`
- [ ] T030 [US2] Exportar `applyRecoveryAdjustment` em `packages/ai/src/index.ts`
- [ ] T031 [P] [US2] Criar `apps/api/src/services/mesocycle.service.ts` com `getActiveMesocycle(userId, supabase)` e `findPendingSession(sessions)`
- [ ] T032 [US2] Reescrever `apps/api/src/routes/workout-latest-plan.ts`: busca o mesociclo ativo via `getActiveMesocycle`; se não existir nenhum, dispara `generateMesocyclePlan` fire-and-forget (bootstrap) e retorna `status: 'generating'`; se existir, deriva `findPendingSession`, aplica `applyRecoveryAdjustment` quando há sessão pendente, monta `upcoming`/`progress`, ou retorna `status: 'generating'` sem novo disparo quando não há sessão pendente
- [ ] T033 [US2] Rodar `pnpm test --filter @helux/ai` e `pnpm test --filter @helux/api` — confirmar que todos os testes passam (GREEN)

**Checkpoint**: Leitura do treino do dia com ajuste por recovery funcional, incluindo bootstrap do primeiro mesociclo — testável mesmo antes da US3 (usando dados mockados com sessões já marcadas como concluídas).

---

## Phase 5: User Story 3 — Progressão do mesociclo por conclusão (Priority: P2)

**Goal**: Ao concluir uma sessão, marcar a sessão correspondente do mesociclo como concluída; só disparar a geração do próximo mesociclo quando todas as sessões do atual estiverem concluídas.

**Independent Test**:
```bash
# Completar todas as sessões de um mesociclo de 4 via POST /api/workouts/sessions (4x)
# Após a 4ª: um novo mesocycle_plans deve ser criado automaticamente (fire-and-forget)
# Entre a 1ª e a 4ª: nenhuma nova geração deve ser disparada
```

### TDD — Testes para User Story 3 (escrever e confirmar FAIL antes de implementar)

- [ ] T034 [P] [US3] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `markSessionCompleted` marca `completed_at` na sessão pendente atual do mesociclo ativo — **confirmar FAIL**
- [ ] T035 [P] [US3] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `markSessionCompleted` é idempotente — chamar duas vezes não sobrescreve o `completed_at` original — **confirmar FAIL**
- [ ] T036 [P] [US3] Escrever teste em `apps/api/src/__tests__/mesocycle.service.test.ts`: `isMesocycleComplete` retorna `true` só quando todas as sessões têm `completed_at` preenchido — **confirmar FAIL**
- [ ] T037 [P] [US3] Escrever teste em `apps/api/src/__tests__/plan-generation.service.test.ts`: `triggerBackgroundPlanGeneration` **não** chama `generateMesocyclePlan` quando ainda há sessão pendente após marcar a conclusão — **confirmar FAIL**
- [ ] T038 [P] [US3] Escrever teste em `apps/api/src/__tests__/plan-generation.service.test.ts`: `triggerBackgroundPlanGeneration` chama `generateMesocyclePlan` e insere em `mesocycle_plans` quando o ciclo acabou de ficar 100% completo — **confirmar FAIL**
- [ ] T039 [P] [US3] Estender teste em `apps/api/src/__tests__/workout-sessions.test.ts`: `POST /api/workouts/sessions` chama `markSessionCompleted` antes de avaliar regeneração — **confirmar FAIL**
- [ ] T040 [US3] Rodar `pnpm test --filter @helux/api` — confirmar que os novos testes falham (RED)

### Implementação — User Story 3

- [ ] T041 [US3] Adicionar `markSessionCompleted(mesocycleId, sessions, supabase)` e `isMesocycleComplete(sessions)` em `apps/api/src/services/mesocycle.service.ts`
- [ ] T042 [US3] Modificar `apps/api/src/services/plan-generation.service.ts`: `triggerBackgroundPlanGeneration` passa a chamar `generateMesocyclePlan` (não mais `generateWorkoutPlan`) e só insere um novo `mesocycle_plans` quando `isMesocycleComplete` for `true` após a marcação
- [ ] T043 [US3] Modificar `apps/api/src/routes/workout-sessions.ts`: após inserir a sessão em `workout_sessions`, chamar `markSessionCompleted` antes de `triggerBackgroundPlanGeneration`
- [ ] T044 [US3] Rodar `pnpm test --filter @helux/api` — confirmar que todos os testes passam (GREEN)

**Checkpoint**: Fluxo completo — geração, leitura ajustada, e progressão por conclusão — funcional de ponta a ponta.

---

## Phase 6: Polish & Validação Final

**Purpose**: Garantir que toda a pipeline do monorepo está limpa.

- [ ] T045 [P] Rodar `pnpm typecheck` na raiz — confirmar 0 erros em todos os workspaces afetados (`@helux/types`, `@helux/ai`, `@helux/api`)
- [ ] T046 Rodar `pnpm test` na raiz — confirmar que todos os testes passam
- [ ] T047 Seguir o fluxo manual de `quickstart.md` de ponta a ponta (bootstrap, ajuste por recovery em dois cenários, pular dias, completar o ciclo inteiro e confirmar regeneração automática)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da Phase 1 — **bloqueia todas as user stories**
- **US1 (Phase 3)**: Depende da Phase 2 — independente das outras stories
- **US2 (Phase 4)**: Depende da Phase 2 — pode ser testada com dados mockados de mesociclo mesmo antes da US3 estar pronta (não depende de US1 em runtime, só reaproveita os tipos)
- **US3 (Phase 5)**: Depende da Phase 2 e dos helpers de `mesocycle.service.ts` criados na US2 (`getActiveMesocycle`) — estende o mesmo arquivo
- **Polish (Phase 6)**: Depende de US1 + US2 + US3 completas

### User Story Dependencies

- **US1 (P1)**: Independente — só usa `packages/ai`, sem tocar em `apps/api`
- **US2 (P1)**: Usa os tipos da Foundational; testável com mocks mesmo sem US1/US3 implementadas em runtime
- **US3 (P2)**: Estende `apps/api/src/services/mesocycle.service.ts` (criado na US2) e chama `generateMesocyclePlan` (criado na US1) — única story com dependência real de implementação nas outras duas

### Dentro de Cada User Story (ordem obrigatória)

```
Testes (RED) → Implementação (GREEN) → Verificar testes passam → Próximo grupo
```

### Parallel Opportunities

```bash
# Phase 2 — testes de tipos em paralelo:
T002 (MesocyclePlan) | T003 (AdjustedWorkoutPlanView)

# Phase 3 (US1) — testes em paralelo:
T009 (sessions.length) | T010 (completed_at null) | T011 (system prompt) | T012 (auth error)

# Phase 4 (US2) — testes em paralelo (arquivos diferentes):
T018-T021 (recovery-adjustment.test.ts) | T022-T024 (mesocycle.service.test.ts) | T025-T027 (workout-latest-plan.test.ts)

# Phase 5 (US3) — testes em paralelo:
T034-T036 (mesocycle.service.test.ts) | T037-T038 (plan-generation.service.test.ts) | T039 (workout-sessions.test.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Concluir Phase 1: Setup
2. Concluir Phase 2: Foundational
3. Concluir Phase 3: User Story 1 (geração do mesociclo)
4. Concluir Phase 4: User Story 2 (leitura ajustada + bootstrap) — já entrega valor completo ao usuário (mesociclo gerado e visível, ajustado por recovery)
5. **PARAR e VALIDAR**: `pnpm test`, testar `GET /workout/latest-plan` de ponta a ponta com um mesociclo mockado no banco
6. MVP entregue — mesmo sem US3, o usuário já vê o mesociclo completo e o ajuste por recovery; só não avança automaticamente entre ciclos ainda

### Incremental Delivery

1. Setup + Foundational → tipos e schema prontos
2. US1 → `generateMesocyclePlan` funcional ✅
3. US2 → leitura ajustada + bootstrap ✅ (MVP utilizável)
4. US3 → progressão automática por conclusão ✅ (completo)

---

## Notes

- `[P]` = arquivos diferentes, sem dependências pendentes — podem rodar em paralelo
- `[USN]` = rastreabilidade com a user story de `spec.md`
- TDD obrigatório: RED antes de GREEN, sempre
- O bootstrap do primeiro mesociclo (T026, T032) fecha uma lacuna que antes dependia do botão manual "Gerar Novo Plano" (fora de escopo desta spec, ver `plan.md` → Complexity Tracking) — decisão tomada durante o detalhamento de tasks, não estava explícita no `plan.md` original
- Commit após cada fase ou grupo lógico de tarefas concluídas
