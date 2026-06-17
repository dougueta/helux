# Tasks: Web MVP â€” Helux Fitness Dashboard

**Input**: Design documents from `specs/004-web-mvp/`
**Prerequisites**: plan.md âœ…, spec.md âœ…, research.md âœ…, data-model.md âœ…, contracts/api.md âœ…
**Tests**: Included â€” TDD is non-negotiable per Helux Constitution (Principle II)
**Branch**: `004-web-mvp`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label (US1â€“US5 map to spec.md priorities P1â€“P5)
- Each task includes exact file path(s)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap `apps/web` workspace and integrate into the monorepo.

- [x] T001 Add `apps/web` to pnpm workspaces and Turborepo pipeline (`pnpm-workspace.yaml`, `turbo.json`)
- [x] T002 Create `apps/web/package.json` with Next.js 14, `@supabase/ssr`, `@helux/types` workspace dep, tailwindcss, vitest, `@testing-library/react`, `@testing-library/user-event`
- [x] T003 [P] Create `apps/web/next.config.ts` â€” transpile `@helux/types`, set `output: 'standalone'`
- [x] T004 [P] Create `apps/web/tsconfig.json` extending root config with `@/*` path alias
- [x] T005 [P] Create `apps/web/tailwind.config.ts` with Helux tokens: `helux-dark: #0A0C0A`, `helux-accent: #C8FA4B`, Space Grotesk + JetBrains Mono font families
- [x] T006 [P] Create `apps/web/vitest.config.ts` with `@vitejs/plugin-react`, `jsdom` environment, setup file

**Checkpoint**: `pnpm --filter @helux/web dev` starts without errors; Tailwind tokens resolve; Vitest runs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth infrastructure, Supabase migration, API client, and shared layout that ALL user stories depend on.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create Supabase migration for `workout_sessions` table with RLS and index (`supabase/migrations/20260616000000_create_workout_sessions.sql`) â€” schema defined in `data-model.md`
- [x] T008 [P] Create `apps/web/src/lib/supabase-server.ts` â€” `createServerClient` for Server Components and middleware using `@supabase/ssr`
- [x] T009 [P] Create `apps/web/src/lib/supabase-browser.ts` â€” `createBrowserClient` for Client Components
- [x] T010 Create `apps/web/middleware.ts` â€” refresh Supabase session cookie on every request; redirect unauthenticated users to `/login` (except `/login` and `/auth/callback`)
- [x] T011 [P] Write failing tests for `api-client` wrapper (`apps/web/src/__tests__/services/api-client.test.ts`) â€” verify Bearer token is injected from Supabase session, verify base URL from env
- [x] T012 Implement `apps/web/src/services/api-client.ts` â€” `apiFetch(path, options)` reads session via `createBrowserClient`, injects `Authorization: Bearer <token>`, prefixes `NEXT_PUBLIC_API_URL`
- [x] T013 Create `apps/web/src/app/login/page.tsx` â€” "Entrar com Google" button that calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [x] T014 Create `apps/web/src/app/auth/callback/route.ts` â€” Supabase OAuth code exchange handler (GET route)
- [x] T015 [P] Create `apps/web/src/app/layout.tsx` â€” root layout with Space Grotesk + JetBrains Mono font loading, `bg-helux-dark` body, and `<NavBar />`
- [x] T016 [P] Create `apps/web/src/components/layout/Shell.tsx` â€” page wrapper: max-width container, safe-area padding for iPhone notch, bottom padding for nav bar
- [x] T017 Create `apps/web/src/components/layout/NavBar.tsx` â€” sticky bottom nav with 4 tabs: Hoje `/`, Recovery `/recovery`, DNA `/dna`, HistÃ³rico `/history`; accent color on active tab
- [x] T018 Create `apps/web/.env.local.example` documenting required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

**Checkpoint**: `/login` page renders; Google OAuth redirects and lands on `/auth/callback`; authenticated users see NavBar; unauthenticated users are redirected to `/login`.

---

## Phase 3: User Story 1 â€” View & Execute Today's Workout (Priority: P1) ðŸŽ¯ MVP

**Goal**: Doug can open the home page, see today's workout plan, start an active workout session, log sets with rest timers, and finish the session â€” all with session state surviving a browser refresh.

