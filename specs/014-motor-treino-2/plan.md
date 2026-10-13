# Implementation Plan: Motor de Geração de Treino 2.0

**Branch**: `014-motor-treino-2` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-motor-treino-2/spec.md`

## Summary

O item do plano (`PlannedExercise`) ganha três campos opcionais e aditivos — `phase` (aquecimento/principal/volta-calma), `supersetGroup` (biset) e `progression` (decisão de carga) — que vivem dentro do JSON `sessions` já armazenado em `mesocycle_plans` (sem migração). Toda a lógica nova é pura e determinística em `@helux/workouts`:

- `plan-structure.ts`: fase efetiva (ausente → principal), normalização do plano gerado (fases ordenadas, bisets inválidos descartados), parceiro de biset;
- `workout-flow.ts`: ponto único que decide, após concluir uma série, **quanto descansar** e **para qual exercício ir** (biset, aquecimento sem descanso) — é aqui que a spec 015 vai plugar o descanso personalizado;
- `progression.ts`: esforço em 4 níveis, parsing de faixa/carga, incremento realista e a regra de progressão (aumentar/manter/reduzir/sem dados) + aplicação determinística no novo mesociclo.

A IA (`@helux/ai`) passa a receber instruções de fases/biset e as decisões de progressão no prompt; a API (`plan-generation.service`) calcula as decisões a partir do mesociclo anterior concluído + histórico desde a geração dele, e depois da resposta da IA normaliza e **sobrescreve** as cargas. A web mostra fases/biset/progressão em Treinos e Home, e o treino ativo ganha itens de aquecimento/volta à calma com um toque, alternância de biset e relato de esforço por exercício.

## Technical Context

**Language/Version**: TypeScript 5 (Node 20 na API, Next.js 15/React 19 na web)
**Primary Dependencies**: Fastify + Supabase JS (API), Anthropic SDK (`@helux/ai`), Next.js App Router (web), zod
**Storage**: Supabase Postgres — `mesocycle_plans.sessions` (jsonb) e `workout_sessions.exercises` (jsonb). Nenhuma migração.
**Testing**: Vitest em todos os workspaces; Testing Library na web; SDK da Anthropic mockado com `vi.mock('@anthropic-ai/sdk')` (padrão existente)
**Target Platform**: Web responsiva (mobile-first) + API Node
**Project Type**: Monorepo pnpm/turbo (apps/web, apps/api, packages/*)
**Performance Goals**: Cálculos de progressão/normalização O(n) sobre dezenas de itens — irrelevante; nenhuma chamada extra à IA
**Constraints**: Compatibilidade com planos antigos e com treino ativo salvo em localStorage no formato antigo; só classes de `helux-v2.css` na web (guard test); sem chamadas reais à Anthropic nos testes; RAM baixa (testes direcionados)
**Scale/Scope**: 1 usuário por mesociclo, 4–10 itens por sessão, ≤ 2 bisets por sessão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|---|---|---|
| I. Monorepo-First | ✅ | Tudo em `packages/types`, `packages/workouts`, `packages/ai`, `apps/api`, `apps/web`. |
| II. Test-First | ✅ | Cada módulo puro nasce com teste vermelho; rotas/hooks/páginas com testes antes da mudança. |
| III. Independent Deployability | ✅ | Campos novos são opcionais: API nova com web antiga (ignora campos) e web nova com planos antigos funcionam. |
| IV. Shared Code via Packages | ✅ | Regras compartilhadas (fase, biset, fluxo, progressão) em `@helux/workouts`, usadas por API e web. |
| V. Simplicity | ✅ | Sem tabela nova, sem novo endpoint; campos opcionais no JSON existente. `workout-flow.ts` é justificado por dois usos concretos (biset agora, descanso 015 depois) — ver Complexity Tracking. |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/014-motor-treino-2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── plan-schema.md        # PlannedExercise estendido + normalização (API ⇄ web ⇄ banco)
│   ├── llm-response.md       # JSON pedido à IA (fases, supersetGroup, progressão no prompt)
│   └── workout-flow.md       # nextStepAfterSet / restSecondsAfterSet (ponto de extensão da 015)
└── tasks.md
```

### Source Code (repository root)

```text
packages/types/src/workout.ts              # ExercisePhase, LoadProgression, PlannedExercise (+phase, supersetGroup, progression)
packages/types/src/plan.ts                 # PlanInput.loadProgression?
packages/workouts/src/
├── plan-structure.ts                      # NOVO: exercisePhase, isMainExercise, normalizeSessionExercises, supersetPartnerIndex, groupByPhase
├── workout-flow.ts                        # NOVO: DEFAULT_REST_SECONDS, restSecondsAfterSet, nextStepAfterSet
├── progression.ts                         # NOVO: EFFORT_*, parseRepRange, parseKg, loadIncrement, decideProgression, computeMesocycleProgression, applyProgression
├── tiredness.ts                           # ajuste só no principal
└── __tests__/{plan-structure,workout-flow,progression,tiredness}.test.ts
packages/ai/src/
├── mesocycle-prompts.ts                   # fases, biset, seção de progressão
├── mesocycle-planner.ts                   # repassa phase/supersetGroup; enriquece só o principal
└── __tests__/mesocycle-{prompts,planner}.test.ts
apps/api/src/services/
├── plan-context.service.ts                # fetchSessionsSince (histórico desde a geração do mesociclo anterior)
├── plan-generation.service.ts             # progressão + normalização antes do insert
└── ../__tests__/plan-generation.service.test.ts, plan-context.service.test.ts
apps/web/src/
├── hooks/useActiveWorkout.ts              # effortByExerciseIndex, setEffort, histórico só do principal
├── app/workout/page.tsx                   # fase, itens de 1 toque, biset, esforço, nextStepAfterSet
├── components/workout/EffortPicker.tsx    # NOVO: Segmented de 4 níveis
├── components/workout/PlanExerciseList.tsx# NOVO: lista agrupada por fase com biset e progressão (Treinos)
├── app/treinos/TreinosClient.tsx          # usa PlanExerciseList
├── app/HomeClient.tsx                     # destaque = 1º do principal
└── __tests__/...                          # testes correspondentes
```

**Structure Decision**: monorepo existente; lógica pura em `packages/workouts` (já dependência de API e web), prompt em `packages/ai`, orquestração na API, UI na web.

## User Story → entrega independente

- **US1 (P1) Fases**: types + plan-structure + tiredness (só principal) + prompt/planner (phase) + normalização na API + UI (lista por fase, treino ativo, Home, histórico só do principal).
- **US2 (P2) Biset**: supersetGroup no prompt/planner + validação na normalização + workout-flow + UI (marcador na lista, alternância no treino ativo).
- **US3 (P2) Progressão**: progression.ts + EffortPicker/useActiveWorkout (esforço) + plan-context/plan-generation (cálculo e aplicação) + prompt (seção) + UI (delta e motivo).

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `workout-flow.ts` como ponto único de descanso/navegação | Biset precisa decidir "descansa ou troca de exercício" por série; a spec 015 vai trocar o tempo de descanso no mesmo ponto | Deixar a lógica inline em `workout/page.tsx` a tornaria não testável isoladamente e forçaria a 015 a reescrever o fluxo de biset |
