# Data Model: Time de Agentes Especialistas de IA (022)

Migration nova: `supabase/migrations/2026MMDDHHMMSS_specialist_agents.sql` (aditiva). Todas as tabelas têm `user_id uuid not null references auth.users(id) on delete cascade`, RLS ligada e policy `auth.uid() = user_id` (padrão do projeto). Tipos TypeScript em `packages/types/src/agents.ts`.

## Enums (texto com `check`)

| Nome | Valores |
|---|---|
| `AgentKey` | `treino`, `medicina`, `nutricao` |
| `Channel` | `equipe`, `treino`, `medicina`, `nutricao` |
| `SourceKey` | `perfil`, `preferencias`, `historico`, `mesociclo`, `cansaco`, `checkins`, `genetica`, `exames`, `nutricao`, `relatos`, `restricoes`, `edicoes` |
| `SourceStatus` | `ativa`, `vazia`, `desativada` |
| `Equipment` | `barra`, `halteres`, `maquina-cabo`, `peso-corporal` (mesmo do banco de exercícios) |
| `Location` | `academia`, `casa`, `ao-ar-livre`, `hotel` |
| `TrainingStyle` | `hipertrofia-classica`, `forca`, `funcional`, `circuito`, `misto` |
| `GuidanceKind` | `restricao-seguranca`, `recomendacao` |
| `GuidanceStatus` | `pendente`, `ativa`, `recusada`, `expirada`, `removida` |
| `FactCategory` | `sintoma`, `preferencia`, `decisao` |
| `ProposalStatus` | `pendente`, `aceita`, `recusada`, `obsoleta` |
| `ProposalKind` | `ajuste-sessao`, `adaptacao-restricao` |

## Tabelas

### `training_preferences` (1 por usuário) — FR-005, R8

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid unique | |
| `available_days` | smallint[] | 0–6 (dom–sáb), 1 a 7 itens, sem repetição |
| `max_session_minutes` | smallint null | 15–180 |
| `location` | text null | `Location` |
| `available_equipment` | text[] | subconjunto de `Equipment`; vazio = sem restrição (todos) |
| `favorite_exercises` | text[] | ids do banco de exercícios |
| `exercises_to_avoid` | text[] | ids do banco; interseção com `favorite_exercises` proibida |
| `priority_muscle_groups` | text[] | grupos do banco (`muscleGroup`) |
| `training_style` | text null | `TrainingStyle` |
| `free_instructions` | text null | ≤ 1000 caracteres |
| `updated_at` | timestamptz | |

**Rígidas** (disparam proposta de adaptação, FR-011): `available_equipment`, `exercises_to_avoid`, `max_session_minutes`. **Suaves**: as demais.

### `training_preferences_history` — FR-011

`id`, `user_id`, `changed_at`, `previous` jsonb, `next` jsonb, `hard_change` boolean. Gravado a cada salvamento; serve para justificar "vale a partir do próximo mesociclo" e para o snapshot.

### `agent_source_settings` — FR-003

| Coluna | Tipo | Regra |
|---|---|---|
| `user_id` | uuid | pk composta com `source` |
| `source` | text | `SourceKey` |
| `enabled` | boolean | default `true` |
| `updated_at` | timestamptz | |

Ausência de linha = fonte ativa.

### `agent_conversations` — FR-022, FR-023

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `channel` | text | `Channel` |
| `started_at` | timestamptz | |
| `archived_at` | timestamptz null | "nova conversa" arquiva a atual do canal |

Índice único parcial: uma conversa não arquivada por `(user_id, channel)`.

### `agent_messages`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `conversation_id` | uuid fk | |
| `user_id` | uuid | |
| `role` | text | `user` \| `agent` |
| `agent` | text null | `AgentKey` (obrigatório quando `role = agent`) |
| `content` | text | texto visível |
| `sources_used` | jsonb null | `{ ativa: SourceKey[], vazia: SourceKey[], desativada: SourceKey[] }` — FR-004 |
| `api_content` | jsonb null | blocos completos do assistente (incl. `tool_use`/`tool_result`/thinking) para replay fiel do histórico |
| `created_at` | timestamptz | |

Índice `(conversation_id, created_at)`. A resposta do agente só é gravada após `finalMessage()` sem erro/refusal.

### `conversation_facts` (Relato de Conversa) — FR-020a

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `category` | text | `FactCategory` |
| `text` | text | 3–280 caracteres; editável pelo usuário |
| `origin_agent` | text | `AgentKey` |
| `message_id` | uuid fk null | mensagem que originou |
| `created_at`, `updated_at` | timestamptz | |
| `deleted_at` | timestamptz null | remoção lógica; removidos nunca entram no snapshot |

