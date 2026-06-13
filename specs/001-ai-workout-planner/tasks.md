# Tasks: Geração de Plano de Treino por IA

**Input**: Design documents from `/specs/001-ai-workout-planner/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**TDD**: A constituição exige TDD obrigatório. Testes DEVEM ser escritos e falhar antes de cada implementação.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2)

---

## Phase 1: Setup (Infraestrutura do Package)

**Purpose**: Criar a estrutura do `packages/ai` e instalar dependências.

- [X] T001 Criar `packages/ai/package.json` com nome `@helux/ai`, dep `@anthropic-ai/sdk` e `@helux/types`, devDep `vitest`
- [X] T002 [P] Criar `packages/ai/tsconfig.json` estendendo `../../tsconfig.base.json` com `rootDir: src, noEmit: true`
- [X] T003 [P] Criar `packages/ai/vitest.config.ts` com `globals: true`
- [X] T004 Adicionar `@helux/ai: workspace:*` às dependencies de `apps/api/package.json`
- [X] T005 Executar `pnpm install` na raiz para resolver o novo workspace

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Garantir que o diretório de dados existe e está protegido no gitignore.

**⚠️ CRÍTICO**: Nenhuma tarefa das user stories pode começar sem esta fase.

- [X] T006 Verificar que `data/workouts/` existe e que `.gitignore` contém `data/workouts/latest-plan.json` — adicionar se ausente
- [X] T007 Criar `packages/ai/src/__tests__/planner.test.ts` vazio (será preenchido nas fases seguintes — apenas garante que o runner detecta o arquivo)

**Checkpoint**: Package criado, deps instaladas, diretório de dados pronto.

---

## Phase 3: User Story 1 — Gerar Plano de Treino (Priority: P1) 🎯 MVP

**Goal**: `generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan>` funcional com chamada real ao Claude API, persistência do plano e endpoint `POST /workout/generate`.

**Independent Test**:
```bash
# Requer ANTHROPIC_API_KEY real ou mock configurado
curl -X POST http://localhost:3001/workout/generate \
  -H "Content-Type: application/json" \
  -d '{"geneticProfile":{...},"constraints":{...},"workoutHistory":[],"recoveryData":[],"userGoals":"ganhar massa","userLevel":"intermediario","availableDaysPerWeek":4}'
# Esperado: 200 com NextWorkoutPlan (generatedAt, exercises, rationale)
```

### TDD — Testes para User Story 1 (escrever e confirmar FAIL antes de implementar)

- [X] T008 [US1] Escrever teste em `packages/ai/src/__tests__/planner.test.ts`: `generateWorkoutPlan()` com SDK mockado via `vi.mock('@anthropic-ai/sdk')` retorna `NextWorkoutPlan` com `generatedAt`, `exercises` e `rationale` — **confirmar FAIL**
- [X] T009 [P] [US1] Escrever teste em `packages/ai/src/__tests__/planner.test.ts`: system prompt contém `GeneticProfile` e `WorkoutConstraints` serializados — **confirmar FAIL**
- [X] T010 [P] [US1] Escrever teste em `packages/ai/src/__tests__/planner.test.ts`: user prompt contém `workoutHistory`, `recoveryData` e `userGoals` — **confirmar FAIL**
- [X] T011 [P] [US1] Escrever teste em `packages/ai/src/__tests__/planner.test.ts`: lança erro descritivo quando `ANTHROPIC_API_KEY` ausente (`AuthenticationError` mockado) — **confirmar FAIL**
- [X] T012 [US1] Escrever teste em `packages/ai/src/__tests__/planner.test.ts`: `generateWorkoutPlan()` escreve `NextWorkoutPlan` em `data/workouts/latest-plan.json` após geração — **confirmar FAIL**
- [X] T013 [P] [US1] Escrever teste em `apps/api/src/__tests__/workout-generate.test.ts`: `POST /workout/generate` retorna 200 com `NextWorkoutPlan` (mock `@helux/ai`) — **confirmar FAIL**
- [X] T014 [P] [US1] Escrever teste em `apps/api/src/__tests__/workout-generate.test.ts`: `POST /workout/generate` retorna 500 com `error` quando `generateWorkoutPlan` lança `AuthenticationError` — **confirmar FAIL**
- [X] T015 [US1] Rodar `pnpm test --filter @helux/ai` e `pnpm test --filter @helux/api` — confirmar que todos os novos testes falham (RED)

### Implementação — User Story 1

- [X] T016 [P] [US1] Criar `packages/ai/src/prompts.ts` com `buildSystemPrompt(profile: GeneticProfile, constraints: WorkoutConstraints): string` — system prompt em português com perfil serializado e instruções de output JSON
- [X] T017 [P] [US1] Criar `packages/ai/src/prompts.ts` (continua): `buildUserPrompt(history: WorkoutSession[], recovery: RecoveryData[], goals: string, level: string, days: number): string` — contexto variável por chamada
- [X] T018 [US1] Criar `packages/ai/src/planner.ts` com `generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan>` usando `@anthropic-ai/sdk`: sistema cacheado (`cache_control: {type: "ephemeral"}`), user message variável, parse do JSON retornado, escrita em `data/workouts/latest-plan.json`
- [X] T019 [US1] Criar `packages/ai/src/index.ts` exportando `generateWorkoutPlan` e tipos auxiliares
- [X] T020 [US1] Rodar `pnpm test --filter @helux/ai` — confirmar todos os testes do package passam (GREEN)
- [X] T021 [US1] Criar `apps/api/src/routes/workout-generate.ts` com `POST /workout/generate`: lê body como `PlanInput`, chama `generateWorkoutPlan()`, retorna plano; captura `Anthropic.AuthenticationError` → 500
- [X] T022 [US1] Registrar `workoutGenerateRoutes` em `apps/api/src/app.ts`
- [X] T023 [US1] Rodar `pnpm test --filter @helux/api` — confirmar todos os testes passam (GREEN)

**Checkpoint**: `POST /workout/generate` funcional e testado. MVP entregue.

---

## Phase 4: User Story 2 — Consultar Último Plano (Priority: P2)

**Goal**: `GET /workout/latest-plan` retorna o último `NextWorkoutPlan` persistido ou 404 se ainda não gerado.

**Independent Test**:
```bash
# Antes de gerar qualquer plano:
curl http://localhost:3001/workout/latest-plan
# Esperado: 404 com {"error": "Nenhum plano gerado ainda..."}

