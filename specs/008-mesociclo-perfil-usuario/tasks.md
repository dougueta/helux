---

description: "Task list template for feature implementation"
---

# Tasks: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Input**: Design documents from `specs/008-mesociclo-perfil-usuario/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/ui-contracts.md, quickstart.md

**Tests**: TDD é obrigatório pela constituição do projeto (ver plan.md → Constitution Check, Princípio II). Toda rota, hook, service e componente novo/modificado tem uma tarefa de teste ANTES da tarefa de implementação correspondente — escreva o teste, confirme que falha, depois implemente.

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US2 ou US3 — mapeia para as user stories de spec.md
- Cada descrição inclui o caminho exato do arquivo

---

## Phase 1: Setup

**Purpose**: Criar o schema novo no banco — pré-requisito físico para tudo que segue.

- [X] T001 Criar migration `supabase/migrations/20260828000000_create_user_training_profile_and_tiredness_signals.sql` com as tabelas `user_training_profile` e `daily_tiredness_signals`, RLS e índice, exatamente como especificado em `data-model.md` (seção "Migration file"); aplicar com `supabase link --project-ref wgrlavmynbingemdbkjg` (se necessário) e `supabase db push --linked`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos compartilhados usados tanto pela API quanto pela Web em US1 e US2.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase.

- [X] T002 [P] Criar `packages/types/src/profile.ts` (novo arquivo) com as interfaces `UserTrainingProfile`, `UserTrainingProfileInput` e `DailyTirednessSignal`, exatamente como definidas em `data-model.md`
- [X] T003 [P] Adicionar campos opcionais `trainingTime?: string`, `timeOff?: string`, `currentInjury?: string` à interface `PlanInput` em `packages/types/src/plan.ts`
- [X] T004 Exportar `./profile` a partir de `packages/types/src/index.ts` (depende de T002)

**Checkpoint**: Tipos prontos — US1 e US2 podem começar em paralelo.

---

## Phase 3: User Story 1 — Perfil influencia a geração do mesociclo (Priority: P1) 🎯 MVP

**Goal**: Substituir `userGoals`/`userLevel` fixos por dados reais de `user_training_profile`, incluindo lesão declarada como alerta situacional obrigatório no prompt.

**Independent Test**: Preencher perfil (objetivo, nível, lesão) via `/perfil`, disparar geração de um novo mesociclo, e confirmar que a prescrição e a `rationale` refletem esses dados — ver `quickstart.md` passos 1–3, 7.

### Tests for User Story 1 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T005 [P] [US1] Testes para `GET /api/profile` e `POST /api/profile` em `apps/api/src/__tests__/profile.test.ts` (novo arquivo, seguir padrão de `apps/api/src/__tests__/checkins.test.ts`): 401 sem auth, `GET` retorna `{ profile: null }` sem linha, `POST` faz upsert parcial (merge, não substitui campos omitidos), 400 em `level` fora do enum ou strings > 300 chars
- [X] T006 [P] [US1] Estender `apps/api/src/__tests__/plan-context.service.test.ts`: `gatherPlanInput` usa `goal`/`level`/`trainingTime`/`timeOff`/`currentInjury` de `user_training_profile` quando a linha existe, e cai nos defaults atuais (`'Hipertrofia e condicionamento geral'` / `'intermediario'`, demais campos `undefined`) quando não existe (FR-005)
- [X] T007 [P] [US1] Estender `packages/ai/src/__tests__/mesocycle-planner.test.ts` (ou criar `packages/ai/src/__tests__/mesocycle-prompts.test.ts`): quando `PlanInput.currentInjury` está preenchido, o system prompt gerado contém um bloco "Alertas Situacionais — OBRIGATÓRIO RESPEITAR" com o texto da lesão; quando vazio, o bloco não aparece
- [X] T008 [P] [US1] No mesmo arquivo de teste de prompts: quando `trainingTime`/`timeOff` estão preenchidos, o contexto do usuário (`buildContextBody`/`buildMesocycleUserPrompt`) inclui linhas com esses valores
- [X] T009 [P] [US1] Testes para `ProfileForm` em `apps/web/src/__tests__/components/perfil/ProfileForm.test.tsx` (novo diretório, seguir padrão de `apps/web/src/__tests__/components/checkin/CheckinForm.test.tsx`): renderiza vazio quando `initial === null`, chama `onSave` com o input preenchido, desabilita o botão quando `saving === true`, permite salvar com todos os campos vazios (FR-011)
- [X] T010 [P] [US1] Testes para `useProfile` em `apps/web/src/__tests__/hooks/useProfile.test.ts`: carrega o perfil no mount, `save()` chama `upsertProfile` e atualiza o estado local, `saving` alterna corretamente
- [X] T011 [P] [US1] Testes para `profile.service.ts` em `apps/web/src/__tests__/services/profile.service.test.ts` (seguir padrão de `apps/web/src/__tests__/services/checkin.service.test.ts`): `getProfile()` faz `GET /api/profile`, `upsertProfile()` faz `POST /api/profile`

