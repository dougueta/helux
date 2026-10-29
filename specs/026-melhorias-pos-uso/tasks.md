# Tasks: Melhorias pós primeiro uso — digitação de carga e preview do próximo treino

**Input**: Design documents from `specs/026-melhorias-pos-uso/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

**Tests**: Obrigatórios (Constituição II, TDD). Em cada história, os testes são escritos e confirmados falhando (red) antes da implementação.

**Comandos**: `pnpm --filter @helux/web test -- <arquivo>` · `pnpm --filter @helux/web typecheck` · `pnpm --filter @helux/web lint`

Caminhos relativos à raiz do repositório; código em `apps/web/src/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: História da spec (US1, US2)

---

## Phase 1: Setup

**Purpose**: Garantir uma base verde antes de mudar qualquer coisa.

- [X] T001 Rodar `pnpm install` e `pnpm --filter @helux/web test` na branch `026-melhorias-pos-uso` e registrar no fim deste arquivo (seção Notas) os testes que já falham em `main`, para não confundi-los com regressões

---

## Phase 2: Foundational

Nenhuma tarefa bloqueante compartilhada: US1 e US2 tocam arquivos diferentes e podem começar logo após T001.

---

## Phase 3: User Story 1 — Digitar carga e repetições da série (Priority: P1) 🎯 MVP

**Goal**: Carga e reps digitáveis no `Stepper`, mantendo −/+. Carga com até 2 casas decimais (10,25 / 10,50), reps inteiras, faixas kg `[0, 500]` e reps `[0, 100]`.

**Independent Test**: Iniciar um treino, digitar `10,25` no kg, confirmar e ver "10,25"; tocar "+" e ver "12,75"; digitar `12` nas reps; concluir a série e conferir que a carga salva é 10,25 (quickstart, US1).

### Tests for User Story 1 ⚠️ (escrever primeiro, confirmar que falham)

- [X] T002 [P] [US1] Criar `apps/web/src/__tests__/lib/stepperInput.test.ts` cobrindo `parseStepperInput(raw, { min, max, decimals })` e `roundTo(n, decimals)`:
  - `"10,25"` e `"10.25"` → 10.25; `"42,5"` → 42.5; `"10,257"` (decimals 2) → 10.26;
  - `""`, `"  "`, `"abc"`, `","` → `null`;
  - `"-3"` → 0 (min 0); `"900"` → 500 (max 500);
  - reps (decimals 0, max 100): `"11,6"` → 12, `"150"` → 100;
  - `roundTo(10.25 + 2.5, 2)` → 12.75 e `roundTo(0.1 + 0.2, 2)` → 0.3 (sem erro de ponto flutuante)
- [X] T003 [P] [US1] Ampliar `apps/web/src/__tests__/components/ui/Stepper.test.tsx` com novos casos (sem remover os existentes):
  - há um `textbox` com nome `kg` mostrando `82,5`; com `decimals > 0` tem `inputMode="decimal"`, com `decimals={0}` tem `inputMode="numeric"`;
  - digitar `10,25` + blur → `onChange(10.25)` uma vez; digitar + Enter → `onChange` também;
  - durante a digitação (antes do blur) `onChange` não é chamado;
  - apagar tudo + blur → `onChange` não é chamado e o campo volta a mostrar o valor anterior; Escape descarta o rascunho;
  - `900` + blur com `max={500}` → `onChange(500)`; mesmo valor do atual + blur → `onChange` não é chamado;
  - com `value={10.25} decimals={2}`, "+" → `onChange(12.75)` (hoje dá 12.8) e "−" → `onChange(7.75)`; com `max`, "+" não passa do máximo;
  - `disabled` desabilita também o campo.
  - O teste existente "− e + com aria-label e valor pt-BR com aria-live" lê `textContent` do container `aria-live`. Se o valor passar a ficar no `value` do input, ajustar **só a forma de ler o valor** (ex.: `toHaveValue('82,5')` / `toHaveDisplayValue`), mantendo o que ele verifica. Registrar o ajuste em Notas.
- [X] T004 [P] [US1] Criar `apps/web/src/__tests__/components/ui/CurrentSet.test.tsx`:
  - kg aceita `10,25` → `onWeight(10.25)`;
  - reps aceita `12` → `onReps(12)` e `11,6` → `onReps(12)`;
  - kg acima de 500 vira 500, reps acima de 100 vira 100;
  - digitar `60` no kg e clicar direto no ✓ (`concluir série 1`) chama `onWeight(60)` **antes** de `onDone` (FR-006; usar `userEvent`, que dispara o blur antes do clique)

