# Data Model: Melhorias pós primeiro uso (026)

Nenhuma tabela, coluna, migration ou contrato de API muda. A feature só lê e escreve estruturas que já existem.

## Série registrada (existente, sem mudança de forma)

`ActiveWorkoutState.exerciseStates[i][j]` (web, `localStorage`) → enviada como `sets[]` em `POST /workout-sessions` (`{ reps: int > 0, weight: number ≥ 0, effort: 1..10 }`).

| Campo | Regra nova no cliente (026) |
|:---|:---|
| `weight` (kg) | Digitável. Faixa `[0, 500]`, até **2 casas decimais** (antes era 1 casa, pelos botões). −/+ com passo 2,5, preservando as duas casas. |
| `reps` | Digitável. Faixa `[0, 100]`, **inteiro**. −/+ com passo 1. |

### Normalização da entrada (função pura)

```text
parseStepperInput(raw, { min, max, decimals }) -> number | null
  raw.trim().replace(',', '.')        # "10,25" -> "10.25"
  vazio ou NaN                        -> null   (o chamador mantém o valor anterior)
  clamp(min, max)                     # -5 -> 0 ; 900 -> 500
  roundTo(decimals)                   # kg: 10.257 -> 10.26 ; reps: 11.6 -> 12
```

`roundTo(n, decimals)` substitui o `round1` do `Stepper` e também vale para os botões (`roundTo(value ± step, decimals)`).

## Próximo treino (existente, só leitura)

`AdjustedWorkoutPlanView.today` (`GET /workout/latest-plan` via `useWorkoutPlan`): `{ letter, focus, exercises: PlannedExercise[], changes, adjustmentReason }`, já com os ajustes de cansaço e as edições manuais aplicados.

O preview não cria nem altera dados. Estados de tela:

| Condição | O que o preview mostra |
|:---|:---|
| `plan.today` presente, sem sessão ativa | Lista completa + "Iniciar treino" |
| `plan.today` presente, `useActiveWorkout().isActive` | Lista completa + aviso "Treino em andamento" + "Continuar treino" |
| sem `plan.today` (sem plano, gerando, erro, ciclo concluído) | Redireciona para `/treinos`, que já trata esses estados |