**Independent Test**: Open `/`, see a workout plan, tap "Iniciar Treino", log 1 set of the first exercise, close and reopen the browser, confirm the session resumed, then finish â€” session saved.

### Tests (write first â€” must FAIL before implementation)

- [x] T019 [P] [US1] Write failing tests for `useActiveWorkout` hook (`apps/web/src/__tests__/hooks/useActiveWorkout.test.ts`) â€” test: initialise from localStorage, logSet advances setIndex, finishWorkout clears state
- [x] T020 [P] [US1] Write failing tests for `useRestTimer` hook (`apps/web/src/__tests__/hooks/useRestTimer.test.ts`) â€” test: starts countdown, fires callback on zero, resets correctly
- [x] T021 [P] [US1] Write failing tests for `SetLogger` component (`apps/web/src/__tests__/components/workout/SetLogger.test.tsx`) â€” test: renders reps/weight/effort inputs, calls onLog with correct values
- [x] T022 [P] [US1] Write failing tests for `WorkoutCard` component (`apps/web/src/__tests__/components/workout/WorkoutCard.test.tsx`) â€” test: renders exercise list, shows rationale, shows "Iniciar Treino" CTA
- [x] T023 [P] [US1] Write failing tests for `workout.service` `getLatestPlan()` (`apps/web/src/__tests__/services/workout.service.test.ts`) â€” test: calls `GET /workout/latest-plan`, returns `NextWorkoutPlan`, handles 404

### Implementation for User Story 1

- [x] T024 [US1] Implement `apps/web/src/services/workout.service.ts` â€” `getLatestPlan()` calling `GET /workout/latest-plan` via `apiFetch`
- [x] T025 [US1] Implement `apps/web/src/hooks/useWorkoutPlan.ts` â€” fetches latest plan on mount, exposes `{ plan, loading, error }`
- [x] T026 [US1] Implement `apps/web/src/components/workout/WorkoutCard.tsx` â€” displays `NextWorkoutPlan.exercises` list and `rationale`; "Iniciar Treino" button navigates to `/workout`
- [x] T027 [US1] Implement `apps/web/src/components/workout/ExerciseList.tsx` â€” renders `PlannedExercise[]` rows with sets/reps/weight chips
- [x] T028 [US1] Implement `apps/web/src/hooks/useActiveWorkout.ts` â€” `ActiveWorkoutState` in `localStorage` key `helux:active-workout`; actions: `startWorkout(plan)`, `logSet(set)`, `nextExercise()`, `finishWorkout()` â†’ `POST /api/workouts/sessions`
- [x] T029 [US1] Write failing tests for `POST /api/workouts/sessions` route (`apps/api/src/__tests__/workout-sessions.test.ts`) â€” test: saves session to Supabase, returns 201, rejects missing fields
- [x] T030 [US1] Implement `apps/api/src/routes/workout-sessions.ts` â€” `POST /api/workouts/sessions` with Supabase Bearer auth + Zod validation â†’ insert into `workout_sessions`
- [x] T031 [US1] Register `workoutSessionsRoutes` in `apps/api/src/index.ts`
- [x] T032 [US1] Implement `apps/web/src/hooks/useRestTimer.ts` â€” countdown from `targetSeconds`, fires `onComplete` callback, exposes `{ secondsLeft, isActive, start, reset }`
- [x] T033 [US1] Implement `apps/web/src/components/workout/SetLogger.tsx` â€” numeric inputs for reps, weight (kg), effort (RPE 1â€“10); "Confirmar SÃ©rie" button calls `onLog`
- [x] T034 [US1] Implement `apps/web/src/components/workout/RestTimer.tsx` â€” circular countdown showing `secondsLeft`; "Pular Descanso" button
- [x] T035 [US1] Implement `apps/web/src/components/workout/ActiveExercise.tsx` â€” current exercise header + `SetLogger` + `RestTimer` orchestration
- [x] T036 [US1] Implement `apps/web/src/app/page.tsx` â€” Server Component: fetch session, render `<WorkoutCard>` with plan data; show loading skeleton while fetching; 404 state shows "Gere seu primeiro plano"
- [x] T037 [US1] Implement `apps/web/src/app/workout/page.tsx` â€” Client Component: reads `useActiveWorkout`, renders `<ActiveExercise>` per exercise; shows finish confirmation on last set; redirects to `/` after save

