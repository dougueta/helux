# Contrato de API: POST /api/workouts/sessions (MODIFICADO)

Rota existente (`apps/api/src/routes/workout-sessions.ts`) — sem mudança de path nem de método, só do schema de validação do corpo da requisição.

## Request Body — antes

```ts
const SetSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  effort: z.number().min(1).max(10),
})

const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(SetSchema),   // sem mínimo — aceita []
})

const SessionBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_s: z.number().int().nonnegative().optional(),
  exercises: z.array(ExerciseSchema),   // sem mínimo — aceita []
})
```

## Request Body — depois

```ts
const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(SetSchema),
  skipped: z.boolean().optional(),
})

const SessionBodySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration_s: z.number().int().nonnegative().optional(),
    exercises: z.array(ExerciseSchema),
  })
  .superRefine((body, ctx) => {
    for (const [i, ex] of body.exercises.entries()) {
      if (ex.sets.length === 0 && ex.skipped !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exercises', i, 'skipped'],
          message: 'Exercício sem séries precisa ser marcado skipped: true',
        })
      }
    }
  })
```

## Resposta em caso de violação

- **400 Bad Request**, mesmo formato de erro já usado pela rota hoje (`{ error: 'Bad Request', details: parsed.error.errors }`) — sem novo código de status, sem mudança na forma de reportar erro ao cliente.

## Compatibilidade

- Uma sessão onde **todos** os exercícios têm `sets.length > 0` passa exatamente como hoje — nenhuma mudança de comportamento (FR-006).
- Um cliente antigo que não envie `skipped` e mande um exercício com `sets: []` agora recebe 400 em vez de 201 — é a mudança intencional desta spec (fecha a brecha relatada). Não há necessidade de suporte a clientes antigos: `apps/web` é atualizado no mesmo PR que a API.
