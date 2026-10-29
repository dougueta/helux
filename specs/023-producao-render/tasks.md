---

description: "Task list for 023-producao-render"
---

# Tasks: Produção Pessoal no Render

**Input**: Design documents from `/specs/023-producao-render/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/environment.md

**Tests**: obrigatórios pela constituição (Test-First). Cada tarefa de código vem depois do seu teste falhando (red → green).

**Organization**: agrupadas por user story. US1 e US2 são P1, US3 e US4 são P2, US5 é P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 a US5, conforme [spec.md](./spec.md)

---

## Phase 1: Setup

- [x] T001 Rodar `pnpm typecheck` e `pnpm test` na branch para registrar a linha de base (anotar falhas já existentes, inclusive as vindas do trabalho em andamento da 022, para não confundir com regressões). **Linha de base (2026-10-20):** `pnpm typecheck` falha só em `@helux/ai` (testes da 022 ainda vermelhos); `@helux/api` 187/188 testes (1 falha em `e2e/fake-anthropic.test.ts`, mesociclo da 022); `@helux/mobile` 9/9

---

## Phase 2: Foundational

Nenhuma. As histórias são independentes entre si e não há infraestrutura compartilhada a criar antes.

---

## Phase 3: User Story 1 - API publicada e acessível de forma confiável (P1) 🎯 MVP

**Goal**: a API valida o ambiente na inicialização e restringe o CORS em produção; existe um guia de deploy reproduzível.

**Independent Test**: iniciar a API com `NODE_ENV=production` sem variáveis e ver a falha com a lista; com tudo preenchido, `GET /health` responde `200` e uma origem diferente de `CORS_ORIGIN` não é liberada.

### Tests for User Story 1 ⚠️ (escrever primeiro e ver falhar)

- [x] T002 [P] [US1] Criar `apps/api/src/__tests__/env.test.ts` cobrindo `loadEnv`: (a) produção sem variáveis lança erro listando cada nome ausente; (b) produção completa retorna o objeto; (c) `CORS_ORIGIN='*'` é rejeitado em produção; (d) `PERSONAL_API_KEY` presente exige `PERSONAL_USER_ID` e `SUPABASE_SERVICE_ROLE_KEY`; (e) fora de produção, sem variáveis, não lança e aplica `CORS_ORIGIN` padrão `http://localhost:3000`
- [x] T003 [P] [US1] Estender `apps/api/src/__tests__/cors.test.ts` com casos de produção: origem igual a `CORS_ORIGIN` recebe `access-control-allow-origin`; origem diferente não recebe

### Implementation for User Story 1

- [x] T004 [US1] Criar `apps/api/src/config/env.ts` com `loadEnv(env = process.env)` usando `zod`, conforme [data-model.md](./data-model.md) (depende de T002)
- [x] T005 [US1] Atualizar `apps/api/src/index.ts` para chamar `loadEnv()` antes de `buildApp()` e encerrar com código 1 e a mensagem do erro se falhar (depende de T004)
- [x] T006 [US1] Atualizar `apps/api/src/app.ts` para que o CORS use a origem de `loadEnv()` em vez de ler `process.env.CORS_ORIGIN` direto; garantir que o `cors.test.ts` existente e o T003 passem (depende de T003, T004)
- [x] T007 [P] [US1] Criar `docs/deploy.md` com o passo a passo do deploy: criar o serviço pelo `render.yaml`, preencher os segredos, definir `NEXT_PUBLIC_API_URL` na Vercel, verificar `/health`, conferir as migrations de `supabase/migrations/` no banco de produção (FR-009)

**Checkpoint**: US1 funcional e testável sozinha.

---

## Phase 4: User Story 2 - Um único destino de deploy (P1)

**Goal**: só a configuração do Render existe, e `.env.example` cobre todas as variáveis.

**Independent Test**: `fly.toml` não existe; toda variável do `render.yaml` está em `.env.example`.

### Tests for User Story 2 ⚠️