### Implementation for User Story 1

- [X] T005 [US1] Criar `apps/web/src/lib/stepperInput.ts` com `roundTo(n, decimals)` (via `Math.round(n * 10 ** d) / 10 ** d`, com correção de `Number.EPSILON`) e `parseStepperInput(raw, { min, max, decimals }): number | null` conforme data-model.md, até T002 passar
- [X] T006 [US1] Alterar `apps/web/src/components/ui/Stepper.tsx` conforme contracts/ui.md, até T003 passar:
  - props `max?: number` e `decimals?: number` (padrão 2);
  - trocar `round1` por `roundTo(…, decimals)` nos botões, respeitando `min` e `max`;
  - o valor central vira `<input type="text" inputMode=… aria-label={label}>` com rascunho local (`useState`). Fora de edição mostra `formatNumber(value)`; com o foco, seleciona o texto. No blur/Enter chama `parseStepperInput` e só chama `onChange` se o resultado não for `null` e for diferente de `value`. Escape restaura e tira o foco;
  - manter a classe `.hx-step-v`, o `<small>{unit}</small>`, a classe `n-md` e o `aria-live`;
  - atualizar o comentário do topo (kg ± 2,5 com 2 casas, reps ± 1, digitável)
- [X] T007 [US1] Ajustar o CSS do valor em `apps/web/src/app/helux-v2.css` (bloco `.hx-step` / `.hx-step-v`) para o `input` herdar a tipografia do `n-md`, sem borda ou fundo próprios, centralizado e com largura que caiba "500" / "112,75". Foco visível com o anel de foco do design system (`:focus-visible`). Conferir em 360 px de largura que a linha `.hx-cur-row` (kg, reps, ✓) não quebra
- [X] T008 [US1] Alterar `apps/web/src/components/ui/CurrentSet.tsx` para passar `decimals={2} max={500}` no kg e `decimals={0} max={100}` nas reps, e atualizar o comentário do topo, até T004 passar
- [X] T009 [US1] Rodar `pnpm --filter @helux/web test` completo e confirmar que `Stepper`, `SetRow`, `CurrentSet` e `workout-page` passam (SC-005). Se `workout-page.test.tsx` usar o `textContent` do valor, aplicar o mesmo ajuste mínimo de T003 e registrar em Notas

**Checkpoint**: US1 completa e entregável sozinha (MVP).

---

## Phase 4: User Story 2 — Ver o próximo treino sem iniciá-lo (Priority: P1)

**Goal**: Tela `/treinos/proximo` com o treino de hoje completo e o detalhe de cada exercício só leitura, sem criar sessão nem check-in. Aberta pela Home e pela aba Treinos; "Iniciar treino" usa o fluxo atual, e "Continuar treino" aparece com sessão ativa.

**Independent Test**: Com plano e sem sessão ativa, Home → "Ver treino" → abrir a execução de um exercício → voltar: nenhum check-in apareceu, `localStorage` sem sessão ativa, progresso igual (quickstart, US2).

### Tests for User Story 2 ⚠️ (escrever primeiro, confirmar que falham)

- [X] T010 [P] [US2] Ampliar `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`: sem `onApply`, a aba Variantes lista as variantes (com "Atual" na ativa) e **não** tem botão "Trocar"; as abas Execução e "Fechar" funcionam igual. Os testes existentes com `onApply` continuam passando
- [X] T011 [P] [US2] Ampliar `apps/web/src/__tests__/components/workout/PlanExerciseList.test.tsx`:
  - exercício principal comum mostra `descanso 90s`; o 1º exercício de um biset mostra `sem descanso antes do par` e o 2º mostra `descanso 90s` (mesma regra de `restSecondsAfterSet` com `hasPendingSets` todo `true`);
  - aquecimento/volta à calma não mostram descanso;
  - com `onSelect`, cada exercício vira um botão `ver execução de {nome}` que chama `onSelect(index)` com o índice no plano completo (não o índice dentro da fase);
  - sem `onSelect`, não há botões (comportamento atual)
