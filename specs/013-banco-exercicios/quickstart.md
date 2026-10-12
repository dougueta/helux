# Quickstart — Spec 013

```bash
# medição antes/depois (imprime os percentuais) + banco + variantes
pnpm --filter @helux/ai exec vitest run src/__tests__/motions.test.ts src/__tests__/exercise-bank.test.ts src/__tests__/variants.test.ts
pnpm --filter @helux/types exec vitest run
pnpm --filter @helux/web exec vitest run src/__tests__/components/workout/ExerciseDemo.test.tsx src/__tests__/components/workout/ExerciseSheet.test.tsx
```

Verificação manual (opcional, com dev server): gerar um plano novo, abrir "Ver execução" em agachamento, terra, remada, barra fixa, prancha, rosca e panturrilha e conferir as animações; com um perfil com alerta de joelho, abrir "Variantes" de um agachamento e conferir a etiqueta "Equivalente".
