# Data Model: Variante Executada Persistida no Histórico

## `ExerciseSet` (packages/types/src/workout.ts) — MODIFICADO

```ts
export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
  skipped?: boolean
  executedVariant?: { name: string; match: number }
}
```

- **`name`**: inalterado — continua sendo o nome do exercício **originalmente planejado** (FR-002: nunca é substituído).
- **`executedVariant`**: presente **somente** quando o usuário registrou ao menos uma série sob uma variante diferente da recomendada/padrão. `name` é o nome da variante executada; `match` é o score de compatibilidade genética dessa variante no momento da execução (snapshot, não referência — ver `research.md` Decisão 2).
- **Regra de derivação** (calculada no cliente, em `useActiveWorkout`; ver `research.md` Decisão 1): a variante "executada" é a que estava ativa (`variantByExerciseIndex[exerciseIndex]`) no momento em que a **primeira** série do exercício foi marcada como feita. Trocas de variante posteriores ao registro da primeira série não alteram esse valor.
- Não é um campo livre — não existe estado em que `executedVariant` esteja presente mas nenhuma série tenha sido registrada com uma variante diferente da recomendada.
- Sessões salvas antes desta mudança simplesmente não têm este campo — consumidores futuros devem tratar sua ausência como "executado com a variante recomendada/planejada", nunca como erro.

## `ActiveWorkoutState` (apps/web/src/hooks/useActiveWorkout.ts) — MODIFICADO

```ts
export interface ActiveWorkoutState {
  planExercises: PlannedExercise[]
  exerciseStates: SetState[][]
  currentExerciseIndex: number
  startedAt: string
  restUntil?: string
  variantByExerciseIndex: Record<number, string>
  executedVariantByExerciseIndex: Record<number, string | undefined>
}
```

- **`executedVariantByExerciseIndex`**: novo. Chave = índice do exercício no plano; valor = `id` da variante travada como "executada" (ou `undefined`/ausente se nenhuma série foi registrada ainda, ou se a variante travada era a recomendada — equivalente a "nenhuma troca"). Nunca persistido no backend diretamente — só usado para derivar `executedVariant` no payload de `finishWorkout`.
- Sessões já salvas em `localStorage` antes desta mudança não têm este campo — hidratação trata ausência como `{}` (mesmo padrão já usado para `variantByExerciseIndex` em sessões legadas).

## Validação (apps/api ou apps/web, a decidir na implementação)

- **Regra de negócio**: `executedVariant`, quando presente, deve ter `name` não-vazio e `match` entre 0 e 100 — mesma faixa de `Variant.match` já usada no restante do app.
- Não introduz nenhuma entidade nova de banco — é uma extensão do tipo `ExerciseSet` já existente (ver spec 009).
