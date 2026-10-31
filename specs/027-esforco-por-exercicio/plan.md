# Implementation Plan: Esforço-alvo de cada exercício durante o treino

**Branch**: `027-esforco-por-exercicio` | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-esforco-por-exercicio/spec.md`

## Summary

O plano já define um alvo em repetições na reserva (`PlannedExercise.rirTarget`) para cada exercício principal. Hoje ele só aparece na lista do plano. Esta feature:

1. **US1**: mostra o alvo na tela do treino, em linguagem simples ("Esforço-alvo: Moderado a difícil · sobrar 2 repetições"), com uma explicação aberta por um toque e a marcação da semana de descarga. A lista do plano e o preview passam a usar o mesmo texto.
2. **US2**: abaixo do "Como foi o esforço?", compara o nível marcado com o alvo ("No alvo", "Abaixo do alvo" ou "Acima do alvo") e, fora do alvo, sugere o que fazer na próxima série ou no próximo treino. Só orienta: não muda carga nem progressão.
3. **US3**: o resumo do treino finalizado mostra quantos exercícios ficaram no alvo e lista os que ficaram fora.

A regra (tabela de correspondência, comparação, sugestões e resumo) é pura e fica em `@helux/workouts`. A web ganha dois componentes pequenos, um campo opcional na sessão local (`deload`) e uma prop opcional na tela de treino concluído. Não há mudança de API, banco nem do tipo `PlannedExercise`.

Decisões em [research.md](./research.md) (R1–R8), tipos em [data-model.md](./data-model.md) e contratos em [contracts/ui.md](./contracts/ui.md).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), React 18 / Next.js 14 App Router
**Primary Dependencies**: `@helux/workouts` (`EffortLevel`, `EFFORT_LEVELS`, `isMainExercise`), `@helux/types` (`PlannedExercise.rirTarget`); web: `EffortPicker`, `useActiveWorkout`, `WorkoutDoneScreen`, `PlanExerciseList`
**Storage**: Nenhuma mudança remota. A sessão ativa em `localStorage` ganha `deload?: boolean` (opcional, compatível com estados antigos)
**Testing**: Vitest (pacote `workouts`) e Vitest + Testing Library (web), com TDD estrito; modo mock da 021 para o roteiro manual
**Target Platform**: Web responsiva (Vercel), uso principal no celular
**Project Type**: Monorepo; toca `packages/workouts` e `apps/web`
**Performance Goals**: A comparação é calculada na renderização, sem chamada de rede (SC-003 < 1 s)
**Constraints**: `progression.ts` e a suíte de progressão continuam iguais (SC-004/FR-011); os testes atuais da `workout-page`, `PlanExerciseList` e `WorkoutDoneScreen` continuam passando (a linha antiga "Deixe N repetições na reserva" é trocada nos testes que a citam)
**Scale/Scope**: 1 módulo puro novo, 2 componentes novos, ~6 arquivos alterados (`index.ts` do workouts, `useActiveWorkout`, `workout/page.tsx`, `WorkoutDoneScreen`, `PlanExerciseList`, os 3 chamadores de `startWorkout`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo dentro do monorepo. |
| **II. Test-First (TDD)** | ✅ PASS | Primeiro os testes de `effort-target` (tabela R2 para RIR 0–5, comparação nos três sentidos, sugestões com e sem série pendente, resumo com e sem itens). Depois `EffortTargetLine` (sem RIR, descarga, explicação com `aria-expanded`), `EffortComparisonNote`, `workout-page` (alvo visível, comparação muda ao trocar o nível, nada em aquecimento), `WorkoutDoneScreen` (três estados) e `useActiveWorkout` (`deload`). |
| **III. Independent Deployability** | ✅ PASS | Só muda a web e um pacote compartilhado já usado por ela; a API não muda. |
| **IV. Shared Code via Packages** | ✅ PASS | A regra fica em `@helux/workouts`, ao lado da escala `EffortLevel`. A web não duplica a tabela. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Tabela fixa em vez de fórmula configurável; explicação inline com `aria-expanded` em vez de folha. O resumo é congelado como o volume já é. |

**Re-check pós-design (Phase 1)**: ✅ continua PASS. O único estado novo é `deload?` na sessão local, justificado em R5.

## Project Structure

### Documentation (this feature)

```text
specs/027-esforco-por-exercicio/
├── plan.md              # Este arquivo
├── research.md          # R1–R8
├── data-model.md        # Tipos e funções de effort-target; campo deload da sessão
├── quickstart.md        # Rodar, testar, roteiro manual
├── contracts/
│   └── ui.md            # EffortTargetLine, EffortComparisonNote, tela de treino, resumo
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/workouts/src/
├── effort-target.ts                         # NOVO: effortTarget, compareEffort, effortAdvice, effortLevelLabel, summarizeEffort
├── index.ts                                 # exporta effort-target
└── __tests__/effort-target.test.ts          # NOVO

apps/web/src/
├── components/workout/
│   ├── EffortTargetLine.tsx                 # NOVO
│   ├── EffortComparisonNote.tsx             # NOVO
│   ├── PlanExerciseList.tsx                 # usa EffortTargetLine
│   └── WorkoutDoneScreen.tsx                # prop effort opcional
├── hooks/useActiveWorkout.ts                # deload? + startWorkout(…, { deload })
├── app/
│   ├── workout/page.tsx                     # alvo, comparação, effort no finishSummary
│   ├── HomeClient.tsx                       # passa deload
│   └── treinos/
│       ├── TreinosClient.tsx                # passa deload
│       └── proximo/ProximoTreinoClient.tsx  # passa deload
└── __tests__/
    ├── components/workout/EffortTargetLine.test.tsx       # NOVO
    ├── components/workout/EffortComparisonNote.test.tsx   # NOVO
    ├── components/workout/WorkoutDoneScreen.test.tsx      # ampliado
    ├── components/workout/PlanExerciseList.test.tsx       # texto do alvo
    ├── hooks/useActiveWorkout.test.ts                     # deload
    └── app/workout-page.test.tsx                          # alvo e comparação
```

**Structure Decision**: A regra fica no pacote de domínio do treino, e a apresentação fica nos componentes de `apps/web/src/components/workout`, seguindo o padrão do `EffortPicker` e do `WeekBadge`.

## Riscos

- **Testes que citam "repetições na reserva"**: a troca do texto da lista (FR-006) quebra asserções existentes. Elas são atualizadas na mesma tarefa, sem afrouxar.
- **Sessões em andamento antes do deploy**: não têm `deload`, então não mostram "Semana de descarga" até o próximo treino. O alvo e a comparação funcionam, porque `rirTarget` já está em `planExercises`.
- **Nível padrão do histórico (8 sem relato)**: o resumo só conta exercícios com esforço marcado; o padrão 8 nunca entra na comparação.

## Complexity Tracking

Nenhuma violação a justificar.
