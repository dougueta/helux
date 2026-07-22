# Quickstart: Geração de Mesociclo de Treino com Ajuste por Recovery

## Rodando localmente

```bash
# na raiz do monorepo
pnpm install
pnpm --filter @helux/ai test        # testes da geração + ajuste determinístico
pnpm --filter @helux/api test       # testes das rotas/serviços afetados

# aplicar a migração nova localmente (requer Supabase CLI configurado, mesmo fluxo de 004-web-mvp)
supabase migration up
```

## Fluxo manual de verificação (após implementar)

1. Com um usuário sem mesociclo ativo, registrar uma sessão de treino (`POST /api/workouts/sessions`) e confirmar (via log/DB) que um `mesocycle_plans` foi criado com todas as sessões do ciclo esperado para os dias/semana do perfil.
2. Chamar `GET /workout/latest-plan` duas vezes no mesmo dia com dados de recovery diferentes simulados (HRV bom vs. HRV baixo) e confirmar que `today.adjusted` e `today.exercises[].sets` mudam entre as chamadas, sem novo insert em `mesocycle_plans`.
3. Registrar sessões em sequência até completar o mesociclo inteiro e confirmar que, após a última, um novo `mesocycle_plans` é criado automaticamente (pode levar alguns segundos, é fire-and-forget) e `GET /workout/latest-plan` eventualmente retorna o novo ciclo.
4. Pular deliberadamente vários dias entre duas chamadas de `GET /workout/latest-plan` sem registrar treino e confirmar que `today` continua sendo a mesma sessão pendente (fila não avança por tempo).

## Onde olhar primeiro no código

- `packages/ai/src/prompts.ts` — prompt de sessão única, referência para adaptar em `mesocycle-prompts.ts`.
- `packages/ai/src/planner.ts` — `generateWorkoutPlan`, referência para `mesocycle-planner.ts`.
- `apps/api/src/services/plan-generation.service.ts` — ponto de disparo atual da geração automática, a ser modificado.
- `apps/api/src/routes/workout-latest-plan.ts` — leitura atual de `workout_plans`, a ser modificada para ler `mesocycle_plans` + aplicar ajuste.
