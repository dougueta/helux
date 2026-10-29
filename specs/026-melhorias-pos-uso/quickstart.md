# Quickstart: Melhorias pós primeiro uso (026)

## Rodar

```powershell
pnpm install
pnpm --filter @helux/web dev
```

Para validar sem backend e sem gastos, use o modo mock da 021: `NEXT_PUBLIC_DATA_SOURCE=mock` em `apps/web/.env.local`, ou a Dev Bar → "Usar dados mockados".

## Testes

```powershell
pnpm --filter @helux/web test
pnpm --filter @helux/web typecheck
pnpm --filter @helux/web lint
```

## Roteiro manual

### US1 — carga e repetições digitáveis

1. Home → "Iniciar treino" → pular o check-in.
2. Tocar no valor de kg da série atual: abre o teclado numérico (no celular, com vírgula).
3. Digitar `10,25` e confirmar: aparece "10,25 kg".
4. Tocar em "+": aparece "12,75 kg".
5. Digitar `42.5`: aparece "42,5 kg". Apagar tudo e sair do campo: volta o valor anterior.
6. Digitar `900`: fica "500 kg". Digitar `-3`: fica "0 kg".
7. Tocar nas reps, digitar `12` e confirmar: aparece "12 reps"; "−" leva a 11.
8. Concluir a série e abrir o histórico depois de finalizar: a carga salva é 10,25 (ou o valor digitado), sem arredondar.

### US2 — preview do próximo treino

1. Sem treino em andamento, Home → "Ver treino": abre `/treinos/proximo` com todas as fases, séries × reps, carga, descanso e biset.
2. Tocar num exercício: abre a folha de execução; a aba Variantes não tem botão de troca.
3. Voltar para a Home: nenhum check-in apareceu; `localStorage` não tem sessão ativa; o progresso do ciclo é o mesmo.
4. No preview, "Iniciar treino": segue o fluxo atual (cansaço → `/workout` → check-in pré-treino), com os mesmos exercícios e a mesma ordem do preview.
5. Com um treino em andamento, abrir o preview: aparece "Treino em andamento" e o botão "Continuar treino", que volta para a mesma sessão sem perder séries.
6. Aba Treinos → "Ver treino completo" abre o mesmo preview; tocar num exercício da lista da aba abre a mesma folha só leitura.