### Implementation for User Story 1

- [X] T012 [US1] Implementar `apps/api/src/routes/profile.ts` (novo): `GET /api/profile` e `POST /api/profile` com schema Zod (campos opcionais, `level` enum, strings max 300), upsert em `user_training_profile` por `user_id` — seguir exatamente o padrão de auth/estrutura de `apps/api/src/routes/checkins.ts` (torna T005 verde)
- [X] T013 [US1] Registrar `profileRoutes` em `apps/api/src/app.ts` (import + `app.register`)
- [X] T014 [US1] Modificar `gatherPlanInput` em `apps/api/src/services/plan-context.service.ts`: buscar `user_training_profile` do usuário (`.select('*').eq('user_id', userId).maybeSingle()`) e usar `goal ?? 'Hipertrofia e condicionamento geral'`, `level ?? 'intermediario'`, repassando `trainingTime`, `timeOff`, `currentInjury` como estão (torna T006 verde)
- [X] T015 [US1] Adicionar parâmetro `currentInjury?: string` a `buildMesocycleSystemPrompt` em `packages/ai/src/mesocycle-prompts.ts`; quando presente, injetar bloco "Alertas Situacionais — OBRIGATÓRIO RESPEITAR" no mesmo padrão visual do bloco "Alertas Genéticos" existente (torna T007 verde)
- [X] T016 [US1] Adicionar parâmetros opcionais `trainingTime?: string`, `timeOff?: string` a `buildContextBody` em `packages/ai/src/prompts.ts`, incluindo linhas de contexto quando presentes (torna T008 verde) — lembrar que esta função é compartilhada com o fluxo legado de sessão única (Nota de Escopo do plan.md)
- [X] T017 [US1] Propagar `trainingTime`/`timeOff` pelas assinaturas de `buildMesocycleUserPrompt` (`mesocycle-prompts.ts`) e `buildUserPrompt` (`prompts.ts`), repassando para `buildContextBody`
- [X] T018 [US1] Atualizar `generateMesocyclePlan` em `packages/ai/src/mesocycle-planner.ts` para passar `input.currentInjury` a `buildMesocycleSystemPrompt` e `input.trainingTime`/`input.timeOff` a `buildMesocycleUserPrompt`
- [X] T019 [US1] Atualizar `generatePlan` em `packages/ai/src/planner.ts` para passar `input.trainingTime`/`input.timeOff` a `buildUserPrompt` (sem `currentInjury` — fluxo legado fora de escopo, ver research.md Decisão 7)
- [X] T020 [P] [US1] Criar `ProfileForm` em `apps/web/src/components/perfil/ProfileForm.tsx` (novo diretório) com as props `{ initial, saving, onSave }` exatamente como em `contracts/ui-contracts.md`, campos `goal`/`level`/`trainingTime`/`timeOff`/`currentInjury`, mesmo padrão visual de `CheckinForm.tsx` (torna T009 verde)
- [X] T021 [P] [US1] Criar `apps/web/src/services/profile.service.ts`: `getProfile()` (GET, retorna `null` em erro) e `upsertProfile(input)` (POST), seguindo `apps/web/src/services/checkin.service.ts` (torna T011 verde)
- [X] T022 [US1] Criar hook `apps/web/src/hooks/useProfile.ts`: carrega perfil no mount via `getProfile()`, expõe `{ profile, loading, saving, save }` — `save` chama `upsertProfile` e atualiza estado local (depende de T021; torna T010 verde)
- [X] T023 [US1] Criar rota `/perfil`: `apps/web/src/app/perfil/page.tsx` (server component — auth guard com `createSupabaseServerClient`, redirect `/login`, `Shell`, mesmo padrão de `apps/web/src/app/checkin/page.tsx`) + `apps/web/src/app/perfil/PerfilClient.tsx` ('use client', usa `useProfile()` e renderiza `<ProfileForm initial={profile} saving={saving} onSave={save} />`, mesmo papel de `HomeClient.tsx` para a Home) + `apps/web/src/app/perfil/loading.tsx` (mesmo padrão de `checkin/loading.tsx`) (depende de T020, T022)
- [X] T024 [US1] Adicionar ícone de acesso a `/perfil` no cabeçalho de `apps/web/src/app/HomeClient.tsx`, ao lado do indicador de streak, reaproveitando o primitivo `Icon` (`@/components/ui/icons`) envolvido num `Link` do Next

