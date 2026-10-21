---

description: "Task list for 023-producao-render"
---

# Tasks: ProduÃ§Ã£o Pessoal no Render

**Input**: Design documents from `/specs/023-producao-render/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/environment.md

**Tests**: obrigatÃ³rios pela constituiÃ§Ã£o (Test-First). Cada tarefa de cÃ³digo vem depois do seu teste falhando (red â†’ green).

**Organization**: agrupadas por user story. US1 e US2 sÃ£o P1, US3 e US4 sÃ£o P2, US5 Ã© P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependÃªncia)
- **[Story]**: US1 a US5, conforme [spec.md](./spec.md)

---

## Phase 1: Setup

- [ ] T001 Rodar `pnpm typecheck` e `pnpm test` na branch para registrar a linha de base (anotar falhas jÃ¡ existentes, inclusive as vindas do trabalho em andamento da 022, para nÃ£o confundir com regressÃµes)

---

## Phase 2: Foundational

Nenhuma. As histÃ³rias sÃ£o independentes entre si e nÃ£o hÃ¡ infraestrutura compartilhada a criar antes.

---

## Phase 3: User Story 1 - API publicada e acessÃ­vel de forma confiÃ¡vel (P1) ðŸŽ¯ MVP

**Goal**: a API valida o ambiente na inicializaÃ§Ã£o e restringe o CORS em produÃ§Ã£o; existe um guia de deploy reproduzÃ­vel.

**Independent Test**: iniciar a API com `NODE_ENV=production` sem variÃ¡veis e ver a falha com a lista; com tudo preenchido, `GET /health` responde `200` e uma origem diferente de `CORS_ORIGIN` nÃ£o Ã© liberada.

### Tests for User Story 1 âš ï¸ (escrever primeiro e ver falhar)

- [ ] T002 [P] [US1] Criar `apps/api/src/__tests__/env.test.ts` cobrindo `loadEnv`: (a) produÃ§Ã£o sem variÃ¡veis lanÃ§a erro listando cada nome ausente; (b) produÃ§Ã£o completa retorna o objeto; (c) `CORS_ORIGIN='*'` Ã© rejeitado em produÃ§Ã£o; (d) `PERSONAL_API_KEY` presente exige `PERSONAL_USER_ID` e `SUPABASE_SERVICE_ROLE_KEY`; (e) fora de produÃ§Ã£o, sem variÃ¡veis, nÃ£o lanÃ§a e aplica `CORS_ORIGIN` padrÃ£o `http://localhost:3000`
- [ ] T003 [P] [US1] Estender `apps/api/src/__tests__/cors.test.ts` com casos de produÃ§Ã£o: origem igual a `CORS_ORIGIN` recebe `access-control-allow-origin`; origem diferente nÃ£o recebe

### Implementation for User Story 1

- [ ] T004 [US1] Criar `apps/api/src/config/env.ts` com `loadEnv(env = process.env)` usando `zod`, conforme [data-model.md](./data-model.md) (depende de T002)
- [ ] T005 [US1] Atualizar `apps/api/src/index.ts` para chamar `loadEnv()` antes de `buildApp()` e encerrar com cÃ³digo 1 e a mensagem do erro se falhar (depende de T004)
- [ ] T006 [US1] Atualizar `apps/api/src/app.ts` para que o CORS use a origem de `loadEnv()` em vez de ler `process.env.CORS_ORIGIN` direto; garantir que o `cors.test.ts` existente e o T003 passem (depende de T003, T004)
- [ ] T007 [P] [US1] Criar `docs/deploy.md` com o passo a passo do deploy: criar o serviÃ§o pelo `render.yaml`, preencher os segredos, definir `NEXT_PUBLIC_API_URL` na Vercel, verificar `/health`, conferir as migrations de `supabase/migrations/` no banco de produÃ§Ã£o (FR-009)

**Checkpoint**: US1 funcional e testÃ¡vel sozinha.

---

## Phase 4: User Story 2 - Um Ãºnico destino de deploy (P1)

**Goal**: sÃ³ a configuraÃ§Ã£o do Render existe, e `.env.example` cobre todas as variÃ¡veis.

