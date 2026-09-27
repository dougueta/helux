# Contrato: plano do mesociclo (API ⇄ web ⇄ banco)

`GET /workout/latest-plan` continua devolvendo `AdjustedWorkoutPlanView`. Mudança **aditiva** em cada item de `today.exercises` / `today.plannedExercises`:

```jsonc
{
  "name": "Supino Reto (Barra)",
  "sets": 4, "reps": "8-10", "weight": "62kg",
  "phase": "principal",                 // opcional: "aquecimento" | "principal" | "volta-calma"
  "supersetGroup": "b1",                // opcional: biset (2 itens consecutivos do principal)
  "progression": {                      // opcional: decisão aplicada
    "action": "aumentar",
    "previousWeightKg": 60, "nextWeightKg": 62,
    "reason": "Topo da faixa (10 reps) em todas as séries com esforço moderado: +2 kg."
  }
}
```

Regras:
- Clientes antigos ignoram os campos. Clientes novos tratam ausência como principal / sem biset / sem progressão.
- `changes` do ajuste de cansaço (spec 011) só listam itens do principal (os outros nunca mudam).
- Normalização (`normalizeSessionExercises`) roda **antes de gravar**; a leitura não re-normaliza (planos antigos não têm campos a normalizar).

`POST /api/workouts/sessions`: **sem mudança de schema**. O payload passa a conter só exercícios do principal e `effort` ∈ {6, 7, 8, 9, 10}.
