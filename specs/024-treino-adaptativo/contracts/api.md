# Contratos HTTP — 024

Todas as rotas exigem `Authorization: Bearer <token Supabase>` (401 sem token válido). Erros: `{ error: string, code?: string, details?: [...] }`.

## Removidas (F1)

| Rota | Motivo |
|---|---|
| `POST /workout/generate` | gerador legado sem autenticação (R13) |

## Genética (F1)

### `POST /api/genetics/report`
Corpo: JSON do laudo Genera (≤ 1 MB). Valida com o parser; grava em `genetic_reports`.
`201 { uploadedAt, traits: number }` · `400 { code: 'invalid-report' }`

### `DELETE /api/genetics/report` → `204`

`GET /genetic-profile` e `GET /api/nutrition/genetic-profile` mantêm o formato atual, agora lendo do banco; sem laudo → `404 { code: 'no-genetic-report' }` (a web já trata como estado vazio).

## Mesociclo e geração (F1, F3)

### `GET /workout/latest-plan` (alterada)
Campos novos opcionais em `AdjustedWorkoutPlanView`: `week { current, total, deload }`, `kind`, `generation`.
`status` passa a aceitar:
- `generating` — geração em andamento
- `generation-failed` — 3 falhas seguidas; `generation.errorCode` diz o motivo
- `onboarding-required` — sem mesociclo pendente e onboarding não concluído

Efeito colateral (FR-031): mesociclo concluído, sem próximo, onboarding concluído e `mesocycle_generation` não está `gerando` (ou está há > 10 min) → dispara a geração em segundo plano.

### `POST /workout/mesocycle/regenerate`
Gera um novo mesociclo agora (substitui o botão "Gerar novo plano"). Exige onboarding concluído.
`202 { status: 'gerando' }` · `409 { code: 'onboarding-required' }` · `409 { code: 'already-generating' }` · `402 { code: 'budget-exceeded' }`

### `POST /workout/mesocycle/repeat-week`
Cria um mesociclo de 1 semana copiando a última semana do ciclo concluído.
`201 { mesocycleId }` · `409 { code: 'no-completed-cycle' }`

### `GET /workout/mesocycle/:id/analysis` (F5)
`200 CycleSummary` · `404` se ainda não analisado

## Onboarding e perfil (F2)

### `GET /api/onboarding`
`200 { step: number | null, completedAt: string | null, profile: UserTrainingProfile, preferences: TrainingPreferences, conditions: HealthCondition[], suggestions: { goalText: string | null, injuryText: string | null } }`

### `PUT /api/onboarding`
Corpo parcial por passo: `{ step, goal?: { primary, secondary?, target?, text? }, experience?: { level, trainingTime, timeOff }, availability?: {...preferências da 022}, cardio?: { likes, avoid } }` → `200` com o mesmo formato do GET.

### `POST /api/onboarding/complete`
Exige objetivo principal, nível e disponibilidade preenchidos. `200 { completedAt }` · `400 { code: 'onboarding-incomplete', missing: string[] }`

`GET/POST /api/profile` (008) continuam e passam a aceitar/retornar os campos novos de objetivo.

## Condições de saúde (F2)

### `GET /api/conditions`
`200 { conditions: HealthCondition[], catalog: Array<{ key, label, regions, rules: ConditionRules }> }`

### `POST /api/conditions`
Corpo: `{ catalogKey | customLabel, region, side?, since?, count?, status, notes? }`.
- Catálogo → `201 { condition, rules }`
- "Outra" → `201 { condition, proposedGuidance: SharedGuidance[] }` (regras propostas pelo Agente de Medicina, status `pendente`; aceite pelas rotas existentes da 022 `/api/agents/guidance/:id/accept|decline`)

### `PATCH /api/conditions/:id` → `200 { condition, rules }`
### `DELETE /api/conditions/:id` → `204` (remove também as orientações ligadas)

### `POST /api/conditions/:id/flare`
`{ region, until? }` (default +5 dias) → `200 { condition }` · `400` se a condição não for `gota`
### `DELETE /api/conditions/:id/flare` → `200 { condition }`

## Sensações (F4)

### `POST /api/session-checkins`
`{ phase, date, mesocycleId?, sessionIndex?, energy?, sleep?, motivation?, rpe?, feeling?, pains?, note? }`
`201 { checkin, adjustment?: { changes: ExerciseAdjustmentChange[], reason } }` — `adjustment` presente quando uma dor no "antes" adaptou a sessão do dia.

`POST /api/workouts/sessions` (alterada): aceita `checkinIds?: string[]` para ligar os check-ins à sessão salva.

## Validade de sessões (F4)

### `GET /api/workouts/review` → `200 { sessions: Array<WorkoutSessionSummary & { reasons: string[] }> }`
### `POST /api/workouts/:id/confirm` → `200`
### `DELETE /api/workouts/:id` → `204` (exclusão explícita pelo usuário)
