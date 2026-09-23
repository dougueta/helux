# Data Model: Cansaço Percebido com Níveis (011)

## Banco — `daily_tiredness_signals` (alterada)

| Coluna | Tipo | Regra |
|---|---|---|
| id, user_id, date, created_at | (existentes) | único por `(user_id, date)` |
| `level` | text not null | `in ('otimo','normal','cansado','exausto')`; linhas legadas → `'exausto'` |
| `override_automatic` | boolean not null default false | `true` = usuário confirmou sobrepor o relógio no dia |
| `updated_at` | timestamptz not null default now() | atualizado a cada PUT |

Migration: `supabase/migrations/20260922000000_tiredness_levels.sql` (não aplicada neste trabalho).

## Tipos (`@helux/types`, `tiredness.ts`)

```ts
type TirednessLevel = 'otimo' | 'normal' | 'cansado' | 'exausto'
type TirednessSource = 'manual' | 'automatic' | 'none'

interface TirednessAssessment {
  date: string                        // YYYY-MM-DD (UTC)
  manualLevel: TirednessLevel | null
  overrideAutomatic: boolean
  automaticLevel: TirednessLevel | null
  automaticHrv: number | null
  effectiveLevel: TirednessLevel | null
  source: TirednessSource
  conflict: boolean                   // manual e automático levam a ajustes diferentes
}

interface ExerciseAdjustmentChange {
  name: string
  setsBefore: number; setsAfter: number
  weightBefore: string; weightAfter: string
}
```

`AdjustedSession` (existente) ganha campos opcionais: `plannedExercises?: PlannedExercise[]`, `changes?: ExerciseAdjustmentChange[]` (planejado → ajustado), `tiredness?: TirednessAssessment`.

`DailyTirednessSignal { active }` (binário) é removido.

## Regras (`@helux/workouts/tiredness.ts`)

- `hrvToTirednessLevel(hrv)`: ≥60 normal; 40–59 cansado; <40 exausto.
- `tirednessTier(level)`: otimo/normal → `none`; cansado → `moderate`; exausto → `high`.
- `assessTiredness({ date, manualLevel, overrideAutomatic, hrv })`:
  - sem automático → efetivo = manual (`source` manual) ou null (`none`);
  - com automático e `manual && overrideAutomatic` → efetivo = manual (`manual`);
  - senão → efetivo = automático (`automatic`);
  - `conflict` = manual e automático presentes com tiers diferentes.
- `adjustExercisesForLevel(exercises, level)`: moderate → sets−1 (mín. 2); high → idem + peso `NNkg` × 0,9 arredondado a 0,5.
- `diffExercises(before, after)`: um item por exercício (mesmo índice) com séries ou carga diferentes.
- `buildAdjustedSession(session, assessment)` → `AdjustedSession` com `plannedExercises`, `changes`, `tiredness`, `adjusted` e `adjustmentReason`.
- `previewTirednessChoice({ assessment, plannedExercises, currentExercises, candidate, confirmOverride })` → `{ conflict, overrideAutomatic, nextAssessment, nextExercises, changesFromCurrent, changesFromPlanned, needsSave }`.

### Motivos (`adjustmentReason`)

- manual: `Você marcou "exausto" hoje` (+ ` — relógio indicava "cansado"` se sobrepôs)
- automático: `Relógio indica "cansado" (HRV 45 ms)`
