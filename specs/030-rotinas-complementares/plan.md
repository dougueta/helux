# Implementation Plan: Módulo de rotinas diárias e complementares (alongamento, abdominal e cardio)

**Branch**: `030-rotinas-complementares` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/030-rotinas-complementares/spec.md`

## Summary

Hoje o Helux coloca toda atividade na fila única `A → B → C → D` do mesociclo e só permite um treino ativo por vez (`helux:active-workout`). Isso impede fazer cardio de manhã e academia à noite ou manter hábitos diários de alongamento e abdominal sem travar ou sobrescrever o treino de musculação.

Esta entrega cria o **módulo de Rotinas Complementares**, acessível na sub-aba **Rotinas** dentro de **Treinos** (`Academia | Rotinas`) e na seção **Rotinas do Dia** da **Home**:

1. **3 rotinas fixas por ciclo (`FR-001a`, `FR-005`)**: **Alongamento & Mobilidade**, **Core / Abdominal** e **Cardio**, calculadas por regra determinística instantânea (`@helux/workouts`) sobre o catálogo oficial (`STRETCH_MOBILITY_BANK`, `EXERCISE_BANK` core e `CARDIO_BANK`), respeitando 100% das condições articulares, equipamento, foco do mesociclo e preferências de frequência/duração do usuário — sem gastar chamada de IA.
2. **Fila `A/B/C/D` exclusiva para a academia (`FR-002a`)**: as sessões dedicadas de cardio e mobilidade deixam de ocupar letras na fila sequencial do mesociclo e migram para as Rotinas Complementares (aquecimento e volta à calma curtos dentro da sessão de academia continuam existindo).
3. **Execução guiada e isolada (`FR-002`, `FR-009`–`FR-011`)**: cada categoria tem tela própria (`/treinos/rotina/[category]`) com estado em `localStorage` separado (`helux:active-routine`), cronômetro regressivo de sustentação para alongamento, séries sem carga para abdominal e registro em < 15 s para cardio.
4. **Sinergia entre turnos e no fim do ciclo (`FR-014`–`FR-016`)**: alerta quando há cardio antes de treino de pernas no mesmo dia, selo `"Já cumprido hoje nas Rotinas"` na volta à calma da academia quando o cardio/alongamento já foi feito mais cedo, e aderência semanal integrada à análise do ciclo (spec 024) e ao Perfil Integrado.

Decisões detalhadas em [research.md](./research.md) (R1–R7), modelo em [data-model.md](./data-model.md), contratos em [contracts/api.md](./contracts/api.md) e [contracts/ui.md](./contracts/ui.md), e roteiro em [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict); Next.js 14 App Router / React 18; Fastify (API)
**Primary Dependencies**: `@helux/types`, `@helux/workouts`, `@helux/ai`, Zod, `@supabase/supabase-js`; web: componentes do Design System v2 (`Segmented`, `Sheet`, `Banner`, `Button`, `SectionHeader`, `ExerciseDemo`)
**Storage**: Supabase Postgres: nova tabela `complementary_routine_logs`; nova coluna `complementary_preferences jsonb` em `user_training_profile`; cliente: `localStorage` isolado `helux:active-routine`
**Testing**: Vitest em `types`, `workouts`, `ai`, `api` e `web` (Testing Library); TDD estrito (Red–Green–Refactor); modo mock (spec 021) atualizado com fixtures das 3 rotinas
**Target Platform**: Web responsiva (Vercel) + API (Render); uso principal no celular
**Project Type**: Monorepo: `packages/types`, `packages/workouts`, `packages/ai`, `apps/api`, `apps/web`, `supabase/migrations`
**Performance Goals**: Prescrição e recálculo das 3 rotinas em < 10 ms (SC-002, puro em memória); iniciar rotina em ≤ 2 toques e concluir cardio em < 15 s (SC-003)
**Constraints**: Nunca alterar `current_session_index` nem `helux:active-workout` ao usar rotinas complementares (SC-001); 0 chamadas de IA para montar/ajustar rotinas complementares; planos antigos com sessões `cardio`/`mobilidade` na fila continuam abrindo sem quebrar
**Scale/Scope**: 1 migração SQL, 1 catálogo tipado novo em `@helux/types`, 1 módulo puro novo em `@helux/workouts`, 1 grupo de rotas Fastify (`/api/routines`), ~5 componentes/telas na web + mocks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo reside nos pacotes e apps existentes do monorepo (`packages/types`, `packages/workouts`, `packages/ai`, `apps/api`, `apps/web`, `supabase/migrations`). |
| **II. Test-First (TDD)** | ✅ PASS | Testes primeiro para: catálogo `STRETCH_MOBILITY_BANK`, `prescribeComplementaryRoutines` (condições articulares, crise ativa, preferências de tempo/frequência), `computeWeeklyRoutineProgress`, `checkCardioLegDayConflict`, `isCooldownSatisfiedByRoutines`, ajuste de `prescribeMethod`/`validateAgainstMethod` (fila só de força), rotas `/api/routines` e componentes (`DailyRoutinesSection`, `RoutinesTab`, `RoutineExecutionClient`). |
| **III. Independent Deployability** | ✅ PASS | Novas rotas `/api/routines` e nova tabela/coluna são aditivas; planos antigos continuam válidos tanto na API quanto na web. |
| **IV. Shared Code via Packages** | ✅ PASS | Tipos e catálogo em `@helux/types`; prescrição determinística, progresso semanal e regras de sinergia em `@helux/workouts`, consumidos tanto pela API quanto pela web. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Apenas 1 rotina fixa por categoria no ciclo (clarify Q4); preferências salvas em JSONB no perfil existente em vez de tabela extra (R4); prescrição determinística sem LLM (R2). |

**Re-check pós-design (Phase 1)**: ✅ Todos os princípios continuam em conformidade sem exceções.

## Project Structure

### Documentation (this feature)

```text
specs/030-rotinas-complementares/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── ui.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20261109000000_030_complementary_routines.sql   # novo: complementary_routine_logs + complementary_preferences em user_training_profile

