# Quickstart: Visibilidade do Mesociclo na Home

## Rodando localmente

```bash
# na raiz do monorepo
pnpm install
pnpm --filter @helux/web test      # testes dos componentes novos + useWorkoutPlan
pnpm --filter @helux/web dev       # sobe a home localmente
```

## Ordem de implementação sugerida

1. Componentes novos (`UpcomingSessionsList`, `RecoveryAdjustedBadge`, `MesocycleProgress`) — construídos e testados isoladamente com dados mockados conforme `contracts/ui-contracts.md`, **sem depender do endpoint real** ainda.
2. `workout.service.ts` + `useWorkoutPlan.ts` — atualizar tipagem para `AdjustedWorkoutPlanView` assim que `006-mesociclo-treino-backend` expuser o novo formato de `GET /workout/latest-plan` (em ambiente local ou de staging).
3. `HomeClient.tsx` — integração final, incluindo os três estados de tela descritos em `data-model.md`.

## Fluxo manual de verificação (após implementar)

1. Com um mesociclo ativo tendo o treino de hoje ajustado por recovery (`today.adjusted: true`), abrir a home e confirmar que o badge aparece no card de hoje.
2. Com o mesmo mesociclo mas sem ajuste (`today.adjusted: false`), confirmar que o badge não aparece.
3. Confirmar que a lista de próximos treinos mostra a ordem correta, sem nenhuma data visível.
4. Simular o estado "mesociclo concluído, aguardando o próximo" (`today: null`, `status: 'generating'`) e confirmar que a home comunica isso claramente, sem parecer quebrada.
5. Testar em viewport de iPhone (Safari ou emulação) que a lista de próximos treinos rola horizontalmente sem afetar o scroll vertical da página.
