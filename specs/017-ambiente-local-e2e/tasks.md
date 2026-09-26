# Tasks: Ambiente Local Integrado e Verificação de Ponta a Ponta

**Input**: Design documents from `/specs/017-ambiente-local-e2e/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**TDD**: a constituição exige TDD. Os testes do harness e a suíte e2e são escritos antes e DEVEM falhar (RED) antes da implementação.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup

- [X] T001 Versionar `supabase/config.toml` (gerado por `supabase init` com CLI 2.118.0, `project_id = "helux"`, auth por e-mail com `enable_confirmations = false`, só valores locais) e `supabase/.gitignore` (`.branches`, `.temp`, `.env*`)
- [X] T002 Adicionar à raiz, em `package.json`, os scripts `db:start` (`pnpm dlx supabase@2.118.0 start -x <serviços não usados, ver research R6>`), `db:stop`, `db:status` (`... status -o env`) e `test:e2e` (`pnpm --filter @helux/api test:e2e`)

---

## Phase 2: Foundational

- [X] T003 Em `apps/api/vitest.config.ts`, adicionar `exclude: [...configDefaults.exclude, 'e2e/**/*.e2e.ts']` para a suíte padrão continuar sem Docker
- [X] T004 Criar `apps/api/vitest.e2e.config.ts` (`include: ['e2e/**/*.e2e.ts']`, `globalSetup: './e2e/global-setup.ts'`, `testTimeout`/`hookTimeout` de 60s, `fileParallelism: false`) e o script `test:e2e` em `apps/api/package.json`
- [X] T005 Criar `apps/api/e2e/tsconfig.json` (estende a base, `noEmit`, inclui `e2e` e `src`) e fazer o `typecheck` de `apps/api/package.json` rodar também `tsc -p e2e`

**Checkpoint**: `pnpm test` continua verde e sem exigir Docker.

---

## Phase 3: User Story 1 — Subir o ambiente local com um comando (P1) 🎯

**Independent Test**: num clone limpo, `pnpm db:start` sobe o banco com as 7 migrations aplicadas e `pnpm db:status` mostra as credenciais locais.

- [X] T006 [US1] Validar em ambiente limpo (`pnpm db:stop --no-backup` se houver): `pnpm db:start` aplica todas as migrations; `pnpm dlx supabase@2.118.0 migration list --local` sem pendências; `pnpm db:status` imprime `API_URL`, `ANON_KEY` e `SERVICE_ROLE_KEY` locais
- [X] T007 [US1] Validar migration nova com o ambiente no ar: criar uma migration descartável, rodar `supabase migration up`, confirmar a aplicação sem recriar o ambiente e removê-la em seguida (Acceptance Scenario 3)

**Checkpoint**: US1 entregue — ambiente local reproduzível.

---

## Phase 4: User Story 2 — Verificação de ponta a ponta com um comando (P1)

**Independent Test**: `pnpm test:e2e` passa. Uma regressão proposital faz falhar o cenário certo.

### Tests (RED primeiro)

- [X] T008 [P] [US2] Escrever `apps/api/e2e/fake-anthropic.test.ts`: `startFakeAnthropic()` responde `POST /v1/messages` com mensagem cujo texto contém um bloco ```json parseável com 4 sessões e exercícios do `EXERCISE_BANK`; `calls` incrementa por chamada; outra rota → 404; `close()` libera a porta — **confirmar FAIL**
- [X] T009 [P] [US2] Escrever `apps/api/e2e/prerequisites.test.ts`: `parseStatusEnv` extrai `API_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` da saída `KEY="valor"`; `assertLocalUrl` aceita `127.0.0.1`/`localhost` e rejeita host remoto com `[e2e] SUPABASE_URL não é local`; `resolveAiMode` retorna `fake` por padrão (mesmo com chave presente), `real` com `E2E_REAL_AI=1` e falha sem chave (mensagens do contrato) — **confirmar FAIL**
- [X] T010 [US2] Escrever `apps/api/e2e/mesocycle-flow.e2e.ts` com os cenários do quickstart 006 em `describe` sequencial, com usuário novo via signup (FR-009): (1) bootstrap: `generating` → sessão A, `upcoming` = demais letras, 0/N, 1 linha; (2) HRV 75 sem ajuste, 50 `cansado` (sets = max(2, base−1), peso igual), 30 `exausto` (sets reduzidos, peso ≤ base), sempre 1 linha; (3) dias pulados: retroagir 5 dias → mesma sessão pendente; (4) ciclo completo: cada POST avança 1 sem chamar a IA e o último gera o ciclo #2 (2 linhas, `GET` devolve o novo em 0/N); os asserts relativos seguem research R5 — **confirmar FAIL** (`pnpm test:e2e` sem harness)

