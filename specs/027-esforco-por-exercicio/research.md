# Research: Esforço-alvo de cada exercício durante o treino (027)

## R1 — Onde fica a regra de alvo e comparação

**Decisão**: Novo módulo puro `packages/workouts/src/effort-target.ts`, exportado pelo `index.ts`, ao lado de `EffortLevel`, `EFFORT_VALUE` e `effortBand` (`progression.ts`). Funções:

- `effortTarget(rir)`: devolve os níveis aceitos e o texto do alvo.
- `compareEffort(rir, level)`: devolve `'no-alvo' | 'abaixo' | 'acima'`.
- `effortAdvice(result, hasPendingSets)`: devolve a sugestão.
- `summarizeEffort(items)`: monta o resumo do treino a partir de `{ exercise, name, level }` por exercício.

**Motivo**: É regra de domínio do treino e usa os tipos que já existem em `@helux/workouts`. Os testes unitários ficam no pacote, sem React (princípio IV). A web só formata e mostra.

**Alternativas**: Colocar a regra em `apps/web/src/lib`, o que separaria regra de esforço da progressão que usa a mesma escala. Mudar `effortBand`/`EFFORT_VALUE`: descartado por FR-011 e SC-004, a progressão não muda.

## R2 — Correspondência entre repetições na reserva (RIR) e nível

**Decisão** (clarificação Q1): o FR-008 vira uma tabela fixa.

| RIR | Níveis "No alvo" | Texto do alvo |
|---|---|---|
| ≥ 4 | facil | Fácil |
| 3 | moderado | Moderado |
| 2 | moderado, dificil | Moderado a difícil |
| 1 | dificil | Difícil |
| 0 | limite | No limite |

A comparação usa a ordem `EFFORT_LEVELS` (facil < moderado < dificil < limite). Um nível abaixo do menor nível aceito dá `abaixo`; acima do maior dá `acima`. RIR fracionário ou negativo não ocorre (o gerador usa inteiros ≥ 0). Por segurança, a função arredonda e limita a ≥ 0.

**Alternativas**: Comparar `EFFORT_VALUE` com `10 − RIR` e uma tolerância. Descartado porque seria mais difícil de explicar e de testar que a tabela.

## R3 — Texto do alvo e explicação

**Decisão**:

- Linha do alvo: `Esforço-alvo: {texto} · sobrar {n} {repetição|repetições}`.
- Com RIR 0, a linha fica `Esforço-alvo: No limite · até a falha`.
- Explicação (um toque):
  - RIR > 0: "Termine a série sentindo que conseguiria fazer mais {n} com boa técnica."
  - RIR 0: "Vá até não conseguir fazer mais nenhuma repetição com boa técnica."
  - Em ambos os casos, acrescenta: "Se sobrar mais, aumente a carga; se sobrar menos, reduza."
- Lista do plano e preview (FR-006): a linha "Deixe N repetições na reserva" passa a usar o mesmo texto da linha do alvo, sem o botão de explicação.

## R4 — Explicação em um toque

**Decisão**: O texto do alvo é um `<button aria-expanded>` que mostra ou esconde a explicação logo abaixo, na mesma tela. Não é um tooltip nem uma folha.

**Motivo**: Funciona por toque e por leitor de tela, sem foco preso nem portal. Segue FR-003 e FR-014.

**Alternativas**: Usar o `Sheet`, que seria pesado demais para uma frase. Tooltip com hover descartado porque não existe hover no celular.

## R5 — Semana de descarga na sessão

**Decisão**: `ActiveWorkoutState` ganha `deload?: boolean`. `startWorkout(planExercises, opts?: { deload?: boolean })` grava o valor, e os três chamadores (Home, Treinos, preview) passam `plan.week?.deload`. Com `deload`, a linha do alvo começa com "Semana de descarga · ".

**Motivo**: `PlannedExercise` não sabe a semana, e o RIR sozinho não identifica a descarga (as primeiras semanas também podem ter RIR alto). Sessões antigas sem o campo continuam funcionando (sem marcação).

**Alternativas**: Adicionar `deload` em `PlannedExercise`, o que mudaria o pacote de tipos e o gerador para um dado que é da semana, não do exercício.

## R6 — Variante, cansaço, biset e sessão retomada

- **Variante**: o alvo vem de `session.planExercises[i].rirTarget`, que não muda com a troca de variante. Herda sem código novo.
- **Cansaço**: `adjustExercisesForLevel` só muda séries e carga, não o `rirTarget`. A sessão mostra o `rirTarget` do exercício como está, então qualquer ajuste futuro aparece sozinho. Nenhum código específico.
- **Biset**: cada exercício é um índice próprio na sessão, com o próprio alvo e o próprio esforço.
- **Retomada**: `planExercises`, `effortByExerciseIndex` e `deload` ficam no `localStorage`. A comparação é recalculada na renderização, sem estado extra.

## R7 — Resumo no fim do treino (US3)

**Decisão**: `saveFinish` calcula `summarizeEffort(...)` com os exercícios da sessão, o nome resolvido e `session.effortByExerciseIndex`, e congela o resultado em `finishSummary.effort`, como já faz com volume e séries, porque a sessão é limpa depois de salvar. `WorkoutDoneScreen` recebe a prop opcional `effort`:

- `null` (nenhum exercício com alvo e esforço registrado): a seção não aparece.
- Todos no alvo: só a contagem ("3 de 3 exercícios no esforço-alvo").
- Algum fora do alvo: a contagem e uma lista com nome, resultado, alvo e esforço registrado.

O nome é o do exercício executado (variante travada, se houver) ou o planejado. Para isso, o chamador passa o nome resolvido.

**Alternativas**: Recalcular a partir do histórico salvo, descartado porque o histórico grava `effort` numérico por série e não o `rirTarget`.

## R8 — Comparação durante o treino

**Decisão**: Logo abaixo do `EffortPicker`, um `<p role="status">` mostra "No alvo", "Abaixo do alvo" ou "Acima do alvo" e, fora do alvo, a sugestão. O texto não depende de cor (FR-014). `hasPendingSets = currentSets.some(s => !s.done)` decide entre "na próxima série" e "no próximo treino".