- [x] T008 [US2] Criar `apps/api/src/__tests__/deploy-config.test.ts` (no padrão do `dockerfile.test.ts`) verificando: (a) `fly.toml` não existe na raiz; (b) `render.yaml` existe e declara `healthCheckPath: /health`; (c) toda `key` de `envVars` do `render.yaml` aparece em `.env.example`; (d) toda variável obrigatória em produção do contrato (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `CORS_ORIGIN`, `PERSONAL_API_KEY`, `PERSONAL_USER_ID`, `SUPABASE_SERVICE_ROLE_KEY`) aparece em `.env.example` e em `render.yaml`; (e) toda variável de `envVars` secreta usa `sync: false`

### Implementation for User Story 2

- [x] T009 [US2] Remover `fly.toml` da raiz (depende de T008)
- [x] T010 [US2] Atualizar `render.yaml` adicionando `SUPABASE_SERVICE_ROLE_KEY` com `sync: false` (depende de T008)
- [x] T011 [US2] Reescrever `.env.example` com todas as variáveis do contrato, cada uma com um comentário de uso e marcada como obrigatória ou opcional (depende de T008)
- [x] T012 [P] [US2] Em `docs/backlog.md`, atualizar a seção sobre `fly.toml` para registrar que o deploy usa o Render

**Checkpoint**: US1 e US2 entregues; já é possível fazer o deploy.

---

## Phase 5: User Story 3 - Integração contínua mínima (P2)

**Goal**: push e pull request rodam typecheck e testes automaticamente.

**Independent Test**: abrir um pull request com um teste falhando e ver o workflow falhar.

### Tests for User Story 3 ⚠️

- [x] T013 [US3] Estender `apps/api/src/__tests__/deploy-config.test.ts` com verificação do workflow: `.github/workflows/ci.yml` existe, dispara em `push` e `pull_request`, usa `pnpm install --frozen-lockfile` e executa `pnpm typecheck` e `pnpm test` (depende de T008)

### Implementation for User Story 3

- [x] T014 [US3] Criar `.github/workflows/ci.yml`: checkout, `pnpm/action-setup` (v9), `actions/setup-node` (24, cache `pnpm`), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (depende de T013) **Já existia (spec 017) e cumpre o contrato 5**: roda em `pull_request` e em `push` na `main`, usa `pnpm/action-setup@v4` (pnpm 9 via `packageManager`) e Node 22 (`engines` pede `>=20`); mantido sem mudança.
- [x] T015 [US3] Registrar em `docs/deploy.md` como ativar o bloqueio de merge por falha do CI (proteção de branch no GitHub)

**Checkpoint**: US3 entregue.

---

## Phase 6: User Story 4 - Mitigação do cold start (P2)

**Goal**: o sync de saúde tolera a API acordando, e o monitor mantém a API ligada.

**Independent Test**: com `fetch` simulado devolvendo `503` duas vezes e depois `200`, o sync conclui; com erro permanente, para após 3 tentativas.

### Tests for User Story 4 ⚠️

- [x] T016 [US4] Estender `apps/mobile/src/__tests__/health-sync.service.test.ts` com casos de retry conforme o contrato 4: (a) `200` na primeira, sem retry; (b) `503`, `503`, `200` conclui com 3 chamadas; (c) erro de rede seguido de sucesso conclui; (d) `400` falha sem retry; (e) 3 falhas esgotam as tentativas, o erro é registrado e os dados locais já foram salvos; (f) `timeout` de 45 s aborta a tentativa e conta como falha. Usar atraso injetável (sem esperar de verdade)

### Implementation for User Story 4

