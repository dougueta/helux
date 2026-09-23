# Data Model: Salvar o Treino ao Concluir

Nenhuma entidade persistida nova ou alterada. `workout_sessions` e o payload de `POST /api/workouts/sessions` ficam como estão; `localStorage['helux:active-workout']` (`ActiveWorkoutState`) também.

## Estado de finalização (cliente, transitório)

`FinishStatus = 'idle' | 'saving' | 'saved' | 'error'`

| De | Evento | Para | Efeito |
|---|---|---|---|
| idle | submit() | saving | chama `finishWorkout()` (POST) |
| saving | POST ok | saved | `finishWorkout` limpa localStorage e sessão |
| saving | POST falha | error | nada é limpo; treino retomável |
| error | submit() (Tentar novamente) | saving | nova tentativa |
| error | reset() (Voltar ao treino) | idle | volta à tela ativa |
| saving / saved | submit() | (sem mudança) | ignorado — guarda contra duplicidade |

## Resumo da conclusão (cliente, transitório)

`FinishSummary = { totalDone: number; elapsed: number }` — séries concluídas e minutos decorridos, calculados em `startFinish()`; existe enquanto a tela de conclusão estiver aberta (independe da sessão ativa, que some após o sucesso).
