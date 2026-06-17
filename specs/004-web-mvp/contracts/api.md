# API Contracts: Web MVP — Helux Fitness Dashboard

**Date**: 2026-06-15
**Base URL**: `HELUX_API_URL` env var (e.g., `https://helux.fly.dev` in prod, `http://localhost:3001` locally)

---

## Existing Endpoints (no changes)

### GET /health
Health check. No auth.

**Response 200**:
```json
{ "status": "ok" }
```

---

### GET /genetic-profile
Returns the parsed genetic profile. No auth (server-side JSON file, single user).

**Response 200**: `GeneticProfile` object (from `packages/genetics` parser output)

**Response 404**:
```json
{ "error": "Perfil genético não encontrado. Adicione genera.json em data/genetics/" }
```

---

### GET /workout/latest-plan
Returns the most recently generated workout plan. No auth.

**Response 200**: `NextWorkoutPlan`
```json
{
  "generatedAt": "2026-06-15T10:30:00Z",
  "exercises": [
    {
      "name": "Agachamento",
      "sets": 4,
      "reps": "6-8",
      "weight": "80kg",
      "notes": "Foco em controle excêntrico"
    }
  ],
  "rationale": "Dado seu HRV elevado (72ms) e perfil de fibras rápidas..."
}
```

**Response 404**:
```json
{ "error": "Nenhum plano gerado ainda. Use POST /workout/generate..." }
```

---

### POST /workout/generate
Generates a new workout plan via Claude AI. No auth. Writes to server-side JSON file.

**Request body**: `PlanInput`
```json
{
  "geneticProfile": { ... },
  "constraints": { ... },
  "workoutHistory": [],
  "recoveryData": [],
  "userGoals": "Hipertrofia, foco em membros inferiores",
  "userLevel": "intermediario",
  "availableDaysPerWeek": 4
}
```

**Response 200**: `NextWorkoutPlan` (same shape as GET /workout/latest-plan)

---

### GET /api/recovery/latest
Returns aggregated recovery metrics from the last 48 hours. **Requires Bearer token**.

**Headers**:
```
Authorization: Bearer <supabase_access_token>
```

**Response 200**: `RecoveryData`
```json
{
  "date": "2026-06-15",
  "hrv": 58,
  "restingHR": 52,
  "activeCalories": 420,
  "sleepHours": 7.5,
  "source": "healthkit"
}
```

**Response 404**: `{ "error": "No data found" }` — recovery section shows empty-state guidance.

**Response 401**: `{ "error": "Unauthorized" }`

---

### POST /api/health/sync
Used exclusively by the iOS Shortcut. Not called by the web app.

---

## New Endpoints (to be added in this phase)

### GET /api/workouts/history

Returns completed workout sessions for the authenticated user, ordered by date descending.

**Headers**: `Authorization: Bearer <supabase_access_token>`

**Query params**:
- `limit` (optional, default 20): number of sessions to return
- `offset` (optional, default 0): pagination offset

**Response 200**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "date": "2026-06-15",
      "duration_s": 3600,
      "exercises": [
        {
          "name": "Agachamento",
          "sets": [
            { "reps": 8, "weight": 80, "effort": 8 }
          ]
        }
      ],
      "created_at": "2026-06-15T18:30:00Z"
    }
  ],
  "total": 42
}
```

**Response 401**: `{ "error": "Unauthorized" }`

---

### POST /api/workouts/sessions

Saves a completed workout session for the authenticated user.

**Headers**: `Authorization: Bearer <supabase_access_token>`

**Request body**:
```json
{
  "date": "2026-06-15",
  "duration_s": 3600,
  "exercises": [
    {
      "name": "Agachamento",
      "sets": [
        { "reps": 8, "weight": 80, "effort": 8 },
        { "reps": 7, "weight": 80, "effort": 9 }
      ]
    }
  ]
}
```

**Response 201**:
```json
{ "id": "uuid", "created_at": "2026-06-15T18:30:00Z" }
```

**Response 400**: Validation error (missing required fields)

**Response 401**: `{ "error": "Unauthorized" }`

---

## Web App Routes

| Path | Description | Auth |
|---|---|---|
| `/` | Home — today's workout plan | Required |
| `/workout` | Active workout session view | Required |
| `/recovery` | Recovery metrics | Required |
| `/dna` | Genetic profile summary | Required |
| `/history` | Workout history list | Required |
| `/history/[id]` | Session detail | Required |
| `/login` | Google OAuth redirect | Public |
| `/auth/callback` | Supabase OAuth callback | Public |
