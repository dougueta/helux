# Data Model: Validação de Conclusão de Treino

## `ExerciseSet` (packages/types/src/workout.ts) — MODIFICADO

```ts
export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
  skipped?: boolean
}
```

- **`skipped`**: `true` quando o exercício foi apresentado ao usuário no treino ativo mas não teve nenhuma série registrada até o momento da finalização. Ausente/`false` (default) quando `sets.length > 0`.
- **Regra de derivação** (calculada no cliente, em `useActiveWorkout.finishWorkout`, e revalidada no servidor): `skipped = sets.length === 0`. Não é um campo livre — não existe estado em que `skipped: true` e `sets` não-vazio coexistam de forma válida.
- Não há migration de banco: `workout_sessions.exercises` já é uma coluna JSON (inserida diretamente via `supabase.from('workout_sessions').insert({ ..., exercises })`), então o campo novo passa a existir nos registros novos sem alterar o schema SQL.
- Sessões já salvas antes desta mudança simplesmente não têm o campo `skipped` em seus itens de `exercises` — consumidores futuros (ex: spec 014, progressão de carga) devem tratar `skipped` ausente como "desconhecido", nunca como "executado" nem como "pulado" por default.

## Validação (packages/types ou apps/api, a decidir na implementação)

- **Regra de negócio**: uma sessão só pode ser persistida se **todo** item de `exercises` com `sets.length === 0` estiver explicitamente marcado `skipped: true`. Isso impede que um cliente desatualizado (ou uma chamada direta à API) grave silenciosamente um exercício vazio sem o sinal de que o usuário foi avisado.
- Não introduz um novo tipo/entidade — é uma regra de validação sobre o tipo `WorkoutSession` já existente.
