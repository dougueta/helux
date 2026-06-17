# Data Model: Web MVP — Helux Fitness Dashboard

**Date**: 2026-06-15
**Branch**: `004-web-mvp`

---

## Existing Entities (from `packages/types`)

These are already defined and will be consumed as-is.

### RecoveryData

```ts
interface RecoveryData {
  date: string           // ISO date "YYYY-MM-DD"
  hrv?: number           // ms (Heart Rate Variability)
  restingHR?: number     // bpm
  activeCalories: number // kcal
  sleepHours?: number    // hours
  source: 'healthkit'
}
```

Source: `GET /api/recovery/latest` — aggregates last 48h from `health_samples` Supabase table.

---

### NextWorkoutPlan

```ts
interface NextWorkoutPlan {
  generatedAt: string         // ISO datetime
  exercises: PlannedExercise[]
  rationale: string           // AI explanation (plain language)
}

interface PlannedExercise {
  name: string
  sets: number
  reps: string    // e.g., "8-12"
  weight: string  // e.g., "60kg" or "bodyweight"
  notes?: string  // technique cues, variants
}
```

Source: `GET /workout/latest-plan` (read), `POST /workout/generate` (create).

---

### GeneticProfile

```ts
interface GeneticProfile {
  // Processed trait summaries from packages/genetics
  // Fields derive from Genera JSON parser output
}
```

Source: `GET /genetic-profile`.

---

### WorkoutSession

```ts
interface WorkoutSession {
  id: string
  date: string          // ISO date
  exercises: ExerciseSet[]
}

interface ExerciseSet {
  name: string
  sets: Array<{
    reps: number
    weight: number  // kg
    effort: number  // RPE 1–10
  }>
}
```

---

## New Entity: WorkoutSession (server-persisted)

### Supabase Table: `workout_sessions`

```sql
CREATE TABLE workout_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  date        DATE NOT NULL,
  duration_s  INTEGER,           -- seconds (nullable if not tracked)
  exercises   JSONB NOT NULL,    -- serialized ExerciseSet[]
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own sessions"
  ON workout_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_workout_sessions_user_date
  ON workout_sessions (user_id, date DESC);
```

---

## Active Session (client-only — localStorage)

In-progress workout state is not persisted to the server until "Finish Workout" is tapped.

### localStorage key: `helux:active-workout`

```ts
interface ActiveWorkoutState {
  planExercises: PlannedExercise[]   // original plan
  loggedSets: {
    exerciseIndex: number
    setIndex: number
    reps: number
    weight: number
    effort: number
    loggedAt: string   // ISO datetime
  }[]
  startedAt: string    // ISO datetime
  currentExerciseIndex: number
  currentSetIndex: number
  restUntil?: string   // ISO datetime (rest timer target)
}
```

This mirrors the pattern already used in `apps/mobile` (`helux:active-session`).

---

## Staleness Rules

| Data | Stale threshold | UI behavior |
|---|---|---|
| Recovery data | > 24 hours since `date` | Warning badge on RecoveryCard |
| Workout plan | > 7 days since `generatedAt` | "Regenerate?" nudge on home |
| Active session | present in localStorage | Resume prompt on mount |
