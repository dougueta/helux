# Tasks: Módulo de Nutrição Esportiva Genética

**Input**: Design documents from `specs/018-nutricao-genetica/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R13), data-model.md, contracts/ (nutrition-api, chat-stream, nutrition-engine), quickstart.md

**Tests**: TDD obrigatório (constituição, princípio II) — em cada tarefa, escrever/atualizar o teste primeiro, vê-lo falhar e só então implementar. Testes nunca chamam a Anthropic de verdade (`vi.mock('@anthropic-ai/sdk')`, padrão do projeto).

**Organization**: por user story (US0–US4 do spec); cada story termina com suítes direcionadas verdes e commit. Suíte completa só no fim (T041), por restrição de RAM.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Criar o pacote `packages/nutrition` (`@helux/nutrition`): `package.json` igual ao de `packages/workouts` (type module, `main: ./src/index.ts`, scripts `test`/`typecheck`, dependência `@helux/types`), `tsconfig.json` e `vitest.config.ts` copiados de `packages/workouts`, `README.md` (propósito: motor determinístico de nutrição; funções do contrato `contracts/nutrition-engine.md`) e `src/index.ts` vazio. Adicionar `@helux/nutrition: workspace:*` em `apps/api/package.json` e `apps/web/package.json`; incluir `'@helux/nutrition'` em `transpilePackages` de `apps/web/next.config.mjs`; acrescentar as duas linhas `COPY packages/nutrition/...` em `apps/api/Dockerfile` (o `apps/api/src/__tests__/dockerfile.test.ts` cobre). Rodar `pnpm install` e `pnpm --filter @helux/api exec vitest run src/__tests__/dockerfile.test.ts`
- [X] T002 Atualizar `@anthropic-ai/sdk` em `packages/ai/package.json` para a versão atual (necessária para `output_config`, `fallbacks` e `client.beta.messages.stream`), `pnpm install`, e rodar `pnpm --filter @helux/ai test` + `pnpm --filter @helux/ai typecheck` para confirmar que o planner de mesociclo (que segue em `claude-sonnet-4-6`) continua verde; corrigir só o que a atualização quebrar
- [X] T003 Criar `supabase/migrations/20261014002645_nutrition.sql` conforme `data-model.md`: colunas `user_training_profile.height_cm/birth_date/sex` (com checks), `body_checkins.neck_cm`; tabelas `diet_phases` (índice único parcial de uma fase `ativa` por usuário), `diet_phase_calibrations`, `daily_nutrition_plans` (único `user_id, date`), `nutrition_chat_messages` (índice `user_id, phase_id, created_at`); RLS `auth.uid() = user_id` em todas. Se o Docker estiver disponível, validar com `pnpm db:start` (aplica as migrations) — senão registrar que a validação fica para o CI/e2e

---

## Phase 2: Foundational (bloqueia as stories)

- [X] T004 [P] Tipos de `data-model.md` em `packages/types/src/nutrition.ts` (DietGoal, Sex, DayType, CalibrationAction, DietTargets, DietPhase, DietCalibration, FoodGroup, FoodTag, FoodItem, MealSlot, MealItem, Meal, RecoveryAdjustment, DayPlan, MealSwap, NutriMarker*, NutritionChatMessage), exportados em `packages/types/src/index.ts`; estender `UserTrainingProfile`/`UserTrainingProfileInput` com `heightCm?`, `birthDate?`, `sex?` em `packages/types/src/profile.ts` e `BodyCheckin` com `neck_cm?` em `packages/types/src/checkin.ts`
- [X] T005 [P] `parseGeneraNutrition(raw)` em `packages/genetics/src/nutrition.ts` (lê `nutri.pontos_de_atencao/cuidados_relevantes/curiosidades/achados_adicionais` e, de `fit`, os marcadores WNT16, ACTN3 e FTO; devolve `{ gene, snp, genotype, label, result, section }[]`, sem repetir SNP + traço; entrada inválida → `[]`), exportado em `packages/genetics/src/index.ts`, com testes em `packages/genetics/src/__tests__/nutrition.test.ts` usando um recorte do `genera.json` real (MCM6 G,G, GC A,C, ALPL A,G, FTO T,T low carb, ADORA2A C,G, WNT16 C,T, ACTN3 C,C)
- [X] T006 `NUTRI_MARKER_RULES`, `classifyMarkers` e `nutritionFlags` em `packages/nutrition/src/genetics-rules.ts` (R10): regra por gene + traço → categoria da US4, status (`atencao`/`neutro`/`favoravel`) pelo genótipo/resultado, conduta (recomendar/evitar) e flags (`intoleranciaLactose`, `vitaminaDBaixa`, `b6Baixa`, `densidadeOsseaBaixa`, `lowCarbEficaz`, `cafeinaTolerada`, `perfilPotencia`); marcador sem regra → `neutro` sem conduta; lista vazia → todas as flags `false`. Testes em `packages/nutrition/src/__tests__/genetics-rules.test.ts` com as entradas do T005 (cenário US4.1: MCM6 atenção, ADORA2A favorável, FTO saciedade favorável, GC/ALPL/WNT16 atenção, FTO low carb e ACTN3 favoráveis)
- [X] T007 [P] `FOOD_CATALOG` (~70 itens, valores da Tabela TACO) em `packages/nutrition/src/catalog.ts` conforme R7, com testes de invariantes em `packages/nutrition/src/__tests__/catalog.test.ts`: ids únicos; kcal ≈ 4·P + 4·C + 9·G (±10%); todo item com lactose tem a tag `contem-lactose`; cada grupo tem ≥ 6 itens sem lactose; existem itens com `rico-b6`, `fonte-vitamina-d`, `fonte-calcio-nao-lactea` e `rapida-digestao`; tags só do tipo `FoodTag`
- [X] T008 `loadNutritionContext(userId, supabase)` em `apps/api/src/services/nutrition-context.service.ts`: perfil (altura, nascimento, sexo), dois check-ins mais recentes, fase ativa + última calibração, cansaço do dia (`getTodayTirednessAssessment().effectiveLevel`), `days_per_week` do mesociclo ativo, sessão de treino salva hoje (`created_at`), marcadores genéticos (`parseGeneraNutrition` + `classifyMarkers` + `nutritionFlags`; sem `genera.json` → `active: false`) e a lista `missing` (`heightCm`, `birthDate`, `sex`, `checkinWeight`). Testes em `apps/api/src/__tests__/nutrition-context.service.test.ts` com Supabase mockado (padrão de `plan-context.service.test.ts`)

**Checkpoint**: fundação pronta (commit).

---

## Phase 3: User Story 0 — Fase de dieta recalibrada a cada check-in (Priority: P1) 🎯 MVP

**Goal**: iniciar uma fase com objetivo e duração; metas-base pela fórmula; recalibração por regra a cada check-in; % de gordura pela Marinha.

**Independent Test**: fase "perder gordura" com check-in de 80 kg → metas calculadas; novo check-in com perda abaixo da esperada → recalibração "reduzir" com motivo (spec US0).

- [X] T009 [P] [US0] `ageOn`, `bmrMifflin`, `navyBodyFat`, `activityFactor` em `packages/nutrition/src/biometrics.ts` (R2, R3) com testes em `packages/nutrition/src/__tests__/biometrics.test.ts`: valores de referência calculados à mão para homem e mulher; Marinha com medida faltando, cintura ≤ pescoço ou resultado fora de 3–60% → `null`; fator 1,375/1,55/1,725 e `null` → 1,375
- [X] T010 [US0] `phaseTargets` em `packages/nutrition/src/phase.ts` (R2): ajuste por objetivo (−20% com déficit máximo de 600 kcal, +10%, −10%, 0), proteína 2,2/2,0/1,8/1,8 g/kg, gordura 25% com mínimo 0,8 g/kg, carboidrato restante, pisos (kcal ≥ max(TMB, 1200); carboidrato ≥ 2 g/kg), arredondamento (kcal múltiplo de 10, gramas inteiros); testes em `packages/nutrition/src/__tests__/phase.test.ts`
- [X] T011 [US0] `recalibrate` em `packages/nutrition/src/phase.ts` (R4), testes no mesmo arquivo: < 2 semanas → `intervalo-curto` sem mudança; faixas semanais por objetivo; abaixo/acima/dentro → −150/+150/manter conforme o objetivo; cintura ≥ 1 cm menor com peso parado em perder gordura/recomposição → manter ("recomposição em curso"); ganhar massa com cintura > +2 cm → não aumenta; ajuste só no carboidrato; proteína pelo peso novo; pisos; `reason` em pt-BR e `metrics` preenchido
- [X] T012 [US0] `POST/GET /api/profile` aceitam e devolvem `heightCm` (120–230), `birthDate` (idade 14–100) e `sex` em `apps/api/src/routes/profile.ts`, testes em `apps/api/src/__tests__/profile.test.ts`
- [X] T013 [US0] `apps/api/src/services/diet-phase.service.ts`: `createPhase` (encerra a ativa, exige pré-requisitos, calcula com o último check-in e grava calibração `inicial`), `endPhase`, `recalibrateOnCheckin` (sem fase ativa → `null`; compara com o check-in da última calibração; grava a calibração e atualiza `base_targets`), testes em `apps/api/src/__tests__/diet-phase.service.test.ts`
- [X] T014 [US0] `POST /api/checkins` aceita `neck_cm` (20–70) e, após gravar, chama `recalibrateOnCheckin` e devolve `{ ..., calibration }` (falha na recalibração não falha o check-in: loga e devolve `calibration: null`), em `apps/api/src/routes/checkins.ts`, testes em `apps/api/src/__tests__/checkins.test.ts`
- [X] T015 [US0] Rotas `GET/POST /api/nutrition/phase` e `POST /api/nutrition/phase/end` em `apps/api/src/routes/nutrition-phase.ts` (contrato `nutrition-api.md`; `409 needs-profile` com `missing`; `bodyFatPct` pelo `navyBodyFat` do último check-in ou `body_fat_pct` digitado), registradas em `apps/api/src/app.ts`, testes em `apps/api/src/__tests__/nutrition-phase.test.ts`
- [X] T016 [P] [US0] Formulário de Perfil com altura, data de nascimento e sexo em `apps/web/src/components/perfil/ProfileForm.tsx`, testes em `apps/web/src/__tests__/components/perfil/ProfileForm.test.tsx`
- [X] T017 [P] [US0] Check-in com campo pescoço e % de gordura calculado (`navyBodyFat` de `@helux/nutrition`, com a altura do perfil) em `apps/web/src/components/checkin/CheckinForm.tsx` (e exibição em `CheckinCard.tsx`), testes em `apps/web/src/__tests__/components/checkin/CheckinForm.test.tsx` e `CheckinCard.test.tsx`
- [X] T018 [US0] Aba Nutrição: `apps/web/src/app/nutricao/page.tsx` + `NutricaoClient.tsx` com seções Hoje · Chat · Fase · Perfil genético (`Segmented` em modo abas); `apps/web/src/components/nutrition/ProfileGate.tsx` (pede altura/nascimento/sexo quando faltam e grava em `/api/profile`); seção Fase com `PhaseCard.tsx` (iniciar fase: objetivo + duração; metas, % de gordura, aviso "fase concluída" após a duração; encerrar) e `CalibrationList.tsx` (antes → depois, ação, motivo). NavBar ganha a aba Nutrição (`apps/web/src/components/layout/NavBar.tsx`) e `.hx-nav` passa a `repeat(5,1fr)` em `apps/web/src/app/helux-v2.css`. Testes em `apps/web/src/__tests__/app/nutricao-fase.test.tsx` e `apps/web/src/__tests__/components/layout/NavBar.test.tsx`
- [X] T019 [US0] Rodar as suítes de `@helux/nutrition`, `@helux/genetics`, `@helux/types`, os testes de `profile`, `checkins`, `diet-phase`, `nutrition-phase`, `nutrition-context` da API e os de `ProfileForm`, `Checkin*`, `nutricao-fase`, `NavBar` e `design-system-guard` da web; commit

- [X] T019a [US0] Correção da validação do usuário: check-in com mais de 35 dias não serve para iniciar a fase (`checkinStale` em `apps/api/src/services/nutrition-context.service.ts`), aviso e link `/checkin?voltar=nutricao` em `apps/web/src/components/nutrition/ProfileGate.tsx`, volta para a Nutrição após salvar (`returnTo` em `apps/web/src/components/checkin/CheckinForm.tsx` e `apps/web/src/app/checkin/page.tsx`); testes em `nutrition-context.service.test.ts`, `nutricao-fase.test.tsx` e `CheckinForm.test.tsx`

**Checkpoint**: US0 entregável.

---

## Phase 4: User Story 1 — Diretrizes diárias alinhadas ao treino e à genética (Priority: P1)

**Goal**: o dia derivado da fase (treino/descanso, carboidrato periodizado, hidratação), refeições do catálogo sem lactose com justificativa genética, horários pelo treino real, troca rápida e histórico.

**Independent Test**: com fase ativa e perfil genético, Nutrição › Hoje mostra metas do dia, 5 refeições sem nenhum item com lactose, pré-treino relativo, e descanso reduz o carboidrato (spec US1).

- [X] T020 [P] [US1] `dayTargets` em `packages/nutrition/src/day.ts` (R6), testes em `packages/nutrition/src/__tests__/day.test.ts`: treino carboidrato × 1,15; descanso × 0,80 (× 0,75 com `lowCarbEficaz`); proteína e gordura constantes; água 35 ml/kg + 500 ml no treino; `cansado` +500 ml e `exausto` +750 ml com `recovery`; `exausto` não corta o carboidrato no descanso (fica no da fase); piso de 2 g/kg de carboidrato no treino; `otimo`/`normal`/`null` → sem ajuste
- [X] T021 [US1] `buildDayPlan` em `packages/nutrition/src/day.ts` (R7), testes no mesmo arquivo: refeições do treino (café, almoço, pré-treino, pós-treino, jantar) e do descanso (café, almoço, lanche, jantar, ceia); moldes por refeição; rotação determinística por data (mesma data → mesmo plano; datas diferentes → planos diferentes); porções em múltiplos de ½ entre ½ e 3; **nenhum item `contem-lactose` com `intoleranciaLactose`** (varrer 60 datas); preferência por `rico-b6`/`fonte-vitamina-d`/`fonte-calcio-nao-lactea` com as flags; totais do dia em ±5% kcal e ±10% por macro; `geneticTags` ("Sem lactose", "Rico em B6"…) e `rationale` citando o marcador; `swaps` aplicadas; `genetics.active = false` → sem filtros genéticos e badge de aviso
- [X] T022 [P] [US1] `swapOptions` em `packages/nutrition/src/swaps.ts` (FR-010), testes em `packages/nutrition/src/__tests__/swaps.test.ts`: até 5, mesmo grupo, sem o próprio item, respeita `intoleranciaLactose`, porção reescalada, ordenadas pela menor diferença de macros
- [X] T023 [P] [US1] `anchorMealTimes` em `packages/nutrition/src/timing.ts` (R8), testes em `packages/nutrition/src/__tests__/timing.test.ts`: sem início → pré "60–90 min antes de treinar" e pós "logo após o treino" (relativos); com início → pós "até 60 min após terminar"; com fim → pós com hora `HH:MM–HH:MM` e `highlight` enquanto `now` estiver na janela; dia de descanso não muda
- [ ] T024 [US1] Rotas do dia em `apps/api/src/routes/nutrition-today.ts` (contrato `nutrition-api.md`): `GET/PUT /api/nutrition/today` (tipo do dia por R5: override do usuário; treino salvo hoje força `treino`; sem mesociclo → descanso; upsert em `daily_nutrition_plans`), `GET /api/nutrition/today/swap-options`, `POST /api/nutrition/today/swap` (valida contra as opções), `GET /api/nutrition/history` (dias passados de treino sem sessão → `treino-nao-realizado`), registradas em `apps/api/src/app.ts`; testes em `apps/api/src/__tests__/nutrition-today.test.ts` (incluindo `needs-profile` e `no-phase`)
- [ ] T025 [US1] Seção Hoje em `apps/web/src/app/nutricao/NutricaoClient.tsx` com `apps/web/src/components/nutrition/DayTargets.tsx` (kcal, macros, água), `MealCard.tsx` (itens, porções, badges genéticos, expandir → justificativa), alternância "hoje é descanso"/"hoje tem treino" (`PUT`), horários ancorados na web com `anchorMealTimes` usando `helux:active-workout.startedAt` do `localStorage` e `workoutToday.finishedAt`, `SwapSheet.tsx` (opções + aplicar), aviso "personalização genética inativa" e lista do histórico; estados de carregamento/erro. Testes em `apps/web/src/__tests__/app/nutricao-hoje.test.tsx` e `apps/web/src/__tests__/components/nutrition/*.test.tsx`
- [ ] T026 [US1] Rodar as suítes direcionadas da US1 (`@helux/nutrition`, `nutrition-today` da API, `nutricao-hoje` e componentes de nutrição da web, `design-system-guard`) e commitar

**Checkpoint**: US1 entregável.

---

## Phase 5: User Story 2 — Agente conversacional especialista (Priority: P1)

**Goal**: chat em streaming com o agente, conversa por fase, contexto do dia, genética e fase.

**Independent Test**: perguntar "Qual o melhor pré-treino para mim hoje e posso tomar cafeína?" → resposta em streaming que cita o treino do dia, ADORA2A e a intolerância à lactose (com IA mockada nos testes; validação real no quickstart).

- [ ] T027 [P] [US2] `buildNutritionSystemPrompt({ markers, flags, phase, day })` em `packages/ai/src/nutrition-prompts.ts` devolvendo `{ stable, day }` (contrato `chat-stream.md`): `stable` com persona, regras (zero lactose com `intoleranciaLactose`, justificar com genética, trocas pelo catálogo, sem medicamentos, disclaimer), marcadores com status e conduta e a fase; `day` com data, tipo do dia, plano, treino do dia e cansaço; `stable` sem data/hora. Testes em `packages/ai/src/__tests__/nutrition-prompts.test.ts`
- [ ] T028 [US2] `streamNutritionChat({ system, history, message, onText })` em `packages/ai/src/nutrition-chat.ts` usando `client.beta.messages.stream` com `claude-opus-5-5`, `max_tokens: 4000`, `output_config: { effort: 'low' }`, `betas: ['server-side-fallback-2026-07-01']`, `fallbacks: 'default'`, `system` em dois blocos (o estável com `cache_control: { type: 'ephemeral' }`), últimas 20 mensagens + a nova; repassa `text_delta` em `onText`; usa `finalMessage()` e devolve `{ text, stopReason }`; exportado em `packages/ai/src/index.ts`. Testes em `packages/ai/src/__tests__/nutrition-chat.test.ts` com o SDK mockado (parâmetros enviados, janela de 20, cache só no bloco estável, deltas, refusal)
- [ ] T029 [US2] `GET /api/nutrition/chat` e `POST /api/nutrition/chat` (SSE `start`/`delta`/`done`/`error`, grava a mensagem do usuário antes e a do agente só após `finalMessage`; `refusal` ou erro → `error` sem gravar; `409 no-phase`) em `apps/api/src/routes/nutrition-chat.ts`, registradas em `apps/api/src/app.ts`; testes em `apps/api/src/__tests__/nutrition-chat.test.ts` com `@helux/ai` mockado (sequência de eventos, persistência, janela da fase, fase sem conversa)
- [ ] T030 [US2] Hook `apps/web/src/hooks/useNutritionChat.ts`: carrega o histórico (`GET`), envia com `fetch` + `Authorization` (mesma sessão do `apiFetch`), lê o corpo como `ReadableStream`, faz o parse de `event:`/`data:`, acumula a resposta em andamento, trata `error`; testes em `apps/web/src/__tests__/hooks/useNutritionChat.test.ts` com `fetch` mockado devolvendo um stream
- [ ] T031 [US2] Seção Chat em `apps/web/src/components/nutrition/ChatPanel.tsx` (histórico agrupado por dia, disclaimer fixo, bolha em streaming, enviar desabilitado durante a resposta, aviso de erro, seletor de fases anteriores em modo leitura), usada no `NutricaoClient.tsx`; testes em `apps/web/src/__tests__/components/nutrition/ChatPanel.test.tsx`
- [ ] T032 [US2] Rodar as suítes direcionadas da US2 (`@helux/ai`, `nutrition-chat` da API, `useNutritionChat`, `ChatPanel`, `design-system-guard`) e commitar

**Checkpoint**: US2 entregável.

---

## Phase 6: User Story 3 — Sinergia com cansaço e recuperação (Priority: P2)

**Goal**: com cansaço `cansado`/`exausto`, card de recuperação no topo; com `exausto`, carboidrato peri-treino sem déficit e nota do agente no chat.

**Independent Test**: marcar "exausto" na Home e abrir Nutrição → card "Ajuste Nutricional de Recuperação" e uma nota de recuperação na conversa da fase (spec US3).

- [ ] T033 [US3] `recoveryNote({ tiredness, dayType })` em `packages/nutrition/src/day.ts` (texto determinístico para `exausto`; `null` nos demais), testes em `packages/nutrition/src/__tests__/day.test.ts`; `GET /api/nutrition/today` grava uma mensagem `role: agent, kind: nota-recuperacao` na conversa da fase quando o dia está `exausto` e ainda não há nota hoje, em `apps/api/src/routes/nutrition-today.ts`, testes em `apps/api/src/__tests__/nutrition-today.test.ts` (uma nota por dia; nenhuma em `cansado`/`normal`)
- [ ] T034 [US3] `apps/web/src/components/nutrition/RecoveryCard.tsx` no topo da seção Hoje (hidratação extra, magnésio, B6, anti-inflamatórios, conforme `plan.recovery`) e a nota de recuperação marcada no `ChatPanel.tsx`; testes em `apps/web/src/__tests__/components/nutrition/RecoveryCard.test.tsx` e no teste do `ChatPanel`
- [ ] T035 [US3] Rodar as suítes direcionadas da US3 e commitar

**Checkpoint**: US3 entregável.

---

## Phase 7: User Story 4 — Perfil nutrigenômico e suplementação (Priority: P2)

**Goal**: seção Perfil genético com os marcadores de nutrição e performance em 3 categorias, status e conduta prática.

**Independent Test**: Nutrição › Perfil genético mostra MCM6 (atenção), ADORA2A (favorável), GC/ALPL/WNT16 (atenção), FTO e ACTN3 (favoráveis); tocar em MCM6 abre a conduta (spec US4).

- [ ] T036 [US4] `GET /api/nutrition/genetic-profile` em `apps/api/src/routes/nutrition-genetic-profile.ts` (contrato: `{ active, markers }`; sem `genera.json` → `active: false`), registrada em `apps/api/src/app.ts`, testes em `apps/api/src/__tests__/nutrition-genetic-profile.test.ts`
- [ ] T037 [US4] Seção Perfil genético em `apps/web/src/components/nutrition/NutriProfile.tsx`: 3 grupos (Metabolismo & Sensibilidades · Micronutrientes & Vitaminas · Perfil Muscular & Dieta), cards reaproveitando `apps/web/src/components/dna/TraitCard.tsx` (gene, genótipo, traço, `warn` no status `atencao`) com o status em palavra, toque → `Sheet` com a conduta (recomendar/evitar); estado "perfil genético não carregado"; testes em `apps/web/src/__tests__/components/nutrition/NutriProfile.test.tsx`
- [ ] T038 [US4] Rodar as suítes direcionadas da US4 e commitar

**Checkpoint**: US4 entregável.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T039 Rodar o guard do design system (`apps/web/src/__tests__/design-system-guard.test.ts`) e corrigir qualquer classe/cor fora do v2 nas telas novas
- [ ] T040 Verificação final única: `pnpm test`, `pnpm typecheck`, `pnpm build`; registrar os números no `quickstart.md`
- [ ] T041 Atualizar `specs/018-nutricao-genetica/quickstart.md` com observações finais (medir SC-003 no chat real; `supabase db push` da migration antes do deploy da API; pontos de revisão R5/R9) e `packages/nutrition/README.md` com o uso das funções

---

## Dependencies & Execution Order

- **Setup (T001–T003)** antes de tudo. T002 é independente de T001/T003.
- **Foundational (T004–T008)**: T004 e T005 em paralelo; T006 depende de T004+T005; T007 depende de T004; T008 depende de T004–T006.
- **US0 (T009–T019)** antes de US1–US3 (o dia, o chat e o cansaço precisam da fase). US4 depende só da Fundação e pode vir antes, se preferir.
- **US1 (T020–T026)** antes de US2 (o contexto do dia entra no prompt) e de US3 (o card fica na seção Hoje).
- Dentro de cada story: testes → módulo puro → API → web.

## Parallel Opportunities

- Fundação: T004 ∥ T005 ∥ T007 (arquivos diferentes).
- US0: T009 ∥ T012 ∥ T016 ∥ T017.
- US1: T020 ∥ T022 ∥ T023 (arquivos diferentes do pacote).
- US2: T027 em paralelo com o início de T029 (rotas com `@helux/ai` mockado).

## Implementation Strategy

MVP = Setup + Fundação + US0 (fase de dieta recalibrada — a base de tudo). Depois US1 (o dia, maior valor diário), US2 (agente), US3 e US4. Cada story com commit e suítes direcionadas verdes; suíte completa + typecheck + build uma única vez no fim (T040), por restrição de RAM.
