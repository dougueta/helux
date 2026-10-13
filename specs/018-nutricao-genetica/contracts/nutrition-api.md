# Contrato: API de Nutrição (`apps/api`)

Todas as rotas exigem `Authorization: Bearer <token>` (mesmo `getUser` das demais rotas) e respondem `401` sem token válido. Erros de validação → `400 { error, details }` (zod).

## Perfil e check-in (rotas existentes, estendidas)

- `POST /api/profile` aceita também `heightCm` (120–230), `birthDate` (`YYYY-MM-DD`, idade 14–100), `sex` (`masculino` | `feminino`). `GET /api/profile` devolve os três.
- `POST /api/checkins` aceita também `neck_cm` (20–70). **Depois de gravar**, se houver fase ativa, recalibra a fase (R4) e devolve junto `{ calibration: DietCalibration | null }`.

## Fase de dieta

### `GET /api/nutrition/phase`
```json
{ "phase": "DietPhase | null", "calibrations": "DietCalibration[]", "bodyFatPct": "number | null",
  "missing": ["heightCm | birthDate | sex | checkinWeight"] }
```

### `POST /api/nutrition/phase`
Body `{ "goal": DietGoal, "durationWeeks": 4..52 }`. Encerra a fase ativa (se houver), cria a nova com cálculo `inicial` e devolve `201 { phase, calibration }`. Pré-requisitos faltando → `409 { error: "needs-profile", missing: [...] }`.

### `POST /api/nutrition/phase/end`
Encerra a fase ativa → `200 { phase }`; sem fase ativa → `404`.

## O dia

### `GET /api/nutrition/today`
Recalcula e grava (upsert) o plano do dia.
```json
{ "status": "ok | needs-profile | no-phase",
  "missing": [],
  "plan": "DayPlan",
  "phase": "DietPhase",
  "tiredness": "otimo | normal | cansado | exausto | null",
  "dayTypeOverride": "descanso | null",
  "workoutToday": { "finishedAt": "string" } }
```
`plan.meals[].timing` vem sempre `relativo` (a ancoragem no relógio é feita na web — R8). `workoutToday` é `null` sem treino salvo hoje. Com `status != "ok"`, `plan` é omitido. Com cansaço `exausto` e sem nota de recuperação hoje, grava uma mensagem `kind: "nota-recuperacao"` na conversa da fase (US3 cenário 2).

### `PUT /api/nutrition/today`
Body `{ "dayType": "treino" | "descanso" }` → grava o override e devolve o mesmo formato do `GET`.

### `GET /api/nutrition/today/swap-options?mealId=…&foodId=…`
`200 { "options": [{ "food": FoodItem, "portions": number, "macros": DietTargets }] }` — até 5, mesmo grupo, mesmas restrições genéticas, ordenadas por menor diferença de macros. `404` se a refeição/alimento não estiver no plano de hoje.

### `POST /api/nutrition/today/swap`
Body `MealSwap` → valida que `toFoodId` está entre as opções; grava e devolve o `GET` atualizado. Fora das opções → `400`.

### `GET /api/nutrition/history?limit=1..60` (padrão 14)
`200 { "days": [{ "date", "dayType", "status", "targets": DietTargets }] }`, mais recentes primeiro.

## Perfil nutrigenômico (US4)

### `GET /api/nutrition/genetic-profile`
`200 { "active": boolean, "markers": NutriMarker[] }` — `active: false` e lista vazia sem `genera.json`.

## Chat
Ver `chat-stream.md`.
