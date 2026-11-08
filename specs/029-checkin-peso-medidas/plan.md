# Implementation Plan: Check-in de peso e medidas com dados confiáveis

**Branch**: `029-checkin-peso-medidas` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/029-checkin-peso-medidas/spec.md`

## Summary

O check-in mensal único vira dois registros:

1. **Pesagem** (`body_weights`, uma por dia) com **peso de tendência** = média dos últimos 7 dias com ≥ 3 pesagens (US1).
2. **Registro de medidas** (`body_checkins` reaproveitada): 8 medidas, com braço/coxa/panturrilha dos dois lados, cargas e notas. O servidor calcula e **salva** o % de gordura pela Marinha. Um % de aparelho é opcional e tem origem (US2). O formulário ganha protocolo e guia "Onde medir?" com silhueta SVG (US4).

A fase de dieta deixa de recalibrar ao salvar o check-in. Agora o usuário toca em **Recalibrar dieta**, vê a proposta (calculada pelas tendências nas duas pontas, com a cintura desempatando) e aplica ou descarta (US3). O histórico mostra massa gorda e magra, cintura/altura e o lembrete de medidas com mais de 28 dias (US5).

As regras puras (tendência, composição, % efetivo, lembrete) ficam em `@helux/nutrition` (`weight-trend.ts`) e são usadas pela web e pela API. Os check-ins mensais são migrados por SQL. Os consumidores atuais (dieta, análise de ciclo da 024, Perfil Integrado, Home, mocks) mudam no mesmo PR.

Decisões em [research.md](./research.md) (R1–R11), modelo em [data-model.md](./data-model.md), contratos em [contracts/api.md](./contracts/api.md) e [contracts/ui.md](./contracts/ui.md).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict); Next.js 14 App Router / React 18; Fastify (API)
**Primary Dependencies**: `@helux/nutrition` (`navyBodyFat`, `recalibrate`, novo `weight-trend`), `@helux/types`, `@helux/workouts` (`checkinTrend`), Zod, `@supabase/supabase-js`; web: `Field`, `Sheet`, `Dialog`, `Segmented`, `Toast`
**Storage**: Supabase Postgres: nova `body_weights`; `body_checkins` alterada (R11); `diet_phase_calibrations.metrics` ganha `trendFrom/trendTo`
**Testing**: Vitest em `nutrition`, `workouts`, `api`, `web` (Testing Library); TDD estrito; modo mock (021) para o roteiro manual
**Target Platform**: Web responsiva (Vercel) + API (Fly.io); uso principal no celular
**Project Type**: Monorepo: `packages/types`, `packages/nutrition`, `packages/workouts`, `apps/api`, `apps/web`, `supabase/migrations`
**Performance Goals**: Registrar pesagem em < 15 s (SC-001); tendência calculada no cliente sobre ≤ 730 pesagens, sem chamada extra
**Constraints**: Migração sem perda de dados (SC-005, FR-025); nenhum consumidor de `BodyCheckin` pode ficar quebrado (tipo removido); sem dependência nova de gráficos (R9)
**Scale/Scope**: 1 usuário principal; ≤ 1 pesagem/dia. ~1 migração, 1 módulo puro novo, 2 grupos de rotas na API (weights, measurements) + 2 rotas de recalibração, ~5 componentes novos na web, ~12 arquivos alterados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo no monorepo; migração em `supabase/migrations`. |
| **II. Test-First (TDD)** | ✅ PASS | Primeiro os testes de `weight-trend` (tendência com 2/3/7 pesagens, gaps, variação semanal, peso de referência ±3 dias, confirmação > 3 kg, composição, cintura/altura, % efetivo com empate, lembrete 14/28 dias) e da faixa 3–60% em `navyBodyFat`. Depois as rotas (`weights`, `measurements`, `recalibration` em cada status), `evaluateRecalibration`, `checkinTrend` com origens diferentes e os componentes (`WeightForm`, `MeasurementForm`, `TrendChart`, `CheckinCard`, diálogo de recalibração). |
| **III. Independent Deployability** | ⚠️ ATENÇÃO | API e web mudam o contrato juntas (`/api/checkins` → `/api/measurements`, `/api/weights`). Deploy na ordem: migração → API → web. Entre a API e a web, a web antiga quebra no check-in. Aceitável para um app de um usuário com deploys em sequência; ver Complexity Tracking. |
| **IV. Shared Code via Packages** | ✅ PASS | Tendência, composição, % efetivo e lembrete ficam em `@helux/nutrition`; tipos em `@helux/types`. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Reaproveita `body_checkins` (R1); dois campos de % em vez de tabela de leituras (R2); preview/apply sem token (R5); gráfico SVG próprio (R9). |

**Re-check pós-design**: sem mudança; o único ponto de atenção continua sendo a ordem de deploy (III).

## Project Structure

### Documentation (this feature)

```text
specs/029-checkin-peso-medidas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── ui.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20261108000000_029_body_weights_measurements.sql   # novo (R11)

