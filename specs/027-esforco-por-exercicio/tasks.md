# Tasks: Esforço-alvo de cada exercício durante o treino

**Input**: Design documents from `specs/027-esforco-por-exercicio/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

**Tests**: Obrigatórios (Constituição II, TDD). Em cada fase, os testes são escritos e confirmados falhando (red) antes da implementação.

**Comandos**: `pnpm --filter @helux/workouts test` · `pnpm --filter @helux/web test -- <arquivo>` · `pnpm -r typecheck` · `pnpm --filter @helux/web lint`

Caminhos relativos à raiz do repositório.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: História da spec (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Partir de uma base verde.

- [X] T001 Rodar `pnpm install`, `pnpm --filter @helux/workouts test` e `pnpm --filter @helux/web test` na branch `027-esforco-por-exercicio`. Anotar na seção Notas, no fim deste arquivo, os testes que já falham em `main`.

---

## Phase 2: Foundational (regra pura em `@helux/workouts`)

**Purpose**: Todas as histórias usam a tabela de correspondência e os textos (research R2/R3, data-model). Esta fase bloqueia as fases seguintes.

- [X] T002 Criar `packages/workouts/src/__tests__/effort-target.test.ts` (red), cobrindo:
  - `effortTarget(undefined)` → `null`.
  - Para RIR 0, 1, 2, 3, 4 e 5, `levels`, `label` e `remaining` da tabela R2:
    - 0 → `['limite']`, "No limite", "até a falha".
    - 1 → `['dificil']`, "Difícil", "sobrar 1 repetição".
    - 2 → `['moderado','dificil']`, "Moderado a difícil", "sobrar 2 repetições".
    - 3 → `['moderado']`, "Moderado".
    - 4 e 5 → `['facil']`, "Fácil", "sobrar 4/5 repetições".
  - RIR `-1` → tratado como 0; `2.4` → 2.
  - `explanation`:
    - RIR 2 contém "conseguiria fazer mais 2 com boa técnica".
    - RIR 0 contém "nenhuma repetição".
    - Ambos contêm "Se sobrar mais, aumente a carga; se sobrar menos, reduza."
  - `compareEffort`:
    - RIR 2: moderado e dificil → `'no-alvo'`; facil → `'abaixo'`; limite → `'acima'`.
    - RIR 0: limite → `'no-alvo'`; dificil → `'abaixo'`.
    - RIR 4: facil → `'no-alvo'`; moderado → `'acima'`.
  - `effortAdvice` com os quatro textos da tabela de sugestões do data-model; `'no-alvo'` → `null`.
  - `effortLevelLabel`: Fácil, Moderado, Difícil, No limite.
  - `summarizeEffort`:
    - Lista vazia → `null`.
    - Itens sem `level`, sem `rirTarget` ou de aquecimento/cardio/mobilidade são ignorados; se só restarem esses → `null`.
    - Mistura de no alvo e fora do alvo → `onTarget` e `total` corretos; `offTarget` só com abaixo/acima, na ordem de entrada, com `exerciseIndex`, `name`, `target`, `level` e `result`.
- [X] T003 Implementar `packages/workouts/src/effort-target.ts`:
  - Tipos `EffortComparison`, `EffortTarget`, `EffortSummaryItem` e `EffortSummary`, e as funções `effortTarget`, `compareEffort` (pela ordem de `EFFORT_LEVELS`), `effortAdvice`, `effortLevelLabel` e `summarizeEffort` (filtra com `isMainExercise`).
  - Exportar em `packages/workouts/src/index.ts`.
  - Não alterar `progression.ts`.
  - T002 deve ficar verde e `progression.test.ts` passar sem mudanças (SC-004).

**Checkpoint**: `pnpm --filter @helux/workouts test` e `pnpm -r typecheck` verdes.

---

## Phase 3: User Story 1 — Ver o esforço-alvo durante o treino (Priority: P1) 🎯 MVP

**Goal**: O exercício principal atual mostra o alvo em linguagem simples, com explicação em um toque e marcação da semana de descarga. A lista do plano e o preview usam o mesmo texto.

**Independent Test**: Iniciar um treino com um exercício de alvo 2 e ver "Esforço-alvo: Moderado a difícil · sobrar 2 repetições" sem tocar em nada. Tocar e ver a explicação. Num aquecimento, não aparece nada (quickstart, US1).

### Tests for User Story 1 ⚠️ (escrever primeiro, confirmar que falham)

- [X] T004 [P] [US1] Criar `apps/web/src/__tests__/components/workout/EffortTargetLine.test.tsx`:
  - `rir={undefined}` não renderiza nada (`container` vazio).
  - `rir={2}` mostra "Esforço-alvo: Moderado a difícil · sobrar 2 repetições".
  - `rir={0}` mostra "No limite · até a falha".
  - `deload` prefixa "Semana de descarga ·".
  - Sem `explainable`: não há botão.
  - Com `explainable`:
    - O botão começa com `aria-expanded="false"` e a explicação fica oculta.
    - O clique muda para `true` e mostra "conseguiria fazer mais 2 com boa técnica", ligada por `aria-controls`.
    - Um segundo clique esconde a explicação.
- [X] T005 [P] [US1] Ampliar `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`:
  - `startWorkout(plan, { deload: true })` grava `deload: true` na sessão e no `localStorage`.
  - `startWorkout(plan)` não grava `deload`.
  - Um estado salvo sem `deload` carrega normalmente.
- [X] T006 [P] [US1] Ampliar `apps/web/src/__tests__/app/workout-page.test.tsx` com o novo `describe('WorkoutPage — esforço-alvo (spec 027, US1)')`, usando `seedState`:
  - Exercício principal com `rirTarget: 2` mostra a linha do alvo junto ao exercício, sem toque extra.
  - Tocar no alvo mostra a explicação.
  - Com `deload: true` no estado, aparece "Semana de descarga".
  - Item de aquecimento (`phase: 'aquecimento'`) e exercício principal sem `rirTarget` não mostram "Esforço-alvo".
  - Trocar a variante mantém o mesmo alvo.
- [X] T007 [P] [US1] Atualizar `apps/web/src/__tests__/components/workout/PlanExerciseList.test.tsx` (linha ~113): a asserção `/deixe 2 repetições na reserva/i` passa a esperar "Esforço-alvo: Moderado a difícil · sobrar 2 repetições", sem botão de explicação dentro da linha.
- [X] T008 [P] [US1] Atualizar as asserções de `startWorkout` em `apps/web/src/__tests__/app/proximo-treino.test.tsx` (linha ~91) para `toHaveBeenCalledWith(EXERCISES, { deload: <valor do fixture> })`. Nos testes de Home e Treinos que verificam o início do treino, verificar que o segundo argumento recebe `plan.week?.deload`. Se algum desses testes não verificar a chamada, acrescentar um caso com `week.deload: true`.

### Implementation for User Story 1

- [X] T009 [US1] Criar `apps/web/src/components/workout/EffortTargetLine.tsx` conforme `contracts/ui.md`:
  - Usa `effortTarget`.
  - O botão de explicação usa `useId` para o `aria-controls`, e o texto da explicação fica em `<p className="t-secondary">`.
  - Usa as classes existentes (`t-secondary` e um botão sem estilo como em `PlanExerciseList`), sem CSS novo além do mínimo.
  - Deixa T004 verde.
- [X] T010 [US1] Em `apps/web/src/hooks/useActiveWorkout.ts`:
  - Acrescentar `deload?: boolean` em `ActiveWorkoutState`.
  - `startWorkout(planExercises, opts?: { deload?: boolean })` grava `deload` só quando for `true`.
  - Deixa T005 verde.
- [X] T011 [US1] Passar `{ deload: currentPlan?.week?.deload }` a `startWorkout` em:
  - `apps/web/src/app/HomeClient.tsx` (linha ~101),
  - `apps/web/src/app/treinos/TreinosClient.tsx` (linha ~48),
  - `apps/web/src/app/treinos/proximo/ProximoTreinoClient.tsx` (linha ~38).
  - Deixa T008 verde.
- [X] T012 [US1] Em `apps/web/src/app/workout/page.tsx`, dentro do bloco `{isMain && (...)}` da linha "séries × reps, descanso" (~linha 353), renderizar logo abaixo `<EffortTargetLine rir={currentEx.rirTarget} deload={session.deload} explainable />`. Deixa T006 verde.
- [X] T013 [US1] Em `apps/web/src/components/workout/PlanExerciseList.tsx`, trocar o `<span>` "Deixe N repetições na reserva" (linhas 90–94) por `<EffortTargetLine rir={exercise.rirTarget} />`, envolvido num `<span style={{ gridColumn: '1 / -1' }}>`. Deixa T007 verde.

**Checkpoint**: US1 completa e testável sozinha: o alvo aparece no treino, na lista e no preview.

---

## Phase 4: User Story 2 — Comparar o esforço registrado com o alvo (Priority: P1)

**Goal**: Depois de "Como foi o esforço?", mostrar "No alvo", "Abaixo do alvo" ou "Acima do alvo" e, fora do alvo, a sugestão para a próxima série ou o próximo treino. Só orienta.

**Independent Test**: Com alvo 2, concluir uma série e marcar "Fácil": aparece "Abaixo do alvo" com "Aumente a carga na próxima série". Trocar para "Difícil": aparece "No alvo" (quickstart, US2).

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] Criar `apps/web/src/__tests__/components/workout/EffortComparisonNote.test.tsx`:
  - Sem `rir` ou sem `level`, não renderiza nada.
  - `rir={2}`:
    - `moderado` → `role="status"` com "No alvo" e sem sugestão.
    - `facil` com `hasPendingSets` → "Abaixo do alvo" e "Aumente a carga na próxima série."
    - `facil` sem séries pendentes → "…no próximo treino."
    - `limite` → "Acima do alvo" e "Reduza a carga ou pare antes da falha na próxima série."
  - O resultado está no texto, não só em cor.
- [X] T015 [P] [US2] Ampliar `apps/web/src/__tests__/app/workout-page.test.tsx` com `describe('WorkoutPage — comparação de esforço (spec 027, US2)')`:
  - Exercício com `rirTarget: 2`, uma série feita e outra pendente.
  - Marcar "Fácil" → "Abaixo do alvo" e "próxima série".
  - Marcar "Difícil" → "No alvo" na hora (FR-010).
  - Com todas as séries feitas, "Fácil" → "próximo treino".
  - Exercício sem `rirTarget`: o `EffortPicker` funciona e não aparece comparação.
  - Estado salvo com `effortByExerciseIndex` já preenchido mostra a comparação ao abrir (sessão retomada).
  - Os testes existentes de "esforço percebido (spec 014)" continuam passando sem alteração (FR-011).

### Implementation for User Story 2

- [X] T016 [US2] Criar `apps/web/src/components/workout/EffortComparisonNote.tsx` conforme `contracts/ui.md`. Usa `effortTarget`, `compareEffort` e `effortAdvice`; o rótulo fica em `<strong>` e a sugestão logo depois, em `<p role="status" className="t-secondary">`. Deixa T014 verde.
- [X] T017 [US2] Em `apps/web/src/app/workout/page.tsx`, logo abaixo do `<EffortPicker>` (~linha 510), renderizar:

  ```tsx
  <EffortComparisonNote
    rir={currentEx.rirTarget}
    level={session.effortByExerciseIndex?.[currentIdx] ?? null}
    hasPendingSets={currentSets.some(s => !s.done)}
  />
  ```

  Não mudar `setEffort` nem `EFFORT_VALUE`. Deixa T015 verde.

**Checkpoint**: US1 e US2 completas; a suíte de progressão continua sem alterações.

---

## Phase 5: User Story 3 — Resumo do esforço ao final do treino (Priority: P2)

**Goal**: A tela de treino concluído mostra quantos exercícios ficaram no alvo e lista os que ficaram fora, com o alvo e o nível marcado.

**Independent Test**: Finalizar um treino com um exercício de alvo 1 marcado "Fácil" e ver "Abaixo do alvo" no resumo com esse exercício (quickstart, US3).

### Tests for User Story 3 ⚠️

- [X] T018 [P] [US3] Ampliar `apps/web/src/__tests__/components/workout/WorkoutDoneScreen.test.tsx`:
  - Sem a prop `effort` (ou com `null`), não aparece a seção "Esforço"; os testes atuais continuam iguais.
  - Com `{ onTarget: 3, total: 3, offTarget: [] }`, aparece "3 de 3 exercícios no esforço-alvo" e nenhuma lista.
  - Com 1 de 2 e um item `abaixo` (nome "Supino", alvo RIR 1, nível facil), aparece "1 de 2…" e uma lista com "Supino", "Abaixo do alvo", "alvo Difícil" e "você marcou Fácil".
- [X] T019 [P] [US3] Ampliar `apps/web/src/__tests__/app/workout-page.test.tsx` com `describe('WorkoutPage — resumo de esforço (spec 027, US3)')`:
  - Finalizar um treino (mesmo fluxo dos testes de "salvar ao concluir") com 2 exercícios com `rirTarget`, um no alvo e um "Fácil" com alvo 1.
  - A tela de concluído mostra "1 de 2" e lista o segundo exercício.
  - A seção continua visível depois que a sessão é limpa (salvamento OK).
  - Treino sem esforço marcado → sem seção.

### Implementation for User Story 3

- [X] T020 [US3] Em `apps/web/src/components/workout/WorkoutDoneScreen.tsx`, acrescentar a prop opcional `effort?: EffortSummary | null` e a seção "Esforço", conforme `contracts/ui.md`:
  - `t-caption` igual ao padrão da tela, depois do `<dl>` do resumo.
  - Lista `<ul>` com `effortLevelLabel` e `target.label`.
  - Deixa T018 verde.
- [X] T021 [US3] Em `apps/web/src/app/workout/page.tsx`:
  - Acrescentar `effort: EffortSummary | null` ao estado `finishSummary`.
  - Em `saveFinish`, calcular `summarizeEffort(session.planExercises.map((exercise, i) => ({ exercise, name, level: session.effortByExerciseIndex?.[i] })))`. O `name` é o da variante travada em `executedVariantByExerciseIndex[i]` (buscar em `exercise.variants`) ou, se não houver, `exercise.name`.
  - Passar `effort={finishSummary.effort}` ao `WorkoutDoneScreen`.
  - Deixa T019 verde.

**Checkpoint**: As três histórias funcionam juntas.

---

## Phase 6: Polish & Cross-Cutting

- [X] T022 Rodar `pnpm -r test`, `pnpm -r typecheck` e `pnpm --filter @helux/web lint`. Tudo verde, exceto as falhas anotadas em T001. Confirmar que `git diff main -- packages/workouts/src/progression.ts packages/workouts/src/__tests__/progression.test.ts` está vazio (SC-004).
- [X] T023 Conferir a acessibilidade (FR-014) nos testes e no código:
  - O alvo, a comparação e o resumo são texto legível, sem depender de cor.
  - O botão da explicação tem `aria-expanded` e `aria-controls`.
  - A comparação está em `role="status"`.
- [ ] T024 Seguir o roteiro manual de `specs/027-esforco-por-exercicio/quickstart.md` no modo mock e anotar o resultado em Notas. Os itens que dependem de celular ou de uma semana de descarga real ficam marcados como pendentes para o dono.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T003)**. T002 bloqueia T003, e T003 bloqueia todas as histórias.
- **US1 (T004–T013)**: depende de T003.
- **US2 (T014–T017)**: depende de T003. Usa `workout/page.tsx` como a US1, então T017 vem depois de T012 (mesmo arquivo).
- **US3 (T018–T021)**: depende de T003. T021 vem depois de T017 (mesmo arquivo `workout/page.tsx`).
- **Polish (T022–T024)**: depois de todas as histórias.

Dentro de cada história, os testes vêm antes da implementação. Tarefas no mesmo arquivo rodam em sequência: `workout-page.test.tsx` em T006 → T015 → T019, e `workout/page.tsx` em T012 → T017 → T021.

## Parallel Example

```text
# US1, depois de T003 — testes em arquivos diferentes:
T004 EffortTargetLine.test.tsx
T005 useActiveWorkout.test.ts
T006 workout-page.test.tsx
T007 PlanExerciseList.test.tsx
T008 proximo-treino.test.tsx (+ Home/Treinos)

