# Fase 1 — Fundação do Monorepo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a estrutura base do monorepo Helux com Turborepo + pnpm, todas as interfaces TypeScript compartilhadas (`packages/types`) e o skeleton da API Fastify com health check.

**Architecture:** Monorepo com pnpm workspaces e Turborepo como orchestrator de build/test/lint. O package `@helux/types` é source-only (sem compilação no MVP) e é resolvido diretamente via TypeScript paths. A API usa `tsx` em desenvolvimento e `tsc` para build de produção.

**Tech Stack:** Node.js 20+, pnpm 9+, Turborepo 2, TypeScript 5.4, Fastify 4, Vitest 1.

---

## Mapa de Arquivos

```
helux/
├── .gitignore                          ← atualizar com data/ e .env
├── .env.example                        ← criar
├── package.json                        ← criar (root workspace)
├── pnpm-workspace.yaml                 ← criar
├── turbo.json                          ← criar
├── tsconfig.base.json                  ← criar (TS config compartilhado)
├── packages/
│   └── types/
│       ├── package.json                ← criar
│       ├── tsconfig.json               ← criar
│       ├── vitest.config.ts            ← criar
│       └── src/
│           ├── index.ts                ← criar (re-exports)
│           ├── genetic.ts              ← criar (GeneticProfile, WorkoutConstraints)
│           ├── workout.ts              ← criar (WorkoutSession, ExerciseSet, PlannedExercise)
│           ├── recovery.ts             ← criar (RecoveryData)
│           ├── plan.ts                 ← criar (PlanInput, NextWorkoutPlan)
│           └── __tests__/
│               └── types.test.ts       ← criar (smoke tests de contratos)
└── apps/
    └── api/
        ├── package.json                ← criar
        ├── tsconfig.json               ← criar
        ├── vitest.config.ts            ← criar
        └── src/
            ├── index.ts                ← criar (bootstrap do servidor)
            ├── app.ts                  ← criar (factory — separado para testabilidade)
            ├── routes/
            │   └── health.ts           ← criar (GET /health)
            └── __tests__/
                └── health.test.ts      ← criar (teste de integração do endpoint)
```

---

## Task 1: Configurar raiz do monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Verificar pré-requisitos**

```bash
node --version   # deve ser >= 20.0.0
pnpm --version   # deve ser >= 9.0.0
```

Se pnpm não estiver instalado: `npm install -g pnpm`

- [ ] **Step 2: Criar `package.json` na raiz**

Conteúdo exato:

```json
{
  "name": "helux",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev --parallel",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && find . -name 'dist' -not -path '*/node_modules/*' -exec rm -rf {} +"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 3: Criar `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Criar `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Criar `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 6: Criar `.env.example`**

```bash
# Claude API (obrigatório para Fase 3)
ANTHROPIC_API_KEY=sk-ant-...

# API server
PORT=3001
HOST=0.0.0.0
```

- [ ] **Step 7: Atualizar `.gitignore`**

Adicionar ao final do `.gitignore` existente:

```gitignore
# Dados sensíveis do usuário
data/genetics/genera.json
data/workouts/history.json

# Variáveis de ambiente
.env
.env.local
.env.*.local

# Build outputs
dist/
.turbo/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 8: Criar estrutura de diretórios**

```bash
mkdir -p packages/types/src/__tests__
mkdir -p apps/api/src/routes
mkdir -p apps/api/src/__tests__
mkdir -p data/genetics
mkdir -p data/workouts
```

- [ ] **Step 9: Instalar dependências da raiz**

```bash
pnpm install
```

Esperado: `Lockfile is up to date, resolution step is skipped` ou criação de `pnpm-lock.yaml`.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .env.example .gitignore
git commit -m "chore: initialize turborepo monorepo with pnpm workspaces"
```

---

## Task 2: Criar `packages/types` com interfaces compartilhadas

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/vitest.config.ts`
- Create: `packages/types/src/genetic.ts`
- Create: `packages/types/src/workout.ts`
- Create: `packages/types/src/recovery.ts`
- Create: `packages/types/src/plan.ts`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/__tests__/types.test.ts`