**Independent Test**: `fly.toml` nÃ£o existe; toda variÃ¡vel do `render.yaml` estÃ¡ em `.env.example`.

### Tests for User Story 2 âš ï¸

- [ ] T008 [US2] Criar `apps/api/src/__tests__/deploy-config.test.ts` (no padrÃ£o do `dockerfile.test.ts`) verificando: (a) `fly.toml` nÃ£o existe na raiz; (b) `render.yaml` existe e declara `healthCheckPath: /health`; (c) toda `key` de `envVars` do `render.yaml` aparece em `.env.example`; (d) toda variÃ¡vel obrigatÃ³ria em produÃ§Ã£o do contrato (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `CORS_ORIGIN`, `PERSONAL_API_KEY`, `PERSONAL_USER_ID`, `SUPABASE_SERVICE_ROLE_KEY`) aparece em `.env.example` e em `render.yaml`; (e) toda variÃ¡vel de `envVars` secreta usa `sync: false`

### Implementation for User Story 2

- [ ] T009 [US2] Remover `fly.toml` da raiz (depende de T008)
- [ ] T010 [US2] Atualizar `render.yaml` adicionando `SUPABASE_SERVICE_ROLE_KEY` com `sync: false` (depende de T008)
- [ ] T011 [US2] Reescrever `.env.example` com todas as variÃ¡veis do contrato, cada uma com um comentÃ¡rio de uso e marcada como obrigatÃ³ria ou opcional (depende de T008)
- [ ] T012 [P] [US2] Em `docs/backlog.md`, atualizar a seÃ§Ã£o sobre `fly.toml` para registrar que o deploy usa o Render

**Checkpoint**: US1 e US2 entregues; jÃ¡ Ã© possÃ­vel fazer o deploy.

---

## Phase 5: User Story 3 - IntegraÃ§Ã£o contÃ­nua mÃ­nima (P2)

**Goal**: push e pull request rodam typecheck e testes automaticamente.

**Independent Test**: abrir um pull request com um teste falhando e ver o workflow falhar.

### Tests for User Story 3 âš ï¸

- [ ] T013 [US3] Estender `apps/api/src/__tests__/deploy-config.test.ts` com verificaÃ§Ã£o do workflow: `.github/workflows/ci.yml` existe, dispara em `push` e `pull_request`, usa `pnpm install --frozen-lockfile` e executa `pnpm typecheck` e `pnpm test` (depende de T008)

### Implementation for User Story 3

- [ ] T014 [US3] Criar `.github/workflows/ci.yml`: checkout, `pnpm/action-setup` (v9), `actions/setup-node` (24, cache `pnpm`), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (depende de T013)
- [ ] T015 [US3] Registrar em `docs/deploy.md` como ativar o bloqueio de merge por falha do CI (proteÃ§Ã£o de branch no GitHub)

**Checkpoint**: US3 entregue.

---

## Phase 6: User Story 4 - MitigaÃ§Ã£o do cold start (P2)

**Goal**: o sync de saÃºde tolera a API acordando, e o monitor mantÃ©m a API ligada.

**Independent Test**: com `fetch` simulado devolvendo `503` duas vezes e depois `200`, o sync conclui; com erro permanente, para apÃ³s 3 tentativas.

### Tests for User Story 4 âš ï¸

- [ ] T016 [US4] Estender `apps/mobile/src/__tests__/health-sync.service.test.ts` com casos de retry conforme o contrato 4: (a) `200` na primeira, sem retry; (b) `503`, `503`, `200` conclui com 3 chamadas; (c) erro de rede seguido de sucesso conclui; (d) `400` falha sem retry; (e) 3 falhas esgotam as tentativas, o erro Ã© registrado e os dados locais jÃ¡ foram salvos; (f) `timeout` de 45 s aborta a tentativa e conta como falha. Usar atraso injetÃ¡vel (sem esperar de verdade)

### Implementation for User Story 4

