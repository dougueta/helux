# Implementation Plan: Cansaço Percebido com Níveis e Confirmação de Ajuste

**Branch**: `011-cansaco-niveis` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/011-cansaco-niveis/spec.md`

## Summary

Substituir o sinal binário de cansaço (spec 008) por um **nível** (ótimo/normal/cansado/exausto) salvo por dia, consolidado com o nível derivado do HRV numa **avaliação de cansaço do dia** (`TirednessAssessment`) com regra de precedência (relógio prevalece, salvo sobreposição manual confirmada). Toda a lógica de domínio (mapeamento HRV → nível, precedência, discordância, ajuste de séries/carga, diff "antes → depois" e prévia de uma escolha) vira um módulo **puro** em `@helux/workouts`, usado pela API (para montar o treino do dia) e pela web (para prever o que muda **antes** de salvar, sem ida extra ao servidor). A web ganha um seletor de níveis na Home e um diálogo em etapas (pergunta → confirmação de discordância → resumo de mudanças) usado tanto na Home quanto ao tocar "Iniciar treino".

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js 14 App Router (web), Fastify + zod (api), Supabase JS
**Storage**: Supabase Postgres — tabela existente `daily_tiredness_signals` ganha colunas `level` e `override_automatic` (migration nova, não aplicada por este trabalho)
**Testing**: Vitest (+ Testing Library/jsdom na web)
**Target Platform**: web responsiva (MVP web-only)
**Project Type**: monorepo web (apps/web) + API (apps/api) + pacotes compartilhados
**Performance Goals**: prévia de mudanças instantânea (cálculo local); salvar + refetch em poucos segundos, sem IA
**Constraints**: não reintroduzir TD-006 — toda mudança salva que altere `GET /workout/latest-plan` deve chamar `refetch()` de `useWorkoutPlan`
**Scale/Scope**: 1 tabela alterada, 2 rotas API alteradas, 2 componentes novos, 1 hook reescrito, 1 módulo de domínio novo

## Constitution Check

| Princípio | Situação |
|---|---|
| I. Monorepo-First | OK — tudo dentro do monorepo. |
| II. Test-First | OK — tasks ordenadas teste (RED) → implementação (GREEN) para domínio, API e web. |
| III. Independent Deployability | Atenção — a API nova lê colunas novas: a migration deve ser aplicada antes do deploy da API (registrado no quickstart). Web e API conversam só via contrato (`contracts/api.md`) e tipos em `@helux/types`. |
| IV. Shared Code via Packages | OK — lógica de domínio em `@helux/workouts` (consumida por api e web: dois consumidores concretos); tipos em `@helux/types`. |
| V. Simplicity | OK — sem endpoint de "preview" no servidor (a prévia é a mesma função pura rodando no cliente); POST/DELETE legados substituídos por GET/PUT, sem manter duas APIs. |

Re-check pós-design: sem violações novas. Ver Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-cansaco-niveis/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/types/src/
├── tiredness.ts              # NOVO: TirednessLevel, TirednessAssessment, ExerciseAdjustmentChange
├── mesocycle.ts              # AdjustedSession + plannedExercises?, changes?, tiredness?
└── profile.ts                # remove DailyTirednessSignal {active} (binário)

packages/workouts/src/
├── tiredness.ts              # NOVO: hrvToTirednessLevel, assessTiredness, adjustExercisesForLevel,
│                             #       diffExercises, buildAdjustedSession, previewTirednessChoice, labels
└── __tests__/tiredness.test.ts

packages/ai/src/
└── recovery-adjustment.ts    # REMOVIDO (substituído por buildAdjustedSession) + teste

apps/api/src/
├── services/tiredness.service.ts   # NOVO: getTodayTirednessAssessment(userId, supabase)
├── routes/tiredness-today.ts       # GET/PUT (substitui POST/DELETE)
├── routes/workout-latest-plan.ts   # usa o service + buildAdjustedSession
└── __tests__/{tiredness-today,tiredness.service,workout-latest-plan}.test.ts

apps/web/src/
├── services/tiredness.service.ts   # getTirednessToday / setTirednessToday
├── hooks/useTirednessFlow.ts       # NOVO (substitui useTiredness.ts): máquina de etapas do diálogo
├── hooks/useWorkoutPlan.ts         # ignora cache local de outro dia
├── components/workout/TirednessSelector.tsx   # NOVO (substitui TirednessToggle.tsx)
├── components/workout/TirednessDialog.tsx     # NOVO: pergunta / discordância / resumo
├── components/workout/AdjustmentChangesList.tsx  # NOVO: lista "séries/carga antes → depois"
├── components/workout/TirednessLevelPicker.tsx   # NOVO: 4 botões de nível (Home + pergunta)
├── app/HomeClient.tsx              # integra seletor + fluxo de início
└── __tests__/...

supabase/migrations/
└── 20260922000000_tiredness_levels.sql   # NOVO
```

**Structure Decision**: seguir o layout existente do monorepo; web e api passam a depender de `@helux/workouts` (web também adiciona o pacote a `transpilePackages`).

## Design

### Fluxo de decisão (puro, `previewTirednessChoice`)

Entrada: avaliação atual, exercícios planejados, exercícios exibidos, nível candidato. Saída:
- `conflict`: há dado automático e `tier(candidato) ≠ tier(automático)`, exceto se o candidato já é o manual sobreposto do dia.
- `overrideAutomatic`: `true` se (e somente se) há conflito confirmado.
- `nextAssessment` / `nextExercises`: resultado caso aplicado (com a sobreposição, se confirmada).
- `changesFromCurrent`: diff exibidos → próximos; `changesFromPlanned`: diff planejados → próximos.
- `needsSave`: candidato/override diferentes do que está salvo.

### Etapas da UI (`useTirednessFlow`)

- **Home** (toque num nível): conflito? → etapa *conflito*; senão, `changesFromCurrent` não vazio? → etapa *mudanças*; senão salva direto. Recusar/cancelar fecha sem salvar.
- **Iniciar treino**: etapa *pergunta* (pré-selecionado `effectiveLevel ?? 'normal'`) → conflito? → *mudanças* se `changesFromCurrent` não vazio (base = exibido) ou se o resultado está ajustado vs. planejado (base = planejado) → salva se `needsSave` → `refetch()` → `startWorkout(plan.today.exercises)` → `/workout`. Recusar conflito ou cancelar mudanças volta à pergunta; fechar a pergunta cancela tudo.
- Todo salvamento: `PUT /api/tiredness-today` → `refetch()` (TD-006).

## Complexity Tracking

| Item | Por quê | Alternativa mais simples rejeitada |
|---|---|---|
| Web passa a depender de `@helux/workouts` | A prévia "o que muda" precisa da mesma regra de ajuste que a API aplica; duplicar violaria o princípio IV | Endpoint de preview no servidor: ida e volta extra por toque e duplicação da montagem do treino na rota |
| Remoção de `applyRecoveryAdjustment` de `@helux/ai` | A regra "mais conservador" da 008 foi substituída; manter duas regras seria inconsistente | Manter as duas e só trocar a chamada deixaria código morto |