- [ ] **Step 1: Escrever o teste que vai falhar primeiro**

Criar `packages/types/src/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  GeneticProfile,
  WorkoutConstraints,
  WorkoutSession,
  ExerciseSet,
  RecoveryData,
  PlanInput,
  NextWorkoutPlan,
  PlannedExercise,
} from '../index'

describe('GeneticProfile', () => {
  it('aceita todos os valores válidos de metabolismo', () => {
    const perfis: GeneticProfile[] = [
      { metabolismo: 'rapido', recuperacaoMuscular: 'alta', riscoCardiovascular: 'baixo', predisposicao: 'forca', alertas: [] },
      { metabolismo: 'lento', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'alto', predisposicao: 'endurance', alertas: ['evitar impacto alto'] },
      { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [] },
    ]
    expect(perfis).toHaveLength(3)
    expect(perfis[0].metabolismo).toBe('rapido')
    expect(perfis[1].alertas[0]).toBe('evitar impacto alto')
  })
})

describe('WorkoutSession', () => {
  it('armazena exercícios com séries, reps e esforço', () => {
    const sessao: WorkoutSession = {
      id: 'sess-001',
      date: '2026-06-12T10:00:00Z',
      exercises: [
        {
          name: 'Supino Reto',
          sets: [
            { reps: 10, weight: 80, effort: 7 },
            { reps: 8, weight: 82.5, effort: 8 },
          ],
        },
      ],
    }
    expect(sessao.exercises[0].name).toBe('Supino Reto')
    expect(sessao.exercises[0].sets[1].weight).toBe(82.5)
  })
})

describe('RecoveryData', () => {
  it('captura dados do HealthKit', () => {
    const recuperacao: RecoveryData = {
      date: '2026-06-12',
      hrv: 45,
      restingHR: 62,
      activeCalories: 420,
      source: 'healthkit',
    }
    expect(recuperacao.source).toBe('healthkit')
    expect(recuperacao.hrv).toBeGreaterThan(0)
  })
})

describe('PlanInput', () => {
  it('combina todos os dados necessários para gerar um plano', () => {
    const input: PlanInput = {
      geneticProfile: {
        metabolismo: 'moderado',
        recuperacaoMuscular: 'media',
        riscoCardiovascular: 'baixo',
        predisposicao: 'forca',
        alertas: [],
      },
      constraints: {
        maxWeeklyFrequency: 4,
        preferredVolume: 'medio',
        restBetweenSets: '90-120s',
        forbiddenExerciseTypes: [],
        cardioIntensityLimit: 'moderado',
      },
      workoutHistory: [],
      recoveryData: [],
      userGoals: 'ganhar massa muscular e perder gordura',
      userLevel: 'intermediario',
      availableDaysPerWeek: 4,
    }
    expect(input.userLevel).toBe('intermediario')
    expect(input.availableDaysPerWeek).toBe(4)
  })
})

describe('NextWorkoutPlan', () => {
  it('contém exercícios planejados e rationale da IA', () => {
    const plano: NextWorkoutPlan = {
      generatedAt: '2026-06-12T10:00:00Z',
      exercises: [
        {
          name: 'Supino Reto',
          sets: 4,
          reps: '8-10',
          weight: '82.5kg',
          notes: 'Foco na contração no topo',
        },
      ],
      rationale: 'Com base no seu HRV de 45ms e predisposição genética para força, recomendo volume moderado com foco em hipertrofia.',
    }
    expect(plano.exercises[0].reps).toBe('8-10')
    expect(plano.rationale).toBeTruthy()
  })
})
```

- [ ] **Step 2: Tentar rodar o teste — confirmar que falha**

```bash
cd packages/types && pnpm test
```

Esperado: FAIL — `Cannot find module '../index.js'` ou erro de import. **Não prosseguir sem ver este erro.**

