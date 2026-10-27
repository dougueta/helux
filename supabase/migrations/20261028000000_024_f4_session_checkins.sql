-- Spec 024 F4 (data-model.md): sensações antes/depois do treino e revisão de sessões suspeitas. Aditiva.

create table session_checkins (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null,
  phase              text not null check (phase in ('antes', 'depois')),
  workout_session_id uuid references workout_sessions(id) on delete set null,
  mesocycle_id       uuid references mesocycle_plans(id) on delete set null,
  session_index      smallint,
  energy             smallint check (energy between 1 and 5),
  sleep              smallint check (sleep between 1 and 5),
  motivation         smallint check (motivation between 1 and 5),
  rpe                smallint check (rpe between 1 and 10),
  feeling            smallint check (feeling between 1 and 5),
  pains              jsonb not null default '[]'::jsonb,
  note               text check (char_length(note) <= 280),
  created_at         timestamptz not null default now()
);

alter table session_checkins enable row level security;
create policy "users manage own session checkins" on session_checkins
  for all using (auth.uid() = user_id);
create unique index session_checkins_unique_idx on session_checkins (user_id, date, phase, coalesce(session_index, -1));

alter table workout_sessions add column review_status text check (review_status in ('confirmada'));
