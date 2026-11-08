-- Spec 029: check-in de peso e medidas.
-- Pesagens diárias numa tabela própria; body_checkins vira o registro de medidas
-- datado (sem "mês"), com membros dos dois lados e % de gordura por origem.

begin;

-- 1. Pesagens: uma por usuário por dia.
create table body_weights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  weight_kg  numeric(5,2) not null check (weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_weights_user_date_unique unique (user_id, date)
);

alter table body_weights enable row level security;

create policy "users manage own weights" on body_weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index body_weights_user_date_idx on body_weights (user_id, date desc);

-- 2. Pesos dos check-ins mensais viram pesagens na data em que foram registrados.
insert into body_weights (user_id, date, weight_kg, created_at, updated_at)
select user_id, (created_at at time zone 'America/Sao_Paulo')::date, weight_kg, created_at, created_at
from body_checkins
where weight_kg is not null
on conflict (user_id, date) do nothing;

-- 3. Data do registro de medidas.
alter table body_checkins add column measured_on date;
update body_checkins set measured_on = (created_at at time zone 'America/Sao_Paulo')::date;
alter table body_checkins alter column measured_on set not null;

-- 4. Membros dos dois lados, novas medidas e % de gordura por origem.
alter table body_checkins rename column arm_cm to arm_right_cm;
alter table body_checkins rename column leg_cm to leg_right_cm;
alter table body_checkins rename column body_fat_pct to body_fat_device_pct;

alter table body_checkins
  add column shoulders_cm           numeric(5,1) check (shoulders_cm between 60 and 200),
  add column chest_cm               numeric(5,1) check (chest_cm between 50 and 200),
  add column arm_left_cm            numeric(5,1) check (arm_left_cm between 10 and 100),
  add column leg_left_cm            numeric(5,1) check (leg_left_cm between 10 and 150),
  add column calf_left_cm           numeric(5,1) check (calf_left_cm between 15 and 80),
  add column calf_right_cm          numeric(5,1) check (calf_right_cm between 15 and 80),
  add column body_fat_navy_pct      numeric(4,1) check (body_fat_navy_pct between 3 and 60),
  add column body_fat_device_source text check (body_fat_device_source in ('bioimpedancia', 'adipometro', 'dexa', 'outro')),
  add column updated_at             timestamptz not null default now();

update body_checkins set body_fat_device_source = 'outro' where body_fat_device_pct is not null;

alter table body_checkins
  add constraint body_checkins_device_source_required
  check (body_fat_device_pct is null or body_fat_device_source is not null);

-- 5. % pela fita (Marinha) dos registros antigos, com o perfil atual
--    (mesma fórmula de packages/nutrition/src/biometrics.ts).
with navy as (
  select c.id,
    case
      when p.sex = 'masculino' and c.waist_cm > c.neck_cm then
        495 / (1.0324 - 0.19077 * log(c.waist_cm - c.neck_cm) + 0.15456 * log(p.height_cm)) - 450
      when p.sex = 'feminino' and c.hip_cm is not null and c.waist_cm + c.hip_cm > c.neck_cm then
        495 / (1.29579 - 0.35004 * log(c.waist_cm + c.hip_cm - c.neck_cm) + 0.221 * log(p.height_cm)) - 450
    end as pct
  from body_checkins c
  join user_training_profile p on p.user_id = c.user_id
  where c.waist_cm is not null and c.neck_cm is not null and p.height_cm is not null and p.sex is not null
)
update body_checkins c
set body_fat_navy_pct = round(navy.pct::numeric, 1)
from navy
where navy.id = c.id and navy.pct between 3 and 60;

-- 6. Check-ins que só tinham peso não viram registro de medidas
--    (exceto os ligados a fases/calibrações de dieta).
delete from body_checkins c
where c.neck_cm is null and c.waist_cm is null and c.hip_cm is null
  and c.arm_right_cm is null and c.leg_right_cm is null
  and c.body_fat_device_pct is null and c.body_fat_navy_pct is null
  and c.squat_kg is null and c.bench_kg is null and c.deadlift_kg is null
  and (c.notes is null or btrim(c.notes) = '')
  and not exists (select 1 from diet_phases d where d.start_checkin_id = c.id)
  and not exists (select 1 from diet_phase_calibrations k where k.checkin_id = c.id);

-- 7. Sai o "mês" e o peso.
alter table body_checkins drop constraint body_checkins_user_month_unique;
drop index if exists body_checkins_user_month_idx;
alter table body_checkins drop column month;
alter table body_checkins drop column weight_kg;

create index body_checkins_user_measured_idx on body_checkins (user_id, measured_on desc, created_at desc);

commit;
