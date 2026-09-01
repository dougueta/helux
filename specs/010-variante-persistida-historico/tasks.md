---

description: "Task list template for feature implementation"
---

# Tasks: Variante Executada Persistida no Histórico

**Input**: Design documents from `specs/010-variante-persistida-historico/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: TDD é obrigatório pela constituição do projeto (ver plan.md → Constitution Check, Princípio II). Toda mudança de comportamento em `useActiveWorkout` e na rota da API ganha uma tarefa de teste ANTES da implementação correspondente — escreva o teste, confirme que falha, depois implemente. As três mudanças puramente de exibição em páginas (`workout/page.tsx`, `history/[id]/page.tsx`) não ganham teste automatizado dedicado: nenhuma página em `apps/web/src/app/**` tem infraestrutura de teste de componente hoje neste projeto (confirmado — nem mesmo o "96 fit" hardcoded que está sendo corrigido foi testado isoladamente quando escrito); a verificação dessas três tarefas é o passeio manual de `quickstart.md`.

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US2 ou US3 — mapeia para as user stories de spec.md
- Cada descrição inclui o caminho exato do arquivo

---

## Phase 1: Setup

Não há inicialização de infraestrutura nesta feature — nenhuma dependência nova, nenhuma migration (ver `research.md` Decisão 3: `executedVariant` entra num campo JSON já existente, mesmo mecanismo de `skipped` da spec 009).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campo de dado compartilhado por todas as user stories.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase.

- [X] T001 [P] Adicionar campo opcional `executedVariant?: { name: string; match: number }` à interface `ExerciseSet` em `packages/types/src/workout.ts`, exatamente como definido em `data-model.md`

**Checkpoint**: Tipo pronto — US1, US2 e US3 podem começar.

---

## Phase 3: User Story 1 — Histórico reflete a variante realmente executada (Priority: P1) 🎯 MVP

**Goal**: Quando o usuário troca de variante e registra séries nela, o histórico salvo passa a identificar a variante executada, mantendo também o exercício originalmente planejado — sem exigir nenhuma mudança quando nenhuma troca ocorre.

**Independent Test**: Iniciar um treino, trocar a variante de um exercício, registrar ao menos 1 série nessa variante, finalizar o treino e verificar na tela de detalhe do histórico que a variante executada aparece corretamente, junto com o exercício originalmente planejado — ver `quickstart.md` passos 1–2.

### Tests for User Story 1 ⚠️ (escrever e confirmar falha antes de implementar)

- [X] T002 [US1] Estender `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`: ao marcar a primeira série de um exercício como feita, `executedVariantByExerciseIndex` daquele índice trava no valor atual de `variantByExerciseIndex` naquele momento; trocas de variante feitas depois de já haver uma série marcada não alteram mais esse valor travado
- [X] T003 [US1] Estender `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts` (mesmo arquivo de T002): `finishWorkout` inclui `executedVariant: { name, match }` no payload do exercício cuja variante travada difere da variante recomendada; omite o campo quando a variante travada é a recomendada (nenhuma troca real ocorreu) ou quando nenhuma série foi registrada
- [X] T004 [P] [US1] Estender `apps/api/src/__tests__/workout-sessions.test.ts`: aceita (`201`) um exercício cujo item inclui `executedVariant: { name, match }` válido, e o objeto inserido via Supabase (`mockInsert`) preserva esse campo

### Implementation for User Story 1

- [X] T005 [US1] Adicionar `executedVariantByExerciseIndex: Record<number, string | undefined>` a `ActiveWorkoutState` em `apps/web/src/hooks/useActiveWorkout.ts`: inicializar vazio em `startWorkout`; na hidratação de sessões salvas em `localStorage`, aplicar fallback `?? {}` para sessões legadas sem o campo (mesmo padrão já usado para `variantByExerciseIndex`)
- [X] T006 [US1] Implementar a lógica de trava em `toggleSetDone` (`useActiveWorkout.ts`): na transição de uma série para `done: true`, se `executedVariantByExerciseIndex[exerciseIndex]` ainda não tiver entrada, gravar ali o valor atual de `variantByExerciseIndex[exerciseIndex]` (depende de T005; torna T002 verde)
- [X] T007 [US1] Atualizar `finishWorkout` (`useActiveWorkout.ts`): para cada exercício com `doneSets.length > 0`, resolver a variante travada em `executedVariantByExerciseIndex[ei]` contra `ex.variants`; se ela existir e não for a variante recomendada, incluir `executedVariant: { name: variante.name, match: variante.match }` no item do payload (depende de T001, T006; torna T003 verde)
- [X] T008 [P] [US1] Em `apps/api/src/routes/workout-sessions.ts`, adicionar `executedVariant: ExecutedVariantSchema.optional()` a `ExerciseSchema`, com `ExecutedVariantSchema = z.object({ name: z.string().min(1), match: z.number().min(0).max(100) })`, exatamente como em `contracts/api.md` (torna T004 verde; arquivo independente de T005–T007)
- [X] T009 [US1] Em `apps/web/src/app/history/[id]/page.tsx`, quando `ex.executedVariant` estiver presente no exercício da sessão, exibir seu nome junto ao nome do exercício originalmente planejado (ex: "Supino Reto com Halteres — variante de Supino Reto (Barra)"); sem exibir nada extra quando ausente (comportamento atual preservado) — depende de T007/T008 (precisa do campo existir de fato numa sessão salva para ser visível); sem teste automatizado dedicado (ver nota em "Tests" no topo do arquivo); validar via `quickstart.md` passos 2–4

**Checkpoint**: US1 completa e testável de forma independente — trocar de variante, registrar séries e finalizar já reflete corretamente no histórico salvo e na tela de detalhe.

---

## Phase 4: User Story 2 — Variante ativa visível na tela de treino (Priority: P2)

**Goal**: O usuário vê, na tela principal do exercício ativo, qual variante está em uso no momento, sem precisar reabrir a tela de detalhes/execução.

**Independent Test**: Trocar a variante de um exercício, fechar a tela de detalhes, e confirmar que a identificação da variante ativa aparece visível na tela principal do exercício — ver `quickstart.md` passo 1.

### Implementation for User Story 2

- [X] T010 [US2] Em `apps/web/src/app/workout/page.tsx`, no indicador "Variante ativa · {equip}" (bloco exibido quando `!selectedVariant.rec`), incluir o nome da variante (`selectedVariant.name`) além do equipamento, para que a identificação completa fique visível sem reabrir o `ExerciseSheet`; sem teste automatizado dedicado (ver nota em "Tests"); validar via `quickstart.md` passo 1

**Checkpoint**: US2 completa e testável de forma independente — não depende de US1 (é só leitura do estado `variantByExerciseIndex` já existente).

---

## Phase 5: User Story 3 — Indicador de compatibilidade genética reflete a variante ativa (Priority: P2)

**Goal**: O indicador de fit exibido no exercício ativo reflete o match real da variante atualmente ativa, em vez de um valor fixo.

**Independent Test**: Trocar entre variantes com scores de fit diferentes e confirmar que o indicador exibido na tela principal do exercício muda de acordo — ver `quickstart.md` passos 1 e 5.

### Implementation for User Story 3

- [X] T011 [US3] Em `apps/web/src/app/workout/page.tsx`, substituir o badge "96 fit" hardcoded pelo valor real: `{selectedVariant?.match ?? currentEx.match} fit`, só renderizando o badge quando esse valor existir (exercícios sem variantes na base podem não ter `match`, ver `packages/ai/src/variants.ts:106`) — usa o match da variante ativa quando há variantes; cai para o match do exercício planejado quando não há; sem teste automatizado dedicado (ver nota em "Tests"); validar via `quickstart.md` passos 1 e 5

**Checkpoint**: US3 completa e testável de forma independente — não depende de US1 nem de US2 (é só leitura do estado `selectedVariant` já existente).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Remover duplicação lateral encontrada durante o planejamento e validar tudo em conjunto.

- [X] T012 [P] Em `apps/web/src/hooks/useWorkoutHistory.ts`, trocar o shape duplicado manualmente no campo `exercises` de `WorkoutSessionRow` por `import type { ExerciseSet } from '@helux/types'` (`research.md` Decisão 3) — refactor puro, sem mudança de comportamento; `apps/web/src/__tests__/hooks/useWorkoutHistory.test.ts` não faz nenhuma asserção sobre o shape do exercício, então nenhum teste novo é necessário, só confirmar que a suíte existente continua verde
- [X] T013 [P] Rodar `pnpm --filter @helux/web test`, `pnpm --filter @helux/api test` e o typecheck do monorepo, confirmando que todos os testes novos (T002–T004) passam em verde e nenhum teste existente quebrou (incluindo `useWorkoutHistory.test.ts` após T012)
- [ ] T014 Executar o fluxo manual de verificação de `quickstart.md` (passos 1–5) contra o app rodando localmente

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — nada a inicializar
- **Foundational (Phase 2)**: sem dependências — pode começar imediatamente; bloqueia US1 (T007 usa o tipo `executedVariant`)
- **US1 (Phase 3)**: depende de Foundational — núcleo da feature (MVP); T009 depende de T007/T008 estarem prontos
- **US2 (Phase 4)**: sem dependência de US1 — só lê `variantByExerciseIndex`, já existente antes desta feature
- **US3 (Phase 5)**: sem dependência de US1 nem US2 — só lê `selectedVariant`, já existente antes desta feature
- **Polish (Phase 6)**: depende de US1, US2 e US3 completas

### Dentro de cada User Story

- Testes (T002–T004) escritos e **falhando** antes da implementação correspondente
- US1: tipo (T001) → estado (T005) → trava no toggle (T006) → payload de finishWorkout (T007) + schema da API (T008, paralelo) → exibição no histórico (T009)

### Parallel Opportunities

- T004 em paralelo com T002/T003 (API vs. hook, arquivos diferentes)
- T008 em paralelo com T005–T007 (rota da API vs. hook, arquivos diferentes)
- US2 (T010) e US3 (T011) podem ser feitas em paralelo entre si e em paralelo com US1, se houver mais de um desenvolvedor — nenhuma depende da lógica de persistência de US1
- T012/T013 em paralelo (arquivos diferentes)

---

## Parallel Example: User Story 1 — Tests

```bash
Task: "Estender useActiveWorkout.test.ts com o comportamento de trava de executedVariantByExerciseIndex"
Task: "Estender workout-sessions.test.ts para aceitar e persistir executedVariant"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 2: Foundational (T001)
2. Phase 3: US1 completa (T002–T009)
3. **PARAR e VALIDAR**: rodar `quickstart.md` passos 1–4 isoladamente
4. US1 sozinha já fecha o problema relatado (TD-004) — histórico correto é o que a spec 014 (progressão de carga) depende

### Incremental Delivery

1. Foundational → base pronta
2. US1 → validar independentemente → já é o incremento de maior valor (fecha o débito técnico)
3. US2 → validar como melhoria de UX independente (visibilidade da variante ativa)
4. US3 → validar como correção independente (badge de fit real)
5. Polish → suíte completa + fluxo manual de `quickstart.md`

---

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story correspondente para rastreabilidade
- Confirmar que os testes falham antes de implementar (TDD obrigatório pela constituição)
- US2 e US3 são deliberadamente magras (uma tarefa de implementação cada, sem teste automatizado dedicado) — são mudanças de exibição em páginas, área do código sem infraestrutura de teste de componente hoje (ver nota em "Tests")
- Evitar: tarefas vagas, dependências cruzadas entre US1/US2/US3 que quebrem a independência de cada uma
