# Research: Web MVP — Helux Fitness Dashboard

**Date**: 2026-06-15
**Branch**: `004-web-mvp`

---

## Finding 1: apps/web does not yet exist

**Decision**: Create `apps/web` as a new Next.js 14 App Router workspace from scratch.

**Rationale**: The directory does not exist in the repo; the constitution requires it to live under `apps/` in the monorepo.

**Alternatives considered**: SvelteKit, Remix. Rejected because the constitution implicitly targets Next.js 14 (listed in memory as Phase 5 stack) and the team has no prior art in the other options.

---

## Finding 2: Workout history has no API endpoint

**Decision**: Add two minimal endpoints to `apps/api`:
- `GET /api/workouts/history` — returns completed sessions for the authenticated user
- `POST /api/workouts/sessions` — saves a completed session

And a new Supabase table `workout_sessions` with a companion migration.

**Rationale**: The spec assumed no new endpoints were needed, but the actual code shows `packages/workouts` uses pure in-memory/local-file functions — there is no persistence layer accessible from a browser. The mobile app used AsyncStorage (device-local). A web app on a different device cannot read that data. Adding 2 endpoints with a single Supabase table is the minimal fix.

**Alternatives considered**:
- `localStorage` only — rejected because data is trapped to one browser/device; Doug uses both iPhone Safari and desktop.
- Direct Supabase calls from Next.js client — rejected because auth token exposure risk and bypasses the API contract layer.

**Complexity deviation documented**: Complexity Tracking table in `plan.md`.

---

## Finding 3: Auth pattern for Next.js 14 App Router

**Decision**: Use `@supabase/ssr` with Next.js middleware for session propagation. Server Components read the session from cookies. Client Components call `createBrowserClient` for mutations.

**Rationale**: The existing API uses `supabase.auth.getUser(token)` via Bearer header. The web app will retrieve the session in middleware, pass it to Server Components, and inject the Bearer token in all `fetch()` calls to the API. This mirrors the existing mobile flow (Supabase session → Bearer header on API calls).

**Alternatives considered**: NextAuth.js — rejected because Supabase is already the auth provider and adding another layer violates Principle V (Simplicity).

---

## Finding 4: Styling approach

**Decision**: Tailwind CSS v3 with a custom theme extending Helux brand tokens.

**Rationale**: Fastest path to mobile-responsive layout. Custom tokens:
- Background: `#0A0C0A` (mapped to `bg-helux-dark`)
- Accent: `#C8FA4B` (mapped to `text-helux-accent`, `bg-helux-accent`)
- Fonts: Space Grotesk (body), JetBrains Mono (metrics/numbers)

**Alternatives considered**: CSS Modules (used by mobile StyleSheet) — rejected because Tailwind delivers responsive utilities and spacing scale much faster for a web app. CSS variables can bridge token consistency.

---

## Finding 5: Active workout session state

**Decision**: In-progress session state lives in `localStorage` (browser). On "Finish Workout", the completed session is `POST`-ed to `POST /api/workouts/sessions` and cleared from localStorage.

**Rationale**: In-progress workouts are device-local by nature (you're at the gym, one device). Recovery from accidental page close is handled by reading localStorage on mount. Completed sessions are server-persisted for cross-device history.

**Alternatives considered**: Server-side session draft — rejected as over-engineering for single-user personal MVP.

---

## Finding 6: Existing endpoints usable as-is

All existing API endpoints are sufficient for their use cases:
- `GET /genetic-profile` — no auth (intentional for personal MVP; JSON file on server)
- `GET /workout/latest-plan` — no auth (same rationale)
- `POST /workout/generate` — no auth (same)
- `GET /api/recovery/latest` — requires Bearer token ✅
- `POST /api/health/sync` — requires API key or Bearer token ✅

**Decision**: The web app calls these endpoints directly via `fetch()`. No BFF (backend for frontend) layer is needed.

---

## Finding 7: Testing stack

**Decision**: Vitest + `@testing-library/react` + `@testing-library/user-event` for components and hooks. Vitest is already the monorepo standard.

**Rationale**: Consistency with all other workspaces (packages/ai, packages/workouts, etc. all use Vitest). `@testing-library/react` tests behavior, not implementation.

**Alternatives considered**: Jest, Cypress — rejected. Jest has no Turborepo alignment here; Cypress is E2E (out of scope for MVP unit/component tests).

---

## Resolved Clarifications

| Item | Resolution |
|---|---|
| Workout history storage | New Supabase table + 2 API endpoints |
| Auth in Next.js App Router | `@supabase/ssr` + middleware |
| Styling | Tailwind CSS v3 + Helux tokens |
| Active session recovery | localStorage for in-progress, Supabase for completed |
| Shared UI package | Not needed — `apps/mobile` is frozen, no duplication risk |