**Checkpoint**: Open `/`, see workout plan, tap "Iniciar Treino", log sets, refresh browser mid-session, confirm resume, finish â€” session appears in Supabase `workout_sessions`.

---

## Phase 4: User Story 2 â€” Generate a New Workout Plan (Priority: P2)

**Goal**: Doug can tap "Gerar Novo Plano" on the home page, triggering AI generation with a visible loading state and the result displayed with rationale.

**Independent Test**: Tap "Gerar Novo Plano" on `/`, observe loading spinner, receive new plan with AI rationale â€” without recovery data, generation still completes using genetic data only.

### Tests (write first â€” must FAIL before implementation)

- [x] T038 [P] [US2] Write failing tests for `genetics.service` `getGeneticProfile()` (`apps/web/src/__tests__/services/genetics.service.test.ts`) â€” test: calls `GET /genetic-profile`, returns `GeneticProfile`, handles 404
- [x] T039 [P] [US2] Write failing tests for `workout.service` `generatePlan()` (`apps/web/src/__tests__/services/workout.service.test.ts`) â€” test: assembles `PlanInput`, calls `POST /workout/generate`, handles AI unavailable (500)
- [x] T040 [P] [US2] Write failing tests for `useWorkoutPlan` `generatePlan` mutation (`apps/web/src/__tests__/hooks/useWorkoutPlan.test.ts`) â€” test: sets `generating: true` during call, updates `plan` on success, sets `error` on failure

### Implementation for User Story 2

- [x] T041 [US2] Implement `apps/web/src/services/genetics.service.ts` â€” `getGeneticProfile()` calling `GET /genetic-profile` via `apiFetch`; returns null on 404
- [x] T042 [US2] Implement `apps/web/src/hooks/useGeneticProfile.ts` â€” fetches profile on mount, exposes `{ profile, loading, error }`
- [x] T043 [US2] Add `generatePlan()` to `apps/web/src/services/workout.service.ts` â€” fetches genetic profile + latest recovery (graceful on 404), assembles `PlanInput`, calls `POST /workout/generate`
- [x] T044 [US2] Extend `apps/web/src/hooks/useWorkoutPlan.ts` â€” add `generatePlan()` action + `generating: boolean` + `generationError` state
- [x] T045 [US2] Add "Gerar Novo Plano" button to `apps/web/src/app/page.tsx` â€” shows spinner during generation, renders updated plan + rationale after success; shows error toast on AI failure

**Checkpoint**: Tap "Gerar Novo Plano", see spinner for up to 15s, receive updated plan with rationale in Portuguese.

---

## Phase 5: User Story 3 â€” Check Recovery Status (Priority: P3)

**Goal**: Doug can navigate to `/recovery` and see HRV, resting HR, active calories, and sleep duration from the latest Apple Watch sync, with a staleness warning if data is older than 24h, and guidance to run the iOS Shortcut if no data exists.

**Independent Test**: Navigate to `/recovery` after running the iOS Shortcut â€” see 4 metric tiles with values and last-sync timestamp. Navigate to `/recovery` with no data â€” see Shortcut guidance card.

### Tests (write first â€” must FAIL before implementation)

- [x] T046 [P] [US3] Write failing tests for `recovery.service` `getLatestRecovery()` (`apps/web/src/__tests__/services/recovery.service.test.ts`) â€” test: calls `GET /api/recovery/latest`, returns `RecoveryData`, handles 404 with null
- [x] T047 [P] [US3] Write failing tests for `useRecovery` hook (`apps/web/src/__tests__/hooks/useRecovery.test.ts`) â€” test: fetches on mount, `isStale` true when date > 24h ago, `hasData` false when null
- [x] T048 [P] [US3] Write failing tests for `RecoveryCard` component (`apps/web/src/__tests__/components/recovery/RecoveryCard.test.tsx`) â€” test: renders 4 metric tiles, shows staleness badge when `isStale`, renders empty-state guidance when no data

