# Implementation Plan: Geração de Mesociclo de Treino com Ajuste por Recovery

**Branch**: `006-mesociclo-treino-backend` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/006-mesociclo-treino-backend/spec.md`

## Summary

Substituir a geração automática de uma sessão de treino por vez (hoje disparada a cada `POST /api/workouts/sessions`) por um mesociclo completo gerado numa única chamada à IA (Abordagem A: prompt único, sem orquestrador). O mesociclo é persistido como uma linha por ciclo, com as sessões em ordem num array; a "sessão pendente atual" é derivada (primeira sem `completed_at`), e a fila só avança quando uma sessão é efetivamente concluída. O ajuste por recovery passa a ser uma função determinística pura aplicada em tempo de leitura no `GET /workout/latest-plan`, sem custo de IA adicional e sem mutar o plano armazenado.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — consistente com o resto do monorepo
**Primary Dependencies**: `@anthropic-ai/sdk` (já em uso em `packages/ai`), `fastify`, `@supabase/supabase-js`, `zod`, `@helux/types`, `@helux/genetics`
**Storage**: Supabase (PostgreSQL) — nova tabela `mesocycle_plans`; `workout_sessions` (histórico de sessões concluídas) ganha uma referência opcional à sessão do mesociclo que ela completou; `workout_plans` (single-session) fica congelada, sem novos inserts
**Testing**: Vitest (`packages/ai`, `apps/api`) — Red→Green→Refactor, mesmo padrão de `packages/ai/src/__tests__/planner.test.ts`
**Target Platform**: Servidor Node.js (`apps/api`) + biblioteca (`packages/ai`)
**Project Type**: Extensão de serviço existente dentro do monorepo — nenhum workspace novo
**Performance Goals**: Ajuste por recovery calculado e retornado em <200ms (função pura, sem chamada de rede); geração do mesociclo permanece numa única chamada Claude (mesma ordem de latência da geração de sessão única hoje, ~poucos segundos)
**Constraints**: O caminho de ajuste por recovery NUNCA deve disparar uma chamada à IA; a geração do mesociclo deve permanecer uma única chamada (Abordagem A, já validada por custo — ver conversa de brainstorming)
**Scale/Scope**: Uso pessoal, usuário único (mesmo padrão do projeto)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Mudanças contidas em `apps/api`, `packages/ai`, `packages/types`, `supabase/migrations` |
| II. Test-First (TDD) | ✅ PASS | `tasks.md` (Fase seguinte) ordena Red → Green → Refactor; segue o padrão já usado em `packages/ai/src/__tests__` |
| III. Independent Deployability | ✅ PASS | `apps/api` continua consumindo `packages/ai` só via import de workspace; nenhuma dependência nova entre apps |
| IV. Shared Code via Packages | ✅ PASS | Tipos novos (`MesocyclePlan`, `MesocycleSession`) em `packages/types`; função de ajuste determinístico em `packages/ai`, reaproveitada por qualquer consumidor futuro |
| V. Simplicity (YAGNI) | ✅ PASS | Reaproveita o prompt/regras de periodização existentes (Abordagem A — 1 chamada, sem orquestrador); ajuste por recovery é uma função pura, não um novo serviço/pacote |

## Project Structure

### Documentation (this feature)

```text
specs/006-mesociclo-treino-backend/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 findings
├── data-model.md         ← entity definitions
├── contracts/
│   └── api.md            ← API contracts (existing + new endpoints)
├── checklists/
│   └── requirements.md   ← spec quality checklist
└── tasks.md               ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/types/src/
├── mesocycle.ts              ← NOVO: MesocyclePlan, MesocycleSession, MesocycleSessionStatus
└── index.ts                   ← export dos novos tipos

packages/ai/src/
├── mesocycle-prompts.ts       ← NOVO: buildMesocycleSystemPrompt / buildMesocycleUserPrompt
│                                  (adapta prompts.ts para pedir o ciclo inteiro em vez de 1 sessão)
├── mesocycle-planner.ts       ← NOVO: generateMesocyclePlan(input): Promise<MesocyclePlan>
├── recovery-adjustment.ts     ← NOVO: applyRecoveryAdjustment(session, recovery): AdjustedSession
│                                  (função pura, reaproveita os limiares de HRV já usados no prompt)
└── __tests__/
    ├── mesocycle-planner.test.ts
    └── recovery-adjustment.test.ts

apps/api/src/
├── routes/
│   ├── workout-latest-plan.ts        ← MODIFICADO: lê de mesocycle_plans, deriva a sessão
│   │                                     pendente atual, aplica applyRecoveryAdjustment em tempo de leitura
│   └── workout-sessions.ts           ← MODIFICADO: após inserir a sessão concluída, marca a
│                                         sessão correspondente do mesociclo como concluída antes
│                                         de decidir se regenera
├── services/
│   ├── plan-generation.service.ts    ← MODIFICADO: triggerBackgroundPlanGeneration só gera um
│   │                                     novo mesociclo quando o atual está 100% concluído
│   ├── plan-context.service.ts       ← inalterado (gatherPlanInput continua alimentando a geração)
│   └── mesocycle.service.ts          ← NOVO: helpers — buscar mesociclo ativo, marcar sessão
│                                         concluída, checar se o ciclo está completo
└── __tests__/
    ├── mesocycle.service.test.ts
    └── workout-latest-plan.test.ts   ← atualizado para o novo formato de leitura

supabase/migrations/
└── 20260722000000_create_mesocycle_plans.sql   ← nova tabela + RLS + índice
```

**Structure Decision**: Estende o layout existente de `001-ai-workout-planner`/`004-web-mvp` (apps/api + packages/ai + packages/types) — nenhum workspace novo. `workout_plans` (single-session) permanece intacta para histórico antigo; toda escrita nova vai para `mesocycle_plans`.

## Complexity Tracking

*Sem violações da constituição a justificar.*

**Gap conhecido, fora do escopo desta spec**: `POST /workout/generate` (botão manual "Gerar Novo Plano" no web) continua chamando `generateWorkoutPlan` (sessão única) e não foi migrado para mesociclo — não estava nas user stories aprovadas. Isso deixa esse botão inconsistente com a nova leitura de "sessão pendente do mesociclo" em `GET /workout/latest-plan`. Recomendo tratar como item de follow-up (nova spec ou task de débito técnico) antes de expor esse botão na UI de novo — sinalizar ao usuário.