# US2 e US3 — os testes de componente podem ser escritos em paralelo com a US1:
T014 EffortComparisonNote.test.tsx
T018 WorkoutDoneScreen.test.tsx
```

## Implementation Strategy

1. **MVP**: T001–T013, para o alvo aparecer no treino, na lista e no preview. Já dá para validar sozinho.
2. **Incremento 2**: T014–T017 (comparação), que fecha o ciclo alvo → registro.
3. **Incremento 3**: T018–T021 (resumo final).
4. **Fechamento**: T022–T024.

Um commit por fase, com o número das tarefas na mensagem.

## Notas

- **T001 (base, 2026-10-31)**: nenhuma falha prévia. Workouts 151 testes, web 680 testes.
- **T022**:
  - `pnpm -r test` verde: workouts 169, web 707, api 344, ai 239, nutrition 77, genetics 37, health 27, types 19, mobile 17.
  - `pnpm -r typecheck` limpo.
  - `git diff main` de `progression.ts` e `progression.test.ts` vazio (SC-004).
  - `pnpm --filter @helux/web lint` não roda: o projeto não tem configuração de ESLint e o `next lint` abre a pergunta interativa de setup. A situação é anterior a esta feature, e o CI não roda lint. Fica fora do escopo.
- **T023**:
  - O alvo, a comparação e o resumo são texto ("No alvo", "Abaixo do alvo"…), sem depender de cor.
  - O botão da explicação tem `aria-expanded` e `aria-controls` (só com a explicação aberta, para não apontar para um id ausente).
  - A comparação fica num `<p role="status">`, e o resumo numa `section` rotulada "Esforço".
- **T024**: os cenários do quickstart estão cobertos por testes automatizados (US1–US3, incluindo sessão retomada e variante). A verificação manual no celular (toque na explicação, leitura em tela pequena) e numa semana de descarga real fica pendente para o dono.
- **Testes ajustados de propósito**:
  - `PlanExerciseList`: o texto antigo "Deixe 2 repetições na reserva" passou a ser o texto do alvo (FR-006).
  - `proximo-treino`: `startWorkout` recebe `{ deload }`.
