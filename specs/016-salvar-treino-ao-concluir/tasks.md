# Tasks: Salvar o Treino ao Concluir

**Input**: Design documents from `specs/016-salvar-treino-ao-concluir/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Obrigatórios (constituição, princípio II — TDD). Cada teste é escrito e confirmado em RED antes da implementação correspondente.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Nenhuma tarefa: sem dependências novas nem estrutura nova (diretório `apps/web/src/__tests__/app/` é criado junto com o primeiro teste da página).

---

## Phase 2: Foundational (bloqueia as user stories)

**Purpose**: Máquina de estados da finalização, usada por US1, US2 e US3.

- [x] T001 [P] Escrever teste RED de `useFinishWorkout` em `apps/web/src/__tests__/hooks/useFinishWorkout.test.ts`: status inicial `idle`; `submit()` → `saving` e chama `finish` uma vez; sucesso → `saved`; `finish` rejeitando → `error` sem `submit()` rejeitar; `submit()` em `error` tenta de novo; `reset()` em `error` → `idle` (contrato em `contracts/ui.md`)
- [x] T002 Implementar `useFinishWorkout` em `apps/web/src/hooks/useFinishWorkout.ts` (status + ref com o estado corrente, `submit`, `reset`) até T001 ficar GREEN
- [x] T003 [P] Escrever teste RED de `WorkoutDoneScreen` em `apps/web/src/__tests__/components/workout/WorkoutDoneScreen.test.tsx`: `saving` mostra "Salvando treino…" sem "registrou suas cargas" e sem botões; `saved` mostra "Treino concluído", a frase de registro, séries/minutos e "Voltar ao início" (chama `onGoHome`); `error` mostra "Não foi possível salvar", "Tentar novamente" (`onRetry`) e "Voltar ao treino" (`onBackToWorkout`), sem "registrou suas cargas"
- [x] T004 Implementar `WorkoutDoneScreen` em `apps/web/src/components/workout/WorkoutDoneScreen.tsx`, movendo o JSX/estilos da tela de conclusão de `apps/web/src/app/workout/page.tsx` e adicionando os estados `saving` e `error`, até T003 ficar GREEN

**Checkpoint**: hook e componente prontos e testados isoladamente.

---

## Phase 3: User Story 1 - Treino é gravado no momento da conclusão (P1) 🎯 MVP

**Goal**: O POST acontece ao finalizar, não ao tocar "Voltar ao início".

**Independent Test**: Finalizar o treino e verificar que `apiFetch('/api/workouts/sessions', POST)` foi chamado sem tocar em "Voltar ao início", e que a tela de conclusão continua visível (sem redirecionar).

- [x] T005 [US1] Escrever teste RED de integração em `apps/web/src/__tests__/app/workout-page.test.tsx` (renderiza `WorkoutPage` de `apps/web/src/app/workout/page.tsx` com `useActiveWorkout` real e `localStorage['helux:active-workout']` semeado; mocks de `@/services/api-client` e `next/navigation`): (a) último exercício com todas as séries feitas → tocar "Finalizar treino" dispara o POST uma vez e, após resolver, mostra "Treino concluído" e não chama `router.replace('/')`; (b) com pulados → aviso da spec 009; cancelar não faz POST; confirmar faz o POST; (c) o corpo do POST é o mesmo produzido por `finishWorkout` (exercícios, `skipped`, `date`, `duration_s`)
- [x] T006 [US1] Em `apps/web/src/app/workout/page.tsx`: usar `useFinishWorkout(finishWorkout)`; criar `startFinish()` que congela `finishSummary = { totalDone, elapsed }` e chama `submit()`; `handleNext` (sem pulados) e `handleConfirmFinish` chamam `startFinish()`; renderizar `WorkoutDoneScreen` quando `finishSummary !== null`, antes do `if (!session) return null`; suprimir o redirecionamento automático para `/` enquanto `finishSummary !== null`; remover `showDone` e `handleSaveAndExit` — até T005 ficar GREEN

**Checkpoint**: MVP — o treino é gravado ao finalizar.

---

## Phase 4: User Story 2 - Tela só afirma o registro após sucesso (P1)

**Goal**: Estados salvando/erro na página, com "Tentar novamente" e "Voltar ao treino".

**Independent Test**: Com o POST rejeitando, a página mostra erro, mantém o treino no localStorage e "Voltar ao treino" retorna à tela ativa com as séries intactas; "Tentar novamente" com o POST ok leva ao sucesso.

- [x] T007 [US2] Adicionar testes RED em `apps/web/src/__tests__/app/workout-page.test.tsx`: (a) com POST pendente, mostra "Salvando treino…" e não "registrou suas cargas"; (b) com POST rejeitando, mostra "Não foi possível salvar", `localStorage['helux:active-workout']` continua presente; (c) "Tentar novamente" com POST ok → "Treino concluído"; (d) "Voltar ao treino" → volta à tela ativa ("Finalizar treino" visível) com as séries marcadas preservadas
- [x] T008 [US2] Ligar `onRetry` → `submit()` e `onBackToWorkout` → `reset()` + `setFinishSummary(null)` em `apps/web/src/app/workout/page.tsx` até T007 ficar GREEN

---

## Phase 5: User Story 3 - Nenhuma gravação duplicada (P2)

**Goal**: Duplo toque e "Voltar ao início" não geram segunda gravação.

**Independent Test**: Dois `submit()` no mesmo tick → um POST; "Voltar ao início" após sucesso → navega sem novo POST.

- [x] T009 [P] [US3] Adicionar testes em `apps/web/src/__tests__/hooks/useFinishWorkout.test.ts`: duas chamadas de `submit()` no mesmo tick chamam `finish` uma vez; `submit()` após `saved` não chama `finish`; `reset()` em `saving`/`saved` não muda o status (confirmar RED ou, se já cobertos pela guarda de T002, registrar que passam de primeira)
- [x] T010 [US3] Adicionar teste em `apps/web/src/__tests__/app/workout-page.test.tsx`: após sucesso, "Voltar ao início" chama `router.replace('/')` e o total de chamadas ao POST continua 1; ajustar `apps/web/src/hooks/useFinishWorkout.ts` / `apps/web/src/app/workout/page.tsx` se necessário até GREEN

---

## Phase 6: Polish & Cross-Cutting

- [x] T011 Rodar `pnpm --filter @helux/web test` e `pnpm typecheck` na raiz; tudo verde (incluindo `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts` e `FinishWorkoutConfirmDialog.test.tsx` inalterados)
- [x] T012 Registrar a resolução do TD-007 em `specs/016-salvar-treino-ao-concluir/research.md` (nota de fechamento) — sem tocar arquivos de memória do usuário
- [ ] T013 Verificação manual seguindo `specs/016-salvar-treino-ao-concluir/quickstart.md` (feita pelo agente principal com o app rodando)

---

## Dependencies & Execution Order

- Phase 2 (T001–T004) bloqueia todas as stories. T001 ∥ T003 (arquivos distintos); T002 depende de T001; T004 de T003.
- US1 (T005–T006) depende de T002 e T004.
- US2 (T007–T008) depende de US1 (mesma página e mesmo arquivo de teste).
- US3: T009 depende só de T002 (pode rodar em paralelo com US1); T010 depende de US1.
- Polish depois de todas as stories; T013 fica para o agente principal.

## Parallel Example

```text
T001 (teste do hook)  ∥  T003 (teste do componente)
T009 (duplicidade no hook)  ∥  T005/T006 (página)
```

## Implementation Strategy

MVP = Phase 2 + US1: o treino passa a ser gravado ao finalizar (resolve a perda de dados). US2 acrescenta o feedback honesto e a recuperação de erro; US3 fecha a duplicidade. Commit ao fim da implementação com todos os testes verdes.
