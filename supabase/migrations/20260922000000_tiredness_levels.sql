-- Spec 011: cansaço percebido com níveis (ótimo/normal/cansado/exausto).
-- Linhas legadas (sinal binário "muito cansado" da spec 008) viram 'exausto'.
alter table daily_tiredness_signals
  add column level text not null default 'exausto'
    check (level in ('otimo', 'normal', 'cansado', 'exausto'));

alter table daily_tiredness_signals
  alter column level drop default;

alter table daily_tiredness_signals
  add column override_automatic boolean not null default false;

alter table daily_tiredness_signals
  add column updated_at timestamptz not null default now();
