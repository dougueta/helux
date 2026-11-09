-- Spec 030: módulo de rotinas diárias e complementares (alongamento, abdominal e cardio).
-- Cria complementary_routine_logs e adiciona complementary_preferences em user_training_profile.

begin;

-- 1. Histórico de execuções das rotinas complementares (múltiplos registros por dia permitidos).
create table complementary_routine_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  category         text not null check (category in ('alongamento-mobilidade', 'core-abdominal', 'cardio')),
  performed_on     date not null,
  performed_at     timestamptz not null default now(),
  duration_minutes integer not null check (duration_minutes between 1 and 240),
  modality         text,
  zone             text check (zone is null or zone in ('leve', 'moderada', 'intervalado-leve')),
  effort           integer check (effort is null or effort between 1 and 10),
  items            jsonb not null default '[]'::jsonb,
  notes            text check (notes is null or char_length(notes) <= 500),
  created_at       timestamptz not null default now()
);

alter table complementary_routine_logs enable row level security;

create policy "users manage own complementary routine logs" on complementary_routine_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_complementary_routine_logs_user_date
  on complementary_routine_logs (user_id, performed_on desc, performed_at desc);

-- 2. Preferências das 3 rotinas complementares no perfil do usuário.
alter table user_training_profile
  add column if not exists complementary_preferences jsonb not null default '{}'::jsonb;

commit;
