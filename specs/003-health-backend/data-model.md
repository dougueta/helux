# Modelo de Dados: Health Ingestion

## Entidades Principais

### HealthSample
Representa uma única amostra de dado biométrico capturada.

```typescript
interface HealthSample {
  id: string; // UUID v4 (HealthKit sampleUUID)
  userId: string; // UUID v4
  type: HealthMetricType;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  metadata: Record<string, any>;
  createdAt: Date;
}

enum HealthMetricType {
  HEART_RATE = 'heart_rate',
  STEP_COUNT = 'step_count',
  HRV = 'hrv',
  SLEEP_STAGE = 'sleep_stage',
  VO2_MAX = 'vo2_max',
  ACTIVE_ENERGY = 'active_energy',
  BLOOD_OXYGEN = 'blood_oxygen',
  RESPIRATORY_RATE = 'respiratory_rate'
}
```

## SQL Schema (Supabase)

```sql
-- Habilitar extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de amostras
CREATE TABLE public.health_samples (
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

-- Habilitar RLS
ALTER TABLE public.health_samples ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ler seus próprios dados
CREATE POLICY "Users can view their own health data" 
ON public.health_samples FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir seus próprios dados
CREATE POLICY "Users can insert their own health data" 
ON public.health_samples FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Índices para performance em séries temporais
CREATE INDEX idx_health_samples_user_type_time ON public.health_samples (user_id, type, start_at DESC);
```