**Checkpoint**: US1 completa e testável de forma independente — perfil editável e refletido no próximo mesociclo gerado.

---

## Phase 4: User Story 2 — Sinalizar cansaço num dia específico (Priority: P1)

**Goal**: Permitir marcar/desmarcar "muito cansado hoje" e combinar esse sinal com o ajuste por HRV, sempre pegando o mais conservador dos dois (FR-009).

**Independent Test**: Sinalizar cansaço hoje sem HRV sincronizado e ver volume/carga reduzidos com motivo visível; desfazer e ver o treino voltar ao original — ver `quickstart.md` passos 4–6.

### Tests for User Story 2 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T025 [P] [US2] Testes para `POST /api/tiredness-today` e `DELETE /api/tiredness-today` em `apps/api/src/__tests__/tiredness-today.test.ts` (novo arquivo): 401 sem auth, `POST` é idempotente (marcar duas vezes não duplica, `unique(user_id, date)`), `DELETE` é idempotente (sem sinalização ativa não falha), ambos retornam `{ active: boolean }`
- [X] T026 [P] [US2] Estender `packages/ai/src/__tests__/recovery-adjustment.test.ts`: com `manualTirednessToday: true` e sem HRV, resultado é `adjusted: true` na faixa "alta" com motivo citando cansaço manual; com HRV já baixo (faixa alta) e `manualTirednessToday: true`, motivo permanece o do HRV; com HRV moderado/alto e `manualTirednessToday: true`, resultado nunca fica menos conservador que a faixa alta (FR-009)
- [X] T027 [P] [US2] Estender `apps/api/src/__tests__/workout-latest-plan.test.ts`: quando existe linha em `daily_tiredness_signals` para hoje, `applyRecoveryAdjustment` é chamado com `manualTirednessToday: true`; quando não existe, com `false`/`undefined`
- [X] T028 [P] [US2] Testes para `TirednessToggle` em `apps/web/src/__tests__/components/workout/TirednessToggle.test.tsx` (novo): `active={false}` renderiza botão "Hoje estou muito cansado" e chama `onToggle` ao tocar; `active={true}` renderiza chip com ação de desfazer visível e chama `onToggle` ao tocar
- [X] T029 [P] [US2] Testes para `useTiredness` em `apps/web/src/__tests__/hooks/useTiredness.test.ts`: `toggle()` chama `markTiredToday`/`clearTiredToday` conforme o estado atual e atualiza `active`
- [X] T030 [P] [US2] Testes para `tiredness.service.ts` em `apps/web/src/__tests__/services/tiredness.service.test.ts`: `markTiredToday()` faz `POST /api/tiredness-today`, `clearTiredToday()` faz `DELETE /api/tiredness-today`

