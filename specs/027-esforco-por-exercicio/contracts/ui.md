# Contratos de UI: Esforço-alvo (027)

## `EffortTargetLine` (novo — `apps/web/src/components/workout/EffortTargetLine.tsx`)

```ts
function EffortTargetLine(props: {
  rir: number | undefined
  deload?: boolean
  explainable?: boolean   // padrão false; true na sessão de treino
}): JSX.Element | null
```

- `rir === undefined` → `null` (FR-005, sem espaço vazio).
- Texto: `[Semana de descarga · ]Esforço-alvo: {label} · {remaining}`.
- Com `explainable`, o texto fica num `<button type="button" aria-expanded>`. Tocar mostra ou esconde `explanation` logo abaixo (`id` ligado por `aria-controls`). Sem `explainable`, é um `<span className="t-secondary">`.

## `EffortComparisonNote` (novo — `apps/web/src/components/workout/EffortComparisonNote.tsx`)

```ts
function EffortComparisonNote(props: {
  rir: number | undefined
  level: EffortLevel | null
  hasPendingSets: boolean
}): JSX.Element | null
```

- Sem `rir` ou sem `level` → `null` (US2 cenário 5).
- `<p role="status">` com "No alvo" | "Abaixo do alvo" | "Acima do alvo". Fora do alvo, a sugestão (`effortAdvice`) vem logo em seguida. O resultado é dado por texto, sem depender de cor (FR-014).

## Tela de treino (`apps/web/src/app/workout/page.tsx`)

- Exercício principal: `<EffortTargetLine rir={currentEx.rirTarget} deload={session.deload} explainable />` logo abaixo da linha "séries × reps, descanso" (FR-001, SC-001).
- Abaixo do `EffortPicker`: `<EffortComparisonNote rir={currentEx.rirTarget} level={effort} hasPendingSets={currentSets.some(s => !s.done)} />`.
- Itens que não são principais: nada muda.

## Lista do plano e preview (`PlanExerciseList.tsx`)

- A linha "Deixe N repetições na reserva" é substituída por `<EffortTargetLine rir={exercise.rirTarget} />`, sem explicação (FR-006). A marcação de descarga dessas telas continua no `WeekBadge`.

## Resumo final (`WorkoutDoneScreen.tsx`)

Nova prop opcional `effort?: EffortSummary | null`:

- `null`/ausente → nenhuma seção (FR-013).
- Com dados: uma seção "Esforço" com "{onTarget} de {total} exercícios no esforço-alvo". Se `offTarget` não estiver vazio, mostra uma lista `<ul>`. Cada item tem o nome, "Abaixo do alvo"/"Acima do alvo" e "alvo {label} · você marcou {nível}" (FR-012).

## `useActiveWorkout`

- `startWorkout(planExercises, opts?: { deload?: boolean })`: segundo argumento opcional. Os chamadores `HomeClient`, `TreinosClient` e `ProximoTreinoClient` passam `{ deload: plan.week?.deload }`.
