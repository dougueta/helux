# Data Model: Motor de Geração de Treino 2.0

Nenhuma tabela ou coluna nova. Os campos vivem em `mesocycle_plans.sessions` (jsonb) e são opcionais.

## ExercisePhase (packages/types)

```ts
export type ExercisePhase = 'aquecimento' | 'principal' | 'volta-calma'
```
Ausente ⇒ `'principal'`.

## LoadProgression (packages/types)

```ts
export type ProgressionAction = 'aumentar' | 'manter' | 'reduzir' | 'sem-dados'
export interface LoadProgression {
  name: string                 // nome do exercício (chave de casamento com o novo plano)
  action: ProgressionAction
  previousWeightKg: number | null
  nextWeightKg: number | null  // null quando sem-dados
  reason: string               // pt-BR legível
}
```

## PlannedExercise (estendido)

| Campo | Tipo | Regra |
|---|---|---|
| `phase?` | `ExercisePhase` | desconhecido/ausente ⇒ principal; normalização reordena por fase |
| `supersetGroup?` | `string` | válido só com exatamente 2 itens consecutivos do principal com o mesmo valor; senão removido |
| `progression?` | `Omit<LoadProgression,'name'>` | presente só em itens do principal que receberam carga da regra (action ≠ sem-dados); `weight` = `${nextWeightKg}kg` |

Demais campos inalterados (name, sets, reps, weight, notes, cues, muscle, muscles, tempo, match, variants).

## PlanInput (estendido)

`loadProgression?: LoadProgression[]` — decisões calculadas antes da geração (só as com action ≠ sem-dados são enviadas à IA).

## Histórico (`workout_sessions.exercises`) — sem mudança de formato

`effort` de cada série passa a refletir o relato do usuário: fácil 6, moderado 7, difícil 9, limite 10, sem relato 8.

## ActiveWorkoutState (web, localStorage)

`effortByExerciseIndex?: Record<number, EffortLevel>` — `EffortLevel = 'facil' | 'moderado' | 'dificil' | 'limite'`. Ausente em estados antigos ⇒ `{}`.

## Entrada da regra de progressão

```ts
interface ProgressionExerciseInput {
  name: string
  prescribedSets: number
  prescribedReps: string            // "8-10", "12"
  performed: { sets: {reps:number; weight:number; effort:number}[]; skipped?: boolean; executedVariant?: {...} } | null
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
}
```

## Transições

Mesociclo N concluído → decisões (histórico desde `N.generated_at`) → prompt → resposta IA → `normalizeSessionExercises` → `applyProgression` → insert do mesociclo N+1.
