-- Spec 024 F5 (data-model.md): análise do ciclo concluído, ligada ao próximo mesociclo. Aditiva.

create table cycle_analyses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  mesocycle_id      uuid not null unique references mesocycle_plans(id) on delete cascade,
  summary           jsonb not null,
  next_mesocycle_id uuid references mesocycle_plans(id) on delete set null,
  created_at        timestamptz not null default now()
);

alter table cycle_analyses enable row level security;
create policy "users manage own cycle analyses" on cycle_analyses
  for all using (auth.uid() = user_id);
