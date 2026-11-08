# Tasks: Check-in de peso e medidas com dados confiáveis

**Input**: Design documents from `specs/029-checkin-peso-medidas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/ui.md, quickstart.md

**Tests**: Obrigatórios (Constituição II — TDD). Em cada tarefa de teste: escrever, rodar e confirmar que falha antes da implementação correspondente.

**Organization**: Por user story (spec.md). US1 e US2 são P1; US3 e US4 P2; US5 P3.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 Registrar no backlog os itens fora do escopo (importar peso/medidas do Apple Health pelo Atalho; carga máxima estimada pelos treinos; fotos de progresso) em `docs/backlog.md`, numa seção "Check-in (pós-029)"

---

## Phase 2: Foundational (bloqueia todas as stories)

**Purpose**: Migração, tipos e as funções puras usadas por todas as stories.

- [ ] T002 Criar a migração `supabase/migrations/20261108000000_029_body_weights_measurements.sql` conforme research R11 e data-model: tabela `body_weights` (unique `(user_id, date)`, check 20–500, índice `(user_id, date desc)`, RLS `auth.uid() = user_id`); copiar pesos de `body_checkins` (`created_at::date`, `on conflict do nothing`); em `body_checkins` adicionar `measured_on` (backfill `created_at::date`, `not null`), `shoulders_cm`, `chest_cm`, `arm_left_cm`, `leg_left_cm`, `calf_left_cm`, `calf_right_cm`, `body_fat_navy_pct`, `body_fat_device_source` (check do enum e obrigatória quando `body_fat_device_pct` não é nula), `updated_at`; renomear `arm_cm`→`arm_right_cm`, `leg_cm`→`leg_right_cm`, `body_fat_pct`→`body_fat_device_pct` (backfill origem `outro`); backfill de `body_fat_navy_pct` com a fórmula da Marinha em SQL a partir de `user_training_profile` (mesma fórmula de `packages/nutrition/src/biometrics.ts`, faixa 3–60); apagar registros sem nenhuma medida/%/carga e sem referência em `diet_phases`/`diet_phase_calibrations`; remover `unique (user_id, month)`, coluna `month`, índice antigo e `weight_kg`; criar índice `(user_id, measured_on desc)`
- [ ] T003 Aplicar a migração localmente (`supabase db reset`) e conferir com SQL: contagem de pesos copiados, origem `outro` nos % antigos, nenhum registro com `measured_on` nulo
- [ ] T004 [P] Substituir `BodyCheckin`/`CheckinInput` por `BodyWeight`, `BodyMeasurement`, `MeasurementInput`, `BodyFatSource`, `DeviceBodyFatSource`, `NavyStatus` em `packages/types/src/checkin.ts` (data-model) e exportar em `packages/types/src/index.ts`
- [ ] T005 [P] Adicionar `trendFrom?`/`trendTo?` em `DietCalibrationMetrics` e o tipo `RecalibrationEvaluation` em `packages/types/src/nutrition.ts`
- [ ] T006 [P] Testes de `navyBodyFat` retornando `null` fora de 3–60% em `packages/nutrition/src/__tests__/biometrics.test.ts`
- [ ] T007 Implementar a faixa 3–60% em `navyBodyFat` em `packages/nutrition/src/biometrics.ts`
- [ ] T008 [P] Testes de `trendAt` (2 pesagens → null; 3 → média; janela `[d−6, d]`; pesagens fora da janela ignoradas), `trendSeries` (null onde não há tendência, um ponto por pesagem), `weeklyChange` (kg e %; null sem uma das pontas) e `referenceWeight` (tendência; sem tendência, pesagem mais próxima em ≤ 3 dias; senão null) em `packages/nutrition/src/__tests__/weight-trend.test.ts`
- [ ] T009 Implementar `trendAt`, `trendSeries`, `weeklyChange`, `referenceWeight` em `packages/nutrition/src/weight-trend.ts` e exportar em `packages/nutrition/src/index.ts`
- [ ] T010 [P] Testes de `effectiveBodyFat` (mais recente de qualquer origem; navy e aparelho no mesmo registro → navy; registro sem % é pulado; nenhum → null) em `packages/nutrition/src/__tests__/weight-trend.test.ts`
- [ ] T011 Implementar `effectiveBodyFat` em `packages/nutrition/src/weight-trend.ts`
- [ ] T012 Atualizar `checkinTrend` para receber `BodyMeasurement` + peso de referência de cada lado (meses = dias entre `measured_on` / 30,4, mínimo 1), calculando delta de % de gordura só quando a origem efetiva dos dois lados é a mesma (FR-012); testes primeiro em `packages/workouts/src/__tests__/checkin-trend.test.ts`, depois `packages/workouts/src/checkin-trend.ts`

**Checkpoint**: migração aplicada localmente, tipos e funções puras verdes (`pnpm --filter @helux/nutrition test`, `pnpm --filter @helux/workouts test`).

---

## Phase 3: User Story 1 — Pesagem frequente com linha de tendência (P1) 🎯 MVP

**Goal**: Registrar o peso em segundos, uma pesagem por dia, e ver tendência e variação semanal.

**Independent Test**: Registrar pesagens em vários dias e ver o histórico com pontos, linha de tendência e variação de 7 dias; com < 3 pesagens, o aviso.

### Tests

- [ ] T013 [P] [US1] Testes de `needsConfirmation` (> 3 kg da última tendência → true; sem tendência → false) em `packages/nutrition/src/__tests__/weight-trend.test.ts`
- [ ] T014 [P] [US1] Testes da rota em `apps/api/src/__tests__/weights.test.ts`: 401 sem token; `GET /api/weights?days` ordenado asc; `PUT /api/weights/:date` cria (`replaced: false`) e substitui (`replaced: true`); data futura → 400 `future-date`; peso fora de 20–500 → 400; `DELETE` → 204 e 404
- [ ] T015 [P] [US1] Testes de `WeightForm` em `apps/web/src/__tests__/components/checkin/WeightForm.test.tsx`: aceita "82,4"; data padrão hoje e sem futuro; lembrete do protocolo de pesagem visível (FR-015); `Dialog` de confirmação quando `needsConfirmation`; toast de substituição quando `replaced: true`
- [ ] T016 [P] [US1] Testes de `TrendChart` em `apps/web/src/__tests__/components/checkin/TrendChart.test.tsx`: pontos por pesagem, linha só onde há tendência, sem ligar através de `null`
- [ ] T017 [P] [US1] Testes do resumo do Check-in em `apps/web/src/__tests__/app/checkin-page.test.tsx`: botões "Registrar peso" e "Registrar medidas"; peso de tendência e variação de 7 dias; aviso "faltam pesagens" com < 3 pesagens; sem "Mensal"

### Implementation

- [ ] T018 [US1] Implementar `needsConfirmation` em `packages/nutrition/src/weight-trend.ts`
- [ ] T019 [US1] Criar `apps/api/src/routes/weights.ts` (GET/PUT/DELETE conforme contracts/api.md, Zod, data de hoje em `America/Sao_Paulo`) e registrar em `apps/api/src/app.ts`
- [ ] T020 [P] [US1] Criar `apps/web/src/services/weights.service.ts` (`listWeights`, `saveWeight`, `deleteWeight`) e `apps/web/src/hooks/useWeights.ts`
- [ ] T021 [P] [US1] Criar `apps/web/src/components/checkin/TrendChart.tsx` (SVG inline, tokens de cor do tema, `role="img"` com `aria-label` descrevendo tendência atual)
- [ ] T022 [US1] Criar `apps/web/src/components/checkin/WeightForm.tsx` e a página `apps/web/src/app/checkin/peso/page.tsx`
- [ ] T023 [US1] Reescrever `apps/web/src/app/checkin/page.tsx` como resumo (tendência, variação, último registro de medidas, dois botões, link Histórico)
- [ ] T024 [US1] Aba **Peso** em `apps/web/src/app/checkin/history/page.tsx`: `TrendChart` + lista de pesagens com editar (reabre `WeightForm` na data) e apagar (FR-006)
- [ ] T025 [US1] Mock: `bodyWeights` em `apps/web/src/mocks/types.ts` e `apps/web/src/mocks/fixtures/checkins.fixture.ts` (pesagens diárias com ±1,5 kg por persona em `personas.ts`) e rotas GET/PUT/DELETE `/api/weights` em `apps/web/src/mocks/routes.ts`; atualizar `apps/web/src/__tests__/mocks/fixtures-schema.test.ts` e `mock-mutations.test.ts`

**Checkpoint**: US1 funcional no modo mock e com API local (roteiro US1 do quickstart).

---

## Phase 4: User Story 2 — % de gordura pela fita como padrão, salvo e com origem (P1)

**Goal**: Registro de medidas datado, com 8 medidas (bilaterais em braço/coxa/panturrilha), % pela Marinha salvo pelo servidor e % de aparelho opcional com origem.

**Independent Test**: Com altura e sexo no perfil, registrar cintura e pescoço sem digitar % e ver no histórico o % com origem "fita"; informar um % de aparelho e ver as duas séries separadas.

### Tests

- [ ] T026 [P] [US2] Testes da rota em `apps/api/src/__tests__/measurements.test.ts`: 401; POST calcula `body_fat_navy_pct` com o perfil e retorna `navy_status` (`ok`, `sem-perfil`, `sem-medidas`, `inconsistente`); % aparelho sem origem → 400; registro vazio → 400 `empty`; data futura → 400; limites de cada medida; GET ordenado por `measured_on` desc; PUT recalcula a Marinha com o perfil atual e 404 para registro de outro usuário; DELETE 204/404
- [ ] T027 [P] [US2] Testes de `MeasurementForm` em `apps/web/src/__tests__/components/checkin/MeasurementForm.test.tsx` (substitui `CheckinForm.test.tsx`): seções Composição/Membros/Performance; campos Esq./Dir. de braço, coxa e panturrilha; prévia da Marinha e mensagens de perfil incompleto; % de aparelho oculto até "Tenho uma medição de aparelho" (FR-011); salvar sem origem mostra erro; aviso de `navy_status` ≠ `ok` após salvar; modo edição com Apagar
- [ ] T028 [P] [US2] Testes de `MeasurementHistory` em `apps/web/src/__tests__/components/checkin/MeasurementHistory.test.tsx` (substitui `CheckinHistoryTable.test.tsx`): origem do % em cada registro; gráfico de % com uma série por origem; nenhuma variação entre origens diferentes (SC-004)

### Implementation

- [ ] T029 [US2] Criar `apps/api/src/routes/measurements.ts` (GET/POST/PUT/DELETE conforme contracts/api.md; Marinha calculada com `navyBodyFat` e perfil de `user_training_profile`), registrar em `apps/api/src/app.ts` e remover `apps/api/src/routes/checkins.ts` e `apps/api/src/__tests__/checkins.test.ts`
- [ ] T030 [P] [US2] Criar `apps/web/src/services/measurements.service.ts` e `apps/web/src/hooks/useMeasurements.ts`; remover `checkin.service.ts`, `useCheckin.ts`, `useCheckinHistory.ts` e o teste `apps/web/src/__tests__/services/checkin.service.test.ts` (migrar casos úteis para `measurements.service.test.ts`)
- [ ] T031 [US2] Criar `apps/web/src/components/checkin/MeasurementForm.tsx` (contracts/ui.md, sem o guia ainda) e remover `CheckinForm.tsx`; páginas `apps/web/src/app/checkin/medidas/page.tsx` (com `?voltar=nutricao`) e `apps/web/src/app/checkin/medidas/[id]/page.tsx`
- [ ] T032 [US2] Criar `apps/web/src/components/checkin/MeasurementHistory.tsx` (lista + gráfico de % por origem usando `TrendChart`) e a aba **Medidas** em `apps/web/src/app/checkin/history/page.tsx`; remover `CheckinHistoryTable.tsx`
- [ ] T033 [US2] Mock: `bodyCheckins` com `measured_on` e campos novos em `apps/web/src/mocks/fixtures/checkins.fixture.ts` e `personas.ts`; rotas `/api/measurements` (com Marinha calculada pelo perfil mockado) em `apps/web/src/mocks/routes.ts`; remover rotas `/api/checkins`; ajustar testes de mocks

**Checkpoint**: US1 + US2 funcionais (roteiro US2 do quickstart, passos 1, 3–7).

---

## Phase 5: User Story 3 — Calibração da dieta pela tendência, sob demanda (P2)

**Goal**: "Recalibrar dieta" mostra proposta calculada pelas tendências e só aplica se o usuário confirmar; salvar pesagens/medidas não altera metas.

**Independent Test**: Fase com pesagens oscilando ±1,5 kg em torno de peso estável → proposta "manter"; tendência caindo acima da faixa → proposta "reduzir"; aplicar grava calibração; descartar não muda nada.

### Tests

- [ ] T034 [P] [US3] Testes de `recalibrate` com textos "Peso de tendência" em `packages/nutrition/src/__tests__/phase.test.ts` (ajustar os existentes)
- [ ] T035 [P] [US3] Testes de `evaluateRecalibration`/`applyRecalibration` em `apps/api/src/__tests__/diet-phase.service.test.ts`: `indisponivel` sem fase/perfil; `intervalo-curto` com `availableOn` = base + 14 dias; `faltam-pesagens` com a ponta correta; `proposta` usando tendências e cintura do registro mais recente até cada data; oscilação ±2 kg em 3 semanas → `manter` (SC-002); apply grava `metrics.trendFrom/trendTo` e atualiza `base_targets` só se mudou; `manter` aplicado também grava
- [ ] T036 [P] [US3] Testes das rotas em `apps/api/src/__tests__/nutrition-phase.test.ts`: `POST /api/nutrition/phase/recalibration/preview` não grava; `POST /api/nutrition/phase/recalibration` 200 com proposta e 409 nos outros status; `GET /api/nutrition/phase` com `checkinWeight`/`checkinStale` a partir das pesagens; `POST /api/nutrition/phase` usa `trendAt(hoje)` ou última pesagem e `effectiveBodyFat`
- [ ] T037 [P] [US3] Testes de `apps/api/src/__tests__/nutrition-context.service.test.ts`: contexto carrega pesagens dos últimos 35+ dias e o último registro de medidas
- [ ] T038 [P] [US3] Testes de `RecalibrationDialog` em `apps/web/src/__tests__/components/nutrition/RecalibrationDialog.test.tsx` (proposta com antes→depois e motivo, Aplicar/Descartar; mensagens de intervalo curto com data, faltam pesagens com link `/checkin/peso`, indisponível) e do botão em `apps/web/src/__tests__/app/nutricao-fase.test.tsx`

### Implementation

- [ ] T039 [US3] Trocar os textos de motivo para "Peso de tendência" em `packages/nutrition/src/phase.ts`
- [ ] T040 [US3] Atualizar `apps/api/src/services/nutrition-context.service.ts`: carregar `body_weights` (desde min(início da fase, última calibração, hoje − 35)) e registros de medidas; calcular `missing` pelas pesagens; `lastCalibration` com `createdAt`
- [ ] T041 [US3] Em `apps/api/src/services/diet-phase.service.ts`: implementar `evaluateRecalibration` e `applyRecalibration` (research R5), adaptar `createPhase` (peso por tendência/última pesagem, % efetivo, `start_checkin_id` = último registro de medidas) e remover `recalibrateOnCheckin` e `checkinBodyFat`
- [ ] T042 [US3] Rotas preview/apply em `apps/api/src/routes/nutrition-phase.ts`
- [ ] T043 [US3] Funções `previewRecalibration`/`applyRecalibration` em `apps/web/src/services/nutrition.service.ts`; criar `apps/web/src/components/nutrition/RecalibrationDialog.tsx` e o botão "Recalibrar dieta" em `apps/web/src/components/nutrition/PhaseSection.tsx` (recarrega metas e `CalibrationList` após aplicar)
- [ ] T044 [US3] Mock: rotas de preview/apply e `missing` pelas pesagens em `apps/web/src/mocks/routes.ts`; persona com fase iniciada há ≥ 2 semanas em `apps/web/src/mocks/fixtures/nutrition.fixture.ts`

**Checkpoint**: roteiro US3 do quickstart.

---

## Phase 6: User Story 4 — Guia de medição no formulário (P2)

**Goal**: Protocolo geral e "Onde medir?" com silhueta para cada medida.

**Independent Test**: Abrir o formulário de medidas e ver o protocolo; tocar em "Onde medir?" de cada medida e ver o ponto e o texto.

- [ ] T045 [P] [US4] Testes de `MeasureGuide` em `apps/web/src/__tests__/components/checkin/MeasureGuide.test.tsx`: texto de cada uma das 8 medidas conforme US4-2; marcador destacado da medida pedida; e em `MeasurementForm.test.tsx`: protocolo geral visível (US4-1) e botão `aria-label="Onde medir: <medida>"` abrindo o `Sheet`
- [ ] T046 [US4] Criar `apps/web/src/components/checkin/MeasureGuide.tsx` (silhueta SVG inline com marcadores por medida, textos da US4) e ligar no `MeasurementForm.tsx` (seção Protocolo recolhível + botões "Onde medir?")

**Checkpoint**: roteiro US2 passo 2 do quickstart.

---

## Phase 7: User Story 5 — Métricas derivadas e lembrete de medidas (P3)

**Goal**: Massa gorda/magra, cintura/altura e lembrete de medidas com > 28 dias; Home e consumidores usando os dados novos.

**Independent Test**: Registro com % e pesagens próximas mostra massa gorda/magra e cintura/altura; registro de 29 dias mostra lembrete; de 10 dias, não.

### Tests

- [ ] T047 [P] [US5] Testes de `bodyComposition`, `waistHeightRatio` e `measurementsDue` (nenhum registro → true; 29 dias → true; 10 dias → false) em `packages/nutrition/src/__tests__/weight-trend.test.ts`
- [ ] T048 [P] [US5] Testes de `CheckinCard` em `apps/web/src/__tests__/components/checkin/CheckinCard.test.tsx`: peso de tendência (ou última pesagem com data), variação 7 dias, % efetivo com origem, cargas, lembrete de medidas; e da Home em `apps/web/src/__tests__/app/home-ver-treino.test.tsx` (props novas)
- [ ] T049 [P] [US5] Testes em `apps/api/src/__tests__/integrated-profile.service.test.ts` (resumo com peso de tendência, variação, últimas medidas e origem do %) e `apps/api/src/__tests__/cycle-analysis.service.test.ts` (dois registros de medidas por `measured_on` com peso de referência)

### Implementation

- [ ] T050 [US5] Implementar `bodyComposition`, `waistHeightRatio`, `measurementsDue` em `packages/nutrition/src/weight-trend.ts`
- [ ] T051 [US5] Mostrar massa gorda/magra (com origem do %) e cintura/altura ("abaixo de 0,5") em `apps/web/src/components/checkin/MeasurementHistory.tsx` usando o perfil (altura) e as pesagens
- [ ] T052 [US5] Atualizar `apps/web/src/app/page.tsx`, `apps/web/src/app/HomeClient.tsx` e `apps/web/src/components/checkin/CheckinCard.tsx` (pesagens + medidas, lembrete, botão único "Check-in"); lembrete também no resumo `apps/web/src/app/checkin/page.tsx`
- [ ] T053 [P] [US5] Atualizar `apps/api/src/services/integrated-profile.service.ts` (`checkinsSummary` → peso de tendência, variação, medidas e origem do %)
- [ ] T054 [P] [US5] Atualizar `apps/api/src/services/cycle-analysis.service.ts` para ler os dois últimos registros de medidas por `measured_on` e as pesagens, passando o peso de referência ao `checkinTrend`

**Checkpoint**: roteiro US5 do quickstart.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T055 [P] Buscar referências restantes a `BodyCheckin`, `CheckinInput`, `month` de check-in e `/api/checkins` em `apps/` e `packages/` (incluindo `apps/web/src/services/session-checkins.service.ts`, `apps/web/src/mocks/fixtures/personas.ts`, `apps/web/src/__tests__/services/api-client.test.ts`, `apps/web/src/__tests__/mocks/personas.test.ts`) e corrigir
- [ ] T056 Rodar `pnpm --filter @helux/nutrition test`, `pnpm --filter @helux/workouts test`, `pnpm --filter @helux/api test`, `pnpm --filter @helux/web test` e `pnpm -r typecheck`; tudo verde
- [ ] T057 Executar o roteiro manual completo de `specs/029-checkin-peso-medidas/quickstart.md` no modo mock e com API local + Supabase local
- [ ] T058 Documentar a ordem de deploy (migração → API → web) e a conferência SQL pós-migração em `docs/deploy.md`

---

## Dependencies & Execution Order

- **Setup (T001)**: independente.
- **Foundational (T002–T012)**: bloqueia tudo. T003 depende de T002; T007 de T006; T009 de T008; T011 de T010; T012 de T004 e T009.
- **US1 (T013–T025)**: depende só da Foundational. MVP.
- **US2 (T026–T033)**: depende da Foundational; usa `TrendChart` (T021) no gráfico de % → fazer depois de US1 ou antecipar T021.
- **US3 (T034–T044)**: depende de US1 (pesagens) e da rota de medidas (T029) para a cintura.
- **US4 (T045–T046)**: depende de T031 (`MeasurementForm`).
- **US5 (T047–T054)**: depende de US1 e US2.
- **Polish (T055–T058)**: depois de todas.

Ordem sugerida: Foundational → US1 → US2 → US4 → US3 → US5 → Polish.

## Parallel Examples

- **Foundational**: T004, T005, T006, T008, T010 juntos (arquivos diferentes; T008 e T010 no mesmo arquivo de teste — fazer em sequência se um agente só).
- **US1**: T014, T015, T016, T017 (testes) juntos; depois T020 e T021 juntos.
- **US2**: T026, T027, T028 juntos.
- **US3**: T034–T038 juntos.
- **US5**: T047, T048, T049 juntos; T053 e T054 juntos.

## Implementation Strategy

1. **MVP**: Foundational + US1 → pesagem diária com tendência já entrega valor. Atenção: a migração remove `weight_kg`/`month`, então o MVP só é deployável junto com US2 (rota de medidas substitui `/api/checkins`) e com os consumidores de T040/T041/T052–T054 compilando. Na prática, o primeiro deploy é Foundational + US1 + US2 + adaptação mínima dos consumidores.
2. **Incremento 2**: US4 (guia) e US3 (recalibração sob demanda).
3. **Incremento 3**: US5 (métricas, Home, perfil integrado, análise de ciclo).
4. Polish, depois PR único para `main` com deploy migração → API → web.
