create table user_training_profile (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  goal             text,
  level            text check (level in ('iniciante', 'intermediario', 'avancado')),
  training_time    text,
  time_off         text,
  current_injury   text,
  updated_at       timestamptz not null default now()
);

alter table user_training_profile enable row level security;

create policy "users manage own training profile" on user_training_profile
  for all using (auth.uid() = user_id);

create table daily_tiredness_signals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),
  constraint daily_tiredness_signals_user_date_unique unique (user_id, date)
);

alter table daily_tiredness_signals enable row level security;

create policy "users manage own tiredness signals" on daily_tiredness_signals
  for all using (auth.uid() = user_id);

create index daily_tiredness_signals_user_date_idx on daily_tiredness_signals (user_id, date desc);
