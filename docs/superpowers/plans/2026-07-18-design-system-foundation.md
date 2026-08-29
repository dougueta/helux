# Design System Foundation — Shared Primitives, Home Polish, Dead Code Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the `Icon`/`HelixMark`/`Ring`/`MatchBadge`/`Chip`/`Label`/`MiniStep` primitives (currently redefined inline in three separate files) into a shared `apps/web/src/components/ui/` module, adopt them everywhere, wire real weekly-progress/streak/genetic-match data into the Home hero, and delete five orphaned legacy components.

**Architecture:** No new architectural layer — this is a refactor-in-place. Each primitive gets its own small file under `apps/web/src/components/ui/`, matching the app's existing "inline style + CSS custom property" pattern (not the prototype's `h-*` CSS class names, which the app never adopted). Consuming files (`HomeClient.tsx`, `DnaClient.tsx`, `workout/page.tsx`) import from the shared module instead of redefining locally; their JSX call sites are otherwise unchanged since the shared components are drop-in supersets of the local ones.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript strict mode, Vitest + `@testing-library/react` + `@testing-library/user-event`.

## Global Constraints

- All colors/spacing MUST use the existing CSS custom properties (`var(--accent)`, `var(--surface-1)`, `var(--r-card)`, etc.) defined in `apps/web/src/app/globals.css` — never hardcode hex values or introduce new Tailwind color tokens.
- Shared primitives live under `apps/web/src/components/ui/` and are plain presentational components — no data fetching, no hooks beyond local UI state.
- Every new shared primitive file gets a colocated test under `apps/web/src/__tests__/components/ui/` before any consumer is migrated to use it (Red → Green → Refactor).
- Preserve every existing prop contract at call sites unless a task explicitly says to change it — this is a refactor, not a redesign.
- Run `npm run test` and `npm run typecheck` from `apps/web/` after every task; both must pass before moving to the next task.

---

## Task 1: Shared `Icon` + `HelixMark` primitive

**Files:**
- Create: `apps/web/src/components/ui/icons.tsx`
- Test: `apps/web/src/__tests__/components/ui/icons.test.tsx`

**Interfaces:**
- Produces: `ICONS: Record<string, string>`, `type IconName = keyof typeof ICONS`, `Icon({ name: IconName, size?: number, stroke?: string, sw?: number, style?: CSSProperties })`, `HelixMark({ size?: number, stroke?: string })` — both default exports are named exports, imported as `import { Icon, HelixMark, ICONS } from '@/components/ui/icons'`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/__tests__/components/ui/icons.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Icon, HelixMark, ICONS } from '@/components/ui/icons'