- [ ] **Step 3: Criar `packages/types/package.json`**

```json
{
  "name": "@helux/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Criar `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Criar `packages/types/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

- [ ] **Step 6: Criar `packages/types/src/genetic.ts`**

```typescript
export interface GeneticProfile {
  metabolismo: 'rapido' | 'lento' | 'moderado'
  recuperacaoMuscular: 'alta' | 'media' | 'baixa'
  riscoCardiovascular: 'alto' | 'medio' | 'baixo'
  predisposicao: 'forca' | 'endurance' | 'misto'
  alertas: string[]
}

export interface WorkoutConstraints {
  maxWeeklyFrequency: number
  preferredVolume: 'baixo' | 'medio' | 'alto'
  restBetweenSets: string
  forbiddenExerciseTypes: string[]
  cardioIntensityLimit: 'leve' | 'moderado' | 'alto'
}
```

- [ ] **Step 7: Criar `packages/types/src/workout.ts`**

```typescript
export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ExerciseSet[]
}

export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
}
```

- [ ] **Step 8: Criar `packages/types/src/recovery.ts`**

```typescript
export interface RecoveryData {
  date: string
  hrv: number
  restingHR: number
  activeCalories: number
  source: 'healthkit'
}
```

- [ ] **Step 9: Criar `packages/types/src/plan.ts`**

```typescript
import type { GeneticProfile, WorkoutConstraints } from './genetic'
import type { WorkoutSession, PlannedExercise } from './workout'
import type { RecoveryData } from './recovery'

export interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]
  recoveryData: RecoveryData[]
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
}

export interface NextWorkoutPlan {
  generatedAt: string
  exercises: PlannedExercise[]
  rationale: string
}
```

- [ ] **Step 10: Criar `packages/types/src/index.ts`**

```typescript
export * from './genetic'
export * from './workout'
export * from './recovery'
export * from './plan'
```

- [ ] **Step 11: Instalar dependências do package**

```bash
cd packages/types && pnpm install
```

- [ ] **Step 12: Rodar os testes — confirmar que passam**

```bash
cd packages/types && pnpm test
```

Esperado:

```
 ✓ packages/types/src/__tests__/types.test.ts (5)
   ✓ GeneticProfile > aceita todos os valores válidos de metabolismo
   ✓ WorkoutSession > armazena exercícios com séries, reps e esforço
   ✓ RecoveryData > captura dados do HealthKit
   ✓ PlanInput > combina todos os dados necessários para gerar um plano
   ✓ NextWorkoutPlan > contém exercícios planejados e rationale da IA

 Test Files  1 passed (1)
 Tests       5 passed (5)
```

- [ ] **Step 13: Typecheck**

```bash
cd packages/types && pnpm typecheck
```

Esperado: sem erros.

- [ ] **Step 14: Commit**

```bash
git add packages/types/
git commit -m "feat(types): add shared TypeScript interfaces for genetic, workout, recovery and plan"
```

---

## Task 3: Criar `apps/api` com health check endpoint

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/__tests__/health.test.ts`

- [ ] **Step 1: Escrever o teste que vai falhar primeiro**

Criar `apps/api/src/__tests__/health.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'

describe('GET /health', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  it('retorna status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(response.statusCode).toBe(200)
  })

  it('retorna body com status ok e timestamp', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    const body = JSON.parse(response.body) as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('retorna 404 para rotas inexistentes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/rota-que-nao-existe',
    })
    expect(response.statusCode).toBe(404)
  })
})
```

- [ ] **Step 2: Tentar rodar o teste — confirmar que falha**

(ainda não temos o package.json, então vai falhar com erro de módulo)

```bash
cd apps/api && ls
```

Confirmar que `package.json` não existe ainda. **Não prosseguir sem confirmar ausência.**

- [ ] **Step 3: Criar `apps/api/package.json`**

