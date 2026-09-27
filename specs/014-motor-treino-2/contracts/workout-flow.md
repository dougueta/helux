# Contrato: fluxo após concluir uma série (`@helux/workouts/workout-flow`)

```ts
export const DEFAULT_REST_SECONDS = 90

export interface RestContext {
  exercises: PlannedExercise[]
  exerciseIndex: number
  /** hasPendingSets[i] = o exercício i ainda tem série não concluída (após a conclusão atual). */
  hasPendingSets: boolean[]
}

/** Ponto único do tempo de descanso — a spec 015 substitui/estende esta função. */
export function restSecondsAfterSet(ctx: RestContext): number

export interface NextStep { restSeconds: number; goToExerciseIndex: number | null }
export function nextStepAfterSet(ctx: RestContext): NextStep
```

Regras (spec FR-005, FR-011, FR-013):

| Situação | restSeconds | goToExerciseIndex |
|---|---|---|
| item de aquecimento/volta-calma | 0 | null |
| 1º membro de biset, parceiro com série pendente | 0 | índice do parceiro |
| 2º membro de biset, 1º com série pendente | `DEFAULT_REST_SECONDS` | índice do 1º |
| biset com parceiro sem série pendente / exercício comum | `DEFAULT_REST_SECONDS` | null |

Observações para a spec 015: o tempo de descanso de toda série do principal passa por `restSecondsAfterSet`; o 0 do 1º membro de biset e dos itens de aquecimento/volta-calma deve ser preservado. A tela usa `restSeconds` também no rótulo "descanso Ns" (hoje sempre 90 s no principal).