### Implementation for User Story 2

- [X] T031 [US2] Implementar `apps/api/src/routes/tiredness-today.ts` (novo): `POST`/`DELETE` `/api/tiredness-today`, upsert/delete em `daily_tiredness_signals` por `(user_id, hoje)`, idempotentes (torna T025 verde)
- [X] T032 [US2] Registrar `tirednessTodayRoutes` em `apps/api/src/app.ts`
- [X] T033 [US2] Adicionar parâmetro `manualTirednessToday?: boolean` a `applyRecoveryAdjustment` em `packages/ai/src/recovery-adjustment.ts`: quando `true`, o resultado nunca fica menos conservador que a faixa "alta" (mesma redução de HRV < 40ms); motivo cita cansaço manual quando o HRV não já indicava faixa alta (torna T026 verde)
- [X] T034 [US2] Modificar `apps/api/src/routes/workout-latest-plan.ts`: consultar `daily_tiredness_signals` para `(user_id, hoje)` junto com `health_samples`, repassar o booleano para `applyRecoveryAdjustment` (torna T027 verde)
- [X] T035 [P] [US2] Criar `TirednessToggle` em `apps/web/src/components/workout/TirednessToggle.tsx` com as props `{ active, onToggle }` de `contracts/ui-contracts.md`, mesmo padrão visual de `RecoveryAdjustedBadge.tsx` no estado ativo (torna T028 verde)
- [X] T036 [P] [US2] Criar `apps/web/src/services/tiredness.service.ts`: `markTiredToday()` (POST) e `clearTiredToday()` (DELETE) (torna T030 verde)
- [X] T037 [US2] Criar hook `apps/web/src/hooks/useTiredness.ts`: expõe `{ active, toggle }`, `toggle()` chama `markTiredToday`/`clearTiredToday` conforme estado atual (depende de T036; torna T029 verde)
- [X] T038 [US2] Integrar `TirednessToggle` + `useTiredness` em `apps/web/src/app/HomeClient.tsx`, renderizado independentemente de `today.adjusted`, próximo de onde `RecoveryAdjustedBadge` aparece, exatamente como em `contracts/ui-contracts.md`

**Checkpoint**: US1 e US2 funcionam de forma independente — cansaço manual ajusta o treino do dia com ou sem perfil preenchido.

---

## Phase 5: User Story 3 — Atualizar perfil sem afetar o mesociclo ativo (Priority: P2)

**Goal**: Garantir que editar o perfil no meio de um mesociclo ativo não altera esse mesociclo retroativamente (FR-010) — comportamento que já emerge da implementação de US1 (perfil só é lido em `gatherPlanInput`, no momento da geração), então esta fase é majoritariamente de verificação/regressão.

**Independent Test**: Atualizar o perfil com um mesociclo ativo em andamento e confirmar que as sessões já geradas não mudam; completar o ciclo e confirmar que o próximo já reflete o perfil novo.

### Tests for User Story 3 ⚠️

- [X] T039 [P] [US3] Teste em `apps/api/src/__tests__/profile.test.ts`: fazer `POST /api/profile` não escreve nem lê `mesocycle_plans` — upsert do perfil é isolado da tabela de mesociclos (FR-010)
- [X] T040 [P] [US3] Estender `apps/api/src/__tests__/plan-generation.service.test.ts` (ou `mesocycle.service.test.ts`): `generateAndSaveMesocycle`, disparado após a conclusão do mesociclo ativo, usa o perfil mais recente em `user_training_profile` no momento da chamada — simular perfil atualizado entre a criação do mesociclo anterior e a geração do próximo, e confirmar que o novo reflete o valor atualizado

### Implementation for User Story 3

- [X] T041 [US3] Revisar `gatherPlanInput` (T014) e o fluxo de `generateAndSaveMesocycle`: confirmar que nenhum dado de perfil é copiado/congelado em `mesocycle_plans` no momento da criação — se algum snapshot indevido for encontrado, remover (nenhuma mudança esperada; tarefa de verificação, não de feature nova)

