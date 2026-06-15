# Plano: iOS Shortcuts HealthKit Loop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fechar o loop de dados reais: iOS Shortcut lê Apple Watch → POST para API → Supabase → app mobile exibe via RecoveryCard ao abrir e no botão ⟳.

**Architecture:** iOS Shortcut (HealthKit) → `POST /api/health/sync` (X-API-Key) → Supabase `health_samples` → `GET /api/recovery/latest` (Bearer) → `useHealthSync` → RecoveryCard.

**Tech Stack:** TypeScript, Fastify, Supabase JS, Fly.io (Docker), Expo SDK 54.

---

## Mapeamento de Arquivos

- Modify: `packages/types/src/recovery.ts` — adicionar `sleepHours?: number`
- Modify: `apps/api/src/routes/health-sync.ts` — suporte a X-API-Key
- Create: `apps/api/src/routes/recovery-latest.ts` — GET /api/recovery/latest
- Modify: `apps/api/src/app.ts` — registrar nova rota
- Modify: `apps/api/.env` — PERSONAL_API_KEY + PERSONAL_USER_ID
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `fly.toml`
- Modify: `apps/mobile/src/hooks/useHealthSync.ts` — buscar do servidor
- Modify: `apps/mobile/src/services/health-sync.service.ts` — adicionar fetchLatestRecovery
- Create: `docs/shortcuts-guide.md` — guia do Shortcut iOS

---

### Tarefa 1: Adicionar sleepHours ao tipo RecoveryData

**Files:**
- Modify: `packages/types/src/recovery.ts`

- [ ] **Passo 1:** Adicionar campo opcional ao tipo:

```typescript
export interface RecoveryData {
  date: string
  hrv: number
  restingHR: number
  activeCalories: number
  sleepHours?: number
  source: 'healthkit'
}
```

- [ ] **Passo 2:** Verificar typecheck do monorepo:

```bash
pnpm --filter @helux/types typecheck
pnpm --filter @helux/mobile typecheck
pnpm --filter @helux/api typecheck
```

- [ ] **Passo 3:** Commit:
```bash
git add packages/types/src/recovery.ts
git commit -m "feat(types): add optional sleepHours to RecoveryData"
```

---

### Tarefa 2: X-API-Key auth + GET /api/recovery/latest

**Files:**
- Modify: `apps/api/src/routes/health-sync.ts`
- Create: `apps/api/src/routes/recovery-latest.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/.env`

- [ ] **Passo 1:** Adicionar ao `apps/api/.env`:

```
PERSONAL_API_KEY=<gerar com: node -e "console.log(require('crypto').randomUUID())">
PERSONAL_USER_ID=<user_id do Supabase Auth dashboard>
```

- [ ] **Passo 2:** Modificar `apps/api/src/routes/health-sync.ts` para aceitar X-API-Key:

Na função `healthSyncRoutes`, substituir o bloco de auth por:

```typescript
app.post('/api/health/sync', async (request, reply) => {
  let userId: string

  const apiKey = request.headers['x-api-key']
  const personalApiKey = process.env.PERSONAL_API_KEY
  const personalUserId = process.env.PERSONAL_USER_ID

  if (apiKey && personalApiKey && personalUserId && apiKey === personalApiKey) {
    // iOS Shortcut path — personal API key
    userId = personalUserId
  } else {
    // App path — Supabase Bearer token
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    userId = user.id
  }

  // resto do handler igual...
```

- [ ] **Passo 3:** Criar `apps/api/src/routes/recovery-latest.ts`:

```typescript
import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import type { RecoveryData } from '@helux/types'

export async function recoveryLatestRoutes(app: FastifyInstance): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  )

  app.get('/api/recovery/latest', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: samples, error } = await supabase
      .from('health_samples')
      .select('type, value, unit, start_at')
      .eq('user_id', user.id)
      .gte('start_at', since)
      .order('start_at', { ascending: false })

    if (error) {
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    if (!samples || samples.length === 0) {
      return reply.code(404).send({ error: 'No data found' })
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

    const hrv = avg(samples.filter(s => s.type === 'hrv').map(s => Number(s.value)))
    const restingHR = avg(samples.filter(s => s.type === 'heart_rate').map(s => Number(s.value)))
    const activeCalories = sum(samples.filter(s => s.type === 'active_energy').map(s => Number(s.value)))
    const sleepSample = samples.find(s => s.type === 'sleep_duration')
    const sleepHours = sleepSample ? Number(sleepSample.value) : undefined

    const latestDate = samples[0]?.start_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]

    const recovery: RecoveryData = {
      date: latestDate,
      hrv: Math.round(hrv),
      restingHR: Math.round(restingHR),
      activeCalories: Math.round(activeCalories),
      sleepHours,
      source: 'healthkit',
    }

    return reply.send(recovery)
  })
}
```

- [ ] **Passo 4:** Registrar em `apps/api/src/app.ts`:

