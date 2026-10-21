# Tasks: Ambiente de Testes com Alternância de Dados Reais e Mockados

**Input**: Design documents from `specs/021-ambiente-testes-mocks/`
**Prerequisites**: [plan.md](./plan.md) (inclui a **Revisão 2026-10-20**, R-A…R-H), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/mock-environment-api.md](./contracts/mock-environment-api.md)

**Tests**: TDD obrigatório (Princípio II): em cada tarefa, o teste vem primeiro e precisa falhar antes da implementação.

**Regenerado em 2026-10-20** depois da revisão do plano. Mudanças: modo em cookie (R-A), sessão e dados de mock no servidor (R-B/R-C), nutrição da 018 nas fixtures (R-D), exames, mobile e `api-mock-provider` fora (R-E/R-F), persona de erro (R-H).

---

## Phase 1: Setup

- [ ] T001 Criar `apps/web/src/mocks/{fixtures}`, `apps/web/src/components/dev` e `apps/web/src/__tests__/mocks`; acrescentar `NEXT_PUBLIC_DATA_SOURCE=real` (comentado, com explicação) em `apps/web/.env.example`

---

## Phase 2: Foundational

- [ ] T002 [P] `apps/web/src/lib/data-source.ts` (isomórfico, sem React): `DataSourceMode`, `resolveDataSource({ nodeEnv, cookie, envDefault })` (precedência R-A), `getDataSource()` no cliente (lê `document.cookie`), `setDataSource(mode)` (grava o cookie `helux-data-source`, `path=/`, 1 ano, e dispara `helux:data-source-change`), `getPersonaId()`/`setPersonaId()` (cookie `helux-mock-persona`, padrão `standard-athlete`) e `isMockActive()`. Testes em `apps/web/src/__tests__/mocks/data-source.test.ts` (produção sempre `real`, cookie > env > `real`, valores inválidos ignorados)
- [ ] T003 [P] `apps/web/src/mocks/mock-store.ts`: `MockDataset`/`MockLocalStorageState` (data-model, sem `medicalExams`, com `nutrition`), `getDataset()`, `updateDataset(updater)`, `reset()` e `loadPersona(id)` sobre `localStorage['helux_mock_state_v1']`; estado ausente, corrompido ou de outra versão → dataset inicial da persona do cookie, com `corrupted: true` para o aviso da Dev Bar; sem `window` → dataset inicial (servidor). Testes em `apps/web/src/__tests__/mocks/mock-store.test.ts`
- [ ] T004 `apps/web/src/mocks/mock-router.ts`: `createMockRouter(store)` com `dispatch(path, options)` (método + path, query string ignorada no casamento e lida pelos handlers) devolvendo o JSON da resposta ou lançando `ApiError` (rota desconhecida → `ApiError('HTTP 404')`). Começa só com `GET /health`. Testes em `apps/web/src/__tests__/mocks/mock-router.test.ts`

**Checkpoint**: fundação pronta (commit).

---

## Phase 3: US1 — Alternância transparente (P1) 🎯 MVP

- [ ] T005 [US1] `apiFetch` em `apps/web/src/services/api-client.ts`: em modo mock, não chama o Supabase nem a rede e despacha para o `mock-router` do `mock-store` do navegador; em `real`, comportamento atual intacto. Testes em `apps/web/src/__tests__/services/api-client-mock-toggle.test.ts` (`fetch` e Supabase mockados: mock não chama nenhum dos dois; real continua mandando o Bearer)
- [ ] T006 [US1] `apps/web/src/lib/server-session.ts` (`getServerSession()`: mock → sessão fake de R-B; real → `createSupabaseServerClient().auth.getSession()`) e `apps/web/src/lib/server-api.ts` (`serverApiGet(path, token, init?)`: mock → `mock-router` com o dataset inicial da persona do cookie; real → `fetch` atual, devolvendo `null` em falha). Trocar as 5 páginas (`app/page.tsx`, `treinos/page.tsx`, `nutricao/page.tsx`, `perfil/page.tsx`, `checkin/page.tsx`) e `dna/load-profile.ts` para usar esses helpers, sem mudar o que cada página faz em `real`. Testes em `apps/web/src/__tests__/lib/server-session.test.ts` e `server-api.test.ts`
- [ ] T007 [US1] `apps/web/middleware.ts`: em modo mock (cookie/env, nunca em produção) segue sem consultar o Supabase. A lógica de decisão fica numa função pura `shouldBypassAuth(request)` em `apps/web/src/lib/data-source.ts`, testada em `data-source.test.ts`

**Checkpoint**: em mock, o app abre sem login e sem rede (commit).

---

## Phase 4: US2 — Dataset coerente do domínio (P1)

