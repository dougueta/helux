---

description: "Task list template for feature implementation"
---

# Tasks: Validação de Conclusão de Treino

**Input**: Design documents from `specs/009-validacao-conclusao-treino/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: TDD é obrigatório pela constituição do projeto (ver plan.md → Constitution Check, Princípio II). Toda rota, hook e componente novo/modificado tem uma tarefa de teste ANTES da tarefa de implementação correspondente — escreva o teste, confirme que falha, depois implemente.

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US2 ou US3 — mapeia para as user stories de spec.md
- Cada descrição inclui o caminho exato do arquivo

---

## Phase 1: Setup

Não há inicialização de infraestrutura nesta feature — nenhuma dependência nova, nenhuma migration (ver `research.md` Decisão 2: `skipped` entra num campo JSON já existente). A pré-condição real está na Fase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campo de dado compartilhado por todas as user stories.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase.

- [X] T001 [P] Adicionar campo opcional `skipped?: boolean` à interface `ExerciseSet` em `packages/types/src/workout.ts`, exatamente como definido em `data-model.md`

**Checkpoint**: Tipo pronto — US1, US2 e US3 podem começar (US3 depende também de T001 para o contrato da API).

---

## Phase 3: User Story 1 — Aviso ao finalizar treino com exercícios pulados (Priority: P1) 🎯 MVP

**Goal**: Ao finalizar um treino com um ou mais exercícios sem nenhuma série registrada, exibir uma confirmação explícita nomeando quantos serão salvos como pulados, antes de gravar a sessão.

**Independent Test**: Iniciar um treino, pular pelo menos um exercício, tocar em "Finalizar treino" e confirmar que aparece o aviso antes de qualquer gravação — ver `quickstart.md` passos 1–3.

### Tests for User Story 1 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T002 [P] [US1] Estender `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`: novo seletor `getSkippedExercises()` retorna os exercícios do plano com `sets.length === 0` no estado atual da sessão; retorna lista vazia quando todos têm ao menos 1 série
- [X] T003 [P] [US1] Criar `apps/web/src/__tests__/components/workout/FinishWorkoutConfirmDialog.test.tsx` (novo arquivo, seguir padrão de testes de `ExerciseSheet.test.tsx` se existir, senão de `TirednessToggle.test.tsx`): renderiza a contagem e os nomes dos exercícios pulados recebidos via prop; chama `onConfirm` ao tocar em confirmar; chama `onCancel` ao tocar em cancelar; não renderiza nada quando a lista de pulados está vazia

### Implementation for User Story 1

- [X] T004 [US1] Implementar `getSkippedExercises()` em `apps/web/src/hooks/useActiveWorkout.ts`, derivado de `session.planExercises` + séries registradas no estado atual (depende de T001; torna T002 verde)
- [X] T005 [P] [US1] Criar `FinishWorkoutConfirmDialog` em `apps/web/src/components/workout/FinishWorkoutConfirmDialog.tsx` com props `{ skippedNames: string[], onConfirm: () => void, onCancel: () => void }`, reaproveitando o padrão de overlay/backdrop de `ExerciseSheet.tsx` (`research.md` Decisão 3) — sem criar um `Modal` genérico novo (torna T003 verde)
- [X] T006 [US1] Em `apps/web/src/app/workout/page.tsx`, o botão "Finalizar treino" passa a chamar `getSkippedExercises()` primeiro; se a lista não estiver vazia, abre `FinishWorkoutConfirmDialog` em vez de chamar `finishWorkout` diretamente; ao confirmar, chama `finishWorkout`; ao cancelar, fecha o diálogo sem salvar e mantém o usuário no treino ativo (depende de T004, T005)

**Checkpoint**: US1 completa e testável de forma independente — pular exercícios dispara confirmação antes de salvar.

---

## Phase 4: User Story 2 — Bloqueio de finalização de treino totalmente vazio sem aviso (Priority: P1)

**Goal**: Garantir que o caso extremo (nenhum exercício com série registrada) segue exatamente o mesmo caminho de confirmação de US1, sem exceção que permita salvar uma sessão vazia silenciosamente.

**Independent Test**: Abrir um treino e tocar em "Finalizar treino" sem registrar nenhuma série; confirmar que a mesma confirmação aparece, mencionando todos os exercícios como pulados — ver `quickstart.md` passo 4.

### Tests for User Story 2 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T007 [P] [US2] Estender `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts` (mesmo arquivo de T002): caso de borda em que `getSkippedExercises()` retorna **todos** os exercícios do plano quando nenhum tem nenhuma série registrada (FR-003)

### Implementation for User Story 2

- [X] T008 [US2] Revisar `page.tsx` (T006): confirmar que não existe nenhum atalho/exceção que finalize diretamente quando a lista de pulados é igual ao plano inteiro — o caminho é idêntico ao de US1, sem branch especial para "vazio" (torna T007 verde; tarefa de verificação, não de código novo se T004/T006 já foram implementadas corretamente)

**Checkpoint**: US1 e US2 juntas — nenhuma forma de finalizar silenciosamente um treino parcial ou totalmente vazio.

---

## Phase 5: User Story 3 — Registro correto de quais exercícios foram pulados (Priority: P2)

**Goal**: A sessão salva distingue exercícios executados de pulados, e a API rejeita qualquer tentativa de salvar um exercício vazio sem o sinal explícito — fechando a brecha também no backend (FR-007, FR-008), não só na UI.

**Independent Test**: Confirmar a finalização de um treino com exercícios pulados e verificar que a sessão salva os identifica separadamente dos executados; tentar contornar via chamada direta à API e confirmar rejeição — ver `quickstart.md` passos 4 e 6.

### Tests for User Story 3 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T009 [P] [US3] Estender `apps/api/src/__tests__/workout-sessions.test.ts`: retorna `400` quando um exercício tem `sets: []` e `skipped` ausente/`false`; retorna `201` quando o mesmo exercício vem com `skipped: true`, e o objeto inserido via Supabase (`mockInsert`) preserva o campo `skipped: true` nesse item (torna `contracts/api.md` verde)
- [X] T010 [P] [US3] Estender `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`: `finishWorkout` inclui `skipped: true` no payload enviado para cada exercício presente em `getSkippedExercises()`, e omite/`false` nos demais

### Implementation for User Story 3

- [X] T011 [US3] Em `apps/api/src/routes/workout-sessions.ts`, adicionar `skipped: z.boolean().optional()` a `ExerciseSchema` e o `superRefine` em `SessionBodySchema` exatamente como em `contracts/api.md` (torna T009 verde)
- [X] T012 [US3] Em `finishWorkout` (`apps/web/src/hooks/useActiveWorkout.ts`), marcar `skipped: true` no payload para cada exercício de `getSkippedExercises()` antes de enviar ao `POST /api/workouts/sessions` (depende de T004; torna T010 verde)

**Checkpoint**: Todas as user stories completas — histórico distingue pulado de executado, e a regra vale tanto na UI quanto na API.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cruzando as três user stories.

- [X] T013 [P] Rodar `pnpm --filter @helux/web test`, `pnpm --filter @helux/api test` e o typecheck do monorepo, confirmando que todos os testes novos (T002–T003, T007, T009–T010) passam em verde e nenhum teste existente quebrou
- [ ] T014 Executar o fluxo manual de verificação de `quickstart.md` (passos 1–6) contra o app rodando localmente — **pendente**: requer login real (Google OAuth) e app rodando, não executável neste ambiente headless; ver Notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — nada a inicializar
- **Foundational (Phase 2)**: sem dependências — pode começar imediatamente; bloqueia US1, US2, US3
- **US1 (Phase 3)**: depende de Foundational — núcleo da feature (MVP)
- **US2 (Phase 4)**: depende de Foundational e reaproveita a implementação de US1 (T004, T006) — é o caso de borda de US1, não uma implementação separada
- **US3 (Phase 5)**: depende de Foundational (T001) — independente de US1/US2 na implementação (mexe em `finishWorkout`/API, não no diálogo), mas semanticamente completa o que US1/US2 começam
- **Polish (Phase 6)**: depende de US1 + US2 + US3 completas

### Dentro de cada User Story

- Testes (T002–T003, T007, T009–T010) escritos e **falhando** antes da implementação correspondente
- Tipo (T001) → seletor/hook (T004) → componente de UI (T005) → wiring na tela (T006) → API (T011) → payload final (T012)

### Parallel Opportunities

- T002/T003 em paralelo (arquivos diferentes)
- T009/T010 em paralelo (API vs. hook, arquivos diferentes)
- US3 (Phase 5, mexe em API + payload) pode ser implementada em paralelo com US1 (Phase 3, mexe em UI) após T001, se houver mais de um desenvolvedor — T006 (wiring do diálogo) e T012 (payload com skipped) só precisam convergir antes do Polish

---

## Parallel Example: User Story 1 — Tests

```bash
Task: "Estender useActiveWorkout.test.ts com getSkippedExercises()"
Task: "Criar FinishWorkoutConfirmDialog.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 2: Foundational (T001)
2. Phase 3: US1 completa (T002–T006)
3. **PARAR e VALIDAR**: rodar `quickstart.md` passos 1–3 isoladamente
4. US1 sozinha já fecha o caso mais comum (pular alguns exercícios)

### Incremental Delivery

1. Foundational → base pronta
2. US1 → validar independentemente → já é um incremento útil (aviso ao pular exercícios)
3. US2 → validar como regressão sobre US1 (caso de borda "tudo pulado")
4. US3 → validar independentemente → histórico confiável + API protegida
5. Polish → suíte completa + fluxo manual de `quickstart.md`

---

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story correspondente para rastreabilidade
- Confirmar que os testes falham antes de implementar (TDD obrigatório pela constituição)
- US2 é deliberadamente magra (uma tarefa de teste + uma de verificação) — é o caso de borda do mesmo mecanismo de US1, não uma segunda implementação
- Evitar: tarefas vagas, dependências cruzadas entre US1/US2/US3 que quebrem a independência de cada uma