- [x] T017 [US4] Em `apps/mobile/src/services/health-sync.service.ts`, trocar o `fetch` do `/api/health/sync` por uma função de retry (até 3 tentativas, espera de 2 s, 4 s e 8 s, `AbortController` de 45 s, retry em erro de rede e 502/503/504, checagem de `res.ok`), mantendo a gravação local antes do POST (depende de T016)
- [x] T018 [P] [US4] Confirmar por leitura que `apps/web/src/services/api-client.ts` e `apps/web/src/lib/server-api.ts` não impõem timeout (FR-008, ver R7 em [research.md](./research.md)) e registrar a conclusão em `docs/deploy.md`
- [x] T019 [P] [US4] Em `docs/deploy.md`, documentar o monitor do UptimeRobot (HTTP em `/health`, a cada 5 minutos) e o limite de 750 h/mês do Render (FR-009)

**Checkpoint**: US4 entregue.

---

## Phase 7: User Story 5 - Backup e controle de gasto (P3)

**Goal**: rotina de backup documentada e testada, e teto de gasto da IA configurado.

**Independent Test**: gerar um backup, restaurar num banco vazio e comparar contagens por tabela.

- [x] T020 [US5] Em `docs/deploy.md`, documentar o backup com `pg_dump` (connection string do Supabase em variável de ambiente, arquivo datado fora do repositório) e a restauração com `psql` (FR-010)
- [x] T021 [US5] Em `docs/deploy.md`, documentar a configuração do limite de gasto mensal no console da Anthropic (FR-011)
- [ ] T022 [US5] Executar a rotina de backup e restaurar num banco descartável; comparar a contagem de linhas por tabela e anotar o resultado em `docs/deploy.md` (SC-005). Ação manual do dono, pois exige credenciais do banco. **Adiada pelo dono em 2026-10-24**, fica pendente depois do deploy

**Checkpoint**: todas as histórias entregues.

---

## Phase 8: Polish & Cross-Cutting

- [x] T023 [P] Varrer arquivos versionados e o histórico da branch por padrões de segredo (`sk-ant-`, JWT `eyJ`, `service_role`) e registrar o comando e o resultado em `docs/deploy.md` (FR-012, SC-006)
- [x] T024 Rodar `pnpm typecheck` e `pnpm test` e comparar com a linha de base de T001; nenhuma regressão **Resultado (2026-10-21):** `pnpm typecheck` 9/9; `pnpm test` todos verdes: api 262, web 595, ai 187, workouts 100, nutrition 76, genetics 34, health 27, types 17, mobile 17. As falhas da linha de base (022 em andamento) não existem mais.
- [x] T025 Atualizar o bloco SPECKIT do `CLAUDE.md` para apontar para `specs/023-producao-render/plan.md`
- [ ] T026 Executar o roteiro de [quickstart.md](./quickstart.md) no deploy real (ação manual do dono) e marcar SC-001 a SC-006

---

## Dependencies & Execution Order

- **T001** primeiro. Depois, US1, US2, US3 e US4 são independentes entre si. Ordem sugerida: P1 (US1, US2), P2 (US3, US4), P3 (US5).
- `deploy-config.test.ts` é criado em T008 (US2) e estendido em T013 (US3), então US3 depende de T008.
- `docs/deploy.md` é criado em T007 e editado por T015, T018, T019, T020, T021, T022 e T023. Como é o mesmo arquivo, essas tarefas devem rodar em sequência depois de T007, apesar do `[P]` que algumas têm em relação ao código.
- Dentro de cada história: teste falhando, depois implementação.
- **T022 e T026** são manuais e dependem de acesso às contas de Render, Supabase e Anthropic.

## Implementation Strategy

### MVP First

1. T001 (linha de base).
2. US1 (T002–T007) e US2 (T008–T012) completas.
3. **Parar e validar**: rodar o deploy no Render seguindo `docs/deploy.md`.

### Incremental Delivery

1. MVP (US1 + US2): API publicável.
2. US3: CI.
3. US4: retry e monitor.
4. US5: backup e teto de gasto.
5. Polish (T023–T026).

## Notes

- Commits atômicos por tarefa ou grupo lógico, citando o número da tarefa.
- O trabalho não commitado da feature 022 na árvore não deve entrar nos commits desta feature (usar `git add` com caminhos explícitos).
