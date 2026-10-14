# Contrato: Runtime dos Agentes em `@helux/ai` (022)

Superfície pública nova de `@helux/ai` (consumida só por `apps/api`). Testes mockam `@anthropic-ai/sdk` (padrão do projeto); nenhuma chamada real nos testes unitários.

## Exports

```ts
// especialistas
export function streamAgentReply(args: {
  agent: AgentKey
  profile: IntegratedProfile          // snapshot já filtrado por fontes ativas
  dayContext: DayContext              // data, treino do dia, cansaço, avisos (expirações, conflitos)
  history: Anthropic.MessageParam[]   // últimas 20 mensagens (api_content quando houver)
  userMessage: string
  tools: AgentToolHandlers            // implementações fornecidas pela API (persistência)
  onEvent: (e: AgentStreamEvent) => void   // delta | fact | proposal | handoff
}): Promise<{ text: string; apiContent: unknown[]; usages: UsageRecord[] }>

export function routeMessage(args: { message: string; recent: RecentTurn[] }):
  Promise<{ agent: AgentKey; reason: string; usage: UsageRecord }>
export function matchesMedicalRedFlag(message: string): boolean   // puro

// treino
export function generateMesocyclePlan(input: { profile: IntegratedProfile; constraints: HardConstraints; daysPerWeek: number }):
  Promise<{ plan: Omit<MesocyclePlan, 'id'>; decisions: PlanDecision[]; usages: UsageRecord[] }>   // inclui validação + 1 retry
export function proposeSessionAdjustment(input: { profile: IntegratedProfile; constraints: HardConstraints; sessions: MesocycleSession[]; sessionIndexes: number[]; request: string }):
  Promise<{ after: MesocycleSession[]; changes: SessionChange[]; reason: string; usages: UsageRecord[] }>
export function validatePlanAgainstConstraints(sessions: MesocycleSession[], c: HardConstraints): ConstraintViolation[]  // puro
export function estimateSessionMinutes(session: MesocycleSession): number                                            // puro
export function compatibleAlternatives(exerciseId: string, c: HardConstraints): Alternative[]                         // puro
export function preferenceSignalsFromEdits(edits: SessionEdit[], now: Date): PreferenceSignal[]                        // puro

// orientações
export function detectGuidanceConflict(args: { candidate: SharedGuidance; active: SharedGuidance[] }):
  Promise<{ conflictWith: string | null; usage: UsageRecord }>

// custo
export function computeCostUsd(u: UsageRecord): number   // puro, tabela de preços versionada
```

`UsageRecord = { model, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, cacheTtl: '5m' | '1h' | null, operation, agent | null }`.

## Pedido à Anthropic (chats)

```ts
client.beta.messages.stream({
  model: 'claude-opus-5-5',
  max_tokens: 8000,
  output_config: { effort: 'low' },
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
  tools: AGENT_TOOLS[agent],          // ordem fixa; strict: true; eager_input_streaming: true
  tool_choice: { type: 'auto' },      // forced tool_choice dá 400 no Opus 5.5
  system: [
    { type: 'text', text: PERSONA[agent],           cache_control: { type: 'ephemeral', ttl: '1h' } }, // persona + regras + escopos dos outros especialistas
    { type: 'text', text: renderProfile(profile),   cache_control: { type: 'ephemeral' } },             // snapshot ordenado
    { type: 'text', text: renderDay(dayContext) },                                                       // volátil, sem cache
  ],
  messages: [...history, { role: 'user', content: userMessage }],
})
```

- Nada de data/hora ou IDs nos blocos 1 e 2.
- Após `finalMessage()`: `refusal` → erro amigável; `max_tokens` com `tool_use` incompleto → não executa a ferramenta, encerra com o texto obtido; `tool_use` → valida inputs (schema local), executa handlers, devolve **todos** os `tool_result` numa única mensagem `user`, continua (≤ 3 iterações).
- `apiContent` (blocos completos, incluindo thinking) é gravado em `agent_messages.api_content` e reenviado sem alteração no histórico (o histórico é só acrescentado — nunca editado).

## Ferramentas (`strict: true`, `additionalProperties: false`)

### `record_conversation_fact` — todos
```json
{ "category": "sintoma" | "preferencia" | "decisao", "text": "string (3–280)" }
```
Descrição para o modelo: registre apenas fatos que o **usuário** declarou e que serão úteis aos outros especialistas (sintomas, preferências, decisões). Não registre suposições suas.

### `propose_shared_guidance` — todos
```json
{ "kind": "restricao-seguranca" | "recomendacao", "text": "string (≤280)", "reason": "string (≤500)",
  "durationDays": "integer 1–90 | null", "blockedPatterns": ["agachar" | "dobrar-quadril" | "empurrar-horizontal" | "empurrar-vertical" | "puxar-horizontal" | "puxar-vertical" | "core" | "isolamento"], "blockedExercises": ["<id do banco>"] }
```
Só o Agente de Medicina Esportiva pode usar `kind = restricao-seguranca` (o handler rejeita de outros agentes com `is_error`). `blockedExercises` com id fora do banco → `is_error`.

### `propose_session_adjustment` — só treino
```json
{ "request": "string (≤500) — o que o usuário pediu, reescrito de forma objetiva", "scope": "hoje" | "pendentes" }
```
O handler chama `proposeSessionAdjustment` (segunda chamada de IA, `effort: medium`), valida e grava a proposta pendente; o `tool_result` traz o resumo das mudanças para o agente comentar.

### `suggest_specialist` — todos
```json
{ "to": "treino" | "medicina" | "nutricao", "reason": "string (≤200)" }
```

## Roteador

`client.messages.create` com `output_config: { effort: 'low', format: { type: 'json_schema', schema: { agent, reason } } }`, `max_tokens: 1000`, sistema estável (escopos dos três especialistas) com cache. Pulado quando `matchesMedicalRedFlag` → `medicina`.

## Mesociclo

`client.beta.messages.stream(...).finalMessage()` com `effort: 'medium'`, `max_tokens: 32000`, `output_config.format` = JSON schema do mesociclo (`daysPerWeek`, `splitType`, `sessions[].{letter, focus, exercises[]}`, `rationale`, `decisions[]`), exercícios restritos ao banco por `enum` de nomes. Depois: `validatePlanAgainstConstraints` → violação → 1 retry com as violações no bloco do dia → violação de novo → erro `constraints-unsatisfiable`.
