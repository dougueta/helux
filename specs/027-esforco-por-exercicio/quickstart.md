# Quickstart: Esforço-alvo de cada exercício (027)

## Rodar

```powershell
pnpm install
pnpm --filter @helux/web dev
```

Sem backend: modo mock da 021 (`NEXT_PUBLIC_DATA_SOURCE=mock` em `apps/web/.env.local`, ou Dev Bar → "Usar dados mockados").

## Testes

```powershell
pnpm --filter @helux/workouts test
pnpm --filter @helux/web test
pnpm -r typecheck
```

A suíte de progressão (`packages/workouts/src/__tests__/progression.test.ts`) tem que passar sem nenhuma alteração (SC-004).

## Roteiro manual

### US1: alvo durante o treino

1. Home → "Iniciar treino" → pular o check-in.
2. No primeiro exercício principal, abaixo de "séries × reps, descanso", aparece "Esforço-alvo: … · sobrar N repetições" sem tocar em nada.
3. Tocar no alvo: abre a explicação ("Termine a série sentindo que conseguiria fazer mais N…"). Tocar de novo: ela fecha.
4. Ir para um aquecimento, cardio ou mobilidade: nenhum alvo, sem espaço vazio.
5. Numa semana de descarga, a linha começa com "Semana de descarga ·".
6. Lista do plano e `/treinos/proximo`: a linha do exercício usa o mesmo texto do alvo.

### US2: comparação

1. Concluir uma série de um exercício com alvo de 2 repetições sobrando.
2. Em "Como foi o esforço?", marcar "Fácil": aparece "Abaixo do alvo · Aumente a carga na próxima série."
3. Trocar para "Difícil": aparece "No alvo" na hora.
4. Marcar "No limite": aparece "Acima do alvo · Reduza a carga ou pare antes da falha na próxima série."
5. Concluir todas as séries e marcar "Fácil": a sugestão passa a falar "no próximo treino".
6. Fechar o app e reabrir o treino: o alvo e a comparação continuam iguais.

### US3: resumo

1. Finalizar um treino com um exercício marcado fora do alvo: o resumo mostra "X de Y exercícios no esforço-alvo" e lista esse exercício com o alvo e o nível marcado.
2. Finalizar com todos no alvo: só aparece a contagem.
3. Finalizar sem marcar nenhum esforço: a seção "Esforço" não aparece.
