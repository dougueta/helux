# Exercise Sheet & Genetic Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the "Exercise Sheet" — a bottom sheet opened from a "Ver execução" card during an active workout that shows an animated SVG movement demo, step-by-step execution cues, a muscle map, and a "Variantes" tab letting the user swap the recommended exercise for a genetically-better-fit alternative without losing logged sets.

**Architecture:** Data flows from a new deterministic, rule-based `buildVariants()` function in `packages/ai` (no LLM call — genetic-fit scoring must be unit-testable) that is wired into `planner.ts`'s existing `attachCues`-style post-processing pipeline, extending `PlannedExercise` with optional `muscle`/`muscles`/`tempo`/`match`/`variants` fields. On the client, two new leaf presentational components (`ExerciseDemo` — a faithful port of the prototype's requestAnimationFrame SVG animation, and `MuscleMap` — a faithful port of the prototype's muscle diagram) compose into `ExerciseSheet`, which is wired into `apps/web/src/app/workout/page.tsx` alongside a new `variantByExerciseIndex` slice of `useActiveWorkout`'s localStorage-backed state.

**Tech Stack:** TypeScript 5 strict mode, Next.js 14 App Router, React 18, Vitest + `@testing-library/react` + `@testing-library/user-event` (apps/web), Vitest (packages/types, packages/ai).

**Known v1 design-fidelity limitations (intentional, not gaps):**
1. The prototype's `HELUX_MOTIONS` table only defines upper-body presses/raises (`press-overhead`, `raise-lateral`, `pushdown`, `press-flat`, `press-incline`, `ext-lying`) — there is no squat/hinge/row preset in the design handoff. `variants.ts`'s `motionFor()` maps `empurrar-vertical` → `press-overhead`, `isolamento` → `pushdown`, and everything else (including all lower-body and pulling patterns) falls back to `press-flat`, which is also `ExerciseDemo`'s own documented fallback for unmapped motion keys. This is a placeholder animation, not a bug.
2. The prototype's `MuscleMap` SVG only draws 7 regions (`peito`, `ombro`, `triceps`, `biceps`, `core`, `dorsal`, `quadriceps`). The exercise bank's `gluteo`, `posterior`, and `panturrilha` muscle groups have no dedicated region, so they collapse onto `quadriceps` (the closest lower-body area) via `MUSCLE_GROUP_TO_MM_KEY`.
3. The design mock's `Exercise` type has `scheme`/`rest` fields; the real `PlannedExercise` already has equivalent `sets`/`reps`/`weight` fields, so `ExerciseSheet` reuses those instead of introducing parallel fields (YAGNI).

## Global Constraints

- All colors/spacing in new/modified `apps/web` UI code MUST use existing CSS custom properties (`var(--accent)`, `var(--surface-1)`, `var(--r-pill)`, etc.) — never hardcode hex, except the two literal gradient hex stops in the demo player background (`#14180f`, `#0a0d09`, `#070906`), which are copied verbatim from the design handoff's CSS reference.
- Follow the app's existing "inline style objects on JSX elements" convention (not the prototype's `h-*` CSS class names) — this matches `apps/web/src/app/workout/page.tsx` and the shared `apps/web/src/components/ui/` primitives today.
- Shared UI primitives (`Icon`, `HelixMark`, `Ring`, `MatchBadge`, `Chip`, `Label`, `MiniStep`) already exist under `apps/web/src/components/ui/` (from the parallel `2026-07-18-design-system-foundation.md` plan) — import them, never redefine them locally.
- `buildVariants()` and all genetic-fit scoring logic MUST be deterministic, pure, and unit-tested — no LLM call, no randomness, matching the existing `attachCues` pattern in `packages/ai/src/planner.ts`.
- Do NOT modify `apps/web/src/app/HomeClient.tsx`, `apps/web/src/app/dna/DnaClient.tsx`, `apps/web/src/app/recovery/page.tsx`, or `apps/web/src/app/history/page.tsx` — those belong to other plans.
- Run the relevant package's test command after every task (`cd apps/web && npx vitest run <file>` / `cd packages/ai && npx vitest run <file>` / `cd packages/types && npx vitest run <file>`) and `npm run typecheck` in that package before moving to the next task.
- All new user-facing copy is Portuguese (pt-BR), matching the existing tone in `apps/web/src/app/workout/page.tsx`.

---

## Task 1: Extend the shared `Icon` set with `pause`, `swap`, `bolt`

**Files:**
- Modify: `apps/web/src/components/ui/icons.tsx`
- Modify: `apps/web/src/__tests__/components/ui/icons.test.tsx`

