CREATE TABLE IF NOT EXISTS public.health_samples (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_samples ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating to avoid errors in repeated runs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'health_samples' 
        AND policyname = 'Users can manage their own health data'
    ) THEN
        CREATE POLICY "Users can manage their own health data" 
        ON public.health_samples FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_health_samples_user_type_time ON public.health_samples (user_id, type, start_at DESC);
