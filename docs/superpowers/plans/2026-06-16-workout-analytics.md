# Workout Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GET /api/workouts/analytics` endpoint and upgrade the `/recovery` page with an "Evolução de Treinos" analytics section showing weekly volume bars, personal records, and summary stats.

**Architecture:** New `WorkoutAnalytics` type in `@helux/types`, a new Fastify route that computes weekly volume and personal records from `workout_sessions`, a service method + hook on the web side, and a rewritten recovery page that renders both recovery data and analytics in the Helux design style.

**Tech Stack:** Fastify 5 (API), Next.js 14 App Router + `'use client'` (web), Vitest + @testing-library/react (tests), @supabase/supabase-js (auth + DB), inline SVG (chart), Tailwind (layout classes), CSS variables (Helux design tokens)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `packages/types/src/analytics.ts` | `WeeklyVolume`, `PersonalRecord`, `WorkoutAnalytics` types |
| **Modify** | `packages/types/src/index.ts` | Re-export analytics types |
| **Create** | `apps/api/src/routes/workout-analytics.ts` | `GET /api/workouts/analytics` handler |
| **Modify** | `apps/api/src/app.ts` | Register new route |
| **Create** | `apps/api/src/__tests__/workout-analytics.test.ts` | API route tests |
| **Modify** | `apps/web/src/services/workout.service.ts` | Add `getWorkoutAnalytics()` |
| **Create** | `apps/web/src/hooks/useWorkoutAnalytics.ts` | React hook wrapping the service |
| **Create** | `apps/web/src/__tests__/hooks/useWorkoutAnalytics.test.ts` | Hook tests |
| **Modify** | `apps/web/src/app/recovery/page.tsx` | Complete rewrite with analytics section |

---

## Task 1: Add analytics types to `@helux/types`

**Files:**
- Create: `packages/types/src/analytics.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Write the type file**

Create `packages/types/src/analytics.ts` with this exact content:

```ts
export interface WeeklyVolume {
  weekStart: string   // ISO date of Monday (YYYY-MM-DD)
  tonnage: number     // sum of weight × reps across all done sets
  sessions: number    // number of sessions that week
}

export interface PersonalRecord {
  exerciseName: string
  maxWeight: number
  reps: number
  achievedAt: string  // ISO date
}

export interface WorkoutAnalytics {
  weeklyVolume: WeeklyVolume[]   // last 8 weeks, ascending (oldest first)
  personalRecords: PersonalRecord[]  // top 8 by maxWeight, descending
  totalSessions: number
  currentStreakWeeks: number     // consecutive weeks with ≥1 session ending this week
  thisWeekSessions: number
}
```

- [ ] **Step 2: Export from index**

Open `packages/types/src/index.ts`. It currently contains:
```ts
export * from './genetic'
export * from './workout'
export * from './recovery'
export * from './plan'
```

Add at the end:
```ts
export * from './analytics'
```

- [ ] **Step 3: Verify types compile**

```bash
cd packages/types && npx tsc --noEmit
```

Expected: no errors, exits 0.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/analytics.ts packages/types/src/index.ts
git commit -m "feat(types): add WorkoutAnalytics, WeeklyVolume, PersonalRecord types"
```

---

## Task 2: API route `GET /api/workouts/analytics`

**Files:**
- Create: `apps/api/src/routes/workout-analytics.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the route file**

Create `apps/api/src/routes/workout-analytics.ts` with this exact content:

```ts
import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import type { WorkoutAnalytics, WeeklyVolume, PersonalRecord } from '@helux/types'

