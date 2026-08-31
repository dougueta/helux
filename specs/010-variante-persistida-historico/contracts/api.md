# Contrato de API: POST /api/workouts/sessions (MODIFICADO)

Rota existente (`apps/api/src/routes/workout-sessions.ts`) — sem mudança de path nem de método, só do schema de validação do corpo da requisição. Estende o contrato já modificado pela spec 009 (campo `skipped`).

## Request Body — antes (pós spec 009)

```ts
const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(SetSchema),
  skipped: z.boolean().optional(),
})
```

## Request Body — depois

```ts
const ExecutedVariantSchema = z.object({
  name: z.string().min(1),
  match: z.number().min(0).max(100),
})

const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(SetSchema),
  skipped: z.boolean().optional(),
  executedVariant: ExecutedVariantSchema.optional(),
})
```

O `superRefine` de `SessionBodySchema` (validação de `skipped`, da spec 009) permanece inalterado — `executedVariant` não interage com essa regra.

## Resposta em caso de violação

- **400 Bad Request**, mesmo formato de erro já usado pela rota hoje — sem novo código de status.

## Compatibilidade

- Uma sessão em que nenhum exercício teve variante trocada passa exatamente como hoje — nenhum item do payload inclui `executedVariant`, nenhuma mudança de comportamento (FR-003).
- Um cliente antigo que não envie `executedVariant` continua funcionando normalmente — o campo é opcional em todos os níveis, não há quebra de compatibilidade retroativa (diferente da mudança de `skipped` na spec 009, que introduziu uma rejeição; aqui não há rejeição nova).