packages/types/src/
├── routines.ts                                     # novo: tipos das rotinas + STRETCH_MOBILITY_BANK + CORE_ROUTINE_BANK
├── cardio.ts                                       # + orientações curtas (cues / zoneGuidance) por modalidade
├── cycle.ts                                        # + complementaryAdherence opcional em CycleSummary
└── index.ts                                        # reexporta ./routines

packages/workouts/src/
├── complementary-routines.ts                       # novo: prescribeComplementaryRoutines, computeWeeklyRoutineProgress,
│                                                   #       checkCardioLegDayConflict, isCooldownSatisfiedByRoutines
├── method.ts                                       # allocate: fila A/B/C/D exclusiva para força (FR-002a)
├── cycle-analysis.ts                               # inclui aderência das 3 rotinas complementares (FR-016)
├── index.ts                                        # reexporta ./complementary-routines
└── __tests__/
    └── complementary-routines.test.ts              # novo: testes unitários TDD

packages/ai/src/
├── mesocycle-prompts.ts                            # instrui weekTemplate focada nas sessões de academia (FR-002a)
└── agents/
    └── method-validation.ts                        # não exige sessões avulsas de cardio/mobilidade na fila A/B/C/D

apps/api/src/
├── routes/routines.ts                              # novo: GET /api/routines, PUT /api/routines/preferences,
│                                                   #       POST /api/routines/logs, DELETE /api/routines/logs/:id
├── services/routines.service.ts                    # novo: lê perfil/condições/mesociclo/logs e monta ComplementaryRoutinesView
├── services/cycle-analysis.service.ts              # passa logs complementares para analyzeCycle
├── services/integrated-profile.service.ts          # resume aderência às rotinas complementares no Perfil Integrado
└── app.ts                                          # registra routinesRoutes

apps/web/src/
├── app/page.tsx + HomeClient.tsx                   # carrega e exibe DailyRoutinesSection + passa completedToday
├── app/treinos/page.tsx + TreinosClient.tsx        # Segmented Academia | Rotinas + selo de volta à calma cumprida
├── app/treinos/proximo/ProximoTreinoClient.tsx     # selo de volta à calma cumprida hoje
├── app/treinos/rotina/[category]/page.tsx          # novo: tela de execução por categoria
├── app/workout/page.tsx                            # indica na volta à calma quando cardio/alongamento já foi feito hoje
├── components/routines/
│   ├── DailyRoutinesSection.tsx                    # novo: bloco Rotinas do Dia na Home
│   ├── RoutinesTab.tsx                             # novo: sub-aba Rotinas em /treinos
│   ├── RoutinePreferencesSheet.tsx                 # novo: ajuste de frequência, duração e foco/modalidade
│   └── RoutineExecutionClient.tsx                  # novo: execução guiada (timer alongamento, séries core, conclusão cardio)
├── hooks/
│   ├── useRoutines.ts                              # novo: busca/atualiza /api/routines, preferências e logs
│   └── useActiveRoutine.ts                         # novo: estado isolado em localStorage ('helux:active-routine')
├── services/routines.service.ts                    # novo: cliente HTTP de /api/routines
└── mocks/                                          # fixtures, rotas mockadas e personas com rotinas complementares
```

**Structure Decision**: Segue a arquitetura do monorepo Helux. Regras determinísticas puras ficam em `@helux/workouts` e catálogos/tipos em `@helux/types`, compartilhados entre `apps/api` e `apps/web`.

## Implementation Order

1. **Migração e Tipos (`@helux/types`)**: migração SQL `030`, tipos `ComplementaryRoutine*`, `STRETCH_MOBILITY_BANK`, metadados de core e orientações de cardio.
2. **Motor Determinístico (`@helux/workouts`) e Ajuste do Método (`@helux/ai`)**: `prescribeComplementaryRoutines`, progresso semanal, conflito cardio × treino de pernas, dispensa de volta à calma duplicada, fila `A/B/C/D` focada em força e integração em `analyzeCycle` (tudo em TDD).
3. **API (`apps/api`)**: `routines.service.ts`, rotas `/api/routines*`, integração com `cycle-analysis.service` e `integrated-profile.service`.
4. **Web — Estado e Execução (`apps/web`)**: `useActiveRoutine` (isolado de `useActiveWorkout`), `useRoutines`, `/treinos/rotina/[category]` (`RoutineExecutionClient` para Alongamento, Core e Cardio).
5. **Web — Home, Sub-aba Rotinas e Sinergia**: `DailyRoutinesSection` na Home, `Segmented` `Academia | Rotinas` + `RoutinesTab` + `RoutinePreferencesSheet` em `/treinos`, e selo `"Já cumprido hoje nas Rotinas"` na volta à calma da academia.
6. **Mocks (spec 021) e Validação End-to-End**: rotas mockadas para `/api/routines*` e conferência do `quickstart.md`.