### Implementation

- [X] T011 [P] [US2] Implementar `apps/api/e2e/fake-anthropic.ts` (contrato da IA simulada em `contracts/commands.md`) — T008 GREEN
- [X] T012 [P] [US2] Implementar `apps/api/e2e/prerequisites.ts` (`parseStatusEnv`, `assertLocalUrl`, `resolveAiMode`, `assertDocker`, `assertGeneticProfile`, `readLocalEnv` via `pnpm dlx supabase@2.118.0 status -o env`) — T009 GREEN
- [X] T013 [US2] Implementar `apps/api/e2e/global-setup.ts`: checar pré-requisitos, reaproveitar Supabase no ar ou subir com `db:start` e derrubar no teardown só se tiver subido (respeitando `E2E_KEEP_DB=1`); expor `LocalEnv` via `provide`
- [X] T014 [US2] Completar o harness no `beforeAll` de `mesocycle-flow.e2e.ts`: definir env, subir a IA simulada (salvo `real`), `buildApp()` em porta 0, clientes service-role e usuário; `afterAll` fecha tudo — T010 GREEN
- [X] T015 [US2] Validar SC-004: comentar temporariamente `markSessionCompleted` em `apps/api/src/services/plan-generation.service.ts` → o cenário de ciclo completo falha com esperado/obtido; reverter
- [X] T016 [US2] Validar SC-003: rodar `pnpm test:e2e` 5 vezes seguidas, todas verdes

**Checkpoint**: US2 entregue — verificação integrada repetível.

---

## Phase 5: User Story 3 — Checagem automática em cada PR (P3)

**Independent Test**: no PR, os jobs `checks` e `e2e` rodam e reportam.

- [ ] T017 [US3] Criar `.github/workflows/ci.yml` (research R7): gatilhos `pull_request` e `push` em `main`; job `checks` (checkout, pnpm 9, Node 22 com cache, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`); job `e2e` (mesmo setup + `pnpm test:e2e`); sem secrets
- [ ] T018 [US3] Validar no PR que os dois jobs aparecem e passam (SC-005)

---

## Phase 6: Polish

- [ ] T019 [P] Criar `docs/desenvolvimento-local.md` (pré-requisitos, `db:*`, `test:e2e`, `E2E_REAL_AI`/`E2E_KEEP_DB`, como ler uma falha) — FR-012
- [ ] T020 [P] Atualizar `specs/006-mesociclo-treino-backend/quickstart.md` para apontar para `pnpm test:e2e` — FR-013
- [ ] T021 Rodar `pnpm typecheck` e `pnpm test` na raiz: tudo verde; `apps/api/src/__tests__/dockerfile.test.ts` segue passando

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T005) → US1 (T006–T007) → US2 (T008–T016) → US3 (T017–T018) → Polish (T019–T021)
- US2 depende da US1 (config e scripts do banco). A US3 depende da US2 (o job e2e roda a suíte).
- Paralelos: T008 ∥ T009; T011 ∥ T012; T019 ∥ T020.

## Implementation Strategy

MVP = US1 + US2 (fluxo local com um comando). A US3 (CI) vem em seguida no mesmo PR. A validação dela (T018) só acontece com o PR aberto.
