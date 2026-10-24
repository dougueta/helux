# Tasks: Treino adaptativo de verdade

**Input**: Design documents from `specs/024-treino-adaptativo/`
**Prerequisites**: plan.md, spec.md, research.md (R0–R15), data-model.md, contracts/api.md, contracts/agent-runtime.md, quickstart.md

**Tests**: obrigatórios (Constituição II — TDD). Toda tarefa de teste vem antes da implementação correspondente e precisa ser vista falhando (RED) antes de implementar.

**Organização**: fases na ordem de entrega do plano (F0–F5, um PR por fase). Cada tarefa leva o rótulo da história da spec que atende. A US6 aparece em duas fases: genética (F1) e dados de sessão (F4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US8 da spec

## Convenções de caminho

- Pacotes: `packages/{types,workouts,ai,genetics}/src/`, testes em `src/__tests__/`
- API: `apps/api/src/{routes,services}/`, testes em `apps/api/src/__tests__/`
- Web: `apps/web/src/{app,components,hooks,services,mocks}/`, testes em `apps/web/src/__tests__/`
- Migrations: `supabase/migrations/`

---

## Phase 1: Setup

**Purpose**: linha de base e pré-requisitos comuns.

- [X] T001 Rodar `pnpm install --frozen-lockfile`, `pnpm typecheck` e `pnpm test` na branch `024-treino-adaptativo` e registrar a contagem por workspace em `specs/024-treino-adaptativo/tasks.md` (nota abaixo de T001) como linha de base de regressão
  - **Linha de base (2026-10-24):** typecheck 9/9; testes types 17, genetics 34, mobile 17, workouts 100, health 27, nutrition 76, ai 187, api 262, web 595.
- [X] T002 [P] Criar a pasta `packages/ai/src/agents/__evals__/results/` com `.gitkeep` e uma entrada no `.gitignore` que ignora `*.local.json` (resultados de rodadas locais), mantendo versionados só os resultados aprovados

---

## Phase 2: Foundational (bloqueia as fases seguintes)

**Purpose**: tipos compartilhados usados por mais de uma fase.

- [X] T003 Escrever teste de tipos em `packages/types/src/__tests__/types.test.ts` cobrindo `Goal`, `Region`, `SessionKind`, `HealthCondition`, `ConditionRules`, `MethodPrescription`, `SessionCheckin`, `CycleSummary`, `CheckinTrend`, `GenerationStatus` e os campos opcionais novos de `MesocycleSession`, `PlannedExercise`, `AdjustedWorkoutPlanView` e `HardConstraints` (conforme data-model.md)
- [X] T004 [P] Criar `packages/types/src/conditions.ts` (Goal, Region, HealthCondition, ConditionRules)
- [X] T005 [P] Criar `packages/types/src/method.ts` (SessionKind, MethodPrescription)
- [X] T006 [P] Criar `packages/types/src/cycle.ts` (SessionCheckin, CycleFinding, CycleSummary, CheckinTrend, GenerationStatus)
- [X] T007 Evoluir `packages/types/src/agents.ts` (HardConstraints + `maxJointStress`, `maxCardioImpact`, `minRir`; novas regras de `ConstraintViolation`; tópicos de `PlanDecision` + `condicao`, `cardio`, `mobilidade`, `ciclo`), `packages/types/src/mesocycle.ts` (`week`, `kind`, `deload`; view com `week`, `kind`, `status` novos, `generation`), `packages/types/src/workout.ts` (`rirTarget`, `cardio`, `region`) e `packages/types/src/profile.ts` (objetivo estruturado, cardio, onboarding); exportar tudo em `packages/types/src/index.ts`. Ajustar os usos existentes de `HardConstraints` (API, web, mocks, testes) com os campos novos vazios para manter o typecheck verde

**Checkpoint**: `pnpm typecheck` e `pnpm test` iguais à linha de base de T001.

---

## Phase 3: User Story 8 — Qualidade medida, linha de base (Priority: P3, entregue primeiro — F0)

**Goal**: medir o Agente de Treino atual antes de qualquer mudança (SC-004).

**Independent Test**: `pnpm --filter @helux/ai eval:treino` gera a tabela perfil × critério com custo e salva o resultado.

- [X] T008 [US8] Escrever testes unitários (sem IA real) em `packages/ai/src/__tests__/agents/treino-eval-scoring.test.ts` para a pontuação determinística: segurança = 0 com qualquer violação; checagem de frequência por grupo, séries semanais por grupo, presença de cardio/mobilidade e estrutura; agregação por critério e custo pela tabela de preços (`agents/cost.ts`)
- [X] T009 [US8] Implementar `packages/ai/src/agents/__evals__/treino-scoring.ts` (checagens determinísticas + agregação) até T008 passar; as checagens de método aceitam prescrição ausente (agente atual) e pulam o que não se aplica
- [X] T010 [P] [US8] Criar `packages/ai/src/agents/__evals__/treino-profiles.ts` com os perfis 1–5 de research R15 como `IntegratedProfile` + `HardConstraints` (perfil 6, ciclo concluído, entra em T107); dados do dono anonimizados
- [X] T011 [US8] Criar `packages/ai/src/agents/__evals__/treino.eval.ts`: gera um plano por perfil com o agente vigente, aplica `treino-scoring.ts`, chama o juiz (Opus 5.5, `effort: 'low'`, structured output `{ scores, comments }` para objetivo, justificativas, genética proporcional e notas honestas), imprime a tabela e o custo, grava `results/<data>-<git-sha>.local.json` e compara com o último resultado aprovado; antes de rodar, imprime o custo estimado e exige `EVAL_CONFIRM=1`
- [X] T012 [US8] Adicionar o script `eval:treino` em `packages/ai/package.json` (mesmo padrão de `eval:medicina`)
- [X] T013 [US8] Rodar a linha de base com aprovação do dono, revisar a tabela com ele e versionar como `packages/ai/src/agents/__evals__/results/baseline.json`; anotar o resumo em research.md (R15)

**Checkpoint F0**: linha de base aprovada → PR F0.

---

## Phase 4: User Story 6 (parte 1) — Genética privada e em produção (Priority: P2 — F1)

**Goal**: laudo genético por usuário no banco, fora do repositório público, disponível em produção, com força de evidência por traço.

**Independent Test**: com laudo enviado, `GET /genetic-profile` e o Perfil Integrado em produção mostram a genética; o arquivo não existe mais no repositório.

- [X] T014 [US6] Criar migration `supabase/migrations/20261025000000_024_f1_genetics_generation.sql` com `genetic_reports` e `mesocycle_generation` (data-model.md), RLS e policies
- [X] T015 [P] [US6] Escrever testes em `packages/genetics/src/__tests__/evidence.test.ts`: cada traço de `parseGeneraTraits` recebe `evidence` (`forte` | `moderada` | `fraca`) por gene a partir de uma tabela fixa; traço desconhecido → `fraca`
- [X] T016 [US6] Implementar a tabela de força de evidência e o campo `evidence` em `packages/genetics/src/traits.ts` até T015 passar
- [X] T017 [P] [US6] Escrever testes em `apps/api/src/__tests__/genetics.service.test.ts` para `getGeneticReport(userId, supabase)` (lê de `genetic_reports`, devolve base + traços ou null) e `saveGeneticReport` (valida com o parser; inválido → erro `invalid-report`)
- [X] T018 [US6] Implementar `apps/api/src/services/genetics.service.ts` até T017 passar
- [X] T019 [US6] Escrever testes em `apps/api/src/__tests__/genetics-report.test.ts` para `POST /api/genetics/report` (201, 400 `invalid-report`, 401, limite de 1 MB) e `DELETE /api/genetics/report` (204)
- [X] T020 [US6] Implementar `apps/api/src/routes/genetics-report.ts` e registrar em `apps/api/src/app.ts` até T019 passar
- [X] T021 [US6] Atualizar os testes de `genetic-profile.test.ts`, `nutrition-genetic-profile.test.ts`, `nutrition-context.service.test.ts` e `integrated-profile.service.test.ts` para esperar leitura do banco por usuário (sem laudo → 404 `no-genetic-report` nas rotas; fonte `vazia` no perfil)
- [X] T022 [US6] Trocar a leitura de `GENERA_PATH` por `genetics.service` em `apps/api/src/routes/genetic-profile.ts`, `apps/api/src/routes/nutrition-genetic-profile.ts`, `apps/api/src/services/nutrition-context.service.ts` e `apps/api/src/services/integrated-profile.service.ts`; no resumo da genética do Perfil Integrado, listar só traços `forte`/`moderada` com a força indicada; T021 verde
- [X] T023 [US6] Trocar o pré-requisito do e2e (`apps/api/e2e/prerequisites.ts`) e o fixture do modo mock (`apps/web/src/mocks/fixtures/genetics.fixture.ts`) por um laudo fictício em `apps/api/e2e/fixtures/genera.fake.json`, semeado em `genetic_reports` no setup do e2e
- [X] T024 [US6] Remover `data/genetics/genera.json` do repositório (`git rm`); confirmar com `git grep -n "genera.json"` que nenhum código depende do arquivo
- [X] T025 [P] [US6] Escrever teste em `apps/web/src/__tests__/components/perfil/GeneticReportUpload.test.tsx`: escolhe arquivo, envia, mostra sucesso/erro e permite remover
- [X] T026 [US6] Implementar `apps/web/src/components/perfil/GeneticReportUpload.tsx` e incluí-lo em `apps/web/src/app/perfil/page.tsx` (seção Genética) + serviço em `apps/web/src/services/genetics.service.ts` e rota no modo mock (`apps/web/src/mocks/routes.ts`); T025 verde

---

## Phase 5: User Story 7 — Gerador único, robusto e de máxima qualidade (Priority: P2 — F1)

**Goal**: um só caminho de geração, autenticado, com estado, nova tentativa e detecção de resposta cortada.

**Independent Test**: `POST /workout/generate` responde 404; "Gerar novo plano" gera e salva na conta; falha simulada leva a nova tentativa e ao estado `generation-failed` com "Repetir a última semana".

- [X] T027 [US7] Escrever testes em `packages/ai/src/__tests__/mesocycle-planner.test.ts`: `stop_reason: 'max_tokens'` → nova tentativa e, persistindo, `IncompleteResponseError`; pedido com `effort: 'xhigh'` e `max_tokens: 64000`
- [X] T028 [US7] Implementar em `packages/ai/src/mesocycle-planner.ts` (e exportar `IncompleteResponseError` em `packages/ai/src/index.ts`) até T027 passar
- [X] T029 [P] [US7] Escrever testes em `apps/api/src/__tests__/generation-status.service.test.ts`: transições `gerando`/`ok`/`falhou`, `attempts` até 3, `gerando` há > 10 min conta como falha, `shouldRetry(status, now)`
- [X] T030 [US7] Implementar `apps/api/src/services/generation-status.service.ts` até T029 passar
- [X] T031 [US7] Estender `apps/api/src/__tests__/plan-generation.service.test.ts`: `generateAndSaveMesocycle` marca `gerando` ao começar, `ok` ao salvar e `falhou` com `error_code` (`constraints-unsatisfiable`, `incomplete-response`, `budget-exceeded`, `refusal`, `unknown`)
- [X] T032 [US7] Integrar o estado em `apps/api/src/services/plan-generation.service.ts` até T031 passar
- [X] T033 [US7] Estender `apps/api/src/__tests__/workout-latest-plan.test.ts`: mesociclo concluído sem próximo → dispara geração quando `shouldRetry`; devolve `status: 'generating'` ou `'generation-failed'` com `generation`
- [X] T034 [US7] Implementar em `apps/api/src/routes/workout-latest-plan.ts` até T033 passar
- [X] T035 [US7] Escrever testes em `apps/api/src/__tests__/mesocycle-actions.test.ts` para `POST /workout/mesocycle/regenerate` (202, 409 `already-generating`, 402 `budget-exceeded`, 401) e `POST /workout/mesocycle/repeat-week` (201 copia a última semana do ciclo concluído com `completedAt` nulo; 409 `no-completed-cycle`); o 409 `onboarding-required` entra em T063
- [X] T036 [US7] Implementar `apps/api/src/routes/mesocycle-actions.ts` e registrar em `apps/api/src/app.ts` até T035 passar
- [X] T037 [US7] Remover `apps/api/src/routes/workout-generate.ts`, seu registro em `app.ts` e `apps/api/src/__tests__/workout-generate.test.ts`; adicionar teste em `apps/api/src/__tests__/mesocycle-actions.test.ts` garantindo `POST /workout/generate` → 404
- [X] T038 [US7] Remover `packages/ai/src/planner.ts` e o que só ele usa em `packages/ai/src/prompts.ts` (manter `buildExerciseCatalogSection`), seus testes e exports; `pnpm --filter @helux/ai test` verde
- [X] T039 [US7] Atualizar testes em `apps/web/src/__tests__/hooks/useWorkoutPlan.test.ts`: `generatePlan` chama `POST /workout/mesocycle/regenerate` e passa a acompanhar `latest-plan` até sair de `generating`; nada de plano gerado gravado em `localStorage`; `repeatWeek()` chama a rota nova
- [X] T040 [US7] Reescrever `generatePlan` e adicionar `repeatWeek` em `apps/web/src/hooks/useWorkoutPlan.ts`; remover `generatePlan` legado de `apps/web/src/services/workout.service.ts`; rotas novas no modo mock (`apps/web/src/mocks/routes.ts`); T039 verde
- [X] T041 [US7] Escrever testes em `apps/web/src/__tests__/app/HomeClient.test.tsx` e `apps/web/src/__tests__/app/TreinosClient.test.tsx` para os estados `generating` ("gerando seu próximo ciclo"), `generation-failed` (mensagem + "Tentar de novo" + "Repetir a última semana")
- [X] T042 [US7] Implementar os estados em `apps/web/src/app/HomeClient.tsx` e `apps/web/src/app/treinos/TreinosClient.tsx` até T041 passar

**Checkpoint F1**: quickstart F1 ok; CI verde → PR F1 (migration F1 aplicada antes do deploy da API).

---

## Phase 6: User Story 1 — Onboarding (Priority: P1 — F2)

**Goal**: objetivo, experiência, condições, disponibilidade e cardio coletados antes do primeiro mesociclo, com retomada e pré-preenchimento.

**Independent Test**: usuário novo conclui o onboarding e só então o plano é gerado; usuário atual vê os campos pré-preenchidos.

- [X] T043 [US1] Criar migration `supabase/migrations/20261026000000_024_f2_onboarding_conditions.sql`: colunas de objetivo/cardio/onboarding em `user_training_profile`, tabela `health_conditions`, coluna `condition_id` em `shared_guidance` (data-model.md), RLS e checks
- [X] T044 [US1] Escrever testes em `apps/api/src/__tests__/onboarding.test.ts` para `GET /api/onboarding` (pré-preenche com perfil, preferências, condições e sugestões a partir de `goal`/`current_injury`), `PUT /api/onboarding` (parcial por passo, salva `onboarding_step`, valida enum e `goal_secondary ≠ goal_primary`, `cardio_likes ∩ cardio_avoid = ∅`) e `POST /api/onboarding/complete` (400 `onboarding-incomplete` com `missing`)
- [X] T045 [US1] Implementar `apps/api/src/routes/onboarding.ts` (reaproveitando os serviços de perfil e preferências da 008/022) e registrar em `app.ts` até T044 passar
- [X] T046 [US1] Estender `apps/api/src/__tests__/profile.test.ts` para os campos novos de objetivo em `GET/POST /api/profile`, e implementar em `apps/api/src/routes/profile.ts`
- [X] T047 [P] [US1] Escrever testes em `apps/web/src/__tests__/app/onboarding.test.tsx`: 6 passos (objetivo → experiência/pausa → condições → disponibilidade/equipamentos → cardio → revisão), salva a cada passo, retoma do `step` salvo, mostra o texto antigo de objetivo/lesão como sugestão, "Concluir" chama `complete` e leva à Home
- [X] T048 [US1] Implementar `apps/web/src/app/onboarding/page.tsx` e `OnboardingClient.tsx` (passos como componentes em `apps/web/src/components/onboarding/`), reaproveitando os campos de `PreferenciasClient.tsx`; o passo de condições usa o componente de T060; serviço `apps/web/src/services/onboarding.service.ts`; rotas no modo mock; T047 verde

---

## Phase 7: User Story 2 — Condições de saúde viram regras (Priority: P1 — F2)

**Goal**: catálogo com regras fixas, "outra" com regras aceitas, crise de gota e validador articular.

**Independent Test**: o caso do dono (LCA ×3, artrose E, gota) gera plano sem nenhuma violação; crise de gota no joelho adapta o treino do dia.

- [X] T049 [US2] Escrever testes em `packages/workouts/src/__tests__/conditions.test.ts`: `CONDITION_CATALOG` com as 8 chaves de R1; `rulesFor(condition)` por status (`ativa` reduz o limite em 1, `resolvida` desliga); `mergeRules` fica com a regra mais restritiva de cada campo; crise ativa → região com limite 0 e impacto 0; crise vencida não vale
- [X] T050 [US2] Implementar `packages/workouts/src/conditions.ts` e exportar em `packages/workouts/src/index.ts` até T049 passar
- [X] T051 [P] [US2] Escrever testes em `packages/ai/src/__tests__/cardio-bank.test.ts`: ids únicos, impacto 0–2, carga articular, ao menos 4 opções de impacto 0
- [X] T052 [P] [US2] Implementar `packages/ai/src/cardio-bank.ts` (lista de R6) e exportar em `packages/ai/src/index.ts` até T051 passar
- [X] T053 [US2] Estender `packages/ai/src/__tests__/agents/constraints.test.ts`: violação `carga-articular` quando `stress[região] > maxJointStress[região]`; `impacto` para item de cardio acima de `maxCardioImpact`; `esforco` quando `rirTarget < minRir`; `compatibleAlternatives` exclui alternativas acima do limite articular
- [X] T054 [US2] Implementar em `packages/ai/src/agents/constraints.ts` até T053 passar
- [X] T055 [US2] Escrever testes em `packages/ai/src/__tests__/agents/condition-rules.test.ts` para `proposeConditionRules(condition)` (Agente de Medicina, structured output com `blockedPatterns`, `blockedExercises`, motivo; SDK mockado; recusa → lista vazia + aviso)
- [X] T056 [US2] Implementar `packages/ai/src/agents/condition-rules.ts` até T055 passar
- [X] T057 [US2] Escrever testes em `apps/api/src/__tests__/conditions.test.ts` para `GET/POST/PATCH/DELETE /api/conditions` (catálogo devolve `rules`; "outra" cria `shared_guidance` pendentes com `condition_id`; DELETE remove as orientações ligadas) e `POST/DELETE /api/conditions/:id/flare` (só `gota`; prazo padrão +5 dias)
- [X] T058 [US2] Implementar `apps/api/src/routes/conditions.ts` e registrar em `app.ts` até T057 passar
- [X] T059 [US2] Estender `apps/api/src/__tests__/integrated-profile.service.test.ts`: fonte `perfil` inclui objetivo estruturado e condições ativas com regras; `HardConstraints` recebe `maxJointStress`, `maxCardioImpact`, `minRir` e padrões/exercícios das condições (catálogo + orientações aceitas + crise); implementar em `apps/api/src/services/integrated-profile.service.ts`
- [X] T060 [P] [US2] Escrever testes em `apps/web/src/__tests__/components/conditions/ConditionsEditor.test.tsx`: escolher do catálogo com região/lado/quantidade/estado, ver as regras, criar "outra" e ver regras pendentes com aceitar/recusar, marcar e encerrar crise de gota
- [X] T061 [US2] Implementar `apps/web/src/components/conditions/ConditionsEditor.tsx`, a página `apps/web/src/app/perfil/condicoes/page.tsx` e o serviço `apps/web/src/services/conditions.service.ts`; link no Perfil; rotas no modo mock; T060 verde
- [X] T062 [US2] (Desvio: ficou em `packages/ai/src/agents/safety-adjustment.ts`, porque depende do banco de exercícios.) Escrever testes em `packages/workouts/src/__tests__/pain-adjustment.test.ts` para `adaptSessionForRegions(session, regions, constraints)`: troca exercícios principais que carregam a região por alternativa de menor carga articular (via `compatibleAlternatives`) ou remove, devolvendo `ExerciseAdjustmentChange[]` e motivo; implementar `packages/workouts/src/pain-adjustment.ts`
- [X] T063 [US2] Estender `apps/api/src/__tests__/workout-latest-plan.test.ts` e `mesocycle-actions.test.ts`: crise de gota ativa adapta a sessão do dia (via T062) junto com o ajuste de cansaço; sem mesociclo pendente e onboarding não concluído → `status: 'onboarding-required'` e geração não dispara; `regenerate` → 409 `onboarding-required`; implementar em `workout-latest-plan.ts`, `mesocycle-actions.ts` e `plan-generation.service.ts`
- [X] T064 [US2] Testes e implementação na web: Home e Treinos levam ao onboarding com `onboarding-required` (`HomeClient.tsx`, `TreinosClient.tsx`); aviso "procure o médico" quando a crise passou do prazo, com "a crise acabou" (`apps/web/src/components/conditions/FlareNotice.tsx`)
- [X] T065 [US2] (Decisão: absorvido pelo eval completo da F3, T086, para medir o agente final numa rodada só.) Rodar o eval (aprovação do custo) e confirmar segurança 5/5 nos perfis com condições; registrar o resultado em `results/` e a comparação com a linha de base

**Checkpoint F2**: quickstart F2 ok → PR F2 (migration F2 antes da API).

---

## Phase 8: User Story 3 — Mesociclo semanal com força, cardio e mobilidade (Priority: P1 — F3)

**Goal**: prescrição de método determinística, semana-modelo pela IA, expansão em 4–6 semanas com deload, cardio e mobilidade nos dias certos.

**Independent Test**: o mesociclo do dono tem 4 semanas com deload, cada grupo ≥ 2×/semana, cardio de impacto 0 e bloco de mobilidade; a UI mostra "semana 1 de 4" e o tipo do dia.

- [X] T066 [US3] Criar migration `supabase/migrations/20261027000000_024_f3_mesocycle_weekly.sql`: `format`, `weeks`, `method`, `goal_primary` em `mesocycle_plans`
- [X] T067 [US3] Escrever testes em `packages/workouts/src/__tests__/method.test.ts` para `prescribeMethod`: semanas (4 iniciante/retorno ≥ 3 meses; 6 intermediário/avançado), deload na última; divisões permitidas por dias de força; `minFrequencyPerGroup = 2` para hipertrofia/condicionamento com 3+ dias; faixas de séries semanais por nível; retorno de pausa começa no piso e sobe ~20%/semana; RIR por semana por objetivo e deload RIR 4; cardio por objetivo filtrado por `maxCardioImpact`; ao menos 1 sessão de mobilidade; `minRir` das condições respeitado; modificadores aplicados e listados
- [X] T068 [US3] Implementar `prescribeMethod` em `packages/workouts/src/method.ts` até T067 passar
- [X] T069 [US3] Escrever testes em `packages/workouts/src/__tests__/method.test.ts` para `validateAgainstMethod(template, method)`: violações `metodo-frequencia` (por grupo principal), `metodo-volume` (séries semanais fora da faixa), `metodo-cardio`, `metodo-mobilidade`, `metodo-estrutura` (nº de dias de força ≠ prescrito)
- [X] T070 [US3] Implementar `validateAgainstMethod` até T069 passar
- [X] T071 [US3] Escrever testes para `expandWeeks(template, method)`: gera N semanas em ordem, aplica `setsFactor` e `rirTarget` por semana, marca `week`/`kind`/`deload`, deload com ~50–60% do volume, `completedAt` nulo, preserva fases e bisets
- [X] T072 [US3] Implementar `expandWeeks` até T071 passar
- [X] T073 [US3] Estender `packages/ai/src/__tests__/agents/mesocycle-schema.test.ts`: schema da semana-modelo (contracts/agent-runtime.md) com `kind`, item principal com `rirTarget`, item de cardio com `modality` ∈ `CARDIO_BANK`, item de mobilidade com `region`; tópicos novos de decisão
- [X] T074 [US3] Implementar o schema em `packages/ai/src/agents/mesocycle-schema.ts` até T073 passar
- [X] T075 [US3] Escrever testes em `packages/ai/src/__tests__/mesocycle-prompts.test.ts`: o bloco de método não tem "OBRIGATÓRIO" em caixa-alta, traz o papel da genética como ajuste fino, as regras de escrita das notas e o posicionamento de cardio/mobilidade; o pedido inclui a prescrição de método, as regras das condições, a progressão de carga e, no retry, as violações (de restrições e de método)
- [X] T076 [US3] Reescrever `packages/ai/src/mesocycle-prompts.ts` (`buildTrainingMethod`, `buildMesocycleRequest`) até T075 passar
- [X] T077 [US3] Estender `packages/ai/src/__tests__/mesocycle-planner.test.ts`: entrada com `method` e `conditions`; valida restrições + método; retry com as duas listas de violações; devolve `weekTemplate`; cardio e mobilidade não recebem enriquecimento de catálogo de força
- [X] T078 [US3] Implementar em `packages/ai/src/mesocycle-planner.ts` até T077 passar
- [X] T079 [US3] Estender `apps/api/src/__tests__/plan-generation.service.test.ts`: monta a prescrição a partir de perfil/preferências/condições, gera a semana-modelo, expande, aplica a progressão de carga e grava `format: 'semanal'`, `weeks`, `method`, `goal_primary`
- [X] T080 [US3] Implementar em `apps/api/src/services/plan-generation.service.ts` até T079 passar
- [X] T081 [US3] Estender `apps/api/src/__tests__/workout-latest-plan.test.ts`: view com `week { current, total, deload }` e `kind` derivados da sessão pendente; planos `rotacao` sem `week`; implementar em `workout-latest-plan.ts`
- [ ] T082 [P] [US3] Escrever testes na web: `PlanExerciseList` mostra RIR alvo ("deixe 2 repetições na reserva"), itens de cardio (modalidade, minutos, zona) e de mobilidade (região); Home/Treinos mostram "semana X de N", deload e o tipo do dia (`apps/web/src/__tests__/components/workout/PlanExerciseList.test.tsx`, `HomeClient.test.tsx`, `TreinosClient.test.tsx`)
- [ ] T083 [US3] Implementar em `apps/web/src/components/workout/PlanExerciseList.tsx`, `HomeClient.tsx` e `TreinosClient.tsx` até T082 passar
- [ ] T084 [US3] Testes e implementação no treino ativo (`apps/web/src/app/workout/page.tsx`, `apps/web/src/hooks/useActiveWorkout.ts`): item de cardio com cronômetro de minutos e "concluído" (sem séries), item de mobilidade como checklist; sessão `kind: 'cardio'`/`'mobilidade'` salva sem exigir séries de força (ajustar o `superRefine` de `workout-sessions.ts` com teste)
- [ ] T085 [US3] Atualizar fixtures e rotas do modo mock com um mesociclo semanal (`apps/web/src/mocks/fixtures/workouts.fixture.ts`, `routes.ts`) e o e2e `apps/api/e2e/mesocycle-flow.e2e.ts` para o formato semanal com a IA simulada (`fake-anthropic.ts`)
- [ ] T086 [US3] Atualizar `treino.eval.ts`/`treino-scoring.ts` para usar a prescrição nas checagens; rodar o eval com `high`, `xhigh` e `max` (aprovação do custo), escolher o effort e registrar a decisão em research.md R12; confirmar SC-001/002/003 e total ≥ linha de base

**Checkpoint F3**: quickstart F3 ok → PR F3.

---

## Phase 9: User Story 4 — Sensações antes e depois (Priority: P2 — F4)

**Goal**: check-ins de sensação ligados às sessões; dor no "antes" adapta a sessão do dia.

**Independent Test**: dor 2 no joelho antes do treino troca os exercícios de joelho com explicação; o histórico mostra RPE e sensações.

- [ ] T087 [US4] Criar migration `supabase/migrations/20261028000000_024_f4_session_checkins.sql`: tabela `session_checkins` e coluna `review_status` em `workout_sessions`
- [ ] T088 [US4] Escrever testes em `apps/api/src/__tests__/session-checkins.test.ts` para `POST /api/session-checkins` (valida faixas por fase; único por dia/fase/sessão; energia do "antes" grava o cansaço do dia quando ainda não marcado; dor em região com condição → `adjustment` via `adaptSessionForRegions`) e para `POST /api/workouts/sessions` ligando `checkinIds`
- [ ] T089 [US4] Implementar `apps/api/src/routes/session-checkins.ts` (registrar em `app.ts`) e a ligação em `workout-sessions.ts`; `workout-latest-plan.ts` aplica a dor do check-in de antes do dia; T088 verde
- [ ] T090 [P] [US4] Escrever testes em `apps/web/src/__tests__/components/workout/PreWorkoutCheckin.test.tsx` e `PostWorkoutCheckin.test.tsx`: 4 toques + "pular"; seletor de região de dor com intensidade; após enviar o "antes", a sessão mostra as trocas e o motivo
- [ ] T091 [US4] Implementar `apps/web/src/components/workout/PreWorkoutCheckin.tsx` (abre ao iniciar em `workout/page.tsx`) e `PostWorkoutCheckin.tsx` (em `WorkoutDoneScreen.tsx`, antes de salvar); serviço `apps/web/src/services/session-checkins.service.ts`; rotas no modo mock; T090 verde
- [ ] T092 [US4] Testes e implementação no histórico: `apps/web/src/app/history/[id]/page.tsx` e a lista de sessões mostram RPE, sensação e dores; `GET /api/workouts/history` inclui os check-ins ligados (teste em `workout-history.test.ts`)

---

## Phase 10: User Story 6 (parte 2) — Dados de sessão confiáveis e notas honestas (Priority: P2 — F4)

**Goal**: sessões suspeitas fora dos cálculos e revisáveis; notas sem raciocínio interno.

**Independent Test**: as sessões de 84–167 s do dono aparecem em "Revisar treinos" e não entram na progressão.

- [ ] T093 [US6] Escrever testes em `packages/workouts/src/__tests__/session-validity.test.ts` para `sessionValidity` (R9: < 3 séries, sem séries, `duration_s` < 600 → suspeita com motivos; `review_status = 'confirmada'` → válida); implementar `packages/workouts/src/session-validity.ts`
- [ ] T094 [US6] Estender os testes de `integrated-profile.service.test.ts`, `plan-generation.service.test.ts` (progressão de carga) e `progression.test.ts`: sessões suspeitas não confirmadas ficam fora do histórico do Perfil Integrado, da regra de variedade e da progressão; implementar nos três pontos
- [ ] T095 [US6] Escrever testes em `apps/api/src/__tests__/workout-review.test.ts` para `GET /api/workouts/review`, `POST /api/workouts/:id/confirm` e `DELETE /api/workouts/:id` (só do próprio usuário); implementar `apps/api/src/routes/workout-review.ts` e registrar
- [ ] T096 [US6] Testes e implementação da tela "Revisar treinos" (`apps/web/src/components/progress/ReviewSessions.tsx` em `apps/web/src/app/recovery/page.tsx`, com aviso quando houver suspeitas): "É real" / "Excluir" com confirmação; rotas no modo mock
- [ ] T097 [US6] Adicionar ao `treino-scoring.ts` uma checagem determinística de notas (sem datas `\d{4}-\d{2}-\d{2}`, sem "usad[oa] (recentemente|em)", sem "evite .* nesta sessão") e ao juiz o critério `notas-honestas`; teste em `treino-eval-scoring.test.ts`

**Checkpoint F4**: quickstart F4 ok → PR F4.

---

## Phase 11: User Story 5 — Análise do ciclo inteiro (Priority: P2 — F5)

**Goal**: resumo do ciclo e próximo mesociclo gerado a partir dos achados e da tendência dos check-ins.

**Independent Test**: o perfil "ciclo concluído" gera um resumo com estagnação, dor recorrente e baixa aderência, e o próximo ciclo trata os três.

- [ ] T098 [US5] Criar migration `supabase/migrations/20261029000000_024_f5_cycle_analyses.sql`: tabela `cycle_analyses`
- [ ] T099 [US5] Escrever testes em `packages/workouts/src/__tests__/checkin-trend.test.ts` para `checkinTrend` (deltas por mês; implausíveis de R10 sem modificador; modificadores por objetivo da tabela R10; meta atingida → `suggestGoalChange`); implementar `packages/workouts/src/checkin-trend.ts`
- [ ] T100 [US5] Escrever testes em `packages/workouts/src/__tests__/cycle-analysis.test.ts` para `analyzeCycle`: aderência por `kind`; e1RM inicial/final por exercício; RPE médio por semana; dores por região e por exercício; cansaço médio; achados `estagnacao` (e1RM ≤ +2% com RPE ≥ 8), `dor-recorrente` (≥ 2 relatos no mesmo exercício/região), `baixa-aderencia` (< 60% de um tipo), `progresso`, `cansaco-alto`; `missingData` quando faltam check-ins; ignora sessões suspeitas
- [ ] T101 [US5] Implementar `packages/workouts/src/cycle-analysis.ts` até T100 passar
- [ ] T102 [US5] Estender `method.test.ts`: achados e tendência viram modificadores (`baixa-aderencia` de cardio → formato alternativo; `estagnacao` → troca de faixa/variação; `cansaco-alto` → volume no piso) e exercícios com `dor-recorrente` viram bloqueados no próximo ciclo; implementar em `method.ts`
- [ ] T103 [US5] Estender `plan-generation.service.test.ts` e `mesocycle-prompts.test.ts`: ao concluir o ciclo, roda `analyzeCycle`, grava `cycle_analyses`, aplica modificadores, envia os achados e a tendência no pedido e liga `next_mesocycle_id`; decisões com tópico `ciclo`; sugestão de troca de objetivo não é aplicada sem aceite; implementar em `plan-generation.service.ts` e `mesocycle-prompts.ts`
- [ ] T104 [US5] Escrever testes e implementar `GET /workout/mesocycle/:id/analysis` em `apps/api/src/routes/mesocycle-actions.ts`
- [ ] T105 [P] [US5] Escrever testes em `apps/web/src/__tests__/components/cycle/CycleSummary.test.tsx`: aderência por tipo, evolução por exercício, dores, tendência dos check-ins, dados que faltaram, e "o que mudou no próximo ciclo" a partir das decisões `ciclo`; sugestão de novo objetivo com aceitar/recusar
- [ ] T106 [US5] Implementar `apps/web/src/components/cycle/CycleSummary.tsx`, exibido na Home ao iniciar um ciclo novo e acessível em Treinos; rotas no modo mock; T105 verde
- [ ] T107 [US5] Adicionar o perfil 6 ("ciclo concluído" com estagnação no agachamento, dor recorrente no leg press e baixa aderência ao cardio) em `treino-profiles.ts` e o critério `ciclo` no juiz; rodar o eval (aprovação do custo) e confirmar SC-005

**Checkpoint F5**: quickstart F5 ok → PR F5.

---

## Phase 12: Polish & Cross-Cutting

- [ ] T108 [P] Atualizar `docs/deploy.md` com as migrations da 024, o upload do laudo genético e as ações do dono (repositório privado, `git filter-repo` do laudo)
- [ ] T109 [P] Revisar logs da API: nenhum dado de saúde (condições, dores, sensações, genética) em logs; só métricas (teste em `apps/api/src/__tests__/` cobrindo o logger da geração)
- [ ] T110 Rodar `pnpm typecheck` e `pnpm test` e comparar com T001; nenhuma regressão
- [ ] T111 Executar o quickstart completo no deploy real com o dono e marcar SC-001 a SC-009

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** bloqueiam tudo.
- **F0 (Phase 3)** primeiro: a linha de base precisa existir antes de qualquer mudança no agente.
- **F1 (Phases 4–5)**: US6-genética e US7 são independentes entre si; o PR F1 junta as duas.
- **F2 (Phases 6–7)**: US1 e US2 dependem de F1 (estado de geração, rota de regenerar). O passo de condições do onboarding (T048) usa o editor de T061.
- **F3 (Phase 8)**: depende de F2 (condições → constraints; objetivo → método).
- **F4 (Phases 9–10)**: depende de F3 (sessões com `week`/`kind`) e de T062 (adaptação por região).
- **F5 (Phase 11)**: depende de F4 (sensações e validade).
- **Polish** ao fim de cada PR no que couber; T110/T111 no fim.

### Within each story

Teste (RED) → implementação (GREEN) → refatoração. Migrations antes das rotas da fase. Modo mock da web atualizado na mesma tarefa da tela.

## Parallel Opportunities

- Phase 2: T004, T005, T006.
- F1: T015/T017/T025 (testes) em paralelo; US6-genética (T014–T026) e US7 (T027–T042) podem andar em paralelo por arquivos diferentes, exceto `app.ts` (registrar rotas em sequência).
- F2: T049/T051 em paralelo; T047 e T060 (testes de web) em paralelo.
- F3: T067/T073/T075 (testes de pacotes diferentes) em paralelo; T082 em paralelo com T079.
- F5: T099 e T100 em paralelo; T105 em paralelo com T103.

### Exemplo (F3)

```text
T067 testes de prescribeMethod (packages/workouts)
T073 testes do schema (packages/ai)
T075 testes do prompt (packages/ai)
```

## Implementation Strategy

### MVP

F0 + F1 + F2 + F3 resolvem o caso do dono (joelho, gota, entrar em forma) com segurança verificada e método semanal; F4 e F5 completam o ciclo de aprendizado.

### Entrega incremental

Um PR por fase (F0–F5), cada um com CI verde, quickstart da fase e, quando mexer no agente, eval aprovado. Migrations aplicadas no Supabase de produção antes do deploy da API da fase.

## Notes

- Toda rodada do eval custa dinheiro: mostrar o custo estimado e pedir aprovação do dono antes.
- Ações destrutivas ou externas (repositório privado, reescrita do histórico do git, exclusão de sessões reais) são do dono.
- Commits atômicos com o número da tarefa, ex.: `feat(workouts): prescrição de método (024 T068)`.
