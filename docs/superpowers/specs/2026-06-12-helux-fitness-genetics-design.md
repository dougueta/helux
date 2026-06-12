# Helux — Design de Arquitetura

**Data:** 2026-06-12
**Status:** Aprovado
**Autor:** Doug Ugueta

---

## Visão do Produto

Helux é um app fitness personalizado por genética. O usuário fornece o resultado do
teste Genera (JSON estruturado com marcadores genéticos), registra seus treinos
(pesos/séries/reps) e sincroniza dados do Apple Watch via HealthKit (HRV, frequência
cardíaca, calorias). Com esses dados, uma engine de regras interpreta a genética e o
Claude API gera o próximo plano de treino adaptado à progressão real do usuário dentro
dos limites definidos pelo seu perfil genético.

### Loop Adaptativo Central

```
genera.json → GeneticProfile (regras) ──┐
HealthKit (Apple Watch) ───────────────→ Claude API → NextWorkoutPlan
WorkoutHistory (log manual) ────────────┘
```

### Fases do Produto

| Fase | Escopo | Status |
|------|--------|--------|
| MVP Pessoal | Planos de treino adaptativos + web | Em design |
| Fase 2 | Planos de nutrição | Futuro |
| Fase 3 | Multi-usuário + auth | Futuro |
| Fase 4 | TBD — expansão | Futuro |

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Stack | Full TypeScript | Uma linguagem, máximo compartilhamento de código |
| Monorepo tooling | Turborepo + pnpm workspaces | Performance, cache de builds |
| Backend | Node.js + Fastify | Leveza, TypeScript nativo, sem overhead |
| Web | Next.js 14 (App Router) | SSR, DX, ecosistema maduro |
| Mobile | Expo (React Native) | HealthKit integration, code sharing com web |
| IA | Claude API (claude-sonnet-4-6) | Personalização em linguagem natural |
| Storage MVP | Arquivos JSON locais | Simplicidade; migra pra DB quando for multi-usuário |
| Apple Watch | HealthKit via expo-health | Dados de recuperação automáticos (HRV, FC) |
| Genética | Regras deterministicas + IA para linguagem | Confiabilidade + personalização |

---

## Arquitetura do Monorepo

```
helux/
├── apps/
│   ├── api/              ← Fastify REST API (toda lógica de negócio)
│   ├── web/              ← Next.js 14 (interface principal)
│   └── mobile/           ← Expo (HealthKit + log de treino)
├── packages/
│   ├── types/            ← Interfaces TypeScript compartilhadas
│   ├── genetics/         ← Engine de regras: JSON Genera → GeneticProfile
│   ├── workouts/         ← CRUD do histórico de treinos + HealthKit adapter
│   └── ai/               ← Wrapper Claude API + prompt templates
├── data/
│   ├── genetics/
│   │   └── genera.json   ← (gitignored) JSON bruto da Genera
│   └── workouts/
│       └── history.json  ← (gitignored) Histórico de treinos
├── docs/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Contratos dos Packages

### `packages/types` — Interfaces compartilhadas

```typescript
interface GeneticProfile {
  metabolismo: 'rapido' | 'lento' | 'moderado'
  recuperacaoMuscular: 'alta' | 'media' | 'baixa'
  riscoCardiovascular: 'alto' | 'medio' | 'baixo'
  predisposicao: 'forca' | 'endurance' | 'misto'
  alertas: string[]
}

interface WorkoutSession {
  id: string
  date: string  // ISO 8601
  exercises: ExerciseSet[]
}

interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>  // effort 1-10
}

interface RecoveryData {
  date: string
  hrv: number           // ms — variabilidade da frequência cardíaca
  restingHR: number     // bpm
  activeCalories: number
  source: 'healthkit'
}

interface NextWorkoutPlan {
  generatedAt: string
  exercises: PlannedExercise[]
  rationale: string     // explicação da IA em linguagem natural
}