**Interfaces:**
- Consumes: the existing `ICONS` const and `Icon` component (produced by the parallel design-system-foundation plan's Task 1).
- Produces: three new keys on `ICONS` — `pause`, `swap`, `bolt` — usable anywhere via `<Icon name="pause" />` etc. `pause` is used inside `ExerciseSheet`'s demo player controls (Task 8); `swap` and `bolt` are used in the active-workout variant-swap banners wired into `workout/page.tsx` (Task 10).

- [ ] **Step 1: Write the failing test**

Add this `it` block inside the existing `describe('Icon', ...)` block in `apps/web/src/__tests__/components/ui/icons.test.tsx`:

```tsx
  it('has path data for pause, swap, and bolt', () => {
    expect(ICONS.pause).toBe('M9 5v14M15 5v14')
    expect(ICONS.swap).toBe('M7 7h11l-3-3M17 17H6l3 3')
    expect(ICONS.bolt).toBe('M13 3 5 13h6l-1 8 8-10h-6z')
  })

  it('renders the swap icon path', () => {
    const { container } = render(<Icon name="swap" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.swap)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: FAIL — `ICONS.pause` is `undefined`, so `expect(undefined).toBe('M9 5v14M15 5v14')` fails.

- [ ] **Step 3: Add the three icon keys**

In `apps/web/src/components/ui/icons.tsx`, add these three lines inside the `ICONS` object (after `timer:`):

```tsx
  timer:    'M12 8v5l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 3h6',
  pause:    'M9 5v14M15 5v14',
  swap:     'M7 7h11l-3-3M17 17H6l3 3',
  bolt:     'M13 3 5 13h6l-1 8 8-10h-6z',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/icons.tsx apps/web/src/__tests__/components/ui/icons.test.tsx
git commit -m "feat(web): add pause, swap, bolt icons for the exercise sheet feature"
```

---

## Task 2: `Variant` type and `PlannedExercise` extension

**Files:**
- Modify: `packages/types/src/workout.ts`
- Modify: `packages/types/src/__tests__/types.test.ts`

**Interfaces:**
- Produces: `export interface Variant { id: string; name: string; equip: string; level: string; match: number; rec?: boolean; betterFit?: boolean; motion: string; implement: string; why: string }` and `PlannedExercise` gains optional `muscle?: string`, `muscles?: { primary: string[]; secondary: string[] }`, `tempo?: string`, `match?: number`, `variants?: Variant[]`. All existing `PlannedExercise` call sites (which only ever set `name/sets/reps/weight/notes/cues`) remain valid with no changes since every new field is optional.

- [ ] **Step 1: Write the failing test**

Add this to `packages/types/src/__tests__/types.test.ts` (new import of `Variant`, new `describe` block):

```ts
import type {
  GeneticProfile,
  WorkoutConstraints,
  WorkoutSession,
  ExerciseSet,
  RecoveryData,
  PlanInput,
  NextWorkoutPlan,
  PlannedExercise,
  Variant,
} from '../index'
```

```ts
describe('Variant', () => {
  it('descreve uma variante de exercício com fit genético', () => {
    const variante: Variant = {
      id: 'e1b',
      name: 'Supino reto com halteres',
      equip: 'Halteres',
      level: 'Intermediário',
      match: 90,
      betterFit: true,
      motion: 'press-flat',
      implement: 'dumbbell',
      why: 'Maior amplitude e estabilização; corrige assimetrias.',
    }
    expect(variante.betterFit).toBe(true)
    expect(variante.rec).toBeUndefined()
  })
})

describe('PlannedExercise — campos opcionais de variantes', () => {
  it('aceita muscle, muscles, tempo, match e variants além dos campos originais', () => {
    const exercicio: PlannedExercise = {
      name: 'Supino reto com barra',
      sets: 4,
      reps: '6-8',
      weight: '80kg',
      muscle: 'Peito',
      muscles: { primary: ['peito'], secondary: ['ombro', 'triceps'] },
      tempo: '2 · 0 · 1',
      match: 96,
      variants: [
        {
          id: 'e1',
          name: 'Supino reto com barra',
          equip: 'Barra',
          level: 'Avançado',
          match: 96,
          rec: true,
          motion: 'press-flat',
          implement: 'barbell',
          why: 'Cargas altas casam com seu perfil de força.',
        },
      ],
    }
    expect(exercicio.variants).toHaveLength(1)
    expect(exercicio.muscles?.primary).toEqual(['peito'])
  })

  it('continua válido sem nenhum dos novos campos (compatibilidade retroativa)', () => {
    const exercicio: PlannedExercise = { name: 'Agachamento', sets: 3, reps: '8-10', weight: '100kg' }
    expect(exercicio.variants).toBeUndefined()
    expect(exercicio.muscle).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/types && npx vitest run src/__tests__/types.test.ts`
Expected: FAIL with a TypeScript error — `Variant` is not exported from `'../index'`, and `PlannedExercise` has no properties `muscle`/`muscles`/`tempo`/`match`/`variants`.

- [ ] **Step 3: Add the `Variant` type and extend `PlannedExercise`**

In `packages/types/src/workout.ts`, replace the whole file content with:

```ts
export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ExerciseSet[]
}

export interface Variant {
  id: string
  name: string
  equip: string
  level: string
  match: number
  rec?: boolean
  betterFit?: boolean
  motion: string
  implement: string
  why: string
}

export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
  cues?: string[]
  muscle?: string
  muscles?: { primary: string[]; secondary: string[] }
  tempo?: string
  match?: number
  variants?: Variant[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/types && npx vitest run src/__tests__/types.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Typecheck the whole types package**

Run: `cd packages/types && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/workout.ts packages/types/src/__tests__/types.test.ts
git commit -m "feat(types): add Variant type and optional variant fields on PlannedExercise"
```

---

## Task 3: Derive `muscles`/`tempo` on every `EXERCISE_BANK` entry

**Files:**
- Modify: `packages/ai/src/exercise-bank.ts`
- Modify: `packages/ai/src/__tests__/exercise-bank.test.ts`

**Interfaces:**
- Consumes: nothing new (internal to the bank).
- Produces: `ExerciseBankEntry` gains required `muscles: { primary: string[]; secondary: string[] }` and `tempo: string` fields, computed deterministically from each entry's existing `muscleGroup`/`pattern` (not hand-authored per entry — 102 entries make that unmaintainable). Also exports `MUSCLE_GROUP_LABEL: Record<string, string>` (PT-BR display label per muscle group, e.g. `quadriceps` → `'Quadríceps'`), consumed by `planner.ts` in Task 5 to populate `PlannedExercise.muscle`.

- [ ] **Step 1: Write the failing tests**

Add these `describe` blocks to `packages/ai/src/__tests__/exercise-bank.test.ts` (keep the existing ones untouched):

```ts
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from '../exercise-bank'
```

```ts
describe('EXERCISE_BANK — músculos e tempo derivados', () => {
  it('toda entrada tem muscles.primary com pelo menos 1 chave válida do MuscleMap', () => {
    const validKeys = ['peito', 'ombro', 'triceps', 'biceps', 'core', 'dorsal', 'quadriceps']
    for (const entry of EXERCISE_BANK) {
      expect(entry.muscles.primary.length).toBeGreaterThanOrEqual(1)
      for (const key of entry.muscles.primary) expect(validKeys).toContain(key)
      for (const key of entry.muscles.secondary) expect(validKeys).toContain(key)
    }
  })

  it('toda entrada tem tempo no formato "N · N · N"', () => {
    for (const entry of EXERCISE_BANK) {
      expect(entry.tempo).toMatch(/^\d+ · \d+ · \d+$/)
    }
  })

  it('Agachamento Livre (Barra): quadriceps primário, core secundário, tempo 2·0·1', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Agachamento Livre (Barra)')!
    expect(entry.muscles.primary).toEqual(['quadriceps'])
    expect(entry.muscles.secondary).toEqual(['core'])
    expect(entry.tempo).toBe('2 · 0 · 1')
  })

  it('Cadeira Extensora (isolamento): sem secundário, tempo 3·1·1', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Cadeira Extensora')!
    expect(entry.muscles.secondary).toEqual([])
    expect(entry.tempo).toBe('3 · 1 · 1')
  })

  it('Cadeira Abdutora (gluteo): mapeia para a região quadriceps do MuscleMap', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Cadeira Abdutora')!
    expect(entry.muscles.primary).toEqual(['quadriceps'])
  })
})

describe('MUSCLE_GROUP_LABEL', () => {
  it('tem um rótulo em português para cada muscleGroup usado no banco', () => {
    const groups = new Set(EXERCISE_BANK.map((e) => e.muscleGroup))
    for (const g of groups) expect(MUSCLE_GROUP_LABEL[g]).toBeTruthy()
    expect(MUSCLE_GROUP_LABEL.quadriceps).toBe('Quadríceps')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/ai && npx vitest run src/__tests__/exercise-bank.test.ts`
Expected: FAIL — `entry.muscles` is `undefined` (TypeError reading `.primary`), and `MUSCLE_GROUP_LABEL` is not exported.

- [ ] **Step 3: Rename the literal array to `RAW_ENTRIES` and extend the interface**

In `packages/ai/src/exercise-bank.ts`, replace the top of the file:

```ts
export interface ExerciseBankEntry {
  id: string
  name: string
  muscleGroup: string
  equipment: 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
  pattern: string
  cues: string[]
}

export const EXERCISE_BANK: ExerciseBankEntry[] = [
```

with:

```ts
export interface ExerciseBankEntry {
  id: string
  name: string
  muscleGroup: string
  equipment: 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
  pattern: string
  cues: string[]
  muscles: { primary: string[]; secondary: string[] }
  tempo: string
}

type RawEntry = Omit<ExerciseBankEntry, 'muscles' | 'tempo'>

const RAW_ENTRIES: RawEntry[] = [
```

Every one of the 102 literal exercise objects between this line and the closing `]` is unchanged — only the declaration line and the interface changed.

- [ ] **Step 4: Append the muscle/tempo derivation logic after the array's closing bracket**

Find the very last lines of the file (the `Cadeira Abdutora` entry and the array's closing `]`):

```ts
  {
    id: 'cadeira-abdutora',
    name: 'Cadeira Abdutora',
    muscleGroup: 'gluteo',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sentado, pernas apoiadas nas almofadas, joelhos juntos no início',
      'Abra as pernas contra a resistência, contraindo o glúteo médio',
      'Controle o retorno, sem deixar o peso "bater" as pernas de volta',
      'Bom exercício acessório para estabilidade do quadril e joelho',
    ],
  },
]
```

Replace just the trailing `]` with `]` followed by this new code (i.e. append everything below to the end of the file):

```ts
]

// ---- muscle-map + tempo derivation ----
// v1 limitation: the MuscleMap SVG only has 7 drawable regions (peito, ombro,
// triceps, biceps, core, dorsal, quadriceps). muscleGroup values with no
// dedicated region (gluteo, posterior, panturrilha) collapse onto quadriceps,
// the closest lower-body region, rather than being invented from scratch.
const MUSCLE_GROUP_TO_MM_KEY: Record<string, string> = {
  peito: 'peito',
  ombro: 'ombro',
  triceps: 'triceps',
  biceps: 'biceps',
  costas: 'dorsal',
  core: 'core',
  quadriceps: 'quadriceps',
  gluteo: 'quadriceps',
  posterior: 'quadriceps',
  panturrilha: 'quadriceps',
}

export const MUSCLE_GROUP_LABEL: Record<string, string> = {
  peito: 'Peito',
  ombro: 'Ombro',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  costas: 'Costas',
  core: 'Core',
  quadriceps: 'Quadríceps',
  gluteo: 'Glúteos',
  posterior: 'Posterior de Coxa',
  panturrilha: 'Panturrilha',
}

const PATTERN_SECONDARY: Record<string, string[]> = {
  agachar: ['core'],
  'dobrar-quadril': ['core', 'quadriceps'],
  'empurrar-horizontal': ['ombro', 'triceps'],
  'empurrar-vertical': ['triceps'],
  'puxar-horizontal': ['biceps'],
  'puxar-vertical': ['biceps'],
  core: [],
  isolamento: [],
}

const PATTERN_TEMPO: Record<string, string> = {
  agachar: '2 · 0 · 1',
  'dobrar-quadril': '2 · 0 · 1',
  'empurrar-horizontal': '2 · 0 · 1',
  'empurrar-vertical': '2 · 0 · 1',
  'puxar-horizontal': '2 · 1 · 1',
  'puxar-vertical': '2 · 1 · 1',
  core: '2 · 1 · 2',
  isolamento: '3 · 1 · 1',
}

function deriveMuscles(entry: RawEntry): { primary: string[]; secondary: string[] } {
  const primary = MUSCLE_GROUP_TO_MM_KEY[entry.muscleGroup] ?? entry.muscleGroup
  const secondary = (PATTERN_SECONDARY[entry.pattern] ?? []).filter((key) => key !== primary)
  return { primary: [primary], secondary }
}

function deriveTempo(entry: RawEntry): string {
  return PATTERN_TEMPO[entry.pattern] ?? '2 · 0 · 1'
}

export const EXERCISE_BANK: ExerciseBankEntry[] = RAW_ENTRIES.map((entry) => ({
  ...entry,
  muscles: deriveMuscles(entry),
  tempo: deriveTempo(entry),
}))
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/ai && npx vitest run src/__tests__/exercise-bank.test.ts`
Expected: PASS (all tests, old and new — the pre-existing 6 tests still pass unchanged since `RAW_ENTRIES`' content and `EXERCISE_BANK`'s `id`/`name`/`equipment`/`pattern`/`cues` fields are untouched)

- [ ] **Step 6: Typecheck**

Run: `cd packages/ai && npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/ai/src/exercise-bank.ts packages/ai/src/__tests__/exercise-bank.test.ts
git commit -m "feat(ai): derive muscles and tempo on every exercise bank entry"
```

---

## Task 4: `buildVariants()` — deterministic genetic-fit variant scoring

**Files:**
- Create: `packages/ai/src/variants.ts`
- Create: `packages/ai/src/__tests__/variants.test.ts`

**Interfaces:**
- Consumes: `EXERCISE_BANK`, `type ExerciseBankEntry` from `./exercise-bank` (Task 3); `GeneticProfile`, `Variant` from `@helux/types` (Task 2).
- Produces: `export function buildVariants(exerciseName: string, geneticProfile: GeneticProfile): Variant[]`, consumed by `planner.ts` in Task 5.

- [ ] **Step 1: Write the failing tests**

Create `packages/ai/src/__tests__/variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { GeneticProfile } from '@helux/types'
import { buildVariants } from '../variants'

describe('buildVariants', () => {
  it('retorna array vazio quando o exercício não existe no banco', () => {
    expect(buildVariants('Exercício Inexistente', {
      metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [],
    })).toEqual([])
  })

  it('gera 1 variante recomendada + 1 por equipamento distinto disponível no mesmo padrão de movimento', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)

    // 1 barra (rec) + halteres + maquina-cabo + peso-corporal = 4, deduped by equipment
    expect(variants).toHaveLength(4)
    expect(new Set(variants.map((v) => v.equip)).size).toBe(4)
  })

  it('marca exatamente a variante original como rec:true, com o match correto', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const recs = variants.filter((v) => v.rec)
    expect(recs).toHaveLength(1)
    expect(recs[0].name).toBe('Agachamento Livre (Barra)')
    expect(recs[0].match).toBe(74)
  })

  it('marca a Leg Press 45° como betterFit quando alertas de joelho favorecem máquina', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const betterFit = variants.filter((v) => v.betterFit)
    expect(betterFit).toHaveLength(1)
    expect(betterFit[0].name).toBe('Leg Press 45°')
    expect(betterFit[0].match).toBe(92)
  })

  it('ordena a lista por match decrescente', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const matches = variants.map((v) => v.match)
    expect(matches).toEqual([...matches].sort((a, b) => b - a))
    expect(variants[0].name).toBe('Leg Press 45°')
  })

  it('não marca nenhuma variante como betterFit quando a recomendada já é a de maior fit', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'alta', riscoCardiovascular: 'baixo',
      predisposicao: 'forca', alertas: [],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    expect(variants.filter((v) => v.betterFit)).toHaveLength(0)
    expect(variants.find((v) => v.rec)?.match).toBe(92)
  })

  it('todo match fica entre 50 e 99', () => {
    const profile: GeneticProfile = {
      metabolismo: 'lento', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'alto',
      predisposicao: 'endurance', alertas: ['risco articular generalizado'],
    }
    for (const name of ['Agachamento Livre (Barra)', 'Supino Reto (Barra)', 'Levantamento Terra (Barra)']) {
      for (const v of buildVariants(name, profile)) {
        expect(v.match).toBeGreaterThanOrEqual(50)
        expect(v.match).toBeLessThanOrEqual(99)
      }
    }
  })

  it('why nunca é uma string vazia', () => {
    const profile: GeneticProfile = {
      metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio',
      predisposicao: 'misto', alertas: [],
    }
    for (const v of buildVariants('Agachamento Livre (Barra)', profile)) {
      expect(v.why.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/ai && npx vitest run src/__tests__/variants.test.ts`
Expected: FAIL with "Cannot find module '../variants'"

- [ ] **Step 3: Implement `buildVariants`**

Create `packages/ai/src/variants.ts`:

```ts
import type { GeneticProfile, Variant } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry } from './exercise-bank'

type Equipment = ExerciseBankEntry['equipment']

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  'maquina-cabo': 'Máquina',
  'peso-corporal': 'Peso corporal',
}

const EQUIPMENT_LEVEL: Record<Equipment, string> = {
  barra: 'Avançado',
  halteres: 'Intermediário',
  'maquina-cabo': 'Iniciante',
  'peso-corporal': 'Iniciante',
}

const EQUIPMENT_IMPLEMENT: Record<Equipment, string> = {
  barra: 'barbell',
  halteres: 'dumbbell',
  'maquina-cabo': 'cable',
  'peso-corporal': 'machine',
}

// Genetic-fit scoring rules (deterministic, no LLM):
// base 70, plus a predisposição bonus per equipment, plus a recovery bonus,
// plus a joint/tendon-risk adjustment, clamped to [50, 99].
const FORCA_BONUS: Record<Equipment, number> = { barra: 18, halteres: 12, 'maquina-cabo': 4, 'peso-corporal': 0 }
const ENDURANCE_BONUS: Record<Equipment, number> = { barra: 2, halteres: 8, 'maquina-cabo': 12, 'peso-corporal': 16 }
const BAIXA_RECOVERY_BONUS: Record<Equipment, number> = { barra: -4, halteres: 0, 'maquina-cabo': 8, 'peso-corporal': 4 }
const JOINT_RISK_BONUS: Record<Equipment, number> = { barra: -10, halteres: 0, 'maquina-cabo': 10, 'peso-corporal': 6 }

const JOINT_RISK_PATTERN = /joelho|ombro|tend[ãa]o|tendinite|articula|ligamento/i

function hasJointRisk(alertas: string[]): boolean {
  return alertas.some((alerta) => JOINT_RISK_PATTERN.test(alerta))
}

function scoreEquipment(equipment: Equipment, profile: GeneticProfile): number {
  let score = 70

  if (profile.predisposicao === 'forca') score += FORCA_BONUS[equipment]
  else if (profile.predisposicao === 'endurance') score += ENDURANCE_BONUS[equipment]
  else score += 8 // misto: neutral bump, ranking driven by recovery/joint-risk rules instead

  if (profile.recuperacaoMuscular === 'baixa') score += BAIXA_RECOVERY_BONUS[equipment]
  else if (profile.recuperacaoMuscular === 'alta' && equipment === 'barra') score += 4

  if (hasJointRisk(profile.alertas)) score += JOINT_RISK_BONUS[equipment]

  return Math.max(50, Math.min(99, score))
}

function buildWhy(equipment: Equipment, profile: GeneticProfile): string {
  if (hasJointRisk(profile.alertas) && (equipment === 'maquina-cabo' || equipment === 'peso-corporal')) {
    return 'Trajetória mais controlada reduz o estresse nas articulações sinalizadas nos seus alertas.'
  }
  if (profile.predisposicao === 'forca' && (equipment === 'barra' || equipment === 'halteres')) {
    return 'Cargas altas casam com seu perfil de força.'
  }
  if (profile.predisposicao === 'endurance' && (equipment === 'maquina-cabo' || equipment === 'peso-corporal')) {
    return 'Padrão mais controlado favorece seu perfil de resistência em séries mais longas.'
  }
  if (profile.recuperacaoMuscular === 'baixa' && equipment === 'maquina-cabo') {
    return 'Menor exigência de estabilização ajuda sua recuperação muscular mais lenta.'
  }
  if (equipment === 'halteres') {
    return 'Maior amplitude e estabilização unilateral; ajuda a corrigir assimetrias.'
  }
  if (equipment === 'maquina-cabo') {
    return 'Trajetória guiada, mais seguro para treinar perto da falha.'
  }
  if (equipment === 'peso-corporal') {
    return 'Sem necessidade de equipamento; ótimo para variar o estímulo sem carga externa.'
  }
  return 'Alternativa de carga livre para variar o estímulo.'
}

// v1 limitation: HELUX_MOTIONS (ported in ExerciseDemo) only has upper-body
// press/pull presets. Patterns with no natural match fall back to 'press-flat'.
function motionFor(pattern: string): string {
  if (pattern === 'empurrar-vertical') return 'press-overhead'
  if (pattern === 'isolamento') return 'pushdown'
  return 'press-flat'
}

function toVariant(entry: ExerciseBankEntry, profile: GeneticProfile, rec: boolean): Variant {
  const variant: Variant = {
    id: entry.id,
    name: entry.name,
    equip: EQUIPMENT_LABEL[entry.equipment],
    level: EQUIPMENT_LEVEL[entry.equipment],
    match: scoreEquipment(entry.equipment, profile),
    motion: motionFor(entry.pattern),
    implement: EQUIPMENT_IMPLEMENT[entry.equipment],
    why: buildWhy(entry.equipment, profile),
  }
  if (rec) variant.rec = true
  return variant
}

export function buildVariants(exerciseName: string, geneticProfile: GeneticProfile): Variant[] {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exerciseName)
  if (!bankEntry) return []

  const seenEquipment = new Set<Equipment>([bankEntry.equipment])
  const uniqueCandidates: ExerciseBankEntry[] = []
  for (const entry of EXERCISE_BANK) {
    if (entry.pattern !== bankEntry.pattern) continue
    if (seenEquipment.has(entry.equipment)) continue
    seenEquipment.add(entry.equipment)
    uniqueCandidates.push(entry)
  }

  const rec = toVariant(bankEntry, geneticProfile, true)
  const others = uniqueCandidates.map((entry) => toVariant(entry, geneticProfile, false))
  const all = [rec, ...others].sort((a, b) => b.match - a.match)

  const topOther = all.find((v) => !v.rec)
  if (topOther && topOther.match > rec.match) {
    topOther.betterFit = true
  }

  return all
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/ai && npx vitest run src/__tests__/variants.test.ts`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Typecheck**

Run: `cd packages/ai && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ai/src/variants.ts packages/ai/src/__tests__/variants.test.ts
git commit -m "feat(ai): add deterministic genetic-fit variant scoring (buildVariants)"
```

---

## Task 5: Wire muscle/tempo/variants into `planner.ts`'s post-processing pipeline

**Files:**
- Modify: `packages/ai/src/planner.ts`
- Modify: `packages/ai/src/__tests__/planner.test.ts`

**Interfaces:**
- Consumes: `EXERCISE_BANK`, `MUSCLE_GROUP_LABEL` from `./exercise-bank` (Task 3); `buildVariants` from `./variants` (Task 4); `GeneticProfile` from `@helux/types`.
- Produces: `generateWorkoutPlan`'s output exercises now also carry `muscle`, `muscles`, `tempo`, `match`, `variants` when the exercise name matches an `EXERCISE_BANK` entry (same graceful-degradation contract as the existing `cues` attachment — untouched when there's no match).

- [ ] **Step 1: Write the failing tests**

Add this `describe` block to `packages/ai/src/__tests__/planner.test.ts` (after the existing `'generateWorkoutPlan — anexação de cues do catálogo'` block):

```ts
describe('generateWorkoutPlan — anexação de músculo, tempo e variantes', () => {
  it('anexa muscle, muscles, tempo, match e variants quando o nome bate com o catálogo', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        generatedAt: '2026-07-18T10:00:00.000Z',
        exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '8-10', weight: '100kg' }],
        rationale: 'Teste',
      }) }],
      usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    })

    const result = await generateWorkoutPlan(MOCK_INPUT)
    const exercise = result.exercises[0]

    expect(exercise.muscle).toBe('Quadríceps')
    expect(exercise.muscles).toEqual({ primary: ['quadriceps'], secondary: ['core'] })
    expect(exercise.tempo).toBe('2 · 0 · 1')
    expect(exercise.match).toBe(68)
    expect(exercise.variants).toBeDefined()
    expect(exercise.variants!.find((v) => v.rec)?.name).toBe('Agachamento Livre (Barra)')
  })

  it('não anexa muscle/tempo/variants quando o nome não bate com o catálogo', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        generatedAt: '2026-07-18T10:00:00.000Z',
        exercises: [{ name: 'Exercício Inventado Pela IA', sets: 3, reps: '10', weight: '20kg' }],
        rationale: 'Teste',
      }) }],
      usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    })

    const result = await generateWorkoutPlan(MOCK_INPUT)
    const exercise = result.exercises[0]

    expect(exercise.muscle).toBeUndefined()
    expect(exercise.muscles).toBeUndefined()
    expect(exercise.tempo).toBeUndefined()
    expect(exercise.match).toBeUndefined()
    expect(exercise.variants).toBeUndefined()
  })
})
```

Note: `MOCK_INPUT.geneticProfile` (already defined earlier in the file) is `{ metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: ['risco de lesão no ligamento'] }` — the `'ligamento'` alert triggers the joint-risk rule from Task 4, which is why `barra`'s score comes out to `70 + 8 (misto) - 10 (joint risk on barra) = 68`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/ai && npx vitest run src/__tests__/planner.test.ts`
Expected: FAIL — `exercise.muscle`/`muscles`/`tempo`/`match`/`variants` are all `undefined` in the first new test.

- [ ] **Step 3: Wire the new attachment functions into the pipeline**

In `packages/ai/src/planner.ts`, replace the whole file with:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { PlanInput, NextWorkoutPlan, PlannedExercise, GeneticProfile } from '@helux/types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from './exercise-bank'
import { buildVariants } from './variants'

export async function generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan> {
  const client = new Anthropic()

  const systemPrompt = buildSystemPrompt(input.geneticProfile, input.constraints)
  const userPrompt = buildUserPrompt(
    input.workoutHistory,
    input.recoveryData,
    input.userGoals,
    input.userLevel,
    input.availableDaysPerWeek,
    input.bodyCheckins,
  )

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
    stream: false,
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta da IA não contém bloco de texto')
  }

  const plan = { ...parseJsonResponse(textBlock.text), generatedAt: new Date().toISOString() }
  plan.exercises = plan.exercises.map((exercise) => enrichExercise(exercise, input.geneticProfile))

  return plan
}

function attachCues(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return { ...exercise, cues: bankEntry.cues }
}

function attachMuscleAndTempo(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return {
    ...exercise,
    muscle: MUSCLE_GROUP_LABEL[bankEntry.muscleGroup] ?? bankEntry.muscleGroup,
    muscles: bankEntry.muscles,
    tempo: bankEntry.tempo,
  }
}

function attachVariants(exercise: PlannedExercise, geneticProfile: GeneticProfile): PlannedExercise {
  const variants = buildVariants(exercise.name, geneticProfile)
  if (variants.length === 0) return exercise
  const rec = variants.find((v) => v.rec)
  return { ...exercise, variants, match: rec?.match }
}

function enrichExercise(exercise: PlannedExercise, geneticProfile: GeneticProfile): PlannedExercise {
  return attachVariants(attachMuscleAndTempo(attachCues(exercise)), geneticProfile)
}

function parseJsonResponse(text: string): NextWorkoutPlan {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    return JSON.parse(jsonStr) as NextWorkoutPlan
  } catch {
    throw new Error(`Falha ao parsear resposta da IA como JSON: ${text.slice(0, 300)}`)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/ai && npx vitest run src/__tests__/planner.test.ts`
Expected: PASS (all tests, including the pre-existing ones — `attachCues`'s behavior and call signature are unchanged, just composed differently)

- [ ] **Step 5: Run the full package test suite and typecheck**

Run: `cd packages/ai && npm run test && npm run typecheck`
Expected: both PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ai/src/planner.ts packages/ai/src/__tests__/planner.test.ts
git commit -m "feat(ai): attach muscle, tempo, and genetic-fit variants to generated plans"
```

---

## Task 6: `ExerciseDemo` — animated SVG movement demo

**Files:**
- Create: `apps/web/src/components/workout/ExerciseDemo.tsx`
- Create: `apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (self-contained, pure presentational).
- Produces: `export function ExerciseDemo({ motion: string, implement?: string, playing: boolean, nonce?: string | number })`, consumed by `ExerciseSheet` (Task 8) and `workout/page.tsx`'s preview card (Task 10).

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

describe('ExerciseDemo', () => {
  it('renders the start pose for press-flat (side view) when not playing', () => {
    const { container } = render(<ExerciseDemo motion="press-flat" implement="barbell" playing={false} />)
    // start.h for press-flat is [104, 106] — with playing=false the animation
    // loop never starts, so phase stays at 0 (the start pose).
    expect(container.querySelector('line[x2="104"][y2="106"]')).toBeInTheDocument()
    expect(container.querySelector('svg[aria-label="demonstração do movimento"]')).toBeInTheDocument()
  })

  it('renders the start pose for press-overhead (front view) when not playing', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="barbell" playing={false} />)
    // start.h for press-overhead is [176, 58]
    expect(container.querySelector('line[x2="176"][y2="58"]')).toBeInTheDocument()
  })

  it('falls back to press-flat for an unknown motion key', () => {
    const { container } = render(<ExerciseDemo motion="not-a-real-motion" playing={false} />)
    expect(container.querySelector('line[x2="104"][y2="106"]')).toBeInTheDocument()
  })

  it('renders 2 dumbbell end-caps per hand (4 total) in front view with implement="dumbbell"', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="dumbbell" playing={false} />)
    expect(container.querySelectorAll('circle[r="3.4"]')).toHaveLength(4)
  })

  it('renders a single bar with 2 end-caps in front view with the default barbell implement', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="barbell" playing={false} />)
    expect(container.querySelectorAll('circle[r="4"]')).toHaveLength(2)
  })

  it('starts the animation loop when playing is true', () => {
    render(<ExerciseDemo motion="press-flat" playing={true} />)
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('does not start the animation loop when playing is false', () => {
    render(<ExerciseDemo motion="press-flat" playing={false} />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/ExerciseDemo.test.tsx`
Expected: FAIL with "Cannot find module '@/components/workout/ExerciseDemo'"

- [ ] **Step 3: Implement `ExerciseDemo`**

Create `apps/web/src/components/workout/ExerciseDemo.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

type MotionView = 'front' | 'side'

interface MotionPreset {
  view: MotionView
  dur: number
  tilt?: number
  S: [number, number]
  start: { e: [number, number]; h: [number, number] }
  end: { e: [number, number]; h: [number, number] }
}

const HELUX_MOTIONS: Record<string, MotionPreset> = {
  'press-overhead': { view: 'front', dur: 2300, S: [136, 80], start: { e: [168, 96], h: [176, 58] }, end: { e: [150, 42], h: [138, 10] } },
  'raise-lateral': { view: 'front', dur: 2500, S: [136, 80], start: { e: [144, 124], h: [148, 162] }, end: { e: [176, 80], h: [206, 76] } },
  pushdown: { view: 'front', dur: 2000, S: [136, 80], start: { e: [140, 126], h: [118, 102] }, end: { e: [140, 126], h: [128, 168] } },
  'press-flat': { view: 'side', dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'press-incline': { view: 'side', tilt: -16, dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'ext-lying': { view: 'side', dur: 2200, S: [104, 150], start: { e: [104, 120], h: [82, 118] }, end: { e: [104, 120], h: [104, 92] } },
}

const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const lerpP = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]
const mir = (p: [number, number]): [number, number] => [220 - p[0], p[1]]

function Implement({
  view,
  impl,
  Rh,
  Lh,
  Re,
}: {
  view: MotionView
  impl: string
  Rh: [number, number]
  Lh?: [number, number]
  Re?: [number, number]
}) {
  const acc = 'var(--accent)'
  if (view === 'front' && Lh && Re) {
    if (impl === 'dumbbell') {
      const bar = (h: [number, number], e: [number, number]) => {
        const dx = h[0] - e[0]
        const dy = h[1] - e[1]
        const L = Math.hypot(dx, dy) || 1
        const px = (-dy / L) * 11
        const py = (dx / L) * 11
        return (
          <g>
            <line x1={h[0] - px} y1={h[1] - py} x2={h[0] + px} y2={h[1] + py} stroke={acc} strokeWidth="6" strokeLinecap="round" />
            <circle cx={h[0] - px} cy={h[1] - py} r="3.4" fill={acc} />
            <circle cx={h[0] + px} cy={h[1] + py} r="3.4" fill={acc} />
          </g>
        )
      }
      return (
        <g>
          {bar(Rh, Re)}
          {bar(Lh, mir(Re))}
        </g>
      )
    }
    if (impl === 'cable') {
      const mid: [number, number] = [(Rh[0] + Lh[0]) / 2, (Rh[1] + Lh[1]) / 2]
      return (
        <g>
          <line x1={110} y1={2} x2={mid[0]} y2={mid[1]} stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1={Lh[0]} y1={Lh[1]} x2={Rh[0]} y2={Rh[1]} stroke={acc} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      )
    }
    const rails =
      impl === 'machine' ? (
        <g stroke="var(--text-faint)" strokeWidth="1.6">
          <line x1={70} y1={6} x2={70} y2={150} />
          <line x1={150} y1={6} x2={150} y2={150} />
        </g>
      ) : null
    return (
      <g>
        {rails}
        <line x1={Lh[0]} y1={Lh[1]} x2={Rh[0]} y2={Rh[1]} stroke={acc} strokeWidth="6" strokeLinecap="round" />
        <circle cx={Lh[0]} cy={Lh[1]} r="4" fill={acc} />
        <circle cx={Rh[0]} cy={Rh[1]} r="4" fill={acc} />
      </g>
    )
  }
  const w = impl === 'dumbbell' ? 13 : 20
  return (
    <g>
      <line x1={Rh[0] - w} y1={Rh[1]} x2={Rh[0] + w} y2={Rh[1]} stroke={acc} strokeWidth="6" strokeLinecap="round" />
      <circle cx={Rh[0] - w} cy={Rh[1]} r="3.8" fill={acc} />
      <circle cx={Rh[0] + w} cy={Rh[1]} r="3.8" fill={acc} />
    </g>
  )
}

export function ExerciseDemo({
  motion,
  implement = 'barbell',
  playing,
  nonce,
}: {
  motion: string
  implement?: string
  playing: boolean
  nonce?: string | number
}) {
  const m = HELUX_MOTIONS[motion] || HELUX_MOTIONS['press-flat']
  const [ph, setPh] = useState(0)

  useEffect(() => {
    if (!playing) return
    let raf: number
    const start = performance.now()
    const loop = (now: number) => {
      const u = ((now - start) % m.dur) / m.dur
      const tri = u < 0.5 ? u / 0.5 : (1 - u) / 0.5
      setPh(easeIO(tri))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, motion, nonce])

  const S = m.S
  const e = lerpP(m.start.e, m.end.e, ph)
  const h = lerpP(m.start.h, m.end.h, ph)
  const limbS = { stroke: 'var(--text)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const jointFill = 'var(--surface-3)'

  const romFront = (
    <g stroke="var(--accent-line)" strokeWidth="2" strokeDasharray="2 5" fill="none" opacity="0.7">
      <line x1={m.start.h[0]} y1={m.start.h[1]} x2={m.end.h[0]} y2={m.end.h[1]} />
      <line x1={220 - m.start.h[0]} y1={m.start.h[1]} x2={220 - m.end.h[0]} y2={m.end.h[1]} />
    </g>
  )
  const romSide = (
    <line
      x1={m.start.h[0]}
      y1={m.start.h[1]}
      x2={m.end.h[0]}
      y2={m.end.h[1]}
      stroke="var(--accent-line)"
      strokeWidth="2"
      strokeDasharray="2 5"
      opacity="0.7"
    />
  )

  let scene
  if (m.view === 'front') {
    const Le = mir(e)
    const Lh = mir(h)
    const LS = mir(S)
    scene = (
      <g>
        {romFront}
        <g stroke="var(--text-dim)" strokeWidth={7} strokeLinecap="round" fill="none">
          <line x1={LS[0]} y1={LS[1]} x2={S[0]} y2={S[1]} />
          <line x1={110} y1={80} x2={110} y2={150} />
          <line x1={96} y1={150} x2={124} y2={150} />
          <line x1={100} y1={150} x2={98} y2={236} />
          <line x1={120} y1={150} x2={122} y2={236} />
        </g>
        <circle cx={110} cy={42} r={15} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
        <g {...limbS}>
          <line x1={S[0]} y1={S[1]} x2={e[0]} y2={e[1]} />
          <line x1={e[0]} y1={e[1]} x2={h[0]} y2={h[1]} />
          <line x1={LS[0]} y1={LS[1]} x2={Le[0]} y2={Le[1]} />
          <line x1={Le[0]} y1={Le[1]} x2={Lh[0]} y2={Lh[1]} />
        </g>
        <circle cx={e[0]} cy={e[1]} r="4.5" fill={jointFill} />
        <circle cx={Le[0]} cy={Le[1]} r="4.5" fill={jointFill} />
        <Implement view="front" impl={implement} Rh={h} Lh={Lh} Re={e} />
      </g>
    )
  } else {
    const tilt = m.tilt ? `rotate(${m.tilt} 110 150)` : undefined
    scene = (
      <g transform={tilt}>
        <g>
          <rect x={36} y={176} width={150} height={12} rx={6} fill="var(--surface-2)" stroke="var(--hairline)" />
          <line x1={54} y1={188} x2={54} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
          <line x1={168} y1={188} x2={168} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        </g>
        {romSide}
        <g stroke="var(--text-dim)" strokeWidth={7} strokeLinecap="round" fill="none">
          <line x1={72} y1={156} x2={150} y2={160} />
          <line x1={150} y1={160} x2={184} y2={160} />
          <line x1={184} y1={160} x2={190} y2={186} />
        </g>
        <circle cx={58} cy={150} r={14} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
        <g {...limbS}>
          <line x1={S[0]} y1={S[1]} x2={e[0]} y2={e[1]} />
          <line x1={e[0]} y1={e[1]} x2={h[0]} y2={h[1]} />
        </g>
        <circle cx={S[0]} cy={S[1]} r="4.5" fill={jointFill} />
        <circle cx={e[0]} cy={e[1]} r="4.5" fill={jointFill} />
        <Implement view="side" impl={implement} Rh={h} />
      </g>
    )
  }

  return (
    <svg viewBox="0 0 220 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="demonstração do movimento">
      {scene}
    </svg>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/ExerciseDemo.test.tsx`
Expected: PASS (all 7 tests)

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/workout/ExerciseDemo.tsx apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx
git commit -m "feat(web): add ExerciseDemo animated SVG movement component"
```

---

## Task 7: `MuscleMap` — worked-muscles diagram

**Files:**
- Create: `apps/web/src/components/workout/MuscleMap.tsx`
- Create: `apps/web/src/__tests__/components/workout/MuscleMap.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export function MuscleMap({ primary?: string[], secondary?: string[] })`, consumed by `ExerciseSheet` (Task 8).

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/__tests__/components/workout/MuscleMap.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MuscleMap } from '@/components/workout/MuscleMap'

describe('MuscleMap', () => {
  it('fills primary muscle regions with the accent color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    const peitoShapes = container.querySelectorAll('[data-muscle="peito"]')
    expect(peitoShapes.length).toBeGreaterThan(0)
    peitoShapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent)'))
  })

  it('fills secondary muscle regions with the soft accent color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    for (const key of ['ombro', 'triceps']) {
      const shapes = container.querySelectorAll(`[data-muscle="${key}"]`)
      expect(shapes.length).toBeGreaterThan(0)
      shapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent-soft)'))
    }
  })

  it('leaves unlisted regions at the neutral surface color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro']} />)
    for (const key of ['biceps', 'dorsal', 'core', 'quadriceps']) {
      const shapes = container.querySelectorAll(`[data-muscle="${key}"]`)
      expect(shapes.length).toBeGreaterThan(0)
      shapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--surface-3)'))
    }
  })

  it('renders a legend entry per primary and secondary muscle with the right label and role', () => {
    render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    expect(screen.getByText('Peitoral')).toBeInTheDocument()
    expect(screen.getByText('Deltoide')).toBeInTheDocument()
    expect(screen.getByText('Tríceps')).toBeInTheDocument()
    expect(screen.getAllByText('primário')).toHaveLength(1)
    expect(screen.getAllByText('secundário')).toHaveLength(2)
    expect(screen.queryByText('Quadríceps')).not.toBeInTheDocument()
  })

  it('renders with no primary/secondary given (all regions neutral, empty legend)', () => {
    const { container } = render(<MuscleMap />)
    expect(container.querySelectorAll('[data-muscle]').length).toBeGreaterThan(0)
    expect(screen.queryByText('primário')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/MuscleMap.test.tsx`
Expected: FAIL with "Cannot find module '@/components/workout/MuscleMap'"

- [ ] **Step 3: Implement `MuscleMap`**

Create `apps/web/src/components/workout/MuscleMap.tsx`:

```tsx
const MM_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  ombro: 'Deltoide',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  core: 'Core',
  dorsal: 'Dorsais',
  quadriceps: 'Quadríceps',
}

type EllipseShape = ['e', number, number, number, number]
type RectShape = ['r', number, number, number, number, number]
type Shape = EllipseShape | RectShape

const MM_REGIONS: { key: string; shapes: Shape[] }[] = [
  { key: 'ombro', shapes: [['e', 31, 58, 12, 9], ['e', 89, 58, 12, 9]] },
  { key: 'triceps', shapes: [['e', 15, 96, 6.5, 15], ['e', 105, 96, 6.5, 15]] },
  { key: 'biceps', shapes: [['e', 23, 92, 7, 15], ['e', 97, 92, 7, 15]] },
  { key: 'peito', shapes: [['e', 47, 80, 14, 11], ['e', 73, 80, 14, 11]] },
  { key: 'dorsal', shapes: [['e', 47, 94, 13, 13], ['e', 73, 94, 13, 13]] },
  { key: 'core', shapes: [['r', 50, 100, 20, 40, 8]] },
  { key: 'quadriceps', shapes: [['e', 49, 154, 10, 26], ['e', 71, 154, 10, 26]] },
]

export function MuscleMap({
  primary = [],
  secondary = [],
}: {
  primary?: string[]
  secondary?: string[]
}) {
  const fillFor = (k: string) => (primary.includes(k) ? 'var(--accent)' : secondary.includes(k) ? 'var(--accent-soft)' : 'var(--surface-3)')
  const strokeFor = (k: string) => (primary.includes(k) ? 'transparent' : secondary.includes(k) ? 'var(--accent-line)' : 'var(--hairline)')

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      <svg viewBox="0 0 120 210" width="96" height="168" aria-label="músculos trabalhados">
        <g fill="var(--surface-2)" stroke="var(--hairline)" strokeWidth="1.5">
          <circle cx="60" cy="24" r="13" />
          <path d="M40 44 Q60 38 80 44 L86 70 L80 150 H70 L66 100 H54 L50 150 H40 L34 70 Z" />
          <path d="M40 46 L22 64 L16 116 H26 L34 74 Z" />
          <path d="M80 46 L98 64 L104 116 H94 L86 74 Z" />
          <path d="M50 150 L48 200 H58 L60 156 L62 200 H72 L70 150 Z" />
        </g>
        {MM_REGIONS.map((reg, i) => (
          <g key={i} fill={fillFor(reg.key)} stroke={strokeFor(reg.key)} strokeWidth="1.2">
            {reg.shapes.map((s, j) =>
              s[0] === 'e' ? (
                <ellipse key={j} cx={s[1]} cy={s[2]} rx={s[3]} ry={s[4]} data-muscle={reg.key} />
              ) : (
                <rect key={j} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5]} data-muscle={reg.key} />
              ),
            )}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {primary.map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--accent)' }} />
            {MM_LABEL[k] || k}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>primário</span>
          </div>
        ))}
        {secondary.map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)' }} />
            {MM_LABEL[k] || k}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>secundário</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/MuscleMap.test.tsx`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/workout/MuscleMap.tsx apps/web/src/__tests__/components/workout/MuscleMap.test.tsx
git commit -m "feat(web): add MuscleMap worked-muscles diagram component"
```

---

## Task 8: `ExerciseSheet` — the bottom sheet

**Files:**
- Create: `apps/web/src/components/workout/ExerciseSheet.tsx`
- Create: `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`

**Interfaces:**
- Consumes: `Icon` (`@/components/ui/icons`, Task 1), `MatchBadge` (`@/components/ui/MatchBadge`), `Chip` (`@/components/ui/Chip`) — both assumed to already exist per the parallel design-system-foundation plan; `ExerciseDemo` (Task 6); `MuscleMap` (Task 7); `PlannedExercise` (`@helux/types`, Task 2).
- Produces: `export function ExerciseSheet({ exercise: PlannedExercise, currentVariantId?: string, onApply: (variantId: string) => void, onClose: () => void })`, consumed by `workout/page.tsx` (Task 10).

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
import type { PlannedExercise } from '@helux/types'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

const EXERCISE: PlannedExercise = {
  name: 'Supino reto com barra',
  sets: 4,
  reps: '6-8',
  weight: '80kg',
  notes: 'Cargas altas — seu forte',
  muscle: 'Peito',
  muscles: { primary: ['peito'], secondary: ['ombro', 'triceps'] },
  tempo: '2 · 0 · 1',
  cues: ['Escápulas retraídas e pés firmes no chão', 'Desça a barra na linha do mamilo', 'Empurre explodindo'],
  match: 96,
  variants: [
    { id: 'e1', rec: true, name: 'Supino reto com barra', equip: 'Barra', level: 'Avançado', match: 96, motion: 'press-flat', implement: 'barbell', why: 'Cargas altas casam com seu perfil de força.' },
    { id: 'e1b', name: 'Supino reto com halteres', equip: 'Halteres', level: 'Intermediário', match: 90, betterFit: true, motion: 'press-flat', implement: 'dumbbell', why: 'Maior amplitude e estabilização; corrige assimetrias.' },
    { id: 'e1c', name: 'Supino na máquina', equip: 'Máquina', level: 'Iniciante', match: 84, motion: 'press-flat', implement: 'machine', why: 'Mais seguro para falhar sozinho, menos estabilização.' },
  ],
}

describe('ExerciseSheet', () => {
  it('shows the Execução tab by default with cues and the muscle map', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Escápulas retraídas e pés firmes no chão')).toBeInTheDocument()
    expect(screen.getByText('músculos trabalhados', { exact: false })).toBeTruthy
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com barra')
  })

  it('shows the recommended variant\'s match badge and equipment/level chips in the header', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('96')).toBeInTheDocument()
    expect(screen.getAllByText('Barra').length).toBeGreaterThan(0)
  })

  it('switches to the Variantes tab and lists every variant with its flags', async () => {
    const user = userEvent.setup()
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)

    await user.click(screen.getByText('Variantes (3)'))

    expect(screen.getByText('Supino reto com halteres')).toBeInTheDocument()
    expect(screen.getByText('Supino na máquina')).toBeInTheDocument()
    expect(screen.getByText('Recomendado')).toBeInTheDocument()
    expect(screen.getByText('fit maior')).toBeInTheDocument()
  })

  it('selecting a different variant updates the preview header without applying it', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<ExerciseSheet exercise={EXERCISE} onApply={onApply} onClose={vi.fn()} />)

    await user.click(screen.getByText('Variantes (3)'))
    await user.click(screen.getByText('Supino reto com halteres'))

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com halteres')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('shows "Fechar" (not the apply button) when the selection has not changed', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Fechar')).toBeInTheDocument()
    expect(screen.queryByText('Usar esta variante')).not.toBeInTheDocument()
  })

  it('shows "Usar esta variante" after selecting a different variant, and it applies + closes', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(<ExerciseSheet exercise={EXERCISE} onApply={onApply} onClose={onClose} />)

    await user.click(screen.getByText('Variantes (3)'))
    await user.click(screen.getByText('Supino reto com halteres'))
    await user.click(screen.getByText('Usar esta variante'))

    expect(onApply).toHaveBeenCalledWith('e1b')
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop calls onClose; clicking inside the sheet does not', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={onClose} />)

    await user.click(screen.getByRole('heading', { level: 2 }))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = container.querySelector('[data-testid="sheet-backdrop"]')!
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('respects an already-active non-recommended currentVariantId', () => {
    render(<ExerciseSheet exercise={EXERCISE} currentVariantId="e1b" onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com halteres')
    expect(screen.getByText('Fechar')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/ExerciseSheet.test.tsx`
Expected: FAIL with "Cannot find module '@/components/workout/ExerciseSheet'"

- [ ] **Step 3: Implement `ExerciseSheet`**

Create `apps/web/src/components/workout/ExerciseSheet.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { PlannedExercise } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { MatchBadge } from '@/components/ui/MatchBadge'
import { Chip } from '@/components/ui/Chip'
import { ExerciseDemo } from './ExerciseDemo'
import { MuscleMap } from './MuscleMap'

export function ExerciseSheet({
  exercise,
  currentVariantId,
  onApply,
  onClose,
}: {
  exercise: PlannedExercise
  currentVariantId?: string
  onApply: (variantId: string) => void
  onClose: () => void
}) {
  const variants = exercise.variants ?? []
  const recVariant = variants.find((v) => v.rec) ?? variants[0]
  const activeId = currentVariantId ?? recVariant?.id

  const [selectedId, setSelectedId] = useState(activeId)
  const [tab, setTab] = useState<'execucao' | 'variantes'>('execucao')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? recVariant
  const cues = exercise.cues ?? []
  const muscles = exercise.muscles ?? { primary: [], secondary: [] }
  const changed = !!selectedVariant && selectedVariant.id !== activeId

  function selectVariant(id: string) {
    setSelectedId(id)
    setNonce((n) => n + 1)
  }

  function handleApply() {
    if (!selectedVariant) return
    onApply(selectedVariant.id)
    onClose()
  }

  return (
    <div
      data-testid="sheet-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(4,6,4,.62)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          background: 'var(--bg)',
          border: '1px solid var(--hairline-2)',
          borderBottom: 'none',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -20px 50px -12px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--surface-3)', margin: '10px auto 4px' }} />

        <div style={{ padding: '0 18px', overflowY: 'auto' }}>
          <div
            style={{
              position: 'relative',
              height: 220,
              borderRadius: 18,
              overflow: 'hidden',
              background: 'radial-gradient(130% 110% at 50% 0%, #14180f 0%, #0a0d09 60%, #070906 100%)',
              border: '1px solid var(--hairline)',
              marginTop: 8,
            }}
          >
            <ExerciseDemo motion={selectedVariant?.motion ?? 'press-flat'} implement={selectedVariant?.implement} playing={playing} nonce={nonce} />

            <span
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-dim)',
                background: 'rgba(10,12,10,.6)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-pill)',
                padding: '5px 10px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              demonstração
            </span>

            {exercise.tempo && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  color: 'var(--text-dim)',
                  background: 'rgba(10,12,10,.6)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-pill)',
                  padding: '5px 10px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {exercise.tempo}
              </span>
            )}

            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'pausar' : 'reproduzir'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'rgba(20,24,18,.72)',
                  border: '1px solid var(--hairline-2)',
                  borderRadius: 'var(--r-pill)',
                  padding: '9px 16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon name={playing ? 'pause' : 'play'} size={14} stroke="var(--text)" />
              </button>
              <button
                onClick={() => setNonce((n) => n + 1)}
                aria-label="repetir animação"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'rgba(20,24,18,.72)',
                  border: '1px solid var(--hairline-2)',
                  borderRadius: 'var(--r-pill)',
                  padding: '9px 16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Repetir
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, flex: 1, fontFamily: 'var(--font-space-grotesk)' }}>
                {selectedVariant?.name ?? exercise.name}
              </h2>
              {selectedVariant && <MatchBadge value={selectedVariant.match} />}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {exercise.muscle && <Chip>{exercise.muscle}</Chip>}
              {selectedVariant && <Chip>{selectedVariant.equip}</Chip>}
              {selectedVariant && <Chip>{selectedVariant.level}</Chip>}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 4,
              margin: '18px 0 4px',
              padding: 4,
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline)',
              borderRadius: 13,
            }}
          >
            <button
              onClick={() => setTab('execucao')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                border: 'none',
                background: tab === 'execucao' ? 'var(--surface-3)' : 'transparent',
                color: tab === 'execucao' ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              Execução
            </button>
            <button
              onClick={() => setTab('variantes')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                border: 'none',
                background: tab === 'variantes' ? 'var(--surface-3)' : 'transparent',
                color: tab === 'variantes' ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              Variantes ({variants.length})
            </button>
          </div>

          {tab === 'execucao' ? (
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cues.map((cue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: 'var(--text-dim)' }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-line)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{cue}</span>
                  </div>
                ))}
              </div>

              <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />

              {exercise.notes && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-line)',
                    borderRadius: 12,
                    padding: '9px 13px',
                  }}
                >
                  <Icon name="dna" size={14} stroke="var(--accent)" />
                  {exercise.notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 4px' }}>
                Troque para uma variante com melhor fit genético sem perder as séries já registradas.
              </p>
              {variants.map((v) => {
                const on = v.id === selectedId
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVariant(v.id)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      background: on ? 'linear-gradient(120deg,var(--accent-soft),var(--surface-1) 60%)' : 'var(--surface-1)',
                      border: `1px solid ${on ? 'var(--accent-line)' : 'var(--hairline)'}`,
                      borderRadius: 16,
                      padding: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: `2px solid ${on ? 'transparent' : 'var(--hairline-2)'}`,
                        background: on ? 'var(--accent)' : 'transparent',
                        marginTop: 2,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v.name}</span>
                        {v.rec && <Chip>Recomendado</Chip>}
                        {v.betterFit && <Chip accent>fit maior</Chip>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <Chip>{v.equip}</Chip>
                        <Chip>{v.level}</Chip>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: 0 }}>{v.why}</p>
                    </div>
                    <MatchBadge value={v.match} size="sm" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--bg)' }}>
          {changed ? (
            <button
              onClick={handleApply}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent)',
                border: 'none',
                color: 'var(--accent-ink)',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk)',
                cursor: 'pointer',
              }}
            >
              Usar esta variante
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 'var(--r-pill)',
                background: 'transparent',
                border: '1px solid var(--hairline-2)',
                color: 'var(--text-dim)',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk)',
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/__tests__/components/workout/ExerciseSheet.test.tsx`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/workout/ExerciseSheet.tsx apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx
git commit -m "feat(web): add ExerciseSheet bottom sheet with execution and variant tabs"
```

---

## Task 9: `useActiveWorkout` — per-exercise variant selection state

**Files:**
- Modify: `apps/web/src/hooks/useActiveWorkout.ts`
- Modify: `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`

**Interfaces:**
- Produces: `ActiveWorkoutState` gains `variantByExerciseIndex: Record<number, string>` (keyed by exercise index in `planExercises`, not by exercise id, since `PlannedExercise` has no stable id — this mirrors how `currentExerciseIndex`/`exerciseStates` already key by index); `useActiveWorkout()` returns a new `selectVariant(exerciseIndex: number, variantId: string): void`. Legacy localStorage sessions saved before this change (no `variantByExerciseIndex` field) hydrate with `variantByExerciseIndex: {}` instead of crashing.

- [ ] **Step 1: Write the failing tests**

Add these `it` blocks inside the existing `describe('useActiveWorkout', ...)` in `apps/web/src/__tests__/hooks/useActiveWorkout.test.ts` (after the `'addSet appends a new set'` test):

```ts
  it('startWorkout initialises variantByExerciseIndex as empty', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    expect(result.current.session?.variantByExerciseIndex).toEqual({})
  })

  it('selectVariant records the chosen variant id for an exercise index', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.selectVariant(0, 'e1b') })
    expect(result.current.session?.variantByExerciseIndex[0]).toBe('e1b')
  })

  it('selectVariant persists to localStorage', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.selectVariant(1, 'e2c') })
    const saved = JSON.parse(localStorageMock.getItem('helux:active-workout')!)
    expect(saved.variantByExerciseIndex[1]).toBe('e2c')
  })

  it('hydrates a legacy session with no variantByExerciseIndex field without crashing', async () => {
    const legacySession = {
      planExercises: mockPlan,
      exerciseStates: [
        [{ weight: 80, reps: 8, done: false }, { weight: 80, reps: 8, done: false }, { weight: 80, reps: 8, done: false }],
        [{ weight: 70, reps: 6, done: false }, { weight: 70, reps: 6, done: false }, { weight: 70, reps: 6, done: false }],
      ],
      currentExerciseIndex: 0,
      startedAt: '2026-07-18T10:00:00.000Z',
    }
    localStorageMock.setItem('helux:active-workout', JSON.stringify(legacySession))

    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())

    expect(result.current.session?.variantByExerciseIndex).toEqual({})
    expect(result.current.session?.currentExerciseIndex).toBe(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/__tests__/hooks/useActiveWorkout.test.ts`
Expected: FAIL — `result.current.session?.variantByExerciseIndex` is `undefined`, and `result.current.selectVariant` is not a function.

- [ ] **Step 3: Extend `ActiveWorkoutState` and add `selectVariant`**

In `apps/web/src/hooks/useActiveWorkout.ts`, make these four changes:

First, extend the interface:

```ts
export interface ActiveWorkoutState {
  planExercises: PlannedExercise[]
  exerciseStates: SetState[][]
  currentExerciseIndex: number
  startedAt: string
  restUntil?: string
  variantByExerciseIndex: Record<number, string>
}
```

Second, replace the hydration effect:

```ts
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveWorkoutState
        setSession({ ...parsed, variantByExerciseIndex: parsed.variantByExerciseIndex ?? {} })
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoaded(true)
  }, [])