- [X] T012 [P] [US2] Criar `apps/web/src/__tests__/app/proximo-treino.test.tsx` para `ProximoTreinoClient`, mockando `next/navigation`, `useWorkoutPlan`, `useActiveWorkout`, `useTirednessFlow` e `apiFetch` como nos testes de app existentes (ver `workout-page.test.tsx`):
  - com `today`: título "Treino {letra} — {foco}", `WeekBadge`, todas as fases e todos os exercícios na ordem do plano, com séries × reps, carga e descanso;
  - com `today.changes`: os ajustes aparecem como texto e não há seletor de cansaço;
  - tocar num exercício abre a folha "Execução do exercício" sem botão "Trocar";
  - montar, abrir e fechar a folha não chama `startWorkout`, não chama `apiFetch`/`saveSessionCheckin` e não escreve em `localStorage` (FR-012, SC-003);
  - sem sessão ativa: "Iniciar treino" chama `openStart()` do `useTirednessFlow`, que recebe os mesmos `today.exercises` mostrados na lista (SC-004);
  - com `isActive: true`: aparece "Treino em andamento", o botão é "Continuar treino" e leva a `router.push('/workout')` sem chamar `startWorkout` (FR-015);
  - sem `today`: `router.replace('/treinos')`
- [X] T013 [P] [US2] Criar `apps/web/src/__tests__/app/home-ver-treino.test.tsx` para `HomeClient`: com `today`, existe um link "Ver treino" para `/treinos/proximo` junto de "Iniciar treino"; sem plano (estado "Gerar meu plano"), o link não aparece. Mockar hooks como em T012
- [X] T014 [P] [US2] Criar `apps/web/src/__tests__/app/treinos-preview.test.tsx` para `TreinosClient`:
  - com `today`, existe o link "Ver treino completo" para `/treinos/proximo`;
  - tocar num exercício da lista abre a folha de execução sem "Trocar";
  - "Iniciar treino" e "Editar" continuam presentes

### Implementation for User Story 2

- [X] T015 [P] [US2] Tornar `onApply` opcional em `apps/web/src/components/workout/ExerciseSheet.tsx`: sem ele, não renderizar o botão "Trocar" da aba Variantes (manter a marca "Atual") e atualizar o comentário do componente, até T010 passar
- [X] T016 [P] [US2] Alterar `apps/web/src/components/workout/PlanExerciseList.tsx` até T011 passar:
  - prop `onSelect?: (index: number) => void`;
  - em `MainRow`, linha de descanso via `restSecondsAfterSet({ exercises, exerciseIndex: index, hasPendingSets: exercises.map(() => true) })` de `@helux/workouts`, com o texto `descanso {s}s` ou `sem descanso antes do par`;
  - com `onSelect`, envolver o conteúdo de cada linha (`MainRow` e `SimpleRow`) num `<button type="button" aria-label="ver execução de {nome}">` com estilo de linha (classe `hx-row-btn` ou equivalente, sem fundo), mantendo o grid e o alvo de toque ≥ 44 px
- [X] T017 [US2] Criar `apps/web/src/app/treinos/proximo/ProximoTreinoClient.tsx` (`'use client'`) conforme contracts/ui.md, até T012 passar:
  - `useWorkoutPlan()` com fallback para o plano inicial da prop (padrão de `TreinosClient`);
  - `useActiveWorkout()` só para `isActive`/`startWorkout`, e `useTirednessFlow({ today, refetch, onStart })` como em `HomeClient`, para "Iniciar treino";
  - `ScreenHeader` com voltar (`router.back()`), `WeekBadge` e `SectionHeader` com título e contagem de exercícios principais;
  - lista de `today.changes` (só texto, se houver);
  - `PlanExerciseList` com `onSelect`, que abre `ExerciseSheet` sem `onApply` (`currentVariantId` indefinido = variante recomendada);
  - rodapé com `Banner` "Treino em andamento" + "Continuar treino" quando `isActive`, senão "Iniciar treino". Montar o diálogo do `useTirednessFlow` do mesmo jeito que `HomeClient` faz;
  - `router.replace('/treinos')` sem `today`
