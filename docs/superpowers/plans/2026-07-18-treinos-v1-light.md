# Treinos Screen — v1 Light (Current Plan + Recent History)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the "Treinos" nav tab a real destination (`/treinos`) that shows the user's currently generated workout plan in full detail (every exercise with sets/reps/weight, not just the 2-3-name teaser Home shows) plus a short recent-history teaser — without inventing a program/split concept that doesn't exist in the backend yet.

**Architecture:** Follows the exact same server/client split already established by `apps/web/src/app/page.tsx` + `HomeClient.tsx`: a server component (`apps/web/src/app/treinos/page.tsx`) does the authenticated data fetching (latest plan + last 3 history sessions) and a client component (`TreinosClient.tsx`) owns the interactive bits (generate plan, start workout) via the existing `useWorkoutPlan`/`useActiveWorkout` hooks. No new backend endpoints, no new types — this reuses `GET /workout/latest-plan` and `GET /api/workouts/history` exactly as `page.tsx` and `history/page.tsx` already do. The full "program with rotating split" version of this screen is out of scope here — see `specs/005-workout-program-split/spec.md` for that backlog spec.

**Tech Stack:** Next.js 14 App Router (Server Components + Client Components), TypeScript strict mode, Vitest + `@testing-library/react`.

## Global Constraints

- All colors/spacing MUST use the existing CSS custom properties (`var(--accent)`, `var(--surface-1)`, `var(--r-card)`, etc.) — never hardcode hex values.
- Do NOT invent a `program`/`split` data concept — `NextWorkoutPlan` has only `{ generatedAt, exercises, rationale }` and `PlannedExercise` has only `{ name, sets, reps, weight, notes?, cues? }`; render exactly what exists.
- Do NOT duplicate the full workout-history list UI here — this screen shows at most the 3 most recent sessions as a teaser linking to `/history`; the full history view belongs to the parallel "Progresso consolidado" plan.
- Run `cd apps/web && npm run typecheck && npm run test` after every task; both must pass before moving to the next task.

---

## Task 1: `formatDuration` helper with tests

**Files:**
- Create: `apps/web/src/lib/format-duration.ts`
- Test: `apps/web/src/__tests__/lib/format-duration.test.ts`

**Interfaces:**
- Produces: `formatDuration(seconds: number | null): string`, imported as `import { formatDuration } from '@/lib/format-duration'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/__tests__/lib/format-duration.test.ts
import { describe, it, expect } from 'vitest'
import { formatDuration } from '@/lib/format-duration'

describe('formatDuration', () => {
  it('returns an em dash for null', () => {
    expect(formatDuration(null)).toBe('—')
  })

  it('returns an em dash for zero', () => {
    expect(formatDuration(0)).toBe('—')
  })

  it('formats under an hour as minutes', () => {
    expect(formatDuration(47 * 60)).toBe('47min')
  })

  it('formats an hour or more as hours and minutes', () => {
    expect(formatDuration(90 * 60)).toBe('1h 30m')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/lib/format-duration.test.ts`
Expected: FAIL with "Cannot find module '@/lib/format-duration'"

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/lib/format-duration.ts
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}min`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/lib/format-duration.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/format-duration.ts apps/web/src/__tests__/lib/format-duration.test.ts
git commit -m "feat(web): add shared formatDuration helper"
```

---

## Task 2: `apps/web/src/app/treinos/TreinosClient.tsx`

**Files:**
- Create: `apps/web/src/app/treinos/TreinosClient.tsx`