- [ ] T017 [US4] Em `apps/mobile/src/services/health-sync.service.ts`, trocar o `fetch` do `/api/health/sync` por uma funÃ§Ã£o de retry (atÃ© 3 tentativas, espera de 2 s, 4 s e 8 s, `AbortController` de 45 s, retry em erro de rede e 502/503/504, checagem de `res.ok`), mantendo a gravaÃ§Ã£o local antes do POST (depende de T016)
- [ ] T018 [P] [US4] Confirmar por leitura que `apps/web/src/services/api-client.ts` e `apps/web/src/lib/server-api.ts` nÃ£o impÃµem timeout (FR-008, ver R7 em [research.md](./research.md)) e registrar a conclusÃ£o em `docs/deploy.md`
- [ ] T019 [P] [US4] Em `docs/deploy.md`, documentar o monitor do UptimeRobot (HTTP em `/health`, a cada 5 minutos) e o limite de 750 h/mÃªs do Render (FR-009)

**Checkpoint**: US4 entregue.

---

## Phase 7: User Story 5 - Backup e controle de gasto (P3)

**Goal**: rotina de backup documentada e testada, e teto de gasto da IA configurado.

**Independent Test**: gerar um backup, restaurar num banco vazio e comparar contagens por tabela.

- [ ] T020 [US5] Em `docs/deploy.md`, documentar o backup com `pg_dump` (connection string do Supabase em variÃ¡vel de ambiente, arquivo datado fora do repositÃ³rio) e a restauraÃ§Ã£o com `psql` (FR-010)
- [ ] T021 [US5] Em `docs/deploy.md`, documentar a configuraÃ§Ã£o do limite de gasto mensal no console da Anthropic (FR-011)
- [ ] T022 [US5] Executar a rotina de backup e restaurar num banco descartÃ¡vel; comparar a contagem de linhas por tabela e anotar o resultado em `docs/deploy.md` (SC-005). AÃ§Ã£o manual do dono, pois exige credenciais do banco

**Checkpoint**: todas as histÃ³rias entregues.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T023 [P] Varrer arquivos versionados e o histÃ³rico da branch por padrÃµes de segredo (`sk-ant-`, JWT `eyJ`, `service_role`) e registrar o comando e o resultado em `docs/deploy.md` (FR-012, SC-006)
- [ ] T024 Rodar `pnpm typecheck` e `pnpm test` e comparar com a linha de base de T001; nenhuma regressÃ£o
- [x] T025 Atualizar o bloco SPECKIT do `CLAUDE.md` para apontar para `specs/023-producao-render/plan.md`
- [ ] T026 Executar o roteiro de [quickstart.md](./quickstart.md) no deploy real (aÃ§Ã£o manual do dono) e marcar SC-001 a SC-006

---

## Dependencies & Execution Order

- **T001** primeiro. Depois, US1, US2, US3 e US4 sÃ£o independentes entre si. Ordem sugerida: P1 (US1, US2), P2 (US3, US4), P3 (US5).
- `deploy-config.test.ts` Ã© criado em T008 (US2) e estendido em T013 (US3), entÃ£o US3 depende de T008.
- `docs/deploy.md` Ã© criado em T007 e editado por T015, T018, T019, T020, T021, T022 e T023. Como Ã© o mesmo arquivo, essas tarefas nÃ£o rodam em paralelo com T007, apesar do `[P]` que algumas tÃªm em relaÃ§Ã£o a cÃ³digo.
- Dentro de cada histÃ³ria: teste falhando, depois implementaÃ§Ã£o.
- **T022 e T026** sÃ£o manuais e dependem de acesso Ã s contas de Render, Supabase e Anthropic.

## Implementation Strategy

### MVP First

1. T001 (linha de base).
2. US1 (T002â€“T007) e US2 (T008â€“T012) completas.
3. **Parar e validar**: rodar o deploy no Render seguindo `docs/deploy.md`.

### Incremental Delivery

1. MVP (US1 + US2): API publicÃ¡vel.
2. US3: CI.
3. US4: retry e monitor.
4. US5: backup e teto de gasto.
5. Polish (T023â€“T026).

## Notes

- Commits atÃ´micos por tarefa ou grupo lÃ³gico, citando o nÃºmero da tarefa.
- O trabalho nÃ£o commitado da feature 022 na Ã¡rvore nÃ£o deve entrar nos commits desta feature (usar `git add` com caminhos explÃ­citos).
