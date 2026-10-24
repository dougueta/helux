-- Spec 024 F2 (data-model.md): objetivo estruturado, onboarding e condições de saúde. Aditiva.

alter table user_training_profile
  add column goal_primary text check (goal_primary in ('condicionamento', 'hipertrofia', 'forca', 'emagrecimento', 'corrida')),
  add column goal_secondary text check (goal_secondary in ('condicionamento', 'hipertrofia', 'forca', 'emagrecimento', 'corrida')),
  add column goal_target text check (char_length(goal_target) <= 140),
  add column cardio_likes text[] not null default '{}',
  add column cardio_avoid text[] not null default '{}',
  add column onboarding_step smallint check (onboarding_step between 0 and 10),
  add column onboarding_completed_at timestamptz,
  add constraint user_training_profile_goals_distinct check (goal_secondary is null or goal_secondary <> goal_primary),
  add constraint user_training_profile_cardio_no_overlap check (not (cardio_likes && cardio_avoid));

-- Condições de saúde e cirurgias (FR-005..009).
create table health_conditions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  catalog_key   text,
  custom_label  text check (char_length(custom_label) <= 120),
  region        text not null check (region in ('joelho', 'ombro', 'lombar', 'quadril', 'tornozelo', 'cotovelo', 'punho', 'sistemica')),
  side          text check (side in ('esquerdo', 'direito', 'ambos')),
  since         date,
  count         smallint not null default 1 check (count between 1 and 20),
  status        text not null default 'controlada' check (status in ('ativa', 'controlada', 'resolvida')),
  notes         text check (char_length(notes) <= 500),
  flare_region  text check (flare_region in ('joelho', 'ombro', 'lombar', 'quadril', 'tornozelo', 'cotovelo', 'punho', 'sistemica')),
  flare_until   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint health_conditions_label check (catalog_key is not null or custom_label is not null),
  constraint health_conditions_flare check (flare_until is null or flare_region is not null)
);

alter table health_conditions enable row level security;
create policy "users manage own health conditions" on health_conditions
  for all using (auth.uid() = user_id);
create index health_conditions_user_idx on health_conditions (user_id);

-- Regras propostas para a condição "outra" ficam nas orientações compartilhadas da 022.
alter table shared_guidance add column condition_id uuid references health_conditions(id) on delete cascade;

-- Uso de IA: a proposta de regras para condição "outra" tem operação própria.
alter table ai_usage_events drop constraint ai_usage_events_operation_check;
alter table ai_usage_events add constraint ai_usage_events_operation_check
  check (operation in ('chat', 'roteamento', 'mesociclo', 'ajuste-sessao', 'adaptacao-restricao', 'conflito', 'condicao'));
