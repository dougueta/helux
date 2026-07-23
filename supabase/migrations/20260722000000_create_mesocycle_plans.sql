CREATE TABLE IF NOT EXISTS mesocycle_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at    TIMESTAMPTZ NOT NULL,
  days_per_week   INTEGER NOT NULL,
  split_type      TEXT NOT NULL DEFAULT '',
  sessions        JSONB NOT NULL DEFAULT '[]'::jsonb,
  rationale       TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mesocycle_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mesocycle plans"
  ON mesocycle_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mesocycle_plans_user_created
  ON mesocycle_plans (user_id, created_at DESC);