```typescript
import { recoveryLatestRoutes } from './routes/recovery-latest'
// dentro de buildApp():
app.register(recoveryLatestRoutes)
```

- [ ] **Passo 5:** Typecheck e commit:

```bash
pnpm --filter @helux/api typecheck
git add apps/api/src/routes/health-sync.ts apps/api/src/routes/recovery-latest.ts apps/api/src/app.ts
git commit -m "feat(api): add X-API-Key auth and GET /api/recovery/latest"
```

---

### Tarefa 3: Fly.io setup

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `fly.toml`

- [ ] **Passo 1:** Criar `apps/api/Dockerfile`:

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

# Copiar arquivos de lock e workspaces
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/genetics/package.json ./packages/genetics/
COPY packages/ai/package.json ./packages/ai/
COPY packages/health/package.json ./packages/health/
COPY packages/workouts/package.json ./packages/workouts/
COPY apps/api/package.json ./apps/api/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar sources
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build
RUN pnpm --filter @helux/api build

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
```

- [ ] **Passo 2:** Criar `apps/api/.dockerignore`:

```
node_modules
dist
.env
.env.*
data/
```

- [ ] **Passo 3:** Criar `fly.toml` na raiz do repo:

```toml
app = "helux-api"
primary_region = "gru"

[build]
  dockerfile = "apps/api/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"
  HOST = "0.0.0.0"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

- [ ] **Passo 4:** Commit:

```bash
git add apps/api/Dockerfile apps/api/.dockerignore fly.toml
git commit -m "feat(api): add Dockerfile and fly.toml for Fly.io deploy"
```

> ⚠️ O deploy em si (`fly launch` + `fly deploy` + `fly secrets set`) é feito manualmente após este commit. Ver guia no README.

---

### Tarefa 4: App — buscar recovery do servidor

**Files:**
- Modify: `apps/mobile/src/services/health-sync.service.ts`
- Modify: `apps/mobile/src/hooks/useHealthSync.ts`

- [ ] **Passo 1:** Adicionar `fetchLatestRecovery` ao `health-sync.service.ts`:

```typescript
export async function fetchLatestRecovery(
  token: string,
  apiUrl: string,
): Promise<RecoveryData | null> {
  try {
    const res = await fetch(`${apiUrl}/api/recovery/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as RecoveryData
  } catch (err) {
    console.error('[fetchLatestRecovery]', err)
    return null
  }
}
```

- [ ] **Passo 2:** Modificar `useHealthSync.ts` — substituir mock sync por fetch do servidor:

```typescript
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { AuthService } from '../services/auth.service'
import { fetchLatestRecovery, RECOVERY_KEY } from '../services/health-sync.service'
import { useAuth } from './useAuth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useHealthSync() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [recovery, setRecovery] = useState<RecoveryData | null>(null)

  // Auto-fetch ao montar quando sessão disponível
  useEffect(() => {
    if (!session) {
      // Fallback: ler do AsyncStorage enquanto não há sessão
      AsyncStorage.getItem(RECOVERY_KEY).then(raw => {
        if (raw) setRecovery(JSON.parse(raw) as RecoveryData)
      })
      return
    }
    // Sessão disponível: buscar do servidor
    AuthService.getAccessToken()
      .then(token => fetchLatestRecovery(token, API_URL))
      .then(data => {
        if (data) {
          setRecovery(data)
          AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(data))
        }
      })
      .catch(err => console.error('[useHealthSync] auto-fetch', err))
  }, [session])

  const sync = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = await AuthService.getAccessToken()
      const data = await fetchLatestRecovery(token, API_URL)
      if (data) {
        setRecovery(data)
        setLastSyncAt(new Date())
        await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(data))
      }
    } catch (err) {
      console.error('[useHealthSync] sync', err)
    } finally {
      setLoading(false)
    }
  }

  return { sync, loading, lastSyncAt, recovery }
}
```

- [ ] **Passo 3:** Typecheck:

```bash
pnpm --filter @helux/mobile typecheck
pnpm --filter @helux/mobile test
```

Esperado: 9 testes passando, typecheck limpo.

- [ ] **Passo 4:** Commit:

```bash
git add apps/mobile/src/hooks/useHealthSync.ts apps/mobile/src/services/health-sync.service.ts
git commit -m "feat(mobile): replace mock sync with server fetch in useHealthSync"
```

---

### Tarefa 5: Guia do iOS Shortcut

**Files:**
- Create: `docs/shortcuts-guide.md`

- [ ] **Passo 1:** Criar guia com passos detalhados para criar o Shortcut no iPhone, incluindo:
  - Ações necessárias (Find Health Samples para cada métrica)
  - Como formatar o JSON
  - Como fazer o POST com X-API-Key
  - Como adicionar à tela inicial como widget

- [ ] **Passo 2:** Commit:

```bash
git add docs/shortcuts-guide.md
git commit -m "docs: add iOS Shortcut setup guide for HealthKit sync"
```
