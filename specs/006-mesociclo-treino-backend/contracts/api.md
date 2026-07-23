# API Contracts: Geração de Mesociclo de Treino com Ajuste por Recovery

**Date**: 2026-07-21
**Base URL**: `HELUX_API_URL` env var (mesmo padrão de `004-web-mvp`)

---

## Modified: GET /workout/latest-plan

Requer `Authorization: Bearer <token>` (auth Supabase — inalterado). Antes lia de `workout_plans`; agora lê o mesociclo ativo em `mesocycle_plans`, deriva a sessão pendente atual e aplica o ajuste por recovery em tempo de leitura.

**Response 200** — `AdjustedWorkoutPlanView`:
```json
{
  "mesocycleId": "b3f1...",
  "generatedAt": "2026-07-21T10:00:00Z",
  "today": {
    "letter": "B",
    "focus": "Puxar / Costas + Bíceps",
    "exercises": [
      {
        "name": "Remada Curvada",
        "sets": 3,
        "reps": "8-10",
        "weight": "60kg",
        "notes": "Volume reduzido hoje por recovery — normalmente 4 séries"
      }
    ],
    "adjusted": true,
    "adjustmentReason": "HRV moderado (52ms)"
  },
  "upcoming": [
    { "letter": "C", "focus": "Pernas" },
    { "letter": "D", "focus": "Ombro + Core" }
  ],
  "progress": { "completed": 1, "total": 4 }
}
```

- `today` é `null` quando não há sessão pendente (mesociclo recém-concluído, aguardando geração do próximo) — ver seção de estados abaixo.
- `upcoming` traz só `letter`/`focus` (não a prescrição completa) das próximas sessões, na ordem do ciclo — suficiente para a spec de UI (`007-mesociclo-treino-ui`) exibir a lista sem payload desnecessário.
- `progress.completed` conta sessões com `completed_at` preenchido; `progress.total` é `sessions.length`.

**Response 200 — sem mesociclo ativo** (primeiro uso, ou aguardando geração do próximo após o ciclo anterior terminar):
```json
{
  "mesocycleId": null,
  "today": null,
  "upcoming": [],
  "progress": null,
  "status": "generating"
}
```
`status: "generating"` é retornado quando o mesociclo anterior está 100% concluído mas o próximo ainda não terminou de ser gerado (geração em background ainda em andamento). `status` omitido (ou `"none"`) quando é realmente o primeiro uso e nenhuma geração foi disparada ainda.

**Response 401**: `{ "error": "Unauthorized" }` — inalterado.

**Response 500**: `{ "error": "Internal Server Error" }` — inalterado.

> Nota: este é um **response shape novo**, incompatível com o `NextWorkoutPlan` retornado hoje. Consumidores existentes (`apps/web/src/hooks/useWorkoutPlan.ts`, `apps/web/src/services/workout.service.ts`) precisam ser atualizados — isso é tratado na spec `007-mesociclo-treino-ui`, não aqui.

---

## Modified: POST /api/workouts/sessions

Contrato de request/response **inalterado** (mesmo body, mesmo `201` com `{ id, created_at }`). O que muda é o efeito colateral server-side:

1. Insere a sessão em `workout_sessions` (como hoje).
2. **Novo**: localiza a sessão pendente atual do mesociclo ativo e marca `completed_at` nela.
3. **Novo**: só dispara a geração do próximo mesociclo (fire-and-forget, como hoje) se, após o passo 2, todas as sessões do mesociclo ativo estiverem concluídas. Antes disso, nenhuma geração é disparada nesse endpoint.

Nenhuma mudança de schema de request/response — apenas de comportamento interno.

---

## Unchanged: POST /workout/generate

Continua chamando `generateWorkoutPlan` (sessão única) — **fora do escopo desta spec** (ver `plan.md` → Complexity Tracking, gap conhecido). Documentado aqui só para deixar explícito que não foi tocado.

---

## Internal contract (não-HTTP): `generateMesocyclePlan`

Consumida por `apps/api/src/services/plan-generation.service.ts`, não exposta como endpoint HTTP direto nesta spec.

```ts
function generateMesocyclePlan(input: PlanInput): Promise<MesocyclePlan>
```

- Mesma `PlanInput` já usada por `generateWorkoutPlan` — nenhuma mudança na coleta de contexto (`gatherPlanInput`).
- Retorna `MesocyclePlan` (ver `data-model.md`) com `sessions` cobrindo a divisão muscular completa para `input.availableDaysPerWeek`.
- Lança erro nas mesmas condições que `generateWorkoutPlan` hoje (chave de API ausente, JSON malformado da IA) — tratamento de erro no chamador é o mesmo já existente em `plan-generation.service.ts` (log + não propaga, por ser fire-and-forget).

## Internal contract (não-HTTP): `applyRecoveryAdjustment`

Consumida por `apps/api/src/routes/workout-latest-plan.ts`.

```ts
function applyRecoveryAdjustment(
  session: MesocycleSession,
  recovery: RecoveryData[],
): AdjustedSession
```

- Função pura, síncrona, sem I/O — ver `research.md` Decisão 4 para as regras de ajuste.
- `recovery` vazio ou sem HRV → retorna a sessão original com `adjusted: false`.
