# API Contracts: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Date**: 2026-08-27
**Base URL**: `HELUX_API_URL` env var (mesmo padrão dos specs anteriores)

Todos os endpoints abaixo requerem `Authorization: Bearer <token>` (auth Supabase — mesmo padrão de `checkins.ts`/`workout-sessions.ts`).

---

## New: GET /api/profile

Retorna o perfil de treino do usuário atual, ou `null` se nunca foi preenchido.

**Response 200**:
```json
{
  "profile": {
    "goal": "Voltar a correr 5km sem dor no joelho",
    "level": "intermediario",
    "trainingTime": "3 anos",
    "timeOff": null,
    "currentInjury": "Dor leve no ombro direito ao levantar acima da cabeça",
    "updatedAt": "2026-08-27T14:00:00Z"
  }
}
```
Ou `{ "profile": null }` quando não existe linha.

**Response 401**: `{ "error": "Unauthorized" }`

---

## New: POST /api/profile

Upsert (cria ou atualiza) o perfil do usuário. Todos os campos opcionais (FR-011) — envie só os campos que quer alterar; campos omitidos mantêm o valor atual (merge, não substituição total).

**Request body**:
```json
{
  "goal": "Voltar a correr 5km sem dor no joelho",
  "level": "intermediario",
  "trainingTime": "3 anos",
  "timeOff": "",
  "currentInjury": "Dor leve no ombro direito ao levantar acima da cabeça"
}
```

**Response 200**: mesmo shape de `GET /api/profile` (`{ "profile": {...} }`), refletindo o estado após o upsert.

**Response 400**: `{ "error": "Bad Request", "details": [...] }` — validação Zod (level fora do enum, strings acima do tamanho máximo).

**Response 401**: `{ "error": "Unauthorized" }`

---

## New: POST /api/tiredness-today

Sinaliza que o usuário está muito cansado hoje. Idempotente — chamar mais de uma vez no mesmo dia não duplica nem falha.

**Request body**: nenhum (a data é sempre "hoje" no servidor, mesma referência de fuso já usada pelo resto do produto).

**Response 200**: `{ "active": true }`

**Response 401**: `{ "error": "Unauthorized" }`

---

## New: DELETE /api/tiredness-today

Desfaz a sinalização de cansaço de hoje (FR-008a). Idempotente — chamar sem sinalização ativa não falha.

**Response 200**: `{ "active": false }`

**Response 401**: `{ "error": "Unauthorized" }`

---

## Modified: GET /workout/latest-plan

Contrato de resposta (`AdjustedWorkoutPlanView`) **inalterado** — nenhum campo novo no payload. O que muda é como `today.adjusted`/`today.adjustmentReason` são calculados internamente:

1. Continua buscando `health_samples` das últimas 48h (inalterado).
2. **Novo**: também busca a linha de `daily_tiredness_signals` para `(user_id, hoje)`.
3. Passa o resultado booleano como novo argumento de `applyRecoveryAdjustment` (ver `data-model.md`/`research.md` Decisão 5) — quando ativo, o ajuste nunca fica menos conservador que a faixa "alta" já usada para HRV baixo.

Nenhuma mudança de request/response — apenas de lógica interna, mesmo padrão de "Modified" já usado em `006-mesociclo-treino-backend/contracts/api.md`.

---

## Modified (geração): `generateAndSaveMesocycle` / `gatherPlanInput`

Não são endpoints HTTP diretos (disparados internamente por `POST /api/workouts/sessions` e pela leitura de `GET /workout/latest-plan` quando não há mesociclo ativo — inalterado). Mudança interna: `gatherPlanInput` (`apps/api/src/services/plan-context.service.ts`) passa a buscar `user_training_profile` do usuário e usar `goal`/`level`/`trainingTime`/`timeOff`/`currentInjury` reais (com fallback para os defaults atuais quando não preenchido — FR-005), em vez dos valores hoje fixos no código.

---

## Unchanged: POST /workout/generate

Fluxo legado de sessão única (botão manual "Gerar Novo Plano") — **não alterado nesta spec**, mesmo precedente de `006`/`007` (débito técnico já rastreado, fora de escopo). Continua usando `buildSystemPrompt`/`buildUserPrompt` (não `buildMesocycleSystemPrompt`/`buildMesocycleUserPrompt`), que também não recebem os novos parâmetros de perfil nesta spec.
