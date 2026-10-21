# @helux/nutrition

Motor determinístico do módulo de nutrição (spec 018): fórmulas de biometria (TMB, % de gordura pela Marinha), metas e recalibração da fase de dieta, derivação do dia, catálogo de alimentos, montagem das refeições, trocas e âncora de horários.

Funções puras, sem I/O — mesmas entradas, mesma saída. A API persiste e orquestra; a web usa as mesmas funções para exibir (ex.: horários pelo treino real).

Contrato: `specs/018-nutricao-genetica/contracts/nutrition-engine.md`.

## Uso

```ts
import { classifyMarkers, nutritionFlags, phaseTargets, recalibrate, buildDayPlan, swapOptions, anchorMealTimes, recoveryNote } from '@helux/nutrition'

const markers = classifyMarkers(parseGeneraNutrition(genera)) // @helux/genetics
const flags = nutritionFlags(markers)                         // intoleranciaLactose, lowCarbEficaz, ...
const plan = buildDayPlan({ date, dayType, base: phase.baseTargets, weightKg, flags, geneticsActive: true, tiredness, swaps })
// plan.recovery traz água extra, orientações e, no dia `exausto`, a nota de recuperação (recoveryNote)
const timed = anchorMealTimes(plan, { startedAt, finishedAt, now })
```

```bash
pnpm --filter @helux/nutrition test
```
