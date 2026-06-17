# Implementation Plan: Web MVP — Helux Fitness Dashboard

**Branch**: `004-web-mvp` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-web-mvp/spec.md`

## Summary

Build `apps/web` as a Next.js 14 App Router web application that serves as the primary Helux interface, replacing the frozen Expo mobile app. The web app is mobile-responsive (iPhone Safari), authenticated via Supabase + Google OAuth, and consumes the existing REST API. Two minimal new API endpoints (`GET /api/workouts/history`, `POST /api/workouts/sessions`) are added to support workout history persistence, backed by a new Supabase table.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**:
- `next@14` (App Router)
- `@supabase/ssr` (auth + SSR session handling)
- `tailwindcss@3` (responsive styling with custom Helux tokens)
- `@testing-library/react` + `vitest` (component + unit tests)
- `@helux/types` (shared interfaces from packages/types)

**Storage**: Supabase (PostgreSQL) — existing `health_samples` table + new `workout_sessions` table
**Testing**: Vitest (monorepo standard) + `@testing-library/react` + `@testing-library/user-event`
**Target Platform**: Web — optimised for iPhone Safari, works on desktop Chrome/Safari/Firefox
**Project Type**: Web application (`apps/web` within monorepo)
**Performance Goals**: Home page renders latest plan < 3s on mobile; rest timer accurate to 1s
**Constraints**: Fully usable one-handed on iPhone (44×44pt min tap targets, no horizontal scroll)
**Scale/Scope**: Single user, personal MVP

## Constitution Check

*GATE: Must pass before implementation. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | `apps/web` lives in the monorepo |
| II. Test-First (TDD) | ✅ PASS | Vitest + RTL enforced; tasks ordered Red → Green → Refactor |
| III. Independent Deployability | ✅ PASS | `apps/web` calls `apps/api` via HTTP only, no direct workspace imports |
| IV. Shared Code via Packages | ✅ PASS | `@helux/types` used; no UI duplication risk (mobile frozen) |
| V. Simplicity (YAGNI) | ✅ PASS | No shared `packages/ui` yet — only one web consumer; see Complexity Tracking |

## Project Structure

### Documentation (this feature)

```
specs/004-web-mvp/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 findings
├── data-model.md        ← entity definitions
├── contracts/
│   └── api.md           ← API contracts (existing + new endpoints)
├── checklists/
│   └── requirements.md  ← spec quality checklist
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code Layout

```
apps/web/                          ← new Next.js 14 workspace
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts                  ← Supabase session refresh + auth guard
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← root layout (font loading, auth context)
│   │   ├── page.tsx               ← home: today's plan + generate button
│   │   ├── login/
│   │   │   └── page.tsx           ← Google OAuth trigger
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts       ← Supabase OAuth callback handler
│   │   ├── workout/
│   │   │   └── page.tsx           ← active workout session view
│   │   ├── recovery/
│   │   │   └── page.tsx           ← recovery metrics
│   │   ├── dna/
│   │   │   └── page.tsx           ← genetic profile
│   │   └── history/
│   │       ├── page.tsx           ← sessions list
│   │       └── [id]/
│   │           └── page.tsx       ← session detail
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NavBar.tsx         ← bottom nav (mobile) / side nav (desktop)
│   │   │   └── Shell.tsx          ← page wrapper with padding + bg
│   │   ├── workout/
│   │   │   ├── WorkoutCard.tsx    ← plan summary card on home
│   │   │   ├── ExerciseList.tsx   ← planned exercise list
│   │   │   ├── ActiveExercise.tsx ← current exercise with set logger
│   │   │   ├── SetLogger.tsx      ← log reps/weight/effort per set
│   │   │   └── RestTimer.tsx      ← countdown timer between sets
│   │   ├── recovery/
│   │   │   └── RecoveryCard.tsx   ← HRV / HR / calories / sleep tiles
│   │   └── dna/
│   │       └── TraitCard.tsx      ← genetic trait with expand detail
│   ├── hooks/
│   │   ├── useActiveWorkout.ts    ← localStorage session state + set logging
│   │   ├── useRestTimer.ts        ← countdown timer logic
│   │   ├── useWorkoutPlan.ts      ← fetch latest plan + generate new
│   │   ├── useRecovery.ts         ← fetch recovery data
│   │   └── useGeneticProfile.ts   ← fetch genetic profile
│   ├── services/
│   │   ├── api-client.ts          ← fetch wrapper (injects Bearer token)
│   │   ├── workout.service.ts     ← calls workout endpoints
│   │   ├── recovery.service.ts    ← calls recovery endpoint
│   │   └── genetics.service.ts    ← calls genetic-profile endpoint
│   └── lib/
│       ├── supabase-server.ts     ← createServerClient (for Server Components)
│       └── supabase-browser.ts    ← createBrowserClient (for Client Components)
└── src/__tests__/
    ├── components/
    │   ├── SetLogger.test.tsx
    │   ├── RestTimer.test.tsx
    │   ├── RecoveryCard.test.tsx
    │   └── WorkoutCard.test.tsx
    ├── hooks/
    │   ├── useActiveWorkout.test.ts
    │   └── useRestTimer.test.ts
    └── services/
        ├── workout.service.test.ts
        └── recovery.service.test.ts

apps/api/src/routes/              ← 2 new files added
├── workout-history.ts            ← GET /api/workouts/history
└── workout-sessions.ts           ← POST /api/workouts/sessions

supabase/migrations/
└── 20260616000000_create_workout_sessions.sql  ← new table + RLS + index
```

**Structure Decision**: Monorepo Option 2 adapted. `apps/web` is fully self-contained. Shared types come from `packages/types`. No new shared packages created (YAGNI — mobile is frozen).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| 2 new API endpoints (breaks spec assumption) | Workout history requires server persistence; browser localStorage is device-local and won't sync between iPhone and desktop | localStorage-only history is invisible across devices for a personal app used on multiple devices |
| New Supabase table `workout_sessions` | Complements the 2 new endpoints; consistent with existing `health_samples` pattern | No alternative server-side persistence exists without this table |
