# Implementation Plan: Calendário visual de treino, saldo semanal e curiosidades do período

**Branch**: `031-calendario-treino` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/031-calendario-treino/spec.md`

## Summary

Hoje o histórico do Helux (`/history`) mostra apenas uma lista linear de sessões, enquanto os dados de rotinas complementares (spec 030), esforço percebido (spec 024/027) e peso corporal (spec 029) ficam espalhados em telas distintas.

Esta entrega cria o **Calendário de Treino** do Helux com foco em **excelência de experiência visual e tátil** (Design System v2):
1. **Grade visual mensal e semanal (`FR-001`–`FR-004`, `FR-011`)**: semanas de segunda a domingo com codificação visual imediata para dias com **treino de academia** (`--accent`), **rotina complementar** (`--success`) ou **ambos**, destaque contínuo na semana selecionada e painel de **Detalhe do Dia** (sessões com link para `/history/[id]`, rotinas e peso do dia) sem salto de layout.
2. **Saldo da Semana (`FR-005`–`FR-006`)**: cartão `.hx-focus` consolidando para a semana selecionada: **Assiduidade** (academia vs. meta + rotinas), **Esforço médio** (`1–10` + faixa *Leve / Moderado / Forte / Muito forte* + Δ vs. semana anterior), **Peso corporal** (média em `kg` + Δ vs. semana anterior) e **Carga & Tempo ativo** (tonelagem, séries e minutos somados).
3. **Curiosidades da Semana e do Mês (`FR-007`–`FR-008`)**: motor 100% determinístico em `@helux/workouts` (0 chamadas de IA) que transforma os dados reais da semana ou do mês em cartões comparativos (equivalência de tonelagem em carros/pianos/malas, PRs e maior carga, dia da semana mais fiel, exercício dominante e tempo total investido).
4. **Integração na Home e no Histórico (`FR-009`–`FR-010`)**: `/history` ganha seletor `Calendário | Lista` (com `Calendário` como padrão) e a **Home** ganha a tira compacta dos 7 dias da semana (`WeeklyCalendarStrip`) que leva ao calendário completo com 1 toque.

Decisões detalhadas em [research.md](./research.md) (R1–R5), modelo em [data-model.md](./data-model.md), contratos em [contracts/api.md](./contracts/api.md) e [contracts/ui.md](./contracts/ui.md), e roteiro de validação em [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict); Next.js 14 App Router / React 18; Fastify (API)
**Primary Dependencies**: `@helux/types`, `@helux/workouts`, Zod, `@supabase/supabase-js`; web: componentes do Design System v2 (`Segmented`, `ScreenHeader`, `SectionHeader`, `HistoryRow`, `IconButton`, `Skeleton`)
**Storage**: Supabase Postgres — **sem nova migração SQL** (lê `workout_sessions`, `session_checkins`, `complementary_routine_logs`, `body_weights` e `user_training_profile`)
**Testing**: Vitest em `types`, `workouts`, `api` e `web` (Testing Library); TDD estrito (Red–Green–Refactor); modo mock (spec 021) atualizado com rota `/api/workouts/calendar`
**Target Platform**: Web responsiva (Vercel) + API (Render); foco mobile-first com alvos `>= 44×44 px`
**Project Type**: Monorepo: `packages/types`, `packages/workouts`, `apps/api`, `apps/web`
**Performance Goals**: Agregação do mês, saldos semanais e curiosidades em `< 10 ms` em memória (SC-001); troca de dia/semana/escopo de curiosidades em `0 ms` (instantânea no cliente, sem nova requisição de rede); 0 chamadas de IA
**Constraints**: Respeitar fuso local (`America/Sao_Paulo` / datas `YYYY-MM-DD`); nunca exibir curiosidades com valores zerados (SC-004); manter a lista tradicional de histórico acessível na aba `Lista`
**Scale/Scope**: 1 módulo de tipos em `@helux/types`, 1 motor determinístico puro em `@helux/workouts`, 1 rota/serviço Fastify (`GET /api/workouts/calendar`), 4 componentes visuais na web + integração em `/history` e na `Home` + suporte no mock router

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Todo o código reside nos pacotes e apps existentes (`packages/types`, `packages/workouts`, `apps/api`, `apps/web`). |
| **II. Test-First (TDD)** | ✅ PASS | Testes unitários e de integração escritos antes da implementação para: `buildTrainingCalendarMonth`, `computeWeeklyBalance`, `classifyEffort`, `formatTonnageEquivalent`, `computePeriodCuriosities`, rota `GET /api/workouts/calendar` e componentes (`WorkoutCalendarView`, `WeeklyBalanceCard`, `PeriodCuriositiesSection`, `WeeklyCalendarStrip`). |
| **III. Independent Deployability** | ✅ PASS | Nova rota `GET /api/workouts/calendar` é 100% aditiva e não requer migração destrutiva; `/history` preserva a visão `Lista`. |
| **IV. Shared Code via Packages** | ✅ PASS | Contratos em `@helux/types` (`calendar.ts`) e motor puro de agregação/curiosidades em `@helux/workouts` (`training-calendar.ts`), reutilizados pela API real e pelo modo mock da web. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Sem novas tabelas ou migrações redundantes (agrega sobre tabelas existentes indexadas por data); curiosidades 100% determinísticas sem custo/latência de LLM. |

**Re-check pós-design (Phase 1)**: ✅ Todos os 5 princípios da Constituição continuam em conformidade.

## Project Structure

### Documentation (this feature)

```text
specs/031-calendario-treino/
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
└── tasks.md             # próxima etapa: speckit-tasks
```

### Source Code (repository root)

```text
packages/types/src/
├── calendar.ts                                     # novo: tipos CalendarDaySummary, WeeklyBalance, PeriodCuriosity, TrainingCalendarMonthView
└── index.ts                                        # reexporta ./calendar