### Implementation for User Story 3

- [x] T049 [US3] Implement `apps/web/src/services/recovery.service.ts` â€” `getLatestRecovery()` calling `GET /api/recovery/latest` via `apiFetch`; returns null on 404
- [x] T050 [US3] Implement `apps/web/src/hooks/useRecovery.ts` â€” fetches recovery on mount; computes `isStale` (date diff > 24h); exposes `{ data, loading, isStale, hasData }`
- [x] T051 [US3] Implement `apps/web/src/components/recovery/RecoveryCard.tsx` â€” 2Ã—2 grid of metric tiles (HRV ms, FC bpm, Calorias kcal, Sono h); staleness badge ("Dados de Xh atrÃ¡s"); empty state with "Execute o Shortcut no iPhone"
- [x] T052 [US3] Implement `apps/web/src/app/recovery/page.tsx` â€” Client Component using `useRecovery`, renders `<RecoveryCard>` with loading skeleton

**Checkpoint**: `/recovery` shows live metric tiles after Shortcut sync; shows empty-state guidance when no data; shows staleness badge when data > 24h old.

---

## Phase 6: User Story 4 â€” View Genetic Profile Summary (Priority: P4)

**Goal**: Doug can navigate to `/dna` and read his genetic fitness traits in plain language, with expand/collapse for each trait's training implication.

**Independent Test**: Navigate to `/dna` â€” see at least 3 trait cards (muscle fiber type, recovery speed, injury risk) with plain-language summaries; tap one to expand the explanation.

### Tests (write first â€” must FAIL before implementation)

- [x] T053 [P] [US4] Write failing tests for `TraitCard` component (`apps/web/src/__tests__/components/dna/TraitCard.test.tsx`) â€” test: renders trait name + summary; expand toggle shows detail; correct accent color for risk level

### Implementation for User Story 4

- [x] T054 [US4] Implement `apps/web/src/components/dna/TraitCard.tsx` â€” trait name, 1-line plain-language summary, expand button revealing training implication; accent color badge (low/medium/high risk)
- [x] T055 [US4] Implement `apps/web/src/app/dna/page.tsx` â€” Server Component: fetches `GET /genetic-profile`, renders grid of `<TraitCard>` per trait; 404 state shows "Perfil genÃ©tico nÃ£o carregado"

**Checkpoint**: `/dna` shows genetic traits in plain Portuguese; each card expands to show training implications.

---

## Phase 7: User Story 5 â€” View Workout History (Priority: P5)

**Goal**: Doug can navigate to `/history`, see past workout sessions in reverse chronological order, and tap any session to view full detail (exercises, sets, weights).

**Independent Test**: After completing 2 workouts, navigate to `/history` â€” see 2 sessions listed with date and muscle groups; tap one to see full exercise/set detail.

### Tests (write first â€” must FAIL before implementation)

- [x] T056 [P] [US5] Write failing tests for `GET /api/workouts/history` route (`apps/api/src/__tests__/workout-history.test.ts`) â€” test: returns sessions for auth user, respects `limit`/`offset`, returns 401 without token
- [x] T057 [P] [US5] Write failing tests for `useWorkoutHistory` hook (`apps/web/src/__tests__/hooks/useWorkoutHistory.test.ts`) â€” test: fetches history on mount, exposes `sessions` array and `total`

### Implementation for User Story 5

- [x] T058 [US5] Implement `apps/api/src/routes/workout-history.ts` â€” `GET /api/workouts/history` with Bearer auth; queries `workout_sessions` ordered by date desc; supports `limit`/`offset` query params
- [x] T059 [US5] Register `workoutHistoryRoutes` in `apps/api/src/index.ts`
- [x] T060 [US5] Implement `apps/web/src/hooks/useWorkoutHistory.ts` â€” fetches `GET /api/workouts/history`; exposes `{ sessions, total, loading, error }`
- [x] T061 [US5] Implement `apps/web/src/app/history/page.tsx` â€” Client Component: renders session list (date, duration, primary muscles); empty state "Nenhum treino registrado ainda"; loading skeleton
- [x] T062 [US5] Implement `apps/web/src/app/history/[id]/page.tsx` â€” fetches single session from history; renders exercise/set table with reps, weight, RPE