export async function workoutAnalyticsRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/api/workouts/analytics', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return reply.code(401).send({ error: 'Unauthorized' })
    const token = authHeader.slice(7)

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) return reply.code(401).send({ error: 'Unauthorized' })

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('date, exercises')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (error) {
      app.log.error(error, 'workout-analytics query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    const rows = sessions ?? []

    function getMondayOf(dateStr: string): string {
      const d = new Date(dateStr + 'T12:00:00Z')
      const day = d.getUTCDay()  // 0=Sun,1=Mon,...
      const diff = day === 0 ? -6 : 1 - day
      d.setUTCDate(d.getUTCDate() + diff)
      return d.toISOString().split('T')[0]
    }

    const weekMap = new Map<string, { tonnage: number; sessions: number }>()

    for (const row of rows) {
      const week = getMondayOf(row.date as string)
      const prev = weekMap.get(week) ?? { tonnage: 0, sessions: 0 }
      let tonnage = 0
      for (const ex of (row.exercises as any[]) ?? []) {
        for (const s of ex.sets ?? []) {
          tonnage += (s.weight ?? 0) * (s.reps ?? 0)
        }
      }
      weekMap.set(week, { tonnage: prev.tonnage + tonnage, sessions: prev.sessions + 1 })
    }

    const today = new Date()
    const weeklyVolume: WeeklyVolume[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i * 7)
      const week = getMondayOf(d.toISOString().split('T')[0])
      const v = weekMap.get(week) ?? { tonnage: 0, sessions: 0 }
      weeklyVolume.push({ weekStart: week, tonnage: v.tonnage, sessions: v.sessions })
    }

    const prMap = new Map<string, PersonalRecord>()
    for (const row of rows) {
      for (const ex of (row.exercises as any[]) ?? []) {
        const name = ex.name as string
        for (const s of ex.sets ?? []) {
          const w = s.weight ?? 0
          const existing = prMap.get(name)
          if (!existing || w > existing.maxWeight) {
            prMap.set(name, { exerciseName: name, maxWeight: w, reps: s.reps ?? 0, achievedAt: row.date as string })
          }
        }
      }
    }
    const personalRecords: PersonalRecord[] = [...prMap.values()]
      .filter(pr => pr.maxWeight > 0)
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 8)

    const thisWeekMonday = getMondayOf(today.toISOString().split('T')[0])
    let streak = 0
    let checkWeek = thisWeekMonday
    for (let i = 0; i < 52; i++) {
      if (weekMap.has(checkWeek)) {
        streak++
        const d = new Date(checkWeek + 'T12:00:00Z')
        d.setUTCDate(d.getUTCDate() - 7)
        checkWeek = d.toISOString().split('T')[0]
      } else {
        break
      }
    }

    const totalSessions = rows.length
    const thisWeekSessions = weekMap.get(thisWeekMonday)?.sessions ?? 0

    const analytics: WorkoutAnalytics = {
      weeklyVolume,
      personalRecords,
      totalSessions,
      currentStreakWeeks: streak,
      thisWeekSessions,
    }

    return reply.send(analytics)
  })
}
```

- [ ] **Step 2: Register route in `apps/api/src/app.ts`**

Current `app.ts` ends at line 29 with `app.register(workoutHistoryRoutes)`. Add the import at the top (after line 9) and register the route.

Add this import line after the existing imports (after `import { workoutHistoryRoutes } from './routes/workout-history'`):
```ts
import { workoutAnalyticsRoutes } from './routes/workout-analytics'
```

Add inside `buildApp()` after `app.register(workoutHistoryRoutes)`:
```ts
app.register(workoutAnalyticsRoutes)
```

- [ ] **Step 3: Typecheck API**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: API route tests

**Files:**
- Create: `apps/api/src/__tests__/workout-analytics.test.ts`

- [ ] **Step 1: Write the test file**

The mock pattern follows `workout-history.test.ts` exactly — mock `@supabase/supabase-js` at the module level, build a minimal Fastify app, inject requests.

Create `apps/api/src/__tests__/workout-analytics.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockSessions = [
  {
    date: '2026-06-10',
    exercises: [
      { name: 'Supino', sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }] },
      { name: 'Agachamento', sets: [{ weight: 100, reps: 10 }] },
    ],
  },
  {
    date: '2026-06-12',
    exercises: [
      { name: 'Supino', sets: [{ weight: 85, reps: 6 }] },
    ],
  },
]

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
        })),
      })),
    })),
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { workoutAnalyticsRoutes } = await import('../routes/workout-analytics')
  await app.register(workoutAnalyticsRoutes)
  return app
}