- [ ] T008 [P] [US2] Fixtures tipadas da persona padrão em `apps/web/src/mocks/fixtures/`: `profile.fixture.ts` (`UserTrainingProfile` com altura, nascimento e sexo), `workouts.fixture.ts` (`AdjustedWorkoutPlanView` com exercícios reais do banco de `@helux/workouts`, 12 `WorkoutSession` nos últimos 30 dias, `WorkoutAnalytics`), `tiredness.fixture.ts` (`TirednessAssessment` + `RecoveryData`), `checkins.fixture.ts` (`BodyCheckin[]`, 3 meses), `genetics.fixture.ts` (`GeneticProfileView` derivado do `genera.json` via `@helux/genetics`)
- [ ] T009 [US2] `apps/web/src/mocks/fixtures/nutrition.fixture.ts` (R-D): fase ativa, plano do dia montado por `buildDayPlan` de `@helux/nutrition` com os marcadores do `genera.json` (`parseGeneraNutrition` + `classifyMarkers` + `nutritionFlags`), histórico de 5 dias e o perfil nutrigenômico
- [ ] T010 [US2] Rotas de leitura no `mock-router`: `/workout/latest-plan`, `/api/workouts/history` (com `limit`/`offset`), `/api/workouts/analytics`, `/api/tiredness-today`, `/api/recovery/latest`, `/api/profile`, `/api/checkins`, `/genetic-profile`, `/api/nutrition/phase`, `/api/nutrition/today`, `/api/nutrition/today/swap-options`, `/api/nutrition/history`, `/api/nutrition/genetic-profile`, cada uma no formato da API real
- [ ] T011 [US2] Teste de coerência em `apps/web/src/__tests__/mocks/fixtures-schema.test.ts`: os tipos de `@helux/types` são checados pelo `tsc` (SC-003); o teste confere a integridade referencial (todo exercício do plano existe no banco de `@helux/workouts`, sessões dentro dos últimos 30 dias, plano do dia sem lactose com MCM6 G,G) e que toda rota GET usada pelos services (lista da T010) responde em mock

**Checkpoint**: todas as telas carregam em mock (commit).

---

## Phase 5: US3 — Dev Bar (P2)

- [ ] T012 [US3] `apps/web/src/components/dev/DevBar.tsx`: barra fixa no rodapé acima do menu, recolhível, com estado `Mock data` / `Real data`, botão de alternância (confirmação se houver um formulário com alterações, via `window.confirm` só quando `document.querySelector('form[data-dirty="true"]')`), recarga da página após a troca e aviso quando o estado local foi descartado por estar corrompido; só classes do `helux-v2.css` + inline (R-G). Testes em `apps/web/src/__tests__/components/dev/DevBar.test.tsx`
- [ ] T013 [US3] Montar a `DevBar` em `apps/web/src/app/layout.tsx` só quando `process.env.NODE_ENV !== 'production'` (import dinâmico, `ssr: false`)

**Checkpoint**: commit.

---

## Phase 6: US4 — Escritas locais e reset (P2)

- [ ] T014 [US4] Rotas de escrita no `mock-router`, persistindo no `mock-store`: `POST /api/workouts/sessions` (insere no histórico, marca a sessão do plano como concluída, atualiza a análise), `PUT /api/tiredness-today`, `POST /api/profile`, `POST /api/checkins` (upsert por mês), `POST /workout/generate` (devolve o plano da persona), `POST /api/nutrition/phase` e `/phase/end`, `PUT /api/nutrition/today` (tipo do dia, recalculado por `buildDayPlan`) e `POST /api/nutrition/today/swap` (aplica a troca com `swapOptions`). Testes em `apps/web/src/__tests__/mocks/mock-mutations.test.ts` (escrita → leitura reflete; persiste num novo `mock-store` sobre o mesmo `localStorage`)
- [ ] T015 [US4] Botão "Resetar dados de teste" na `DevBar` → `reset()`, evento `helux:mock-reset` e recarga; teste no `DevBar.test.tsx`

**Checkpoint**: commit.

---

## Phase 7: US5 — Personas (P3)

- [ ] T016 [US5] `apps/web/src/mocks/fixtures/personas.ts`: `standard-athlete`, `rest-day-athlete` (plano sem treino hoje e dia de descanso na nutrição), `exhausted-athlete` (cansaço `exausto`, HRV baixo, plano ajustado, card de recuperação na nutrição), `zero-state` (sem plano, histórico, check-ins, fase nem perfil), `network-error` (R-H: toda leitura lança `ApiError('HTTP 503')`). Testes em `apps/web/src/__tests__/mocks/personas.test.ts`
- [ ] T017 [US5] Seletor de persona na `DevBar` → `setPersonaId` + `loadPersona` + evento `helux:persona-change` + recarga; teste no `DevBar.test.tsx`

**Checkpoint**: commit.

---

## Phase 8: Guardas e verificação final

- [ ] T018 Teste de guarda em `apps/web/src/__tests__/mocks/production-guard.test.ts`: com `NODE_ENV=production`, `resolveDataSource` → `real` mesmo com cookie/env `mock`, `shouldBypassAuth` → `false`, `getServerSession` não devolve a sessão fake, e o `layout.tsx` não monta a `DevBar`
- [ ] T019 Rodar o guard do design system, `pnpm test`, `pnpm typecheck` e `pnpm build`; atualizar o `quickstart.md` (como ligar o mock, personas, limitação R-C, números das suítes)
