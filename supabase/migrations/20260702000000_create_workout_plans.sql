CREATE TABLE IF NOT EXISTS workout_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at  TIMESTAMPTZ NOT NULL,
  exercises     JSONB NOT NULL DEFAULT '[]'::jsonb,
  rationale     TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plans"
  ON workout_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_created
  ON workout_plans (user_id, created_at DESC);