```

Third, replace the `state` object built in `startWorkout`:

```ts
    const state: ActiveWorkoutState = {
      planExercises,
      exerciseStates,
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      variantByExerciseIndex: {},
    }
```

Fourth, add `selectVariant` right after `addSet` (before `finishWorkout`), and add it to the hook's return value:

```ts
  const selectVariant = useCallback((exerciseIndex: number, variantId: string) => {
    setSession(prev => {
      if (!prev) return prev
      const next: ActiveWorkoutState = {
        ...prev,
        variantByExerciseIndex: { ...prev.variantByExerciseIndex, [exerciseIndex]: variantId },
      }
      save(next)
      return next
    })
  }, [])
```

```ts
  return {
    session,
    loaded,
    isActive: session !== null,
    startWorkout,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    selectVariant,
    finishWorkout,
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/__tests__/hooks/useActiveWorkout.test.ts`
Expected: PASS (all tests, including the 5 pre-existing ones)

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useActiveWorkout.ts apps/web/src/__tests__/hooks/useActiveWorkout.test.ts
git commit -m "feat(web): add per-exercise variant selection state to useActiveWorkout"
```

---

## Task 10: Wire the demo card, swap hints, and sheet into `workout/page.tsx`

**Files:**
- Modify: `apps/web/src/app/workout/page.tsx`

**Interfaces:**
- Consumes: `ExerciseDemo` (Task 6), `ExerciseSheet` (Task 8), `selectVariant`/`variantByExerciseIndex` (Task 9), `MatchBadge`/`Chip` (existing shared primitives), the `swap`/`bolt`/`play`/`chevron` icons (Task 1 + existing).

- [ ] **Step 1: Add the new imports**

In `apps/web/src/app/workout/page.tsx`, find the existing hook import line:

```tsx
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
```

Replace it with:

```tsx
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
```

(This is additive regardless of whether the parallel design-system-foundation plan has already migrated this file's local `Icon`/`Ring`/`MiniStepper` definitions to shared imports — those live elsewhere in the file and are untouched here.)

- [ ] **Step 2: Destructure `selectVariant` and add `sheetOpen` state**

Find:

```tsx
  const {
    session,
    loaded,
    isActive,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    finishWorkout,
  } = useActiveWorkout()

  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [showDone, setShowDone] = useState(false)
```

Replace with:

```tsx
  const {
    session,
    loaded,
    isActive,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    selectVariant,
    finishWorkout,
  } = useActiveWorkout()

  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [showDone, setShowDone] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
```

- [ ] **Step 3: Derive the current exercise's variant state**

Find:

```tsx
  const currentIdx = session.currentExerciseIndex
  const currentEx = session.planExercises[currentIdx]
  const currentSets = session.exerciseStates[currentIdx] ?? []
```

Replace with:

```tsx
  const currentIdx = session.currentExerciseIndex
  const currentEx = session.planExercises[currentIdx]
  const currentSets = session.exerciseStates[currentIdx] ?? []

  const variants = currentEx?.variants ?? []
  const recVariant = variants.find(v => v.rec)
  const currentVariantId = session.variantByExerciseIndex?.[currentIdx]
  const selectedVariant = variants.find(v => v.id === currentVariantId) ?? recVariant
  const betterFitAvailable = variants.some(v => v.betterFit)
```

- [ ] **Step 4: Insert the "Ver execução" demo card and swap banners into the exercise header**

Find the end of the exercise header block (the `currentEx.notes` conditional and its closing `</div>`):

```tsx
              {currentEx.notes && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 10px',
                  }}
                >
                  <Icon name="dna" size={12} stroke="var(--accent)" sw={1.8} />
                  {currentEx.notes}
                </span>
              )}
            </div>
```

Replace with:

```tsx
              {currentEx.notes && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 10px',
                  }}
                >
                  <Icon name="dna" size={12} stroke="var(--accent)" sw={1.8} />
                  {currentEx.notes}
                </span>
              )}

              {variants.length > 0 && selectedVariant && (
                <>
                  <button
                    onClick={() => setSheetOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                      width: '100%',
                      textAlign: 'left',
                      marginTop: 16,
                      padding: '10px 14px 10px 10px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 16,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'relative',
                        width: 72,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: 11,
                        overflow: 'hidden',
                        background: 'radial-gradient(120% 120% at 50% 0%, var(--surface-2), #0c0f0c)',
                        border: '1px solid var(--hairline)',
                      }}
                    >
                      <ExerciseDemo
                        motion={selectedVariant.motion}
                        implement={selectedVariant.implement}
                        playing={true}
                        nonce={`${currentIdx}:${selectedVariant.id}`}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 5,
                          bottom: 5,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Icon name="play" size={11} stroke="var(--accent-ink)" />
                      </span>
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ver execução</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                        técnica · músculos · {variants.length} variantes
                      </span>
                    </span>
                    <Icon name="chevron" size={18} stroke="var(--text-faint)" />
                  </button>

                  {!selectedVariant.rec && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 10,
                        padding: '9px 13px',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-line)',
                        borderRadius: 12,
                        fontSize: 12.5,
                        color: 'var(--accent)',
                      }}
                    >
                      <Icon name="swap" size={14} stroke="var(--accent)" />
                      <span style={{ flex: 1 }}>
                        Variante ativa <b>· {selectedVariant.equip}</b>
                      </span>
                      {recVariant && (
                        <button
                          onClick={() => selectVariant(currentIdx, recVariant.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Voltar à recomendada
                        </button>
                      )}
                    </div>
                  )}

                  {selectedVariant.rec && betterFitAvailable && (
                    <button
                      onClick={() => setSheetOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        marginTop: 10,
                        padding: '9px 13px',
                        background: 'var(--surface-2)',
                        border: '1px dashed var(--hairline-2)',
                        borderRadius: 12,
                        fontSize: 12.5,
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Icon name="bolt" size={14} stroke="var(--accent)" />
                      <span style={{ flex: 1 }}>
                        Variante com <b>fit maior</b> disponível
                      </span>
                      <Icon name="chevron" size={15} stroke="var(--text-faint)" />
                    </button>
                  )}
                </>
              )}
            </div>
```

- [ ] **Step 5: Render `ExerciseSheet` conditionally at the end of the active workout screen**

Find the very end of the component (the Footer's closing `</div>` followed by the root wrapper's closing `</div>`):

```tsx
        </button>
      </div>
    </div>
  )
}
```

Replace with:

```tsx
        </button>
      </div>

      {sheetOpen && currentEx && (
        <ExerciseSheet
          exercise={currentEx}
          currentVariantId={currentVariantId}
          onApply={(variantId) => selectVariant(currentIdx, variantId)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 7: Run the full apps/web test suite**

Run: `cd apps/web && npm run test`
Expected: PASS (no regressions in any existing test file)

- [ ] **Step 8: Manually verify in the browser**

Run: `cd apps/web && npm run dev`, start a workout whose plan includes an exercise the AI happened to name identically to an `EXERCISE_BANK` entry (e.g. seed a plan with `"Agachamento Livre (Barra)"` if testing locally without a live Anthropic key), and confirm:
- The "Ver execução" card renders below the genetic note chip, with a live looping mini animation.
- Tapping it opens the sheet sliding up from the bottom with a backdrop; tapping the backdrop closes it.
- The "Variantes" tab lists alternatives with match scores, "Recomendado"/"fit maior" flags, and selecting one updates the header preview live without closing the sheet.
- Selecting a non-recommended variant and tapping "Usar esta variante" closes the sheet and shows the "Variante ativa" banner with a "Voltar à recomendada" link that reverts it.
- Reloading the page (simulating an app resume) preserves the selected variant (localStorage-backed).
- An exercise with no bank match (no `variants`) renders the active workout screen exactly as before, with no demo card and no crash.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/app/workout/page.tsx
git commit -m "feat(web): wire the exercise demo card, variant swap hints, and sheet into the active workout screen"
```

---

## Self-Review Notes

**Spec coverage:**
- `Variant` type + `PlannedExercise` extension → Task 2.
- `exercise-bank.ts` `muscles`/`tempo` extension → Task 3.
- Deterministic, unit-tested, non-LLM `buildVariants` → Task 4.
- Wiring into `planner.ts`'s `attachCues`-style pipeline → Task 5.
- `ExerciseDemo` (faithful port of `HELUX_MOTIONS`/`Implement`/animation loop) → Task 6.
- `MuscleMap` (faithful port of `MM_LABEL`/`MM_REGIONS`) → Task 7.
- `ExerciseSheet` (demo player, header, segmented tabs, Execução tab, Variantes tab, footer apply/close logic) → Task 8.
- `useActiveWorkout` variant-selection state with legacy-session backward compatibility → Task 9.
- In-header demo preview card, "Variante ativa" banner with revert, "fit maior" hint banner, sheet wiring into `workout/page.tsx` → Task 10.
- Missing `pause`/`swap`/`bolt` icons → Task 1 (done first, as required by later tasks).
- Explicitly out of scope per instructions: `HomeClient.tsx`, `DnaClient.tsx`, `recovery/page.tsx`, `history/page.tsx` — none of the 10 tasks touch them.

**Placeholder scan:** No task contains "TBD", "add appropriate handling", or unshown code — every step has complete, runnable code and an exact file path. The two "known v1 limitations" (motion-preset fallback, muscle-group collapse) are documented as deliberate, tested design decisions with concrete fallback values (`press-flat`, `quadriceps`), not deferred work.

**Type consistency:** `Variant` (Task 2) is used with identical field names (`id/name/equip/level/match/rec/betterFit/motion/implement/why`) in `variants.ts` (Task 4), `ExerciseSheet.tsx` (Task 8), and `workout/page.tsx` (Task 10). `PlannedExercise.variants`/`muscle`/`muscles`/`tempo`/`match` (Task 2) are populated with those exact names in `planner.ts` (Task 5) and read with those exact names in `ExerciseSheet.tsx` (Task 8) and `workout/page.tsx` (Task 10). `ActiveWorkoutState.variantByExerciseIndex` and `selectVariant(exerciseIndex, variantId)` (Task 9) are consumed with the same signature in `workout/page.tsx` (Task 10). `EXERCISE_BANK`'s `muscles`/`tempo`/`MUSCLE_GROUP_LABEL` (Task 3) are consumed with matching names in `planner.ts` (Task 5).

**Test-value consistency:** The `buildVariants` scoring numbers asserted in Task 4's tests (`74`, `82`, `92`, `80`) and Task 5's planner test (`68`) were hand-traced against the exact `EXERCISE_BANK` array order and the exact scoring rules defined in the same task, so they will match the code as written (not borrowed from an external source of truth).
