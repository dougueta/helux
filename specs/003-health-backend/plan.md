# Plano de Implementação: Backend de Coleta HealthKit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um backend robusto para receber e persistir amostras de saúde (batimentos, passos, etc) do Apple Watch via Supabase.

**Architecture:** Arquitetura monorepo com um novo package `@helux/health` para lógica de domínio e integração com a API Fastify existente. Persistência direta no Supabase com RLS.

**Tech Stack:** TypeScript, Fastify, Supabase (PostgreSQL), Zod, Vitest.

---

## Mapeamento de Arquivos

- **Novo Package:** `packages/health/`
  - `src/index.ts`: Exportações públicas.
  - `src/types.ts`: Definições Zod e interfaces.
  - `src/sync.service.ts`: Lógica de processamento e inserção.
- **API:** `apps/api/`
  - `src/routes/health-sync.ts`: Novo endpoint de sincronização.
  - `src/app.ts`: Registro da nova rota.
- **Database:** `supabase/migrations/` (ou execução direta via CLI/MCP)
  - `20260615_create_health_samples.sql`: Schema da tabela e RLS.

---

### Tarefa 1: Setup do Package `@helux/health`

**Files:**
- Create: `packages/health/package.json`
- Create: `packages/health/tsconfig.json`
- Create: `packages/health/vitest.config.ts`

- [ ] **Passo 1: Criar o package.json**
```json
{
  "name": "@helux/health",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@helux/types": "workspace:*",
    "@supabase/supabase-js": "^2.49.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "vitest": "^3.2.6",
    "typescript": "*"
  }
}
```

- [ ] **Passo 2: Configurar o TS e Vitest**
- Criar arquivos baseados nos padrões de `packages/workouts`.

- [ ] **Passo 3: Commit inicial do package**
```bash
git add packages/health
git commit -m "chore: setup @helux/health package"
```

---

### Tarefa 2: Schema do Banco de Dados (Supabase)

**Files:**
- Create: `supabase/migrations/20260615_create_health_samples.sql`

- [ ] **Passo 1: Definir o SQL da tabela**
```sql
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

CREATE POLICY "Users can manage their own health data" 
ON public.health_samples FOR ALL 
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_samples_user_type_time ON public.health_samples (user_id, type, start_at DESC);
```

- [ ] **Passo 2: Executar migração**
- Usar `supabase db query` ou MCP `execute_sql`.

- [ ] **Passo 3: Commit do schema**
```bash
git add supabase/migrations
git commit -m "feat: add health_samples table with RLS"
```

---

### Tarefa 3: Lógica de Sincronização (SyncService)

**Files:**
- Create: `packages/health/src/types.ts`
- Create: `packages/health/src/sync.service.ts`
- Test: `packages/health/src/__tests__/sync.service.test.ts`

- [ ] **Passo 1: Definir Schemas Zod**
```typescript
import { z } from 'zod';

export const HealthSampleSchema = z.object({
  uuid: z.string().uuid(),
  value: z.number(),
  unit: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export const HealthSyncPayloadSchema = z.object({
  heartRate: z.array(HealthSampleSchema).optional(),
  steps: z.array(HealthSampleSchema).optional(),
  hrv: z.array(HealthSampleSchema).optional(),
});
```

- [ ] **Passo 2: Escrever teste de falha para o Service**
```typescript
// sync.service.test.ts
import { describe, it, expect } from 'vitest';
import { processSync } from '../sync.service';

describe('SyncService', () => {
  it('should format samples correctly for supabase insertion', async () => {
    const payload = { heartRate: [{ uuid: '...', value: 70, unit: 'bpm', startDate: '...', endDate: '...' }] };
    const result = await processSync('user-123', payload);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('heart_rate');
  });
});
```

- [ ] **Passo 3: Implementar `processSync`**
- Implementar a lógica que mapeia o objeto aggregator para o formato de colunas da tabela `health_samples`.

- [ ] **Passo 4: Commit**
```bash
git add packages/health/src
git commit -m "feat: implement health sync service logic"
```

---

### Tarefa 4: Endpoint API (Fastify)

**Files:**
- Create: `apps/api/src/routes/health-sync.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Passo 1: Criar a rota de sync**
```typescript
import { FastifyInstance } from 'fastify';
import { HealthSyncPayloadSchema } from '@helux/health';

export async function healthSyncRoutes(app: FastifyInstance) {
  app.post('/api/health/sync', async (request, reply) => {
    const userId = request.user.id; // Assumindo auth middleware existente
    const payload = HealthSyncPayloadSchema.parse(request.body);
    // Chamar service...
    return reply.code(202).send({ status: 'accepted' });
  });
}
```

- [ ] **Passo 2: Registrar no `app.ts`**
```typescript
import { healthSyncRoutes } from './routes/health-sync';
// ... inside buildApp
app.register(healthSyncRoutes);
```

- [ ] **Passo 3: Teste de Integração (E2E básico)**
- Rodar `npm test` no `apps/api` garantindo que a rota responde 401 sem token e 202 com payload válido.

- [ ] **Passo 4: Finalizar e Commit**
```bash
git add apps/api/src
git commit -m "feat: add health sync endpoint to api"
```