- [X] T018 [US2] Criar `apps/web/src/app/treinos/proximo/page.tsx` (server component) copiando o padrão de `apps/web/src/app/treinos/page.tsx`: `getServerSession()` → `redirect('/login')`; `serverFetch('/workout/latest-plan')` com o mesmo `revalidate`; renderizar `<ProximoTreinoClient plan={plan} />`. Sem histórico. Conferir que o modo mock da 021 (`apps/web/src/mocks/routes.ts`) já atende `/workout/latest-plan` nessa rota; se o middleware de mock listar páginas, incluir `/treinos/proximo`
- [X] T019 [US2] Em `apps/web/src/app/HomeClient.tsx`, adicionar logo abaixo do botão "Iniciar treino" (dentro do bloco `today`) um link secundário "Ver treino" para `/treinos/proximo` (componente `Link` do Next com a aparência de `Button kind="ghost" block`, seguindo o padrão de links-botão já usado no arquivo), até T013 passar
- [X] T020 [US2] Em `apps/web/src/app/treinos/TreinosClient.tsx`, até T014 passar:
  - link "Ver treino completo" para `/treinos/proximo` no `aside` do `SectionHeader` do treino atual (mantendo a contagem de exercícios ao lado) ou logo abaixo dele;
  - passar `onSelect` à `PlanExerciseList`, abrindo uma `ExerciseSheet` sem `onApply` com estado local `viewing: number | null`
- [X] T021 [US2] Rodar `pnpm --filter @helux/web test` completo e confirmar que nenhum teste existente quebrou

**Checkpoint**: US1 e US2 funcionando, cada uma testável sozinha.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T022 Rodar `pnpm --filter @helux/web typecheck` e `pnpm --filter @helux/web lint` e corrigir o que for desta feature
- [X] T023 Validar o roteiro manual de `specs/026-melhorias-pos-uso/quickstart.md` (US1 passos 1–8, US2 passos 1–6) no modo mock da 021, em viewport de celular (360–390 px), claro e escuro. Registrar o resultado em Notas
- [X] T024 [P] Registrar em `docs/backlog.md` a observação fora de escopo do plan.md (Riscos): "Iniciar treino" na Home e na aba Treinos sobrescreve, sem aviso, uma sessão em andamento

---

## Phase 6: Correções da revisão do PR #20

**Purpose**: corrigir os achados da revisão de código do PR #20 antes do merge. O contrato do `Stepper` mudou (ver `contracts/ui.md` e `research.md` R2): o valor válido passa a ser enviado a cada tecla, para que tocar no ✓ sem sair do campo não perca a carga digitada.

### Tests (escrever primeiro, confirmar que falham)

- [X] T025 [P] [US1] Testes em `apps/web/src/__tests__/components/ui/Stepper.test.tsx`: (a) valor válido digitado chama `onChange` sem blur, e desmontar com o campo focado não perde o valor; (b) "+" com rascunho aberto parte do valor digitado e o blur seguinte não sobrescreve; (c) focar e sair sem digitar não chama `onChange` (12,345 e 1000 continuam iguais); (d) prop `value` alterada de fora com o campo focado substitui o rascunho; (e) Escape volta ao valor de antes da edição; (f) a região `aria-live` não contém o campo e só anuncia mudanças dos botões
- [X] T026 [P] [US2] Testes em `PlanExerciseList.test.tsx` e `proximo-treino.test.tsx`: o nome acessível do botão da linha inclui a prescrição (séries × reps, carga, descanso); "voltar" do preview vai para a origem (`/` com `?de=home`, senão `/treinos`) sem depender do histórico do navegador

### Implementation

- [X] T027 [US1] `Stepper.tsx`: enviar o valor válido a cada tecla, botões partindo do valor atual e encerrando o rascunho, rascunho iniciado com o número cru (sem agrupamento nem arredondamento) e sem `onChange` se o texto não mudou, ressincronizar o rascunho quando `value` muda de fora, Escape restaura o valor de antes da edição
- [X] T028 [US1] `Stepper.tsx`: tirar o campo da região `aria-live`; um texto oculto (`.sr`) anuncia só as mudanças feitas pelos botões
- [X] T029 [US2] `PlanExerciseList.tsx`: trocar o `aria-label` do botão por um prefixo oculto "ver execução de" para o nome acessível incluir a prescrição; remover o `borderTop` repetido
- [X] T030 [US2] Preview: "voltar" com destino explícito (`?de=home` no link da Home → `/`, senão `/treinos`), sem `router.back()`
- [X] T031 [US2] Extrair `getLatestPlan` para `apps/web/src/lib/server-api.ts` e usar em `/`, `/treinos` e `/treinos/proximo`
- [X] T032 Registrar em `docs/backlog.md` a duplicação da ligação `TirednessDialog`/`useTirednessFlow` entre `HomeClient` e `ProximoTreinoClient` (achado da revisão, fora do escopo destas correções)
- [X] T033 Rodar `pnpm --filter @helux/web test` e `typecheck` completos