packages/workouts/src/
├── training-calendar.ts                            # novo: buildTrainingCalendarMonth, computeWeeklyBalance, classifyEffort,
│                                                   #       formatTonnageEquivalent, computePeriodCuriosities
├── index.ts                                        # reexporta ./training-calendar
└── __tests__/
    └── training-calendar.test.ts                   # novo: suíte TDD cobrindo grade, semanas cruzando mês, saldo, deltas e curiosidades

apps/api/src/
├── routes/workout-calendar.ts                      # novo: GET /api/workouts/calendar?month=YYYY-MM
├── services/workout-calendar.service.ts            # novo: busca workout_sessions, complementary_routine_logs, body_weights e perfil
├── app.ts                                          # registra workoutCalendarRoutes
└── __tests__/
    └── workout-calendar.test.ts                    # novo: testes da rota GET /api/workouts/calendar (auth, validação, payload)

apps/web/src/
├── app/page.tsx + HomeClient.tsx                   # exibe WeeklyCalendarStrip na Home levando a /history
├── app/history/page.tsx                            # Segmented Calendário | Lista + WorkoutCalendarView como visão principal
├── app/treinos/TreinosClient.tsx                   # link "Ver calendário e histórico" → /history
├── components/calendar/
│   ├── WorkoutCalendarView.tsx                     # novo: orquestra navegação de mês, grade, detalhe do dia, saldo e curiosidades
│   ├── CalendarMonthGrid.tsx                       # novo: grade mensal (seg-dom) com linha semanal destacada e marcadores v2
│   ├── CalendarDayDetail.tsx                       # novo: resumo do dia selecionado (sessões com link, rotinas e peso do dia)
│   ├── WeeklyBalanceCard.tsx                       # novo: cartão .hx-focus do Saldo da Semana (assiduidade, esforço, peso, volume/tempo)
│   ├── PeriodCuriositiesSection.tsx                # novo: seção Curiosidades com Segmented Semana | Mês
│   └── WeeklyCalendarStrip.tsx                     # novo: tira compacta dos 7 dias da semana atual para a Home
├── hooks/
│   └── useWorkoutCalendar.ts                       # novo: busca e faz cache por mês de GET /api/workouts/calendar
└── mocks/
    └── routes.ts                                   # novo handler mock para GET /api/workouts/calendar usando buildTrainingCalendarMonth
```

**Structure Decision**: Mantém a separação limpa do monorepo Helux: tipos em `@helux/types`, regras de negócio e cálculos determinísticos puros em `@helux/workouts`, endpoint REST enxuto em `apps/api` e experiência visual v2 em `apps/web` (com suporte integral ao modo mock da spec 021).

## Implementation Order

1. **Tipos Compartilhados (`@helux/types`)**: criar `packages/types/src/calendar.ts` e reexportar em `packages/types/src/index.ts`.
2. **Motor Determinístico do Calendário, Saldo e Curiosidades (`@helux/workouts`) — TDD**: escrever testes em `packages/workouts/src/__tests__/training-calendar.test.ts` e implementar `packages/workouts/src/training-calendar.ts`.
3. **API (`apps/api`) — TDD**: escrever testes em `apps/api/src/__tests__/workout-calendar.test.ts` e implementar `workout-calendar.service.ts` + `routes/workout-calendar.ts` + registro em `app.ts`.
4. **Web — Componentes de Calendário, Saldo da Semana e Curiosidades (`apps/web`) — TDD**: implementar `useWorkoutCalendar`, `CalendarMonthGrid`, `CalendarDayDetail`, `WeeklyBalanceCard`, `PeriodCuriositiesSection`, `WorkoutCalendarView` e `WeeklyCalendarStrip` com testes de componentes.
5. **Web — Integração em `/history`, `Home`, `/treinos` e Modo Mock (spec 021)**: integrar `Segmented` (`Calendário | Lista`) em `/history`, `WeeklyCalendarStrip` na `Home`, handler em `apps/web/src/mocks/routes.ts` e validar toda a suíte.
