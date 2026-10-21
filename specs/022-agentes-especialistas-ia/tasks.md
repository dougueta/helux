# Tasks: Time de Agentes Especialistas de IA

**Input**: Design documents from `specs/022-agentes-especialistas-ia/`
**Prerequisites**: plan.md, spec.md, research.md (R0–R13), data-model.md, contracts/ (agents-api, agent-runtime), quickstart.md

**Contexto da branch (2026-10-20)**: a 022 está empilhada sobre 021 → 018. A 018 está integrada (`@helux/nutrition`, `diet_phases`, `daily_nutrition_plans`) e a US2 dela já foi movida para cá (R0 resolvido). A 019 não existe, então a fonte `exames` é declarada e fica sempre `vazia`. O modo mock da 021 (`apps/web/src/mocks/`) precisa ganhar as rotas e o stream simulado da 022 (R12).

**Tests**: TDD obrigatório (constituição, princípio II). Em cada tarefa, o teste vem primeiro e precisa falhar antes da implementação. Testes nunca chamam a Anthropic (`vi.mock('@anthropic-ai/sdk')`). O eval de segurança (T046) usa chamadas reais e roda só sob demanda.

**Antes de escrever código que fala com a Anthropic** (T013, T016, T030, T031, T040, T048): carregar o skill `claude-api` e conferir os parâmetros do Opus 5.5 usados no contrato `agent-runtime.md` (`output_config`, `fallbacks`, `strict`, `eager_input_streaming`, `cache_control.ttl`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Criar `supabase/migrations/20261020120000_specialist_agents.sql` conforme `data-model.md`: tabelas `training_preferences`, `training_preferences_history`, `agent_source_settings`, `agent_conversations` (índice único parcial por canal não arquivado), `agent_messages` (índice `conversation_id, created_at`), `conversation_facts`, `shared_guidance`, `workout_adjustment_proposals`, `session_edits`, `ai_usage_events` (índice `user_id, created_at`), `ai_budget_settings`; colunas `mesocycle_plans.rationale_decisions` e `sources_used` (jsonb null); checks dos enums; RLS `auth.uid() = user_id` em todas
- [X] T002 [P] Tipos de `data-model.md` em `packages/types/src/agents.ts` (AgentKey, Channel, SourceKey + `SOURCE_KEYS` na ordem fixa, SourceStatus, Equipment, Location, TrainingStyle, GuidanceKind/Status, FactCategory, ProposalKind/Status, TrainingPreferences(+Input), IntegratedProfile, HardConstraints, PlanDecision, AgentMessage, ConversationFact, SharedGuidance, WorkoutAdjustmentProposal, SessionChange, SessionEdit, UsageRecord, AgentStreamEvent, BudgetStatus, SourcesUsed), exportados em `packages/types/src/index.ts`; `AdjustedWorkoutPlanView` ganha `rationaleDecisions?` e `sourcesUsed?` opcionais

---

## Phase 2: Foundational (bloqueia as stories)

- [X] T003 [P] `computeCostUsd(usage)` em `packages/ai/src/agents/cost.ts` com a tabela de preços versionada (R11: Opus 5.5 US$ 4/20 por MTok, escrita de cache 1,25× (5 min) ou 2× (1 h), leitura US$ 0,20/MTok; modelo desconhecido → preço do Opus 5.5); testes em `packages/ai/src/__tests__/agents/cost.test.ts`
- [X] T004 [P] `estimateSessionMinutes`, `validatePlanAgainstConstraints` e `compatibleAlternatives` (puros) em `packages/ai/src/agents/constraints.ts` (R7: exercícios por **nome ou id** do banco; aquecimento/volta à calma ignorados; equipamento vazio = todos; 40 s por série + descanso prescrito, ou 90 s, + 5 min de aquecimento; `blockedPatterns`/`blockedExercises`; alternativas com mesmo `muscleGroup` e `pattern`, ou só `muscleGroup` se vazio, marcando `violatesSafety` com o motivo); testes em `packages/ai/src/__tests__/agents/constraints.test.ts`
- [X] T005 [P] `preferenceSignalsFromEdits(edits, now)` (puro) em `packages/ai/src/agents/edit-signals.ts` (trocado ≥ 2× em 60 dias → `evitar-tendencia`; escolhido ≥ 2× → `preferencia`); testes em `packages/ai/src/__tests__/agents/edit-signals.test.ts`
- [X] T006 [P] `renderProfile(profile)` e `renderDay(dayContext)` em `packages/ai/src/agents/render-profile.ts`: fontes na ordem de `SOURCE_KEYS`, chaves ordenadas, só fontes `ativa` com resumo, listas de vazias/desativadas, nada de data/hora no snapshot (R6); `stale` → "(desatualizado)"; testes em `packages/ai/src/__tests__/agents/render-profile.test.ts` (mesma entrada → mesma string; fonte desativada não aparece)
- [X] T007 `ai-budget.service.ts` em `apps/api/src/services/`: `recordUsage(userId, usages, supabase)` (grava `ai_usage_events` com `computeCostUsd`), `budgetStatus(userId, supabase, now)` (mês civil `America/Sao_Paulo`, teto padrão 20) e `assertBudget(...)` (≥ 100% → erro `budget-exceeded`; ≥ 80% → `warning`); testes em `apps/api/src/__tests__/ai-budget.service.test.ts` com `fakeSupabase`
- [X] T008 `integrated-profile.service.ts` em `apps/api/src/services/`: `buildIntegratedProfile(userId, supabase, now)` lê em paralelo as 12 fontes (R6: perfil, preferências, últimas 10 sessões + progressão, mesociclo ativo, cansaço do dia (011), 2 check-ins, genética (`genera.json`), exames = sempre `vazia` (019 ausente), nutrição pela fase ativa + plano do dia (018), relatos não removidos, orientações `ativa` (expiração na leitura, R9), edições → sinais (T005)), aplica `agent_source_settings` (desativada → sem dados) e devolve `{ profile, constraints: HardConstraints, sourcesUsed }`. Absorve `plan-context.service.ts` (mantém as funções que outros arquivos usam, reexportando). Testes em `apps/api/src/__tests__/integrated-profile.service.test.ts`

**Checkpoint**: fundação pronta (commit).

---

## Phase 3: User Story 1 — Treino 100% personalizado (P1) 🎯 MVP

**Goal**: preferências de treino, mesociclo pelo Perfil Integrado com validação de restrições rígidas e justificativa por decisão, edição manual, proposta de adaptação e ajuste em linguagem natural.

**Independent Test**: preferências (45 min, só halteres, evitar agachamento livre, glúteos prioritários) → gerar mesociclo (IA mockada nos testes) → nenhuma violação do validador, justificativa com fontes; editar exercício pendente; pedir "hoje só tenho 30 min" → proposta antes → depois.

- [X] T009 [US1] Rotas `GET/PUT /api/training-preferences` em `apps/api/src/routes/training-preferences.ts` (zod pelo data-model: dias 0–6 sem repetição, 15–180 min, equipamentos do enum, ids do banco, interseção favoritos × evitar proibida, instruções ≤ 1000), gravando `training_preferences_history` com `hard_change`; mudança só suave → `appliesFrom: 'proximo-mesociclo'`; mudança rígida → roda o validador nas sessões pendentes e, se houver violação, gera a proposta de adaptação (T015) respeitando o teto (`budgetBlocked`); registrada em `apps/api/src/app.ts`. Testes em `apps/api/src/__tests__/training-preferences.test.ts`
- [X] T010 [P] [US1] Página `/perfil/preferencias` em `apps/web/src/app/perfil/preferencias/page.tsx` + `PreferencesForm` em `apps/web/src/components/agents/PreferencesForm.tsx` (dias, duração, local, equipamentos, favoritos/evitar com busca no banco, grupos, estilo, instruções; aviso "vale a partir do próximo mesociclo" ou cartão da proposta), serviço em `apps/web/src/services/agents.service.ts`; link no Perfil. Testes em `apps/web/src/__tests__/components/agents/PreferencesForm.test.tsx`
- [X] T011 [US1] Prompt do mesociclo a partir do snapshot em `packages/ai/src/mesocycle-prompts.ts` (`buildAgentMesocyclePrompt({ profile, constraints, daysPerWeek, violations? })`: persona de treino, restrições rígidas explícitas, regra de segurança e conflito (FR-010), pedido de `decisions` com fontes, fontes ausentes/desativadas); testes em `packages/ai/src/__tests__/mesocycle-prompts.test.ts`
- [X] T012 [US1] JSON schema do mesociclo em `packages/ai/src/agents/mesocycle-schema.ts` (`daysPerWeek`, `splitType`, `sessions[].{letter, focus, exercises[]}` com `name` em `enum` dos nomes do banco + fases de aquecimento/volta à calma livres, `rationale`, `decisions[]`); teste de forma em `packages/ai/src/__tests__/agents/mesocycle-schema.test.ts`
- [X] T013 [US1] `generateMesocyclePlan({ profile, constraints, daysPerWeek })` em `packages/ai/src/mesocycle-planner.ts`: `claude-opus-5-5`, `effort: 'medium'`, structured output (T012), fallbacks, validação (T004) + 1 retry com as violações, depois erro `constraints-unsatisfiable`; enriquecimento atual (cues, músculos, variantes) preservado; devolve `{ plan, decisions, usages }`. A assinatura antiga (`PlanInput`) sai. Testes em `packages/ai/src/__tests__/mesocycle-planner.test.ts` (SDK mockado: parâmetros, retry, erro, refusal)
- [X] T014 [US1] `plan-generation.service.ts` usa `buildIntegratedProfile` + o novo planner, grava `rationale_decisions`, `sources_used` e o uso (T007), e respeita o teto (bloqueado → mesociclo atual continua); `daysPerWeek` = `available_days.length` ou 4. `workout-latest-plan.ts` devolve `rationaleDecisions` e `sourcesUsed`. Testes em `apps/api/src/__tests__/plan-generation.service.test.ts` e no teste da rota
- [X] T015 [US1] `proposeSessionAdjustment` em `packages/ai/src/agents/session-adjustment.ts` (IA `effort: medium`, structured output das sessões afetadas, validação + 1 retry, diff no formato da 011) e `proposals.service.ts` em `apps/api/src/services/` (criar proposta `ajuste-sessao`/`adaptacao-restricao` só com sessões pendentes; aceitar → aplica no `mesocycle_plans.sessions`, ou `obsoleta` se `before` mudou; recusar). Rotas `POST /api/workout/adjust` e `POST /api/workout/proposals/:id/{accept,reject}` em `apps/api/src/routes/workout-proposals.ts`. Testes no `packages/ai` e em `apps/api/src/__tests__/workout-proposals.test.ts`
- [X] T016 [US1] Edição manual: `session-edit.service.ts` + rotas `GET .../alternatives` e `PATCH /api/workout/sessions/:index/exercises/:exerciseIndex` em `apps/api/src/routes/workout-session-edit.ts` (concluída → 409 `session-completed`; viola segurança sem `confirmSafetyOverride` → 409 `safety-warning`; grava `session_edits`). Testes em `apps/api/src/__tests__/workout-session-edit.test.ts`
- [X] T017 [US1] Web em `/treinos`: menu por exercício pendente "Trocar" (lista de alternativas) e edição de séries/reps/carga (`SessionEditSheet` em `apps/web/src/components/agents/SessionEditSheet.tsx`, com o aviso de segurança e "salvar mesmo assim"); card "Ajustar treino de hoje" com `ProposalCard` (`apps/web/src/components/agents/ProposalCard.tsx`, antes → depois, aceitar/recusar); justificativa do mesociclo por decisão com fontes (`PlanRationale`). Testes em `apps/web/src/__tests__/components/agents/`

**Checkpoint**: US1 entregável (commit).

---

## Phase 4: User Story 2 — Perfil Integrado e controle (P1)

**Goal**: tela com as fontes, datas, liga/desliga, relatos, restrições, teto e consumo.

**Independent Test**: abrir `/perfil/integrado`, ver as 12 fontes com data/vazia, desligar "exames" → `PUT` grava e o perfil volta com a fonte `desativada`.

- [X] T018 [US2] Rotas `GET /api/agents/profile` (perfil + `budget`), `PUT /api/agents/sources/:source`, `PUT /api/agents/budget`, `PATCH/DELETE /api/agents/facts/:id` e `DELETE /api/agents/guidance/:id` em `apps/api/src/routes/agents-profile.ts`; testes em `apps/api/src/__tests__/agents-profile.test.ts`
- [X] T019 [US2] Página `/perfil/integrado` em `apps/web/src/app/perfil/integrado/page.tsx` + `IntegratedProfileView`/`SourceToggleList` em `apps/web/src/components/agents/` (fontes com status, data e resumo; liga/desliga; relatos editáveis/removíveis; orientações ativas com motivo/origem/prazo e "remover"; teto editável e consumo com aviso de 80%); link no Perfil. Testes em `apps/web/src/__tests__/components/agents/IntegratedProfileView.test.tsx`

**Checkpoint**: US2 entregável (commit).

---

## Phase 5: Runtime de chat (bloqueia US3–US5)

**Goal**: conversa com streaming SSE com o Agente de Treino, ferramentas que só criam pendências, histórico por canal.

- [X] T020 Ferramentas em `packages/ai/src/agents/tools.ts` (`AGENT_TOOLS[agent]` em ordem fixa, `strict`, `additionalProperties: false`, schemas do contrato) e `validateToolInput(name, input)` local; testes em `packages/ai/src/__tests__/agents/tools.test.ts`
- [X] T021 Personas em `packages/ai/src/agents/personas.ts` (`PERSONA.treino`, `.medicina`, `.nutricao`: escopo, regras de segurança, aviso de fontes (FR-004), encaminhamento (FR-020), escopos dos outros especialistas; sem data/hora); testes de conteúdo em `packages/ai/src/__tests__/agents/personas.test.ts`
- [X] T022 `streamAgentReply` em `packages/ai/src/agents/stream-agent.ts` (contrato `agent-runtime.md`: 3 blocos de sistema com cache, `effort: low`, fallbacks, deltas → `onEvent`, laço de ferramentas ≤ 3 com todos os `tool_result` numa mensagem, `refusal`/`max_tokens`, devolve `{ text, apiContent, usages }`); exportado em `packages/ai/src/index.ts`. Testes em `packages/ai/src/__tests__/agents/stream-agent.test.ts` com o stream mockado
- [X] T023 `agent-chat.service.ts` em `apps/api/src/services/` (conversa do canal: buscar/criar/arquivar; últimas 20 mensagens com `api_content`; handlers das ferramentas: relato, orientação `pendente` (só medicina cria `restricao-seguranca`), proposta de ajuste (T015), encaminhamento; grava a resposta com `sources_used` e o uso) e rotas `GET /api/agents/conversations/:channel`, `POST .../:channel/new` e `POST /api/agents/chat` (SSE `start`/`delta`/`fact`/`proposal`/`handoff`/`done`/`error`, teto → 409) em `apps/api/src/routes/agents-chat.ts`. Testes em `apps/api/src/__tests__/agents-chat.test.ts` com `@helux/ai` mockado
- [X] T024 Web: `agents.service.ts` com o leitor de SSE (`fetch` + `ReadableStream`, parse de `event:`/`data:`), hook `useAgentChat(channel)` em `apps/web/src/hooks/useAgentChat.ts` e `AgentChat` em `apps/web/src/components/agents/AgentChat.tsx` (histórico, bolha em streaming, indicação do especialista, cartões de relato/proposta/encaminhamento, "nova conversa", erro e teto). Seção "Falar com o treinador" em `/treinos`. Testes em `apps/web/src/__tests__/hooks/useAgentChat.test.ts` e `.../components/agents/AgentChat.test.tsx`
- [X] T025 Rotas `POST /api/agents/guidance/:id/{accept,reject}` em `apps/api/src/routes/agents-guidance.ts` (`pendente` → `ativa` com `starts_at`/`expires_at`, ou `recusada`; senão 409) + `GuidanceCard` na web; testes em `apps/api/src/__tests__/agents-guidance.test.ts`

**Checkpoint**: chat com o Agente de Treino (commit).

---

## Phase 6: User Story 3 — Medicina Esportiva (P2)

**Goal**: especialista de medicina com triagem, alerta médico e restrições de segurança compartilhadas que o validador respeita.

**Independent Test**: relatar dor no ombro → resposta (mockada) com proposta de restrição; aceitar → `HardConstraints` traz o padrão bloqueado e a edição/geração respeita.

- [X] T026 [P] [US3] `matchesMedicalRedFlag(message)` (puro, lista fechada do R10 com variações sem acento/maiúsculas) em `packages/ai/src/agents/router.ts`; testes com os 11 sinais e falsos positivos em `packages/ai/src/__tests__/agents/router.test.ts`
- [X] T027 [US3] Canal `medicina` no chat (persona, bloco do dia com lesão declarada e cargas recentes) e acesso em `/equipe?agente=medicina` e a partir do campo de lesão no Perfil; restrição aceita entra no `HardConstraints` (`blockedPatterns`/`blockedExercises`) — teste de integração em `apps/api/src/__tests__/integrated-profile.service.test.ts` (SC-007)
- [X] T028 [US3] Eval de segurança em `packages/ai/src/agents/__evals__/medicina.eval.ts` (~20 cenários: 11 sinais + variações + falsos positivos; LLM-juiz verifica "procure atendimento" e ausência de "continue treinando"; script `eval:medicina` em `packages/ai/package.json`, fora do `vitest run`)

**Checkpoint**: US3 entregável (commit).

---

## Phase 7: User Story 4 — Nutrição Genética (P2)

**Goal**: especialista de nutrição na seção Chat de `/nutricao`, com a fonte `nutricao` (018) e as regras genéticas.

**Independent Test**: canal `nutricao` com perfil contendo MCM6 G,G → o snapshot traz a fase, o plano do dia e "sem lactose"; a seção Chat da Nutrição usa o `AgentChat`.

- [X] T029 [US4] Resumo da fonte `nutricao` (fase, metas do dia, tipo do dia, refeições, flags genéticas da 018) em `integrated-profile.service.ts`; a persona de nutrição exige respeitar as flags (lactose) e recomendar profissional para dosagem (FR-017); testes no serviço e em `personas.test.ts`
- [X] T030 [US4] Seção "Chat" volta à aba Nutrição em `apps/web/src/app/nutricao/NutricaoClient.tsx` usando `AgentChat channel="nutricao"`; atualizar `apps/web/src/__tests__/app/nutricao-fase.test.tsx` (seções Hoje · Chat · Fase · Perfil genético)

**Checkpoint**: US4 entregável (commit).

---

## Phase 8: User Story 5 — Equipe Helux (P3)

**Goal**: chat único com roteamento, relatos compartilhados, encaminhamento e conflito de orientações.

**Independent Test**: canal `equipe` → atalho de alerta médico vai para medicina sem chamar o roteador; mensagem comum chama o roteador (mockado) e emite `routed`; aceitar recomendação conflitante com restrição → resposta com `conflict`.

- [X] T031 [US5] `routeMessage` (structured output `{ agent, reason }`, `effort: low`, cache do sistema) em `packages/ai/src/agents/router.ts`; canal `equipe` no `agent-chat.service.ts` (atalho → roteador → especialista, evento `routed`, mensagem do agente guarda o especialista). Testes no `packages/ai` e em `agents-chat.test.ts`
- [X] T032 [US5] `detectGuidanceConflict` em `packages/ai/src/agents/guidance-conflict.ts` e uso no aceite de recomendação (resposta com `conflict`; a recomendação vai ao prompt marcada `em-conflito`); avisos de expiração no bloco do dia; testes em `packages/ai` e `agents-guidance.test.ts`
- [X] T033 [US5] Página `/equipe` em `apps/web/src/app/equipe/page.tsx` (seletor Equipe/Treino/Medicina/Nutrição via `?agente=`), botão "Equipe" no `Shell` e card na Home; `HandoffCard` "continuar com X" troca de canal. Testes em `apps/web/src/__tests__/app/equipe.test.tsx`

**Checkpoint**: US5 entregável (commit).

---

## Phase 9: Modo mock (021) e polimento

- [X] T034 Modo mock (R12): rotas da 022 no `apps/web/src/mocks/routes.ts` (perfil integrado, fontes, teto, preferências, conversas, orientações, propostas, alternativas/edição) com estado no `MockDataset`, e `POST /api/agents/chat` em mock devolvendo um stream SSE simulado (`Response` com `ReadableStream`) a partir de respostas pré-gravadas por agente (incluindo uma proposta e um relato); o leitor de SSE do `agents.service.ts` funciona igual. Testes em `apps/web/src/__tests__/mocks/agents-mock.test.ts`
- [X] T035 Logs por chamada de IA (R13: agente, operação, modelo, latência, `firstTokenMs`, tokens, cache, `stopReason`; sem conteúdo) no `agent-chat.service.ts` e na geração
- [ ] T036 Guard do design system, `pnpm test`, `pnpm typecheck`, `pnpm build`; aplicar a migration (T001) no Supabase se a conexão estiver disponível; atualizar `quickstart.md` com os números e o que ficou para validação manual (latência SC-004a, eval)

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T008; T003–T006 em paralelo; T007 depende de T003; T008 de T005/T006).
- US1 (T009–T017) e US2 (T018–T019) dependem só da fundação.
- Runtime (T020–T025) depende de US1 (T015 para a ferramenta de ajuste).
- US3 (T026–T028) e US4 (T029–T030) dependem do runtime; US5 (T031–T033) de US3 e US4.
- T034–T036 no fim.

## Parallel Opportunities

- Fundação: T003 ∥ T004 ∥ T005 ∥ T006.
- US1: T010 (web) em paralelo com T011–T013 (pacote ai).
- US3: T026 em paralelo com T027.

## Implementation Strategy

MVP = fundação + US1 (treino personalizado com validador). Depois US2 (controle), o runtime de chat, Medicina, Nutrição e Equipe. Commit por fase, com as suítes direcionadas verdes. A suíte completa roda uma vez no fim (T036), por restrição de RAM.
