-- Spec 024 F3 (data-model.md, R7): mesociclo semanal. Aditiva; planos antigos ficam 'rotacao'.

alter table mesocycle_plans
  add column format text not null default 'rotacao' check (format in ('rotacao', 'semanal')),
  add column weeks smallint check (weeks between 1 and 8),
  add column method jsonb,
  add column goal_primary text check (goal_primary in ('condicionamento', 'hipertrofia', 'forca', 'emagrecimento', 'corrida'));