---

## Dependencies & Execution Order

- **T001** → todo o resto.
- **US1 (T002–T009)** e **US2 (T010–T021)** são independentes: arquivos diferentes, e as duas podem andar em paralelo após T001.
- Dentro de US1: T002, T003 e T004 (testes) → T005 → T006 → T007 → T008 → T009.
- Dentro de US2: T010–T014 (testes) → T015 e T016 (paralelos) → T017 → T018 → T019 e T020 → T021.
- **Polish (T022–T024)** depois das duas histórias; T024 pode ser feita a qualquer momento.

## Parallel Examples

```text
# US1 — testes juntos:
T002 stepperInput.test.ts · T003 Stepper.test.tsx · T004 CurrentSet.test.tsx

# US2 — testes juntos:
T010 ExerciseSheet.test · T011 PlanExerciseList.test · T012 proximo-treino.test · T013 home-ver-treino.test · T014 treinos-preview.test

# US2 — componentes base juntos:
T015 ExerciseSheet.tsx · T016 PlanExerciseList.tsx

# Entre histórias: US1 inteira em paralelo com US2 inteira.
```

## Implementation Strategy

1. **MVP = US1** (T001–T009): resolve o atrito de toda série e já pode ir para produção sozinha.
2. **US2** (T010–T021): preview, com a sessão ativa e o check-in intocados.
3. **Polish** (T022–T024): typecheck/lint, roteiro manual no celular, backlog.

## Notas

- **T001**: linha de base em `main`/`026` verde: 92 arquivos e 644 testes passando, nenhuma falha preexistente.
- **T003**: o teste antigo "− e + com aria-label e valor pt-BR com aria-live" passou a ler o valor por `input.value` (`toHaveValue('82,5')`) em vez de `textContent`; a verificação é a mesma. Nenhum outro teste existente precisou mudar (T009: `SetRow` e `workout-page` passaram sem ajuste).
- **T020**: o link "Ver treino completo" ficou logo abaixo da lista (opção prevista na tarefa), e não no `aside` do `SectionHeader`, que mantém a contagem de exercícios.
- **T021**: suíte completa com 97 arquivos e 673 testes passando.
- **T022**: `typecheck` limpo. `next lint` não roda: o ESLint da web nunca foi configurado (abre o assistente interativo do Next). É preexistente e ficou registrado em `docs/backlog.md`.
- **T023**: roteiro manual no modo mock (`NEXT_PUBLIC_DATA_SOURCE=mock`, `next dev`), em Chrome com a coluna do app (~390 px). Conferido:
  - Home → "Ver treino" abre `/treinos/proximo`, com a aba Treinos ativa, a lista completa e "descanso 90s".
  - Tocar num exercício abre "Execução do exercício" sem "Trocar"; nenhuma sessão em `localStorage`.
  - "Iniciar treino" no preview → diálogo de cansaço → `/workout` → check-in pré-treino (pulado).
  - kg digitado `10,25` + Enter → campo "10,25" e sessão com `weight: 10.25`; "+" → "12,75" / `12.75`.
  - Preview com a sessão ativa → "Treino em andamento" + "Continuar treino", com as séries intactas.
  - Não conferido manualmente: tema claro, teclado numérico de um celular real e o histórico após finalizar (cobertos só por testes/API, que já aceita duas casas).
- **T025–T033 (revisão do PR #20)**: o `Stepper` passou a enviar o valor válido a cada tecla (contrato atualizado em `contracts/ui.md` e R2 em `research.md`); o teste do `CurrentSet` sobre FR-006 agora confere o último valor antes do ✓. A busca do plano foi para `getLatestPlan` em `lib/server-api.ts`, com o mesmo cache de antes. O `aria-label` do grupo do Stepper continua igual ao do campo, porque os testes e o leitor de tela o usam como nome do grupo. Suíte: 680 testes, 679 passando; a única falha (`mock-mutations` › nutrição) é preexistente, também falha sem estas mudanças e ficou registrada em `docs/backlog.md`. `typecheck` limpo.
