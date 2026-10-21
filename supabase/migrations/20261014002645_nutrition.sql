-- Spec 018: módulo de nutrição esportiva genética.
-- Aditiva: colunas opcionais em tabelas existentes + 4 tabelas novas com RLS.

-- Dados fixos do perfil para a TMB (Mifflin-St Jeor) e o % de gordura (Marinha).
alter table user_training_profile
  add column height_cm  numeric(5,1) check (height_cm between 120 and 230),
  add column birth_date date,
  add column sex        text check (sex in ('masculino', 'feminino'));

-- Pescoço para o % de gordura pela fita métrica (método da Marinha).
alter table body_checkins
  add column neck_cm numeric(4,1) check (neck_cm between 20 and 70);

-- Fase de dieta: objetivo, duração e metas-base (recalibradas a cada check-in).
create table diet_phases (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  goal             text not null check (goal in ('perder_gordura', 'ganhar_massa', 'recomposicao', 'manutencao')),
  started_on       date not null,
  duration_weeks   int  not null check (duration_weeks between 4 and 52),
  status           text not null default 'ativa' check (status in ('ativa', 'encerrada')),
  base_targets     jsonb not null,
  start_checkin_id uuid references body_checkins(id) on delete set null,
  created_at       timestamptz not null default now(),
  ended_at         timestamptz
);

alter table diet_phases enable row level security;

create policy "users manage own diet phases" on diet_phases
  for all using (auth.uid() = user_id);

-- No máximo uma fase ativa por usuário.
create unique index diet_phases_one_active_per_user on diet_phases (user_id) where status = 'ativa';
create index diet_phases_user_created_idx on diet_phases (user_id, created_at desc);

-- Histórico de recalibrações da fase.
create table diet_phase_calibrations (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references diet_phases(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  checkin_id  uuid references body_checkins(id) on delete set null,
  action      text not null check (action in ('inicial', 'aumentar', 'manter', 'reduzir', 'intervalo-curto')),
  before      jsonb,
  after       jsonb not null,
  reason      text not null,
  metrics     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table diet_phase_calibrations enable row level security;

create policy "users manage own diet phase calibrations" on diet_phase_calibrations
  for all using (auth.uid() = user_id);

create index diet_phase_calibrations_phase_idx on diet_phase_calibrations (phase_id, created_at desc);

-- Plano do dia (última versão calculada) — histórico por data.
create table daily_nutrition_plans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null,
  phase_id           uuid references diet_phases(id) on delete set null,
  day_type           text not null check (day_type in ('treino', 'descanso')),
  day_type_override  text check (day_type_override in ('descanso')),
  tiredness_level    text check (tiredness_level in ('otimo', 'normal', 'cansado', 'exausto')),
  plan               jsonb not null,
  swaps              jsonb not null default '[]'::jsonb,
  status             text not null default 'ativo' check (status in ('ativo', 'treino-nao-realizado', 'concluido')),
  updated_at         timestamptz not null default now(),
  constraint daily_nutrition_plans_user_date_unique unique (user_id, date)
);

alter table daily_nutrition_plans enable row level security;

create policy "users manage own daily nutrition plans" on daily_nutrition_plans
  for all using (auth.uid() = user_id);

create index daily_nutrition_plans_user_date_idx on daily_nutrition_plans (user_id, date desc);

-- Conversa com o agente nutricionista: uma por fase de dieta.
create table nutrition_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  phase_id    uuid not null references diet_phases(id) on delete cascade,
  role        text not null check (role in ('user', 'agent')),
  kind        text not null default 'chat' check (kind in ('chat', 'nota-recuperacao')),
  content     text not null check (char_length(content) between 1 and 4000),
  day         date not null,
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table nutrition_chat_messages enable row level security;

create policy "users manage own nutrition chat messages" on nutrition_chat_messages
  for all using (auth.uid() = user_id);

create index nutrition_chat_messages_phase_idx on nutrition_chat_messages (user_id, phase_id, created_at);
