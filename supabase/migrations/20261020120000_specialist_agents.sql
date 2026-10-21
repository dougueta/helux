-- Spec 022: time de agentes especialistas (data-model.md). Migration aditiva.

-- Preferências de treino (FR-005, R8): uma linha por usuário.
create table training_preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users(id) on delete cascade,
  available_days         smallint[] not null default '{}' check (available_days <@ array[0,1,2,3,4,5,6]::smallint[] and cardinality(available_days) <= 7),
  max_session_minutes    smallint check (max_session_minutes between 15 and 180),
  location               text check (location in ('academia', 'casa', 'ao-ar-livre', 'hotel')),
  available_equipment    text[] not null default '{}' check (available_equipment <@ array['barra','halteres','maquina-cabo','peso-corporal']::text[]),
  favorite_exercises     text[] not null default '{}',
  exercises_to_avoid     text[] not null default '{}',
  priority_muscle_groups text[] not null default '{}',
  training_style         text check (training_style in ('hipertrofia-classica', 'forca', 'funcional', 'circuito', 'misto')),
  free_instructions      text check (char_length(free_instructions) <= 1000),
  updated_at             timestamptz not null default now(),
  constraint training_preferences_no_overlap check (not (favorite_exercises && exercises_to_avoid))
);

alter table training_preferences enable row level security;
create policy "users manage own training preferences" on training_preferences
  for all using (auth.uid() = user_id);

-- Histórico das preferências (FR-011).
create table training_preferences_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  changed_at  timestamptz not null default now(),
  previous    jsonb,
  next        jsonb not null,
  hard_change boolean not null default false
);

alter table training_preferences_history enable row level security;
create policy "users manage own training preferences history" on training_preferences_history
  for all using (auth.uid() = user_id);

-- Liga/desliga de fontes do Perfil Integrado (FR-003). Sem linha = fonte ativa.
create table agent_source_settings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     text not null check (source in ('perfil','preferencias','historico','mesociclo','cansaco','checkins','genetica','exames','nutricao','relatos','restricoes','edicoes')),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, source)
);

alter table agent_source_settings enable row level security;
create policy "users manage own agent source settings" on agent_source_settings
  for all using (auth.uid() = user_id);

-- Conversas (FR-022/023): uma conversa aberta por canal.
create table agent_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  channel     text not null check (channel in ('equipe', 'treino', 'medicina', 'nutricao')),
  started_at  timestamptz not null default now(),
  archived_at timestamptz
);

alter table agent_conversations enable row level security;
create policy "users manage own agent conversations" on agent_conversations
  for all using (auth.uid() = user_id);
create unique index agent_conversations_open_channel_idx on agent_conversations (user_id, channel) where archived_at is null;

create table agent_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'agent')),
  agent           text check (agent in ('treino', 'medicina', 'nutricao')),
  content         text not null,
  sources_used    jsonb,
  api_content     jsonb,
  created_at      timestamptz not null default now(),
  constraint agent_messages_agent_required check (role = 'user' or agent is not null)
);

alter table agent_messages enable row level security;
create policy "users manage own agent messages" on agent_messages
  for all using (auth.uid() = user_id);
create index agent_messages_conversation_idx on agent_messages (conversation_id, created_at);

-- Relatos de conversa (FR-020a).
create table conversation_facts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null check (category in ('sintoma', 'preferencia', 'decisao')),
  text         text not null check (char_length(text) between 3 and 280),
  origin_agent text not null check (origin_agent in ('treino', 'medicina', 'nutricao')),
  message_id   uuid references agent_messages(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table conversation_facts enable row level security;
create policy "users manage own conversation facts" on conversation_facts
  for all using (auth.uid() = user_id);

-- Restrições/recomendações compartilhadas (FR-018/019/021, R9).
create table shared_guidance (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('restricao-seguranca', 'recomendacao')),
  text              text not null check (char_length(text) between 1 and 280),
  reason            text not null check (char_length(reason) <= 500),
  origin_agent      text not null check (origin_agent in ('treino', 'medicina', 'nutricao')),
  status            text not null default 'pendente' check (status in ('pendente', 'ativa', 'recusada', 'expirada', 'removida')),
  starts_at         timestamptz,
  expires_at        timestamptz,
  duration_days     smallint check (duration_days between 1 and 90),
  blocked_patterns  text[] not null default '{}',
  blocked_exercises text[] not null default '{}',
  message_id        uuid references agent_messages(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint shared_guidance_expiry check (expires_at is null or starts_at is null or expires_at > starts_at)
);

alter table shared_guidance enable row level security;
create policy "users manage own shared guidance" on shared_guidance
  for all using (auth.uid() = user_id);

-- Propostas de ajuste de treino (FR-009, FR-011).
create table workout_adjustment_proposals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  mesocycle_id    uuid not null references mesocycle_plans(id) on delete cascade,
  kind            text not null check (kind in ('ajuste-sessao', 'adaptacao-restricao')),
  session_indexes smallint[] not null,
  before          jsonb not null,
  after           jsonb not null,
  changes         jsonb not null default '[]'::jsonb,
  reason          text not null default '',
  status          text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada', 'obsoleta')),
  message_id      uuid references agent_messages(id) on delete set null,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

alter table workout_adjustment_proposals enable row level security;
create policy "users manage own workout adjustment proposals" on workout_adjustment_proposals
  for all using (auth.uid() = user_id);

-- Edições manuais de sessão (FR-009a/b).
create table session_edits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  mesocycle_id    uuid not null references mesocycle_plans(id) on delete cascade,
  session_index   smallint not null,
  exercise_index  smallint not null,
  kind            text not null check (kind in ('troca-exercicio', 'series-reps-carga')),
  before          jsonb not null,
  after           jsonb not null,
  safety_override boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table session_edits enable row level security;
create policy "users manage own session edits" on session_edits
  for all using (auth.uid() = user_id);

-- Uso e teto de IA (FR-025/026, R11).
create table ai_usage_events (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  agent                       text check (agent in ('treino', 'medicina', 'nutricao')),
  operation                   text not null check (operation in ('chat', 'roteamento', 'mesociclo', 'ajuste-sessao', 'adaptacao-restricao', 'conflito')),
  model                       text not null,
  input_tokens                integer not null default 0,
  output_tokens               integer not null default 0,
  cache_creation_input_tokens integer not null default 0,
  cache_read_input_tokens     integer not null default 0,
  cost_usd                    numeric(10,6) not null,
  created_at                  timestamptz not null default now()
);

alter table ai_usage_events enable row level security;
create policy "users manage own ai usage events" on ai_usage_events
  for all using (auth.uid() = user_id);
create index ai_usage_events_user_created_idx on ai_usage_events (user_id, created_at);

create table ai_budget_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  monthly_cap_usd numeric(8,2) not null default 20 check (monthly_cap_usd >= 1),
  updated_at      timestamptz not null default now()
);

alter table ai_budget_settings enable row level security;
create policy "users manage own ai budget settings" on ai_budget_settings
  for all using (auth.uid() = user_id);

-- Justificativa por decisão e fontes usadas no mesociclo (FR-004, FR-008).
alter table mesocycle_plans add column rationale_decisions jsonb;
alter table mesocycle_plans add column sources_used jsonb;
