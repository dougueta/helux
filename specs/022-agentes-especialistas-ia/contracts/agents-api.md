# Contrato: API dos Agentes Especialistas (022)

Todas as rotas exigem `Authorization: Bearer <token Supabase>` (padrão atual). Erros: `{ "error": string, "code"?: string }`. Tipos em `@helux/types` (`agents.ts`).

## Perfil Integrado

### `GET /api/agents/profile`
`200 IntegratedProfile` (ver data-model). Também traz `budget: { capUsd, spentUsd, pct }`.

### `PUT /api/agents/sources/:source`
Body `{ "enabled": boolean }`. `204`. `400` se `source` ∉ `SourceKey`.

## Preferências de treino

### `GET /api/training-preferences`
`200 TrainingPreferences` (vazio = valores nulos/listas vazias).

### `PUT /api/training-preferences`
Body `TrainingPreferencesInput` (validação do data-model). Resposta `200`:
```json
{ "preferences": TrainingPreferences,
  "appliesFrom": "proximo-mesociclo" | "imediato",
  "proposal": WorkoutAdjustmentProposal | null }
```
- Mudança só em suaves → `appliesFrom: "proximo-mesociclo"`, `proposal: null`.
- Mudança em rígidas com sessões pendentes que violam → `proposal` `adaptacao-restricao` `pendente` (gera IA; sujeito ao teto, R11). Sem violação → `proposal: null`.
- Teto atingido → preferências salvas, `proposal: null`, `"budgetBlocked": true` (a adaptação pode ser pedida depois).

### `GET /api/exercises` *(acrescentado na implementação)*
`200 { exercises: Array<{ id, name, muscleGroup, equipment, pattern }> }` — catálogo do banco para os seletores de favoritos/evitar (a web não depende de `@helux/ai`).

## Conversas (SSE)

### `GET /api/agents/conversations/:channel`
`200 { conversation: { id, channel, startedAt } | null, messages: AgentMessage[] }` — conversa não arquivada do canal, ordem cronológica.

### `POST /api/agents/conversations/:channel/new`
Arquiva a conversa atual do canal. `201 { conversation }`.

### `POST /api/agents/chat`
Body `{ "channel": Channel, "message": string (1–2000) }`.

Pré-condições: teto mensal < 100% (senão `409 { code: "budget-exceeded" }`).

Resposta `200`, `Content-Type: text/event-stream`:

| Evento | `data` | Quando |
|---|---|---|
| `start` | `{ userMessageId, budgetWarning?: { pct } }` | mensagem do usuário gravada |
| `routed` | `{ agent: AgentKey, reason }` | só `channel = equipe`, antes do 1º `delta` |
| `delta` | `{ text }` | trecho de texto do especialista |
| `fact` | `{ fact: ConversationFact }` | ferramenta `record_conversation_fact` executada |
| `proposal` | `{ guidance?: SharedGuidance, adjustment?: WorkoutAdjustmentProposal }` | proposta pendente criada |
| `handoff` | `{ to: AgentKey, reason }` | `suggest_specialist` |
| `done` | `{ agentMessageId, sourcesUsed }` | resposta completa gravada |
| `error` | `{ message, code?: "refusal" \| "ai-unavailable" \| "budget-exceeded" }` | falha; nada do agente gravado; relatos/propostas criados antes do erro são mantidos (têm vida própria) |

Fluxo no servidor: grava mensagem do usuário → (equipe) atalho de alerta médico ou roteador → monta prompt (contrato `agent-runtime.md`) → stream → laço de ferramentas (≤ 3 iterações) → grava resposta + `ai_usage_events` → `done`.

## Propostas e orientações compartilhadas

### `POST /api/agents/guidance/:id/accept` · `POST /api/agents/guidance/:id/reject`
`200 SharedGuidance`. Aceitar recomendação que conflita com restrição de segurança ativa → `200` com `conflict: { guidanceId, text }` (ambas ativas; a restrição prevalece). `409` se o status não for `pendente`.

### `DELETE /api/agents/guidance/:id`
Restrição/recomendação `ativa` → `removida`. `204`.

### `POST /api/workout/proposals/:id/accept` · `POST /api/workout/proposals/:id/reject`
Aceitar: aplica `after` nas `session_indexes` do mesociclo. `200 { mesocycle }`. `409 { code: "obsolete" }` se as sessões mudaram desde a proposta. `409` se não `pendente`.

### `POST /api/workout/adjust`
Ajuste em linguagem natural fora do chat (ex.: card "Ajustar treino de hoje"). Body `{ "request": string (1–500) }`. `200 { proposal: WorkoutAdjustmentProposal }`. Teto → `409 budget-exceeded`. Validação falha 2× → `422 { code: "constraints-unsatisfiable", violations }`.

## Relatos de conversa

### `PATCH /api/agents/facts/:id` — body `{ "text": string }` → `200 ConversationFact`
### `DELETE /api/agents/facts/:id` — remoção lógica → `204`

## Edição manual de sessão

### `GET /api/workout/sessions/:index/exercises/:exerciseIndex/alternatives`
`200 { alternatives: Array<{ exerciseId, name, equipment, violatesSafety: boolean, reason?: string }> }` — mesmo `muscleGroup` e `pattern` (ou só `muscleGroup` se vazio), equipamento disponível, sem `exercises_to_avoid`. Determinístico, sem IA.

### `PATCH /api/workout/sessions/:index/exercises/:exerciseIndex`
Body `{ "exerciseId"?: string, "sets"?: number, "reps"?: string, "load"?: string, "confirmSafetyOverride"?: boolean }`.
- Sessão concluída → `409 { code: "session-completed" }`.
- Viola restrição de segurança ativa e sem `confirmSafetyOverride` → `409 { code: "safety-warning", reasons: string[] }` (a UI mostra e reenviar com `true` salva).
- `200 { session }` + grava `session_edits`.

## Mesociclo (alteração em rota existente)

`GET /api/workout/latest-plan` e a geração em segundo plano passam a usar o Perfil Integrado e devolvem também `rationaleDecisions: PlanDecision[]` e `sourcesUsed`. Geração bloqueada pelo teto → o mesociclo atual continua; a próxima tentativa ocorre no próximo acesso após liberação. Contrato de resposta existente preservado (campos novos opcionais).

## Teto de IA

### `PUT /api/agents/budget` — body `{ "monthlyCapUsd": number (≥ 1) }` → `200 { capUsd, spentUsd, pct }`