**Interfaces:**
- Consumes: `formatDuration` from `@/lib/format-duration` (Task 1); `Label` from `@/components/ui/Label` (from `docs/superpowers/plans/2026-07-18-design-system-foundation.md`, assumed already implemented); `useActiveWorkout` (`apps/web/src/hooks/useActiveWorkout.ts` — `startWorkout(exercises: PlannedExercise[])`); `useWorkoutPlan` (`apps/web/src/hooks/useWorkoutPlan.ts` — returns `{ plan, generating, generationError, generatePlan }`); `WorkoutSessionRow` type from `@/hooks/useWorkoutHistory` (`{ id, date, duration_s, exercises, created_at }`).
- Produces: `TreinosClient({ plan: NextWorkoutPlan | null, recentSessions: WorkoutSessionRow[] })`, a client component with no exported test (see Step 3 note — this follows the same "hook-wired page, manual verification" precedent already established by `HomeClient.tsx`, which also has zero automated test coverage today).

- [ ] **Step 1: Write the component**

```tsx
// apps/web/src/app/treinos/TreinosClient.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { Label } from '@/components/ui/Label'
import { formatDuration } from '@/lib/format-duration'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'
import type { NextWorkoutPlan, PlannedExercise } from '@helux/types'

interface TreinosClientProps {
  plan: NextWorkoutPlan | null
  recentSessions: WorkoutSessionRow[]
}

export function TreinosClient({ plan: initialPlan, recentSessions }: TreinosClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, generating, generationError, generatePlan } = useWorkoutPlan()
  const currentPlan = plan ?? initialPlan

  function handleStart() {
    if (!currentPlan) return
    startWorkout(currentPlan.exercises)
    router.push('/workout')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      <header style={{ marginBottom: 20 }}>
        <Label>Seu treino atual</Label>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: '6px 0 0' }}>
          Treinos
        </h1>
      </header>

      {currentPlan ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16, marginBottom: 12 }}>
          {currentPlan.rationale && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14 }}>{currentPlan.rationale}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentPlan.exercises?.map((ex: PlannedExercise, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{ex.name}</p>
                  {ex.notes && <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0' }}>{ex.notes}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)', fontSize: 13, margin: 0 }}>
                    {ex.sets}×{ex.reps}
                  </p>
                  <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-faint)', fontSize: 11, margin: 0 }}>{ex.weight}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleStart}
            style={{
              width: '100%',
              marginTop: 14,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-space-grotesk)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -8px var(--accent-glow)',
            }}
          >
            Iniciar treino
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 20, textAlign: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--text)', marginBottom: 4 }}>Nenhum plano gerado ainda.</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Use o botão abaixo para gerar seu primeiro plano.</p>
        </div>
      )}

      {generationError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{generationError}</p>}
      <button
        onClick={generatePlan}
        disabled={generating}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--hairline-2)',
          borderRadius: 'var(--r-pill)',
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'var(--font-space-grotesk)',
          color: generating ? 'var(--text-faint)' : 'var(--text-dim)',
          cursor: generating ? 'not-allowed' : 'pointer',
          minHeight: 44,
          opacity: generating ? 0.6 : 1,
          marginBottom: 24,
        }}
      >
        {generating ? 'Gerando plano…' : 'Gerar Novo Plano'}
      </button>

      {recentSessions.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Treinos recentes</h2>
            <a href="/history" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Ver histórico
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSessions.map(session => (
              <a
                key={session.id}
                href={`/history/${session.id}`}
                style={{
                  display: 'block',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-card)',
                  padding: '12px 14px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-dim)', fontSize: 12 }}>
                    {formatDuration(session.duration_s)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Note on test coverage**

This component follows the exact same pattern as `apps/web/src/app/HomeClient.tsx`, which has zero automated tests today (it's a hook-wired page composition, not a pure presentational unit) — do not introduce a new, inconsistent testing standard here. Verification for this task happens in Task 3's manual check once the route is wired end-to-end.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/treinos/TreinosClient.tsx
git commit -m "feat(web): add TreinosClient with full current-plan exercise list"
```

---

## Task 3: `apps/web/src/app/treinos/page.tsx` and NavBar wiring

**Files:**
- Create: `apps/web/src/app/treinos/page.tsx`
- Modify: `apps/web/src/components/layout/NavBar.tsx:28-33` (the `tabs` array)