### `shared_guidance` (Restrição/Recomendação Compartilhada) — FR-018/019/021, R9

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `kind` | text | `GuidanceKind` |
| `text` | text | ≤ 280 |
| `reason` | text | ≤ 500 |
| `origin_agent` | text | `AgentKey` |
| `status` | text | `GuidanceStatus` |
| `starts_at` | timestamptz null | preenchido no aceite |
| `expires_at` | timestamptz null | opcional; > `starts_at` |
| `blocked_patterns` | text[] | padrões do banco (`agachar`, `empurrar-vertical`…) bloqueados no treino |
| `blocked_exercises` | text[] | ids do banco bloqueados |
| `message_id` | uuid fk null | |
| `created_at`, `updated_at` | timestamptz | |

**Transições**: `pendente → ativa` (aceite) | `pendente → recusada`; `ativa → removida` (usuário) | `ativa → expirada` (leitura com `expires_at < now()`). Só `ativa` entra no snapshot e no validador. `pendente` com mais de 7 dias → tratada como `recusada`.

### `workout_adjustment_proposals` (Proposta de Ajuste de Treino) — FR-009, FR-011

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `mesocycle_id` | uuid fk | |
| `kind` | text | `ProposalKind` |
| `session_indexes` | smallint[] | sessões pendentes afetadas |
| `before` | jsonb | sessões atuais (snapshot) |
| `after` | jsonb | sessões propostas (validadas, R7) |
| `changes` | jsonb | resumo por exercício (formato da 011: séries/carga/exercício antes → depois) |
| `reason` | text | |
| `status` | text | `ProposalStatus` |
| `message_id` | uuid fk null | |
| `created_at`, `resolved_at` | timestamptz | |

**Regras**: no aceite, se `before` ≠ estado atual das sessões (mudou depois da proposta) → `obsoleta`, nada aplicado. Aceitar substitui as sessões de `session_indexes` no `mesocycle_plans.sessions`. Sessões concluídas nunca entram em `session_indexes`.

### `session_edits` (Edição Manual de Sessão) — FR-009a/b

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `mesocycle_id` | uuid fk | |
| `session_index` | smallint | sessão pendente |
| `exercise_index` | smallint | |
| `kind` | text | `troca-exercicio` \| `series-reps-carga` |
| `before` | jsonb | `{ exerciseId?, sets?, reps?, load? }` |
| `after` | jsonb | idem |
| `safety_override` | boolean | usuário confirmou apesar de aviso de restrição |
| `created_at` | timestamptz | |

### `ai_usage_events` — FR-025/026, R11

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `agent` | text null | `AgentKey` ou null (roteador/conflito) |
| `operation` | text | `chat` \| `roteamento` \| `mesociclo` \| `ajuste-sessao` \| `adaptacao-restricao` \| `conflito` |
| `model` | text | modelo efetivo |
| `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` | integer | do `usage` |
| `cost_usd` | numeric(10,6) | `computeCostUsd` |
| `created_at` | timestamptz | |

Índice `(user_id, created_at)`. Consumo do mês = soma de `cost_usd` no mês civil `America/Sao_Paulo`.

### `ai_budget_settings` (1 por usuário)

`user_id` pk, `monthly_cap_usd numeric(8,2)` (default 20, mínimo 1), `updated_at`.

## Objetos de domínio (sem tabela)

### `IntegratedProfile` (montado na leitura) — FR-001/002

```ts
interface IntegratedProfile {
  generatedAt: string
  sources: Record<SourceKey, {
    status: SourceStatus
    updatedAt: string | null
    stale?: boolean            // exames > 6 meses
    summary: string            // texto curto para o prompt (vazio se não ativa)
    data: unknown              // estrutura por fonte para a tela
  }>
}
```

Ordem das fontes fixa (a de `SourceKey`) e JSON com chaves ordenadas para estabilidade do cache (R6).

### `HardConstraints` (entrada do validador, R7)

`{ availableEquipment: Equipment[], exercisesToAvoid: string[], maxSessionMinutes: number | null, blockedPatterns: string[], blockedExercises: string[] }` — união das preferências rígidas com as restrições de segurança ativas.

### `PlanDecision` (justificativa por decisão, FR-008)

`{ topic: 'divisao' | 'volume' | 'exercicio' | 'descanso' | 'intensidade' | 'outro', choice: string, sources: SourceKey[], reason: string }` — gravado em `mesocycle_plans.rationale_decisions jsonb` (coluna nova, nullable; `rationale` texto continua).

## Alterações em tabelas existentes

| Tabela | Mudança |
|---|---|
| `mesocycle_plans` | + `rationale_decisions jsonb null`; + `sources_used jsonb null` |
| `nutrition_chat_messages` (018) | não usada pela 022; ver research R0 |
