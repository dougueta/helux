# Implementation Plan: Geração de Plano de Treino por IA

**Branch**: `001-ai-workout-planner` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-ai-workout-planner/spec.md`

## Summary

Criar `packages/ai` com `generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan>` usando o SDK da Anthropic com `claude-sonnet-4-6`. O system prompt (GeneticProfile + WorkoutConstraints + instruções de formato) é marcado com `cache_control` para reutilização entre chamadas — o perfil genético muda raramente. O user prompt injeta o histórico de treinos e dados de recuperação, que variam por chamada. O último plano gerado é persistido em `data/workouts/latest-plan.json`. A API expõe dois endpoints: `POST /workout/generate` e `GET /workout/latest-plan`.

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: `@anthropic-ai/sdk`, `@helux/types`, `@helux/genetics`  
**Storage**: JSON local (`data/workouts/latest-plan.json`) — arquivo gitignored  
**Testing**: Vitest 3.2.6 — SDK Anthropic mockado via `vi.mock`  
**Target Platform**: Node.js 20+  
**Project Type**: Package library (`packages/ai`) + extensão da web service (`apps/api`)  
**Performance Goals**: Geração de plano em < 30s (depende do modelo); leitura do último plano em < 100ms  
**Constraints**: `ANTHROPIC_API_KEY` obrigatório em runtime; mínimo 2048 tokens no prefixo cacheado para `sonnet-4-6`  
**Scale/Scope**: 1 usuário (MVP pessoal), ~1–2 gerações por dia

## Constitution Check

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Monorepo-First | ✅ | `packages/ai` reside neste repo |
| II. Test-First | ✅ | TDD estrito — testes antes do código |
| III. Independent Deployability | ✅ | `packages/ai` tem `package.json` próprio, declarações explícitas de deps |
| IV. Shared Code via Packages | ✅ | Importa `@helux/types` para todos os tipos compartilhados |
| V. Simplicity | ✅ — sem violações | Uma função wrapper; sem plugin architecture ou retry automático |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-workout-planner/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões de design da API e prompt
├── data-model.md        # Phase 1 — entidades e fluxo de dados
├── contracts/
│   └── api-endpoints.md # Phase 1 — contratos REST
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
packages/ai/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts              ← exports públicos
    ├── planner.ts            ← generateWorkoutPlan()
    ├── prompts.ts            ← buildSystemPrompt(), buildUserPrompt()
    └── __tests__/
        └── planner.test.ts

apps/api/src/
├── routes/
│   ├── workout-generate.ts   ← POST /workout/generate
│   └── workout-latest-plan.ts ← GET /workout/latest-plan
└── __tests__/
    ├── workout-generate.test.ts
    └── workout-latest-plan.test.ts

data/workouts/
└── latest-plan.json          ← (gitignored) último plano gerado
```

**Structure Decision**: Monorepo Option 3 (Package + API extension). `packages/ai` encapsula toda a lógica de integração com o Claude. `apps/api` apenas injeta o input e salva o output — sem lógica de negócio duplicada.
