-- Spec 024 F1 (data-model.md): laudo genético por usuário e estado da geração do mesociclo. Aditiva.

-- Laudo genético (R14): sai do repositório e passa a viver por usuário, com RLS.
create table genetic_reports (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  source      text not null default 'genera' check (source in ('genera')),
  raw         jsonb not null,
  uploaded_at timestamptz not null default now()
);

alter table genetic_reports enable row level security;
create policy "users manage own genetic report" on genetic_reports
  for all using (auth.uid() = user_id);

-- Estado da geração do mesociclo (R13, FR-031): uma linha por usuário.
create table mesocycle_generation (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  status     text not null check (status in ('gerando', 'falhou', 'ok')),
  started_at timestamptz,
  attempts   smallint not null default 0 check (attempts between 0 and 10),
  error_code text check (error_code in ('constraints-unsatisfiable', 'incomplete-response', 'budget-exceeded', 'refusal', 'onboarding-required', 'unknown')),
  updated_at timestamptz not null default now()
);

alter table mesocycle_generation enable row level security;
create policy "users manage own mesocycle generation" on mesocycle_generation
  for all using (auth.uid() = user_id);