# Após POST /workout/generate:
curl http://localhost:3001/workout/latest-plan
# Esperado: 200 com NextWorkoutPlan (generatedAt, exercises, rationale)
```

### TDD — Testes para User Story 2 (escrever e confirmar FAIL antes de implementar)

- [X] T024 [US2] Escrever teste em `apps/api/src/__tests__/workout-latest-plan.test.ts`: `GET /workout/latest-plan` retorna 200 com `NextWorkoutPlan` quando `data/workouts/latest-plan.json` existe (mock `fs`) — **confirmar FAIL**
- [X] T025 [US2] Escrever teste em `apps/api/src/__tests__/workout-latest-plan.test.ts`: `GET /workout/latest-plan` retorna 404 com `error` quando arquivo não existe — **confirmar FAIL**
- [X] T026 [US2] Rodar `pnpm test --filter @helux/api` — confirmar novos testes falham (RED)

### Implementação — User Story 2

- [X] T027 [US2] Criar `apps/api/src/routes/workout-latest-plan.ts` com `GET /workout/latest-plan`: verifica existência de `data/workouts/latest-plan.json`, lê e retorna JSON parseado; 404 se ausente
- [X] T028 [US2] Registrar `workoutLatestPlanRoutes` em `apps/api/src/app.ts`
- [X] T029 [US2] Rodar `pnpm test --filter @helux/api` — confirmar todos os testes passam (GREEN)

**Checkpoint**: US1 + US2 funcionais. Todos os endpoints do plano entregues.

---

## Phase 5: Polish & Validação Final

**Purpose**: Garantir que toda a pipeline Turborepo está limpa.

- [X] T030 [P] Rodar `pnpm typecheck` na raiz — confirmar 0 erros em todos os workspaces (`@helux/types`, `@helux/genetics`, `@helux/ai`, `@helux/api`)
- [X] T031 Rodar `pnpm test` na raiz — confirmar todos os testes passam (tipos 5, genetics 22, ai 5, api 9)
- [ ] T032 Verificar `usage.cache_creation_input_tokens > 0` numa chamada real (com `ANTHROPIC_API_KEY` real) para confirmar que o system prompt atingiu o mínimo de 2048 tokens para caching no `sonnet-4-6`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão da Phase 1
- **US1 (Phase 3)**: Depende da Phase 2 — **bloqueada até Foundational estar completa**
- **US2 (Phase 4)**: Depende da Phase 2 — **pode rodar em paralelo com US1 após Phase 2**
- **Polish (Phase 5)**: Depende de US1 + US2 completas

### User Story Dependencies

- **US1 (P1)**: Independente — nenhuma dependência de US2
- **US2 (P2)**: Independente — lê arquivo que US1 escreve, mas o teste usa mock de `fs`

### Dentro de Cada User Story (ordem obrigatória)

```
Testes (RED) → Implementação (GREEN) → Verificar testes passam → Próximo grupo
```

### Parallel Opportunities

```bash
# Phase 1 — todos em paralelo:
T001 (package.json) | T002 (tsconfig.json) | T003 (vitest.config.ts)

# Phase 3 — testes em paralelo (todos diferentes arquivos):
T008 (test: output shape) | T009 (test: system prompt) | T010 (test: user prompt) | T011 (test: auth error)

# Phase 3 — implementação em paralelo após T015:
T016+T017 (prompts.ts) | [aguardar] → T018 (planner.ts) → T019 (index.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1: Setup
2. Concluir Phase 2: Foundational
3. Concluir Phase 3: User Story 1 (TDD completo)
4. **PARAR e VALIDAR**: `pnpm test`, testar `POST /workout/generate` com API key real
5. MVP entregue — geração de plano funcionando

### Incremental Delivery

1. Setup + Foundational → Package pronto
2. User Story 1 → Geração de plano com IA ✅ (MVP)
3. User Story 2 → Consulta do último plano ✅ (completo)

---

## Notes

- `[P]` = arquivos diferentes, sem dependências pendentes — podem rodar em paralelo
- `[USN]` = rastreabilidade com a user story da spec.md
- TDD obrigatório: RED antes de GREEN, sempre
- Verificar `cache_creation_input_tokens > 0` para validar que caching está ativo (T032)
- Commit após cada fase ou grupo lógico de tarefas concluídas
