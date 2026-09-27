# Quickstart: Motor de Geração de Treino 2.0

## Testes direcionados

```bash
pnpm --filter @helux/workouts test          # plan-structure, workout-flow, progression, tiredness
pnpm --filter @helux/ai test                # prompts e planner (Anthropic mockado)
pnpm --filter @helux/api test -- plan-generation plan-context workout-latest-plan
pnpm --filter @helux/web test -- workout useActiveWorkout Treinos Home design-system-guard
```

## Verificação final (uma vez)

```bash
pnpm test && pnpm typecheck && pnpm build
```

## Validação manual (sem produção)

1. Com um mesociclo gerado pela IA (ambiente local), abrir **Treinos**: ver seções Aquecimento / Treino principal / Volta à calma e o marcador "Biset".
2. Iniciar o treino: marcar um item de aquecimento (sem descanso); no biset, concluir a série 1 do 1º exercício → tela vai ao 2º sem descanso; concluir a série do 2º → descanso de 90 s e volta ao 1º.
3. Relatar esforço num exercício (Fácil/Moderado/Difícil/No limite), finalizar; conferir no histórico que só o principal foi salvo.
4. Concluir todas as sessões do mesociclo: o próximo mesociclo mostra "+X kg" nos exercícios que progrediram, com motivo.
5. Plano antigo (sem fases): abrir e executar normalmente.