describe('GET /api/workouts/analytics', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/workouts/analytics' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with analytics shape for valid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/analytics',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('weeklyVolume')
    expect(body).toHaveProperty('personalRecords')
    expect(body).toHaveProperty('totalSessions')
    expect(body).toHaveProperty('currentStreakWeeks')
    expect(body).toHaveProperty('thisWeekSessions')
  })

  it('returns exactly 8 weeks in weeklyVolume', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/workouts/analytics',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const body = res.json()
    expect(body.weeklyVolume).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run API tests**

```bash
cd apps/api && npm test
```

Expected: all tests pass (existing tests + 3 new analytics tests).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/workout-analytics.ts apps/api/src/app.ts apps/api/src/__tests__/workout-analytics.test.ts
git commit -m "feat(api): add GET /api/workouts/analytics endpoint with tests"
```

---

## Task 4: Web service method

**Files:**
- Modify: `apps/web/src/services/workout.service.ts`

- [ ] **Step 1: Update the service file**

Current line 2 in `apps/web/src/services/workout.service.ts`:
```ts
import type { NextWorkoutPlan, WorkoutSession } from '@helux/types'
```

Replace with:
```ts
import type { NextWorkoutPlan, WorkoutSession, WorkoutAnalytics } from '@helux/types'
```

Then add this function at the end of the file (after `generatePlan`):

```ts
export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics | null> {
  try {
    return (await apiFetch('/api/workouts/analytics')) as WorkoutAnalytics
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Typecheck web**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

---

## Task 5: `useWorkoutAnalytics` hook

**Files:**
- Create: `apps/web/src/hooks/useWorkoutAnalytics.ts`

- [ ] **Step 1: Create the hook**

Create `apps/web/src/hooks/useWorkoutAnalytics.ts`:

```ts
'use client'

import { useState, useEffect } from 'react'
import { getWorkoutAnalytics } from '@/services/workout.service'
import type { WorkoutAnalytics } from '@helux/types'

export function useWorkoutAnalytics() {
  const [data, setData] = useState<WorkoutAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkoutAnalytics()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
```

---

## Task 6: Hook tests

**Files:**
- Create: `apps/web/src/__tests__/hooks/useWorkoutAnalytics.test.ts`

- [ ] **Step 1: Write the hook tests**

The pattern follows `useWorkoutHistory.test.ts` — mock the service, not the API client directly.

Create `apps/web/src/__tests__/hooks/useWorkoutAnalytics.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/services/workout.service', () => ({
  getWorkoutAnalytics: vi.fn(),
}))

const mockAnalytics = {
  weeklyVolume: Array.from({ length: 8 }, (_, i) => ({
    weekStart: `2026-04-${String(14 + i * 7).padStart(2, '0')}`,
    tonnage: i * 1000,
    sessions: i > 0 ? 2 : 0,
  })),
  personalRecords: [
    { exerciseName: 'Supino', maxWeight: 85, reps: 6, achievedAt: '2026-06-12' },
  ],
  totalSessions: 10,
  currentStreakWeeks: 2,
  thisWeekSessions: 2,
}

describe('useWorkoutAnalytics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with loading=true and data=null', async () => {
    const { getWorkoutAnalytics } = await import('@/services/workout.service')
    vi.mocked(getWorkoutAnalytics).mockResolvedValueOnce(mockAnalytics)
    const { useWorkoutAnalytics } = await import('@/hooks/useWorkoutAnalytics')
    const { result } = renderHook(() => useWorkoutAnalytics())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('returns data and loading=false after resolution', async () => {
    const { getWorkoutAnalytics } = await import('@/services/workout.service')
    vi.mocked(getWorkoutAnalytics).mockResolvedValueOnce(mockAnalytics)
    const { useWorkoutAnalytics } = await import('@/hooks/useWorkoutAnalytics')
    const { result } = renderHook(() => useWorkoutAnalytics())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockAnalytics)
  })

  it('sets data to null when service returns null', async () => {
    const { getWorkoutAnalytics } = await import('@/services/workout.service')
    vi.mocked(getWorkoutAnalytics).mockResolvedValueOnce(null)
    const { useWorkoutAnalytics } = await import('@/hooks/useWorkoutAnalytics')
    const { result } = renderHook(() => useWorkoutAnalytics())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
  })
})
```

- [ ] **Step 2: Run web tests**

```bash
cd apps/web && npm test
```

Expected: all tests pass (existing + 3 new hook tests).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/workout.service.ts apps/web/src/hooks/useWorkoutAnalytics.ts apps/web/src/__tests__/hooks/useWorkoutAnalytics.test.ts
git commit -m "feat(web): add getWorkoutAnalytics service, useWorkoutAnalytics hook, and tests"
```

---

## Task 7: Rewrite recovery page

**Files:**
- Modify: `apps/web/src/app/recovery/page.tsx`

- [ ] **Step 1: Rewrite the file**

The current file is 31 lines. Fully replace it with:

```tsx
'use client'

import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import { useRecovery } from '@/hooks/useRecovery'
import { useWorkoutAnalytics } from '@/hooks/useWorkoutAnalytics'
import type { WeeklyVolume } from '@helux/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekNum(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z')
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7)
}

// ── VolumeChart ───────────────────────────────────────────────────────────────

