create table body_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  month        date not null,
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm     numeric(5,1),
  hip_cm       numeric(5,1),
  arm_cm       numeric(5,1),
  leg_cm       numeric(5,1),
  squat_kg     numeric(6,2),
  bench_kg     numeric(6,2),
  deadlift_kg  numeric(6,2),
  notes        text,
  created_at   timestamptz not null default now(),
  constraint body_checkins_user_month_unique unique (user_id, month)
);

alter table body_checkins enable row level security;

create policy "users manage own checkins" on body_checkins
  for all using (auth.uid() = user_id);

create index body_checkins_user_month_idx on body_checkins (user_id, month desc);