packages/types/src/
├── checkin.ts            # BodyWeight, BodyMeasurement, MeasurementInput, BodyFatSource, NavyStatus (remove BodyCheckin)
└── (nutrition types)     # DietCalibrationMetrics.trendFrom/trendTo, RecalibrationEvaluation

packages/nutrition/src/
├── weight-trend.ts       # novo: trendAt, trendSeries, weeklyChange, referenceWeight, needsConfirmation,
│                         #       bodyComposition, waistHeightRatio, effectiveBodyFat, measurementsDue
├── biometrics.ts         # navyBodyFat: faixa 3–60%
├── phase.ts              # textos "Peso de tendência"
└── __tests__/weight-trend.test.ts

packages/workouts/src/
└── checkin-trend.ts      # compara BodyMeasurement + peso de referência; % só com mesma origem

apps/api/src/
├── routes/weights.ts                 # novo
├── routes/measurements.ts            # novo (substitui routes/checkins.ts)
├── routes/nutrition-phase.ts         # + preview / apply
├── services/nutrition-context.service.ts   # pesagens + medidas
├── services/diet-phase.service.ts    # evaluateRecalibration, applyRecalibration (remove recalibrateOnCheckin)
├── services/cycle-analysis.service.ts
├── services/integrated-profile.service.ts
└── app.ts                            # registra rotas

apps/web/src/
├── app/checkin/page.tsx              # resumo + 2 botões
├── app/checkin/peso/page.tsx         # novo
├── app/checkin/medidas/page.tsx      # novo
├── app/checkin/medidas/[id]/page.tsx # novo
├── app/checkin/history/page.tsx      # abas Peso / Medidas
├── app/page.tsx + HomeClient.tsx     # dados novos para o CheckinCard
├── components/checkin/WeightForm.tsx           # novo
├── components/checkin/MeasurementForm.tsx      # substitui CheckinForm
├── components/checkin/MeasureGuide.tsx         # novo (silhueta SVG + textos)
├── components/checkin/TrendChart.tsx           # novo (SVG)
├── components/checkin/CheckinCard.tsx
├── components/checkin/MeasurementHistory.tsx   # substitui CheckinHistoryTable
├── components/nutrition/PhaseSection.tsx       # botão + RecalibrationDialog
├── components/nutrition/RecalibrationDialog.tsx # novo
├── services/weights.service.ts, measurements.service.ts (substituem checkin.service.ts)
├── hooks/useWeights.ts, useMeasurements.ts (substituem useCheckin/useCheckinHistory)
└── mocks/ (fixtures, routes, types, personas)
```

**Structure Decision**: Monorepo existente. Regras puras em `packages/nutrition` (já dependência de web e API), tipos em `packages/types`, rotas Fastify em `apps/api`, telas em `apps/web`.

## Implementation Order

1. Migração + tipos (base para todos).
2. `weight-trend` e `navyBodyFat` (puros, TDD).
3. API: weights, measurements, consumidores (nutrition-context, diet-phase, cycle-analysis, integrated-profile), recalibração preview/apply.
4. Web: services/hooks, WeightForm (MVP US1), MeasurementForm + guia (US2/US4), histórico + gráficos, Home, Nutrição (US3), métricas e lembrete (US5).
5. Mocks + roteiro manual do quickstart.
6. Backlog: registrar Apple Health, 1RM pelos treinos e fotos de progresso em `docs/backlog.md`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Mudança de contrato API+web no mesmo deploy (III) | `/api/checkins` mensal não representa pesagens diárias nem vários registros de medidas | Manter `/api/checkins` como compatibilidade exigiria emular "mês" sobre os dados novos só para uma janela de minutos entre deploys de um app de um usuário |