**Interfaces:**
- Consumes: `TreinosClient` from Task 2; `createSupabaseServerClient` from `@/lib/supabase-server` (already used identically in `apps/web/src/app/page.tsx:2`).

- [ ] **Step 1: Write the server page**

```tsx
// apps/web/src/app/treinos/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { TreinosClient } from './TreinosClient'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getLatestPlan(token: string) {
  try {
    const res = await fetch(`${API}/workout/latest-plan`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getRecentHistory(token: string) {
  try {
    const res = await fetch(`${API}/api/workouts/history?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions ?? []
  } catch { return [] }
}

export default async function TreinosPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [plan, recentSessions] = await Promise.all([
    getLatestPlan(session.access_token),
    getRecentHistory(session.access_token),
  ])

  return <TreinosClient plan={plan} recentSessions={recentSessions} />
}
```

- [ ] **Step 2: Point the "Treinos" nav tab at the new route**

In `apps/web/src/components/layout/NavBar.tsx`, find the `tabs` array:

```tsx
const tabs = [
  { href: '/', label: 'Hoje', icon: 'home' as const },
  { href: '/history', label: 'Treinos', icon: 'dumbbell' as const },
  { href: '/checkin', label: 'Check-in', icon: 'ruler' as const },
  { href: '/recovery', label: 'Progresso', icon: 'chart' as const },
]
```

Change only the `Treinos` entry's `href` from `/history` to `/treinos` (leave the `Hoje`, `Check-in`, and `Progresso` entries exactly as they are — the parallel "Progresso consolidado" plan may independently change the `Progresso` entry's `href`; do not revert that if it has already landed):

```tsx
const tabs = [
  { href: '/', label: 'Hoje', icon: 'home' as const },
  { href: '/treinos', label: 'Treinos', icon: 'dumbbell' as const },
  { href: '/checkin', label: 'Check-in', icon: 'ruler' as const },
  { href: '/recovery', label: 'Progresso', icon: 'chart' as const },
]
```

- [ ] **Step 3: Verify typecheck and existing tests**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: both PASS

- [ ] **Step 4: Manually verify the new screen end-to-end**

Run: `cd apps/web && npm run dev`, log in, tap the "Treinos" nav tab. Confirm:
- It navigates to `/treinos` and the tab is highlighted as active
- With a generated plan present, every exercise in the plan is listed with sets×reps and weight (not just 2-3 names like Home's hero)
- "Iniciar treino" starts an active workout session identically to Home's hero button (lands on `/workout` with the same exercises)
- "Gerar Novo Plano" regenerates the plan and the list updates
- With no plan, the empty state renders with no crash
- If any workout history exists, the last 3 sessions appear below with correct relative dates and durations, each linking to `/history/[id]`; "Ver histórico" links to `/history`
- With zero workout history, the "Treinos recentes" section is simply absent (no empty list, no crash)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/treinos/page.tsx apps/web/src/components/layout/NavBar.tsx
git commit -m "feat(web): wire /treinos route and repoint Treinos nav tab"
```

---

## Self-Review Notes

- **Spec coverage**: implements exactly the "v1 leve" scope the user chose — current plan as a full-detail card + recent history teaser, explicitly without a program/split concept (that's deferred to `specs/005-workout-program-split/spec.md`).
- **Placeholder scan**: no TBD/vague steps; all code is complete and copy-pasteable.
- **Type consistency**: `TreinosClientProps` uses `NextWorkoutPlan | null` and `WorkoutSessionRow[]` exactly matching the existing hook/type definitions read from the codebase (`packages/types/src/plan.ts`, `apps/web/src/hooks/useWorkoutHistory.ts`) — no invented fields.
- **Coordination with parallel plans**: Task 3 Step 2 explicitly scopes the `NavBar.tsx` edit to only the `Treinos` entry and calls out that the `Progresso` entry may be touched independently by the "Progresso consolidado" plan — read the file fresh at execution time rather than assuming its exact current content if that plan has already landed.