**Checkpoint**: `/history` shows all completed sessions; tapping one shows full exercise detail.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mobile UX hardening and deployment readiness.

- [x] T063 [P] Audit all pages for mobile layout: tap targets â‰¥ 44px, no horizontal scroll on 390px viewport, bottom nav not covering content â€” fix any violations
- [x] T064 [P] Add `<Suspense>` loading skeletons to all async pages (home, recovery, dna, history)
- [x] T065 [P] Add error boundary wrapper to root layout (`apps/web/src/app/layout.tsx`) for graceful API failure display
- [x] T066 Run `supabase db push` to apply `workout_sessions` migration to remote Supabase project
- [x] T067 Add `apps/web` Dockerfile and update `turbo.json` build pipeline for production build verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies â€” start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 â€” BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 â€” first story to implement
- **US2 (Phase 4)**: Depends on Phase 2 â€” can start after Phase 2 even before US1 finishes (different files)
- **US3 (Phase 5)**: Depends on Phase 2 only â€” independent of US1/US2
- **US4 (Phase 6)**: Depends on `genetics.service` from US2 â€” can reuse it; otherwise independent
- **US5 (Phase 7)**: Depends on Phase 2 Supabase migration (T007) and `workout-sessions` route (T030/T031 from US1)
- **Polish (Phase 8)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Foundation only. Self-contained except API route in apps/api (T029â€“T031).
- **US2 (P2)**: Foundation + `genetics.service` (T041). Recovery call is optional (graceful degradation).
- **US3 (P3)**: Foundation only. `recovery.service` is standalone.
- **US4 (P4)**: Foundation + `genetics.service` already built in US2 (T041). Reuse it.
- **US5 (P5)**: Foundation + Supabase migration (T007) + `workout-sessions` route (T030/T031 from US1).

### Within Each User Story

1. Write all failing tests first (marked [P] â€” can run in parallel)
2. Implement services before hooks
3. Implement hooks before components
4. Implement components before pages
5. Commit at each checkpoint

---

## Parallel Opportunities Per Story

### US1 â€” Parallel Test Writing (T019â€“T023)

```
Launch together:
- T019: useActiveWorkout tests
- T020: useRestTimer tests
- T021: SetLogger tests
- T022: WorkoutCard tests
- T023: workout.service tests
```

### US2 â€” Parallel Test Writing (T038â€“T040)

```
Launch together:
- T038: genetics.service tests
- T039: workout.service generatePlan tests
- T040: useWorkoutPlan mutation tests
```

### US3 â€” Parallel Test Writing (T046â€“T048)

```
Launch together:
- T046: recovery.service tests
- T047: useRecovery tests
- T048: RecoveryCard tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open `/` on iPhone Safari, start and finish a real workout
5. Ship this as the working MVP

### Incremental Delivery

1. Setup + Foundational â†’ workspace boots, auth works
2. US1 â†’ can view plan and log a workout (deploy)
3. US2 â†’ can generate new plans (deploy)
4. US3 â†’ can check recovery (deploy)
5. US4 â†’ can view DNA (deploy)
6. US5 â†’ can see history (deploy)

---

## Task Summary

| Phase | Tasks | Count |
|---|---|---|
| Phase 1: Setup | T001â€“T006 | 6 |
| Phase 2: Foundational | T007â€“T018 | 12 |
| Phase 3: US1 | T019â€“T037 | 19 |
| Phase 4: US2 | T038â€“T045 | 8 |
| Phase 5: US3 | T046â€“T052 | 7 |
| Phase 6: US4 | T053â€“T055 | 3 |
| Phase 7: US5 | T056â€“T062 | 7 |
| Phase 8: Polish | T063â€“T067 | 5 |
| **Total** | | **67** |

---

## Notes

- `[P]` tasks = independent files, no blocking dependency â€” run in parallel
- TDD is mandatory per Constitution Principle II: write the test, confirm it FAILS, then implement
- Each user story phase ends with a named checkpoint â€” stop and validate before continuing
- `apps/mobile` is frozen â€” make no changes there
- Commit after each checkpoint (or after each task if using `/speckit-git-commit`)
