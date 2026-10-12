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

## Observações finais (implementação, 2026-10-12)

- **Verificação final:** `pnpm typecheck` 8/8; `pnpm test` verde (web 461, api 128, ai 121, workouts 100, genetics 30, health 27, types 17, mobile 9); `pnpm build` ok; guard do DS v2 verde.
- **Rótulo de descanso:** a linha "N × reps, descanso Ns" do treino ativo usa `restSecondsAfterSet` (mesmo ponto do timer). O 1º exercício de um biset mostra "sem descanso antes do par".
- **Carga decimal:** `useActiveWorkout` passou a ler a carga com `parseFloat` (antes `parseInt`), senão a progressão em passos de 2,5 kg ("102.5kg") virava 102 kg no treino.
- **Esforço no histórico:** sem relato continua gravando 8; com relato grava 6/7/9/10 em todas as séries concluídas do exercício.
- **Progressão:** só na transição automática de mesociclo (`triggerBackgroundPlanGeneration` → `generateAndSaveMesocycle(..., previous)`). Bootstrap e "Gerar novo plano" não aplicam (FR-020). Se a busca do histórico falhar, a geração segue sem progressão.
- **Sem verificação manual nesta entrega:** os passos 1–5 acima ficam para o usuário (exigem mesociclo real gerado pela IA e login).

## Notas para a spec 015 (descanso personalizado)

- **Ponto de extensão:** `restSecondsAfterSet(ctx)` em `packages/workouts/src/workout-flow.ts` é o único lugar que decide o descanso. Substituir/estender ali; `nextStepAfterSet` e a tela já consomem o valor (timer e rótulo).
- **Preservar:** 0 s nos itens de aquecimento/volta à calma e no 1º exercício de um biset cujo parceiro ainda tem série pendente.
- **Contexto disponível hoje:** `exercises`, `exerciseIndex`, `hasPendingSets`. Para descanso por exercício/genética/cansaço, ampliar `RestContext` (campos opcionais, para não quebrar chamadas atuais).
- **`useRestTimer` (hook órfão, anterior à 012):** continua sem uso; a tela controla o descanso localmente. Avaliar na 015 se reaproveita ou remove.