```json
{
  "name": "@helux/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@helux/types": "workspace:*",
    "fastify": "^4.28.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "*",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Criar `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@helux/types": ["../../packages/types/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Criar `apps/api/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

- [ ] **Step 6: Criar `apps/api/src/routes/health.ts`**

```typescript
import type { FastifyInstance } from 'fastify'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  })
}
```

- [ ] **Step 7: Criar `apps/api/src/app.ts`**

A factory `buildApp` é separada de `index.ts` para permitir testes sem iniciar o servidor TCP.

```typescript
import Fastify, { type FastifyInstance } from 'fastify'
import { healthRoutes } from './routes/health'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(healthRoutes)

  return app
}
```

- [ ] **Step 8: Criar `apps/api/src/index.ts`**

```typescript
import { buildApp } from './app'

const app = buildApp()

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
```

- [ ] **Step 9: Instalar dependências**

```bash
cd apps/api && pnpm install
```

Esperado: fastify e tsx instalados, `@helux/types` resolvido via workspace.

- [ ] **Step 10: Rodar os testes — confirmar que passam**

```bash
cd apps/api && pnpm test
```

Esperado:

```
 ✓ apps/api/src/__tests__/health.test.ts (3)
   ✓ GET /health > retorna status 200
   ✓ GET /health > retorna body com status ok e timestamp
   ✓ GET /health > retorna 404 para rotas inexistentes

 Test Files  1 passed (1)
 Tests       3 passed (3)
```

- [ ] **Step 11: Typecheck**

```bash
cd apps/api && pnpm typecheck
```

Esperado: sem erros.

- [ ] **Step 12: Testar o servidor em modo dev**

```bash
cd apps/api && pnpm dev
```

Em outro terminal:

```bash
curl http://localhost:3001/health
```

Esperado: `{"status":"ok","timestamp":"2026-06-12T..."}`. Encerrar o servidor com `Ctrl+C`.

- [ ] **Step 13: Commit**

```bash
git add apps/api/
git commit -m "feat(api): add Fastify API skeleton with /health endpoint (TDD)"
```

---

## Task 4: Validar pipeline Turborepo completo

**Files:**
- No files to create — validação apenas

- [ ] **Step 1: Rodar todos os testes via Turborepo na raiz**

```bash
cd <raiz do projeto> && pnpm test
```

Esperado:

```
Tasks:    2 successful, 2 total
Cached:   0 cached, 2 total
  Time:   ~Xs
```

- [ ] **Step 2: Rodar typecheck via Turborepo**

```bash
pnpm typecheck
```

Esperado: 0 erros em todos os workspaces.

- [ ] **Step 3: Verificar estrutura final de diretórios**

```bash
find . -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

Esperado: todos os arquivos criados nas Tasks 2 e 3 listados.

- [ ] **Step 4: Commit final de validação**

```bash
git add .
git commit -m "chore: validate turborepo pipeline — all workspaces test and typecheck clean"
```

---

## Verificação End-to-End da Fase 1

Após completar todas as tasks:

```bash
# 1. Instalar tudo da raiz
pnpm install

# 2. Rodar todos os testes
pnpm test
# Esperado: 8 testes passando (5 types + 3 api)

# 3. Typecheck completo
pnpm typecheck
# Esperado: 0 erros

# 4. Subir a API
pnpm --filter @helux/api dev
# Em outro terminal:
curl http://localhost:3001/health
# Esperado: {"status":"ok","timestamp":"..."}
```

A Fase 1 está completa quando:
- ✅ `pnpm test` passa com 8 testes em 2 workspaces
- ✅ `pnpm typecheck` sem erros
- ✅ `GET /health` responde `{"status":"ok"}`
- ✅ `.gitignore` protege `data/` e `.env`

---

## Próximo Passo

Com a Fase 1 completa, o próximo plano é **Fase 2 — Módulo Genético**: parser do JSON Genera + engine de regras + endpoint `GET /genetic-profile`.

**Pré-requisito para Fase 2:** fornecer o JSON real da Genera para mapear os marcadores genéticos com fidelidade antes de escrever as regras.