describe('Icon', () => {
  it('renders the path for the given icon name', () => {
    const { container } = render(<Icon name="check" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.check)
  })

  it('renders play as a filled icon using the stroke color as fill', () => {
    const { container } = render(<Icon name="play" stroke="red" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('fill', 'red')
    expect(svg).toHaveAttribute('stroke', 'none')
  })

  it('applies size and custom style', () => {
    const { container } = render(<Icon name="dna" size={30} style={{ transform: 'rotate(180deg)' }} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveStyle({ transform: 'rotate(180deg)' })
  })
})

describe('HelixMark', () => {
  it('renders two strand paths', () => {
    const { container } = render(<HelixMark />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/icons'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/web/src/components/ui/icons.tsx
import type { CSSProperties } from 'react'

export const ICONS = {
  home:     'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  dna:      'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
  chart:    'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play:     'M7 4.5v15l13-7.5z',
  flame:    'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron:  'M9 6l6 6-6 6',
  close:    'M6 6l12 12M18 6 6 18',
  check:    'M5 12.5 10 17.5 19.5 7',
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  timer:    'M12 8v5l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 3h6',
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 22,
  stroke = 'currentColor',
  sw = 1.9,
  style,
}: {
  name: IconName
  size?: number
  stroke?: string
  sw?: number
  style?: CSSProperties
}) {
  const solid = name === 'play'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? stroke : 'none'}
      stroke={solid ? 'none' : stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

export function HelixMark({ size = 28, stroke = 'var(--accent)' }: { size?: number; stroke?: string }) {
  const rungs = [0.16, 0.34, 0.5, 0.66, 0.84]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11 3 C 21 9, 21 23, 11 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21 3 C 11 9, 11 23, 21 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      {rungs.map((t, i) => {
        const y = 3 + t * 26
        const amp = Math.sin(t * Math.PI) * 5
        return <line key={i} x1={16 - amp} y1={y} x2={16 + amp} y2={y} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity={0.5} />
      })}
    </svg>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/icons.tsx apps/web/src/__tests__/components/ui/icons.test.tsx
git commit -m "feat(web): add shared Icon and HelixMark primitives"
```

---

## Task 2: Shared `Ring` primitive

**Files:**
- Create: `apps/web/src/components/ui/Ring.tsx`
- Test: `apps/web/src/__tests__/components/ui/Ring.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 (self-contained; the caller passes an `<Icon />` as `children` when it wants one rendered inside the ring).
- Produces: `Ring({ value: number, size?: number, sw?: number, children?: ReactNode })`, imported as `import { Ring } from '@/components/ui/Ring'`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/__tests__/components/ui/Ring.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Ring } from '@/components/ui/Ring'

describe('Ring', () => {
  it('sets stroke-dashoffset to 0 when value is 100', () => {
    const { container } = render(<Ring value={100} size={64} sw={6} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    expect(circles[1]).toHaveAttribute('stroke-dashoffset', '0')
  })

  it('sets a partial stroke-dashoffset for a partial value', () => {
    const { container } = render(<Ring value={0} size={64} sw={6} />)
    const circles = container.querySelectorAll('circle')
    const circumference = 2 * Math.PI * ((64 - 6) / 2)
    expect(circles[1]).toHaveAttribute('stroke-dashoffset', String(circumference))
  })

  it('renders children centered inside the ring', () => {
    const { getByText } = render(<Ring value={50}><span>86</span></Ring>)
    expect(getByText('86')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/Ring.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/Ring'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/web/src/components/ui/Ring.tsx
import type { ReactNode } from 'react'

export function Ring({
  value,
  size = 64,
  sw = 6,
  children,
}: {
  value: number
  size?: number
  sw?: number
  children?: ReactNode
}) {
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={sw}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1 }}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/Ring.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/Ring.tsx apps/web/src/__tests__/components/ui/Ring.test.tsx
git commit -m "feat(web): add shared Ring primitive"
```

---

## Task 3: Shared `MatchBadge`, `Chip`, `Label` primitives

**Files:**
- Create: `apps/web/src/components/ui/MatchBadge.tsx`
- Create: `apps/web/src/components/ui/Chip.tsx`
- Create: `apps/web/src/components/ui/Label.tsx`
- Test: `apps/web/src/__tests__/components/ui/atoms.test.tsx`

**Interfaces:**
- Produces: `MatchBadge({ value: number, size?: 'md'|'sm' })`, `Chip({ children: ReactNode, accent?: boolean, style?: CSSProperties })`, `Label({ children: ReactNode, style?: CSSProperties })`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/__tests__/components/ui/atoms.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchBadge } from '@/components/ui/MatchBadge'
import { Chip } from '@/components/ui/Chip'
import { Label } from '@/components/ui/Label'

describe('MatchBadge', () => {
  it('renders the fit value and "fit" suffix', () => {
    render(<MatchBadge value={94} />)
    expect(screen.getByText('94')).toBeInTheDocument()
    expect(screen.getByText('fit')).toBeInTheDocument()
  })
})

describe('Chip', () => {
  it('renders children', () => {
    render(<Chip>Peito</Chip>)
    expect(screen.getByText('Peito')).toBeInTheDocument()
  })

  it('uses accent background when accent is true', () => {
    render(<Chip accent>Hoje</Chip>)
    expect(screen.getByText('Hoje')).toHaveStyle({ background: 'var(--accent)' })
  })
})

describe('Label', () => {
  it('renders uppercase label text', () => {
    render(<Label>Treino de hoje</Label>)
    expect(screen.getByText('Treino de hoje')).toHaveStyle({ textTransform: 'uppercase' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/atoms.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/MatchBadge'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/web/src/components/ui/MatchBadge.tsx
export function MatchBadge({ value, size = 'md' }: { value: number; size?: 'md' | 'sm' }) {
  const sm = size === 'sm'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 'var(--r-pill)',
        fontWeight: 600,
        color: 'var(--accent)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-line)',
        fontSize: sm ? 11 : 12,
        padding: sm ? '3px 7px' : '4px 9px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{value}</span>
      <span style={{ opacity: 0.7 }}>fit</span>
    </span>
  )
}
```

```tsx
// apps/web/src/components/ui/Chip.tsx
import type { ReactNode, CSSProperties } from 'react'

export function Chip({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        fontSize: 11.5,
        fontWeight: 600,
        color: accent ? 'var(--accent-ink)' : 'var(--text-dim)',
        background: accent ? 'var(--accent)' : 'var(--surface-2)',
        border: accent ? '1px solid transparent' : '1px solid var(--hairline)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
```

```tsx
// apps/web/src/components/ui/Label.tsx
import type { ReactNode, CSSProperties } from 'react'

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-faint)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/atoms.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/MatchBadge.tsx apps/web/src/components/ui/Chip.tsx apps/web/src/components/ui/Label.tsx apps/web/src/__tests__/components/ui/atoms.test.tsx
git commit -m "feat(web): add shared MatchBadge, Chip, Label primitives"
```

---

## Task 4: Shared `MiniStep` primitive

**Files:**
- Create: `apps/web/src/components/ui/MiniStep.tsx`
- Test: `apps/web/src/__tests__/components/ui/MiniStep.test.tsx`

**Interfaces:**
- Consumes: `Icon` from Task 1 (`@/components/ui/icons`).
- Produces: `MiniStep({ value: number, step: number, onChange: (v: number) => void, done: boolean })`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/__tests__/components/ui/MiniStep.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiniStep } from '@/components/ui/MiniStep'

describe('MiniStep', () => {
  it('shows the current value', () => {
    render(<MiniStep value={62.5} step={2.5} onChange={vi.fn()} done={false} />)
    expect(screen.getByText('62.5')).toBeInTheDocument()
  })

  it('calls onChange with value + step when the plus button is clicked', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={60} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[1])
    expect(onChange).toHaveBeenCalledWith(62.5)
  })

  it('calls onChange with value - step when the minus button is clicked', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={60} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onChange).toHaveBeenCalledWith(57.5)
  })

  it('never calls onChange with a value below zero', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={1} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onChange).toHaveBeenCalledWith(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/MiniStep.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/MiniStep'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/web/src/components/ui/MiniStep.tsx
import { Icon } from './icons'

export function MiniStep({
  value,
  step,
  onChange,
  done,
}: {
  value: number
  step: number
  onChange: (v: number) => void
  done: boolean
}) {
  const press = (d: number) => onChange(Math.max(0, Math.round((value + d * step) * 100) / 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
      <button
        onClick={() => press(-1)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: done ? 'var(--accent-soft)' : 'var(--surface-2)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="minus" size={11} stroke={done ? 'var(--accent)' : 'var(--text-dim)'} sw={2.4} />
      </button>
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 14,
          fontWeight: 600,
          color: done ? 'var(--accent)' : 'var(--text)',
          minWidth: 28,
          textAlign: 'center',
        }}
      >
        {value}
      </span>
      <button
        onClick={() => press(1)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: done ? 'var(--accent-soft)' : 'var(--surface-2)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="plus" size={11} stroke={done ? 'var(--accent)' : 'var(--text-dim)'} sw={2.4} />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/MiniStep.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/MiniStep.tsx apps/web/src/__tests__/components/ui/MiniStep.test.tsx
git commit -m "feat(web): add shared MiniStep primitive"
```

---

## Task 5: Adopt shared primitives in `HomeClient.tsx`

**Files:**
- Modify: `apps/web/src/app/HomeClient.tsx:1-65`

**Interfaces:**
- Consumes: `Icon`, `HelixMark` from `@/components/ui/icons`; `Ring` from `@/components/ui/Ring` (Tasks 1-2).

- [ ] **Step 1: Delete the locally-defined primitives and import the shared ones**

In `apps/web/src/app/HomeClient.tsx`, delete lines 10-65 (the entire block from `// ─── Design tokens: icons, mark, ring ───` through the closing brace of the local `Ring` function — i.e. everything between the last import and the `// ─── Helpers ───` comment), and add these imports alongside the existing ones at the top of the file:

```tsx
import { Icon } from '@/components/ui/icons'
import { HelixMark } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'
```

No other line in the file changes — every existing call site (`<Icon name="dumbbell" size={15} stroke="var(--text-dim)" />`, `<HelixMark size={24} />`, `<Ring value={score} size={56} sw={5}>...</Ring>`) already matches the shared components' prop signatures exactly.

- [ ] **Step 2: Verify typecheck and existing tests still pass**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: both PASS with no new errors (there is no existing `HomeClient.test.tsx`, so this only confirms nothing else broke)

- [ ] **Step 3: Manually verify the Home screen renders unchanged**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`, and confirm the topbar logo, hero card, recovery ring, and DNA insight card render pixel-identical to before this change (no visual diff expected — this step is a pure refactor).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/HomeClient.tsx
git commit -m "refactor(web): adopt shared Icon/HelixMark/Ring in HomeClient"
```

---

## Task 6: Adopt shared primitives in `DnaClient.tsx`

**Files:**
- Modify: `apps/web/src/app/dna/DnaClient.tsx:1-49`

**Interfaces:**
- Consumes: `Icon` from `@/components/ui/icons`; `Ring` from `@/components/ui/Ring` (Tasks 1-2).

- [ ] **Step 1: Delete the locally-defined primitives and import the shared ones**

In `apps/web/src/app/dna/DnaClient.tsx`, delete lines 9-49 (the block from `// ─── Design tokens: icons, ring ───` through the closing brace of the local `Ring` function), and add:

```tsx
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'
```

Every call site in the rest of the file (`<Icon name="dna" size={12} stroke="var(--text-faint)" />`, `<Ring value={score} size={108} sw={9}>...</Ring>`) is unchanged.

- [ ] **Step 2: Verify typecheck and existing tests still pass**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: both PASS

- [ ] **Step 3: Manually verify the DNA screen renders unchanged**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/dna`, confirm the score ring, trait bars, and driver grid render identically to before.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dna/DnaClient.tsx
git commit -m "refactor(web): adopt shared Icon/Ring in DnaClient"
```

---

## Task 7: Adopt shared primitives in `workout/page.tsx`

**Files:**
- Modify: `apps/web/src/app/workout/page.tsx:1-166` (icon/ring/stepper block), plus the two `<Ring>` and two `<MiniStepper>` call sites further down the file.

**Interfaces:**
- Consumes: `Icon` from `@/components/ui/icons`; `Ring` from `@/components/ui/Ring`; `MiniStep` from `@/components/ui/MiniStep` (Tasks 1, 2, 4).

- [ ] **Step 1: Delete the locally-defined primitives and import the shared ones**

In `apps/web/src/app/workout/page.tsx`, delete lines 7-162 (from the `// --- Icons ---` comment through the closing brace of the local `MiniStepper` function — this removes the local `ICONS`, `Icon`, `Ring`, and `MiniStepper` definitions), and add:

```tsx
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'
import { MiniStep } from '@/components/ui/MiniStep'
```

- [ ] **Step 2: Update the `Ring` call site to pass the check icon as a child**

The local `Ring` used to hardcode a check `Icon` inside itself; the shared `Ring` takes `children` instead. Find this call site (inside the "Done screen" block):

```tsx
<Ring value={100} size={120} sw={8} />
```

Replace it with:

```tsx
<Ring value={100} size={120} sw={8}>
  <Icon name="check" size={48} stroke="var(--accent)" sw={2.4} />
</Ring>
```

- [ ] **Step 3: Rename the two `MiniStepper` call sites to `MiniStep`**

Find the two call sites inside the set rows:

```tsx
<MiniStepper
  value={s.weight}
  step={2.5}
  onChange={v => updateSet(currentIdx, si, 'weight', v)}
  done={s.done}
/>
<MiniStepper
  value={s.reps}
  step={1}
  onChange={v => updateSet(currentIdx, si, 'reps', v)}
  done={s.done}
/>
```

Replace `MiniStepper` with `MiniStep` in both (props are unchanged):

```tsx
<MiniStep
  value={s.weight}
  step={2.5}
  onChange={v => updateSet(currentIdx, si, 'weight', v)}
  done={s.done}
/>
<MiniStep
  value={s.reps}
  step={1}
  onChange={v => updateSet(currentIdx, si, 'reps', v)}
  done={s.done}
/>
```

- [ ] **Step 4: Verify typecheck and existing tests still pass**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: both PASS

- [ ] **Step 5: Manually verify the active workout screen renders unchanged**

Run: `cd apps/web && npm run dev`, start a workout from the home screen, confirm the header, set rows (steppers + check button), rest timer, and completion screen (ring + check icon) all render and behave identically to before.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/workout/page.tsx
git commit -m "refactor(web): adopt shared Icon/Ring/MiniStep in workout page"
```

---

## Task 8: Wire real weekly progress and streak into Home

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/HomeClient.tsx`

**Interfaces:**
- Consumes: `GET /api/workouts/analytics` (already implemented; same endpoint `useWorkoutAnalytics`/`getWorkoutAnalytics` call client-side in `apps/web/src/services/workout.service.ts:43-49`), returning `WorkoutAnalytics` (`packages/types/src/analytics.ts`: `{ weeklyVolume, personalRecords, totalSessions, currentStreakWeeks, thisWeekSessions }`).
- Produces: `HomeClientProps.analytics: { thisWeekSessions: number; currentStreakWeeks: number } | null`.

- [ ] **Step 1: Add an analytics fetcher to `page.tsx` and pass it to `HomeClient`**

In `apps/web/src/app/page.tsx`, add a new fetcher function alongside the existing ones (after `getLatestCheckins`, before `HomePage`):

```tsx
async function getAnalytics(token: string) {
  try {
    const res = await fetch(`${API}/api/workouts/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}
```

Update the `Promise.all` call and the `<HomeClient>` render to include it:

```tsx
const [plan, recovery, insight, checkinsRaw, analytics] = await Promise.all([
  getLatestPlan(session.access_token),
  getRecovery(session.access_token),
  getGeneticInsight(),
  getLatestCheckins(session.access_token),
  getAnalytics(session.access_token),
])
```

```tsx
return (
  <HomeClient
    plan={plan}
    recovery={recovery}
    insight={insight}
    firstName={firstName}
    checkins={checkins}
    analytics={analytics}
  />
)
```

- [ ] **Step 2: Accept the new prop in `HomeClient` and replace the hardcoded week counter**

In `apps/web/src/app/HomeClient.tsx`, update `HomeClientProps`:

```tsx
interface HomeClientProps {
  plan: any
  recovery: { hrv?: number; restingHR?: number; activeCalories?: number; sleepHours?: number; date?: string } | null
  insight: { title?: string; text?: string; icon?: string } | null
  firstName: string
  checkins: BodyCheckin[]
  analytics: { thisWeekSessions: number; currentStreakWeeks: number } | null
}
```

Destructure it in the component signature:

```tsx
export function HomeClient({ plan: initialPlan, recovery, insight, firstName, checkins, analytics }: HomeClientProps) {
```

Add a constant near the top of the component body (matching the `availableDaysPerWeek: 4` value already hardcoded in `apps/web/src/services/workout.service.ts:34`):

```tsx
const WEEKLY_TARGET = 4
```

Replace the hardcoded week block:

```tsx
<div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px' }}>
  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Semana</div>
  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
    — <span style={{ fontSize: 15, color: 'var(--text-faint)', fontWeight: 500 }}>/ 5</span>
  </div>
</div>
```

with:

```tsx
<div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px' }}>
  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Semana</div>
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
      {analytics?.thisWeekSessions ?? 0}
    </span>
    <span style={{ fontSize: 15, color: 'var(--text-faint)', fontWeight: 500 }}>/ {WEEKLY_TARGET}</span>
  </div>
  <div style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: WEEKLY_TARGET }).map((_, i) => (
      <span
        key={i}
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: i < (analytics?.thisWeekSessions ?? 0) ? 'var(--accent)' : 'var(--surface-3)',
        }}
      />
    ))}
  </div>
</div>
```

- [ ] **Step 3: Add the streak badge to the topbar**

Replace the topbar block:

```tsx
<div className="flex items-center justify-between px-4 pt-12 pb-2">
  <div className="flex items-center gap-2">
    <HelixMark size={24} />
    <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
      helux
    </span>
  </div>
</div>
```

with:

```tsx
<div className="flex items-center justify-between px-4 pt-12 pb-2">
  <div className="flex items-center gap-2">
    <HelixMark size={24} />
    <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
      helux
    </span>
  </div>
  {analytics && analytics.currentStreakWeeks > 0 && (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '6px 11px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--surface-2)',
      border: '1px solid var(--hairline)',
    }}>
      <Icon name="flame" size={14} stroke="var(--accent)" />
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
        {analytics.currentStreakWeeks}
      </span>
      <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>sem</span>
    </div>
  )}
</div>
```

- [ ] **Step 4: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Manually verify with real and empty data**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`. With existing workout history, confirm the streak badge appears next to the logo and the week dots reflect `thisWeekSessions` filled cells out of 4. Temporarily stub `getAnalytics` to return `null` (or test on a fresh account) and confirm the streak badge is hidden and the week counter shows `0 / 4` with all dots unfilled — no crash.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/HomeClient.tsx
git commit -m "feat(web): wire real weekly progress and streak into Home"
```

---

## Task 9: Add `MatchBadge` to the Home hero using the genetic score

**Files:**
- Modify: `apps/web/src/app/page.tsx:27-35` (`getGeneticInsight`)
- Modify: `apps/web/src/app/HomeClient.tsx`

**Interfaces:**
- Consumes: `MatchBadge` from `@/components/ui/MatchBadge` (Task 3). The `/genetic-profile` endpoint's response is read as `Record<string, unknown>` elsewhere in the app (`DnaClient.tsx:65` does the same `profile.score` read without a typed contract) — this task follows that same established, untyped-read pattern rather than inventing a new typed contract.
- Produces: `HomeClientProps.insight: { title?: string; text?: string; score?: number } | null` (drops the never-used `icon` field from the old type).

- [ ] **Step 1: Extend `getGeneticInsight` to also surface the overall score**

In `apps/web/src/app/page.tsx`, replace:

```tsx
async function getGeneticInsight() {
  try {
    const res = await fetch(`${API}/genetic-profile`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const p = await res.json()
    if (p?.drivers?.[0]) return p.drivers[0]
    return null
  } catch { return null }
}
```

with:

```tsx
async function getGeneticInsight() {
  try {
    const res = await fetch(`${API}/genetic-profile`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const p = await res.json()
    const driver = p?.drivers?.[0]
    const score = typeof p?.score === 'number' ? p.score : undefined
    if (!driver && score === undefined) return null
    return { score, title: driver?.title, text: driver?.text }
  } catch { return null }
}
```

- [ ] **Step 2: Update `HomeClientProps` and render `MatchBadge` in the hero**

In `apps/web/src/app/HomeClient.tsx`, update the `insight` field of `HomeClientProps`:

```tsx
insight: { title?: string; text?: string; score?: number } | null
```

Add the import:

```tsx
import { MatchBadge } from '@/components/ui/MatchBadge'
```

Find the hero top row:

```tsx
<div className="flex items-center justify-between mb-2" style={{ position: 'relative' }}>
  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
    Treino de hoje
  </span>
</div>
```

Replace it with:

```tsx
<div className="flex items-center justify-between mb-2" style={{ position: 'relative' }}>
  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
    Treino de hoje
  </span>
  {insight?.score != null && <MatchBadge value={insight.score} />}
</div>
```

Note: this block only renders inside `{currentPlan ? (...) : (...)}` when `currentPlan` is truthy, so no additional guard is needed.

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Manually verify**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`. Confirm the "Treino de hoje" hero card shows a `MatchBadge` (green pill with a number and "fit") to the right of the label when the genetic profile has a `score` field, and that the hero still renders correctly with no badge when it doesn't (check `apps/api`'s `/genetic-profile` response shape, or temporarily log `p.score` in `getGeneticInsight` to confirm the field name).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/HomeClient.tsx
git commit -m "feat(web): show genetic MatchBadge on the Home hero"
```

---

## Task 10: Delete dead legacy workout components

**Files:**
- Delete: `apps/web/src/components/workout/WorkoutCard.tsx`
- Delete: `apps/web/src/components/workout/SetLogger.tsx`
- Delete: `apps/web/src/components/workout/RestTimer.tsx`
- Delete: `apps/web/src/components/workout/ActiveExercise.tsx`
- Delete: `apps/web/src/components/workout/ExerciseList.tsx`
- Delete: `apps/web/src/__tests__/components/workout/WorkoutCard.test.tsx`
- Delete: `apps/web/src/__tests__/components/workout/SetLogger.test.tsx`
- Delete: `apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx`

**Interfaces:** None — these files have zero importers outside their own now-deleted tests. Confirmed by:

```bash
grep -rn "from '@/components/workout/\(WorkoutCard\|SetLogger\|RestTimer\|ActiveExercise\|ExerciseList\)'" apps/web/src --include="*.tsx" --include="*.ts"
```

returning only the three test files listed above (verified during plan research on 2026-07-18) — `apps/web/src/app/workout/page.tsx` reimplements this UI inline and never imports any of them.

- [ ] **Step 1: Re-verify no importers exist (repo may have changed since research)**

Run:

```bash
cd apps/web && grep -rn "components/workout/WorkoutCard\|components/workout/SetLogger\|components/workout/RestTimer\|components/workout/ActiveExercise\|components/workout/ExerciseList" src --include="*.tsx" --include="*.ts"
```

Expected: only the 3 test files listed above appear in the output. If any other file appears, STOP this task and investigate before deleting — do not delete a file with a live importer.

- [ ] **Step 2: Delete the component files and their tests**

```bash
git rm apps/web/src/components/workout/WorkoutCard.tsx \
       apps/web/src/components/workout/SetLogger.tsx \
       apps/web/src/components/workout/RestTimer.tsx \
       apps/web/src/components/workout/ActiveExercise.tsx \
       apps/web/src/components/workout/ExerciseList.tsx \
       apps/web/src/__tests__/components/workout/WorkoutCard.test.tsx \
       apps/web/src/__tests__/components/workout/SetLogger.test.tsx \
       apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx
```

- [ ] **Step 3: Verify the app still builds and all remaining tests pass**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: both PASS (test count drops by the number of tests that were in the 3 deleted test files; no new failures)

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(web): remove unused legacy workout components predating the design-token migration"
```

---

## Self-Review Notes

- **Spec coverage**: covers all 4 items in the "Polish da Home + limpeza" scope the user selected — shared `Icon`/`Ring` extraction (Tasks 1-2, adopted in Tasks 5-7), streak badge + week dots (Task 8), hero `MatchBadge` (Task 9), dead code removal (Task 10). `MatchBadge`/`Chip`/`Label`/`MiniStep` (Tasks 3-4) are pulled forward here (rather than left to the Exercise Sheet plan) because Task 7 already needs `MiniStep` to finish the `workout/page.tsx` migration cleanly, and the parallel Exercise Sheet plan can then simply import `MatchBadge`/`Chip` instead of redefining them.
- **Placeholder scan**: no TBD/"add tests for the above"/vague steps — every step has literal file paths and full code.
- **Type consistency**: `HomeClientProps.insight` changes shape once (Task 9) and is threaded consistently through `page.tsx` and `HomeClient.tsx` in the same task; `MiniStepper` → `MiniStep` rename is applied at both call sites in the same step (Task 7, Step 3).