interface PlannedExercise {
  name: string
  sets: number
  reps: string          // ex: "8-12" ou "15"
  weight: string        // ex: "70kg" ou "progressão +2.5kg"
  notes?: string
}

interface WorkoutConstraints {
  maxWeeklyFrequency: number
  preferredVolume: 'baixo' | 'medio' | 'alto'
  restBetweenSets: string       // ex: "90-120s"
  forbiddenExerciseTypes: string[]
  cardioIntensityLimit: 'leve' | 'moderado' | 'alto'
}

interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]     // últimas N sessões
  recoveryData: RecoveryData[]         // últimos N dias
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
}
```

### `packages/genetics` — Engine de regras

- `parseGeneraJson(raw: unknown): GeneticProfile`
  Mapeia marcadores do JSON Genera → perfil estruturado. Determinístico, sem IA.
- `getWorkoutConstraints(profile: GeneticProfile): WorkoutConstraints`
  Regras: recuperação baixa → volume conservador; risco cardio alto → limite intensidade.

### `packages/ai` — Wrapper Claude API

- `generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan>`
  System prompt: GeneticProfile + constraints (cacheado — genética muda raramente).
  User prompt: WorkoutHistory (últimas N sessões) + RecoveryData + UserGoals.
  Modelo: `claude-sonnet-4-6` com prompt caching habilitado.

### `packages/workouts` — Histórico + HealthKit

- `logWorkout(session: WorkoutSession): void`
- `getHistory(limit?: number): WorkoutSession[]`
- `importFromHealthKit(rawHK: HealthKitWorkout): WorkoutSession`
- `getRecoveryData(days?: number): RecoveryData[]`

---

## API REST (apps/api)

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /health | Health check |
| GET | /genetic-profile | GeneticProfile parseado do genera.json |
| GET | /workouts | Lista histórico de treinos |
| POST | /workouts | Registra nova sessão |
| GET | /recovery | Últimos dados de recuperação do HealthKit |
| POST | /recovery | Importa dados do HealthKit (via mobile) |
| POST | /workout/generate | Gera próximo plano via Claude API |
| GET | /workout/latest-plan | Último plano gerado |

---

## Ordem de Implementação

### Fase 1 — Fundação
Setup monorepo (Turborepo + pnpm), `packages/types`, `apps/api` skeleton, CI.

### Fase 2 — Módulo Genético
`packages/genetics`: parser do JSON Genera + engine de regras + testes unitários + endpoint `GET /genetic-profile`.

### Fase 3 — IA + Geração de Plano
`packages/ai`: wrapper Claude API + prompt templates + caching + endpoint `POST /workout/generate`.

### Fase 4 — Log de Treinos + HealthKit
`packages/workouts` + `apps/mobile`: telas de log + integração `expo-health`.

### Fase 5 — Web App MVP
`apps/web`: dashboard com plano atual, histórico, perfil genético. Fluxo completo.

---

## Estratégia de Testes (TDD — constituição)

- `packages/genetics`: 100% unitário — JSON Genera → GeneticProfile esperado
- `packages/workouts`: unitário, HealthKit mockado
- `packages/ai`: Claude API mockado, testes de estrutura de prompt
- `apps/api`: testes de integração por endpoint (Fastify inject)
- `apps/web` / `apps/mobile`: Vitest + Testing Library

Test runner padrão: **Vitest** em todos os workspaces.

---

## Dados Sensíveis (.gitignore)

```
data/genetics/genera.json
data/workouts/history.json
.env
.env.local
```

Variáveis de ambiente necessárias: `ANTHROPIC_API_KEY`

---

## Pré-requisito Externo

Antes de implementar a Fase 2 (Módulo Genético), é necessário o JSON real da Genera
para mapear os marcadores genéticos com fidelidade. Sem esse arquivo, as regras serão
baseadas na estrutura esperada mas não validadas contra os dados reais.
