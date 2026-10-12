# Data Model — Spec 013

## ExerciseBankEntry (`packages/ai/src/exercise-bank.ts`)

| Campo | Tipo | Regra |
|---|---|---|
| id, name | string | únicos |
| muscleGroup | string | chave de `MUSCLE_GROUP_LABEL` |
| equipment | `barra \| halteres \| maquina-cabo \| peso-corporal` | |
| pattern | string | 8 padrões |
| cues | string[] | 3–5 não vazias |
| muscles, tempo | derivados | inalterados |
| **stress** (novo, derivado) | `{ joelho: 0\|1\|2; ombro: 0\|1\|2; lombar: 0\|1\|2 }` | `PATTERN_STRESS[pattern]` + `STRESS_OVERRIDES[id]` |

`PATTERN_STRESS` (joelho/ombro/lombar): agachar 2/0/1 · dobrar-quadril 0/0/2 · empurrar-horizontal 0/1/0 · empurrar-vertical 0/2/1 · puxar-horizontal 0/1/1 · puxar-vertical 0/2/0 · core 0/0/1 · isolamento 0/0/0.

## MotionCatalogEntry (`packages/types/src/motion.ts`)

| Campo | Tipo | Regra |
|---|---|---|
| key | `MotionKey` | única |
| patterns | string[] | padrões de movimento que a animação representa |
| muscleGroups | string[]? | obrigatório quando `patterns` inclui `isolamento` |

`GENERIC_MOTION = 'press-flat'` (último recurso).

## Variant (`packages/types/src/workout.ts`)

Acrescenta `crossPattern?: boolean` — `true` só em equivalentes de outro padrão. Demais campos inalterados; `implement` passa a aceitar `bodyweight`.

## FlaggedJoint (interno a `variants.ts`)

`'joelho' | 'ombro' | 'lombar'`, extraído dos `alertas` do `GeneticProfile`.

## MotionPreset (`apps/web/.../ExerciseDemo.tsx`)

- `ArmPreset` (existente): `view`, `dur`, `tilt?`, `S`, `start/end {e,h}`.
- `PosePreset` (novo): `kind: 'pose'`, `view`, `dur`, `scene`, `mirror?`, `implAt`, `start/end: Pose` com pontos `head, sh, el, ha, hip, kn, an, toe`.