function VolumeChart({ weeks }: { weeks: WeeklyVolume[] }) {
  const maxTonnage = Math.max(...weeks.map(w => w.tonnage), 1)
  const W = 320, barW = 34, gap = 6, bottom = 70

  return (
    <svg viewBox={`0 0 ${W} 80`} width="100%" style={{ display: 'block' }}>
      {weeks.map((w, i) => {
        const x = i * (barW + gap) + 3
        const h = Math.max(4, (w.tonnage / maxTonnage) * 58)
        const y = bottom - h
        const isCurrent = i === weeks.length - 1
        const isEmpty = w.tonnage === 0
        const fill = isCurrent ? 'var(--accent)' : isEmpty ? 'var(--surface-3)' : 'var(--surface-2)'
        const weekNum = getWeekNum(w.weekStart)
        return (
          <g key={w.weekStart}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={fill} />
            <text
              x={x + barW / 2} y={78}
              textAnchor="middle"
              fill={isCurrent ? 'var(--accent)' : 'var(--text-faint)'}
              fontSize={9}
              fontFamily="var(--font-jetbrains-mono)"
            >
              S{weekNum}
            </text>
            {isCurrent && w.tonnage > 0 && (
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fill="var(--accent)"
                fontSize={8}
                fontFamily="var(--font-jetbrains-mono)"
              >
                {w.tonnage >= 1000 ? `${(w.tonnage / 1000).toFixed(1)}t` : `${w.tonnage}kg`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { data: recoveryData, loading: recoveryLoading, isStale } = useRecovery()
  const { data: analytics, loading: analyticsLoading } = useWorkoutAnalytics()

  const loading = recoveryLoading || analyticsLoading

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      {/* Header */}
      <header className="mb-4">
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
          Apple Watch
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Progresso
        </h1>
      </header>

      {/* Recovery section */}
      {recoveryLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: 96 }} className="animate-pulse" />
          ))}
        </div>
      ) : (
        <RecoveryCard data={recoveryData} isStale={isStale} />
      )}

      {/* Analytics section */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px', letterSpacing: '-0.01em' }}>
        Evolução de Treinos
      </h2>

      {analyticsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: 64 }} className="animate-pulse" />
            ))}
          </div>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: 100 }} className="animate-pulse" />
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: 160 }} className="animate-pulse" />
        </div>
      ) : analytics && analytics.totalSessions > 0 ? (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { value: analytics.thisWeekSessions, label: 'esta semana' },
              { value: analytics.totalSessions, label: 'no total' },
              { value: analytics.currentStreakWeeks, label: 'sem. ativas' },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-card)',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Volume chart */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '16px 12px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 12px' }}>
              Volume Semanal (kg)
            </p>
            <VolumeChart weeks={analytics.weeklyVolume} />
          </div>

          {/* Personal records */}
          {analytics.personalRecords.length > 0 && (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0', padding: '12px 16px', borderBottom: '1px solid var(--hairline)' }}>
                Recordes Pessoais
              </p>
              {analytics.personalRecords.map((pr, i) => (
                <div
                  key={pr.exerciseName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < analytics.personalRecords.length - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{pr.exerciseName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>
                      {pr.maxWeight}kg
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>× {pr.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            Nenhum treino registrado ainda. Conclua seu primeiro treino para ver a evolução.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck web**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all web tests**

```bash
cd apps/web && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/recovery/page.tsx
git commit -m "feat(web): upgrade recovery page with workout analytics section"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run all API tests**

```bash
cd apps/api && npm test
```

Record pass/fail counts and report.

- [ ] **Step 2: Run all web tests**

```bash
cd apps/web && npm test
```

Record pass/fail counts and report.

- [ ] **Step 3: Report DONE or BLOCKED**

If all tests pass: report **DONE** with test counts.
If any test fails: report **BLOCKED** with failure output.

---

## Self-Review Checklist

- [x] **Spec coverage:** Types (Task 1) ✓, API route (Task 2) ✓, API tests (Task 3) ✓, Service (Task 4) ✓, Hook (Task 5) ✓, Hook tests (Task 6) ✓, Recovery page rewrite with all sections (Task 7) ✓
- [x] **No placeholders:** All steps have concrete code
- [x] **Type consistency:** `WeeklyVolume`, `PersonalRecord`, `WorkoutAnalytics` defined once in Task 1 and referenced by name in all subsequent tasks; `getWorkoutAnalytics` defined in Task 4, imported in Task 5; `useWorkoutAnalytics` defined in Task 5, imported in Task 7
- [x] **Auth pattern:** Matches `workout-history.ts` (verifyClient + user-scoped client with Authorization header)
- [x] **Test mock pattern:** Matches `workout-history.test.ts` (vi.mock at module level, vi.resetModules in beforeEach, inline Fastify buildApp)
- [x] **Recovery page:** No Shell wrapper, uses `max-w-lg mx-auto px-4 pt-12 pb-24` className, `useRecovery` unchanged
