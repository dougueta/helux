# Data Model: Esforço-alvo de cada exercício (027)

Não muda API, banco nem o tipo `PlannedExercise`. Só há tipos novos em `@helux/workouts` e um campo opcional na sessão local.

## Tipos novos (`packages/workouts/src/effort-target.ts`)

```ts
export type EffortComparison = 'no-alvo' | 'abaixo' | 'acima'

export interface EffortTarget {
  rir: number                 // inteiro ≥ 0
  levels: EffortLevel[]       // níveis "No alvo" (R2), em ordem crescente
  label: string               // "Moderado a difícil"
  remaining: string           // "sobrar 2 repetições" | "sobrar 1 repetição" | "até a falha"
  explanation: string         // R3
}

export interface EffortSummaryItem {
  exerciseIndex: number
  name: string
  target: EffortTarget
  level: EffortLevel
  result: EffortComparison
}

export interface EffortSummary {
  onTarget: number            // quantos ficaram no alvo
  total: number               // exercícios com alvo e esforço registrado
  offTarget: EffortSummaryItem[] // só abaixo/acima, na ordem do treino
}
```

## Funções

| Função | Entrada | Saída | Regras |
|---|---|---|---|
| `effortTarget(rir)` | `number \| undefined` | `EffortTarget \| null` | `undefined` → `null`. Arredonda; < 0 → 0. Tabela R2. |
| `compareEffort(target, level)` | `EffortTarget`, `EffortLevel` | `EffortComparison` | Pela ordem de `EFFORT_LEVELS`. |
| `effortAdvice(result, hasPendingSets)` | `EffortComparison`, `boolean` | `string \| null` | `no-alvo` → `null`. Ver tabela abaixo. |
| `effortLevelLabel(level)` | `EffortLevel` | `string` | Fácil / Moderado / Difícil / No limite. |
| `summarizeEffort(items)` | `{ exercise: PlannedExercise; name: string; level?: EffortLevel }[]` | `EffortSummary \| null` | Considera só os exercícios principais com `rirTarget` e `level`. Sem nenhum → `null`. |

### Sugestões (FR-009)

| Resultado | Série pendente | Sem série pendente |
|---|---|---|
| abaixo | "Aumente a carga na próxima série." | "Aumente a carga no próximo treino." |
| acima | "Reduza a carga ou pare antes da falha na próxima série." | "Reduza a carga ou pare antes da falha no próximo treino." |

## Sessão local (`apps/web/src/hooks/useActiveWorkout.ts`)

```ts
interface ActiveWorkoutState {
  // ...campos atuais
  /** Spec 027: sessão iniciada na semana de descarga; ausente em estados antigos. */
  deload?: boolean
}
```

`startWorkout(planExercises, opts?: { deload?: boolean })` grava `deload` só quando for `true`. Os campos `planExercises[i].rirTarget` e `effortByExerciseIndex` já existem e não mudam.

## Resumo congelado (`apps/web/src/app/workout/page.tsx`)

`finishSummary` ganha `effort: EffortSummary | null`, calculado em `saveFinish` antes de a sessão ser limpa.
