# @helux/nutrition

Motor determinístico do módulo de nutrição (spec 018): fórmulas de biometria (TMB, % de gordura pela Marinha), metas e recalibração da fase de dieta, derivação do dia, catálogo de alimentos, montagem das refeições, trocas e âncora de horários.

Funções puras, sem I/O — mesmas entradas, mesma saída. A API persiste e orquestra; a web usa as mesmas funções para exibir (ex.: horários pelo treino real).

Contrato: `specs/018-nutricao-genetica/contracts/nutrition-engine.md`.

```bash
pnpm --filter @helux/nutrition test
```