**Checkpoint**: Todas as user stories funcionam de forma independente e compostas — perfil editável a qualquer momento sem afetar ciclos em andamento.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cruzando as três user stories.

- [X] T042 [P] Rodar `pnpm --filter @helux/ai test`, `pnpm --filter @helux/api test`, `pnpm --filter @helux/web test` e o typecheck do monorepo, confirmando que todos os testes novos (T005–T011, T025–T030, T039–T040) passam em verde
- [X] T043 Executar o fluxo manual de verificação de `quickstart.md` (passos 1–7) contra o app rodando localmente

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de T001 (schema precisa existir antes de os tipos referenciarem as colunas) — bloqueia US1, US2, US3
- **US1 (Phase 3)**: depende de Foundational — sem dependência de US2/US3
- **US2 (Phase 4)**: depende de Foundational — independente de US1 (pode rodar em paralelo com Phase 3)
- **US3 (Phase 5)**: depende de US1 (T012, T014) já existirem — é essencialmente uma verificação sobre o comportamento de US1
- **Polish (Phase 6)**: depende de US1 + US2 completas; US3 recomendado mas não bloqueante

### Dentro de cada User Story

- Testes (T005–T011, T025–T030, T039–T040) escritos e **falhando** antes da implementação correspondente
- Tipos/schema → rotas/services → hooks → componentes → integração na Home
- `useProfile`/`useTiredness` dependem dos respectivos `*.service.ts` (T022 depende de T021; T037 depende de T036)

### Parallel Opportunities

- T002/T003 em paralelo (arquivos diferentes em `packages/types`)
- Todos os testes T005–T011 em paralelo entre si (arquivos diferentes)
- Todos os testes T025–T030 em paralelo entre si
- US1 (Phase 3) inteira pode rodar em paralelo com US2 (Phase 4) após Foundational, se houver mais de um desenvolvedor
- T020/T021 em paralelo (componente vs. service, sem dependência mútua)
- T035/T036 em paralelo (componente vs. service, sem dependência mútua)

---

## Parallel Example: User Story 1 — Tests

```bash
Task: "Testes para GET/POST /api/profile em apps/api/src/__tests__/profile.test.ts"
Task: "Estender plan-context.service.test.ts com leitura de user_training_profile"
Task: "Estender mesocycle-planner.test.ts com bloco de Alertas Situacionais"
Task: "Testes para ProfileForm em apps/web/src/__tests__/components/perfil/ProfileForm.test.tsx"
Task: "Testes para useProfile em apps/web/src/__tests__/hooks/useProfile.test.ts"
Task: "Testes para profile.service.ts em apps/web/src/__tests__/services/profile.service.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002–T004)
3. Phase 3: US1 completa (T005–T024)
4. **PARAR e VALIDAR**: rodar `quickstart.md` passos 1–3 e 7 isoladamente
5. US1 sozinha já entrega o núcleo pedido — substituir valores fixos por perfil real

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → validar independentemente → já é um incremento útil (perfil real influencia o mesociclo)
3. US2 → validar independentemente → cansaço manual complementa o ajuste por HRV
4. US3 → validar como regressão sobre US1 (edição de perfil não quebra ciclo ativo)
5. Polish → suíte completa + fluxo manual de `quickstart.md`

---

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story correspondente para rastreabilidade
- Confirmar que os testes falham antes de implementar (TDD obrigatório pela constituição)
- `POST /workout/generate` (fluxo legado de sessão única) permanece **fora de escopo** em todas as fases — nenhuma tarefa acima o modifica além de T019, que só estende `buildContextBody`/`buildUserPrompt` com mais contexto (sem novo comportamento obrigatório), conforme `research.md` Decisão 7
- Evitar: tarefas vagas, dois desenvolvedores no mesmo arquivo simultaneamente, dependências cruzadas entre US1/US2 que quebrem a independência de cada uma
