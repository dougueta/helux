# Implementation Plan: Melhorias pós primeiro uso — digitação de carga e preview do próximo treino

**Branch**: `026-melhorias-pos-uso` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/026-melhorias-pos-uso/spec.md`

## Summary

Duas melhorias só na web, sem mudança de API, banco ou pacotes:

1. **Carga e repetições digitáveis (US1)**: o valor central do `Stepper` vira um campo de texto com teclado numérico, confirmado no blur/Enter. Os botões −/+ continuam. A carga passa a guardar até duas casas decimais (10,25 / 10,50 kg); hoje o `round1` do `Stepper` corta para uma. Reps são inteiras. A normalização (vírgula/ponto, vazio, faixa, casas) fica numa função pura testada.
2. **Preview do próximo treino (US2)**: nova tela `/treinos/proximo`, aberta pela Home ("Ver treino") e pela aba Treinos. Ela mostra `plan.today` completo com a `PlanExerciseList` (que ganha descanso e linhas tocáveis) e o detalhe pela `ExerciseSheet` em modo só leitura (`onApply` opcional). Não cria sessão nem check-in. "Iniciar treino" reaproveita o fluxo da Home; com sessão ativa, o botão vira "Continuar treino".

Decisões em [research.md](./research.md) (R1–R7); dados em [data-model.md](./data-model.md); contratos de componentes e rota em [contracts/ui.md](./contracts/ui.md).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), React 18 / Next.js 14 App Router
**Primary Dependencies**: `@helux/types`, `@helux/workouts` (`restSecondsAfterSet`, `groupByPhase`, `isMainExercise`); componentes existentes da web (`Stepper`, `CurrentSet`, `PlanExerciseList`, `ExerciseSheet`, `useWorkoutPlan`, `useActiveWorkout`, `useTirednessFlow`)
**Storage**: Nenhuma mudança. A sessão ativa continua em `localStorage` (`useActiveWorkout`); as séries continuam indo para `POST /workout-sessions`, que já aceita `weight` com qualquer casa decimal
**Testing**: Vitest + Testing Library (web), TDD estrito; modo mock da 021 para validação manual
**Target Platform**: Web responsiva (Vercel), com uso principal no celular
**Project Type**: Monorepo; esta feature toca só `apps/web`
**Performance Goals**: Preview abre com o plano já em cache do `useWorkoutPlan` / do server component (sem chamada nova); digitação sem atraso perceptível
**Constraints**: Os testes atuais de `Stepper`, `SetRow` e `workout-page` continuam passando (SC-005); o preview não escreve nada (SC-003); o preview e a sessão usam a mesma fonte, `plan.today` (SC-004)
**Scale/Scope**: 1 rota nova, 1 função pura nova, ~6 componentes alterados (`Stepper`, `CurrentSet`, `ExerciseSheet`, `PlanExerciseList`, `HomeClient`, `TreinosClient`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo em `apps/web`. |
| **II. Test-First (TDD)** | ✅ PASS | Testes primeiro: `parseStepperInput`/`roundTo` (pura), `Stepper` (digitar, vírgula, vazio, faixa, ±, Escape), `ExerciseSheet` sem `onApply`, `PlanExerciseList` com descanso e `onSelect`, `ProximoTreinoClient` (lista, sem escrita em `localStorage`/API, Iniciar vs Continuar, redirect sem `today`), botões de entrada na Home e na aba Treinos. |
| **III. Independent Deployability** | ✅ PASS | Só a web muda; nenhuma dependência de deploy da API. |
| **IV. Shared Code via Packages** | ✅ PASS | O descanso vem de `@helux/workouts` (`restSecondsAfterSet`), sem regra duplicada. A normalização fica em `apps/web/src/lib` porque só a web a usa. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Reaproveita `PlanExerciseList`, `ExerciseSheet` e `useTirednessFlow` com props opcionais em vez de componentes novos. Sem teclado próprio, sem modal de edição. |

**Re-check pós-design (Phase 1)**: ✅ mantém PASS. Nenhuma abstração nova além de uma função pura e uma rota.

## Project Structure

### Documentation (this feature)

```text
specs/026-melhorias-pos-uso/
├── plan.md              # Este arquivo
├── research.md          # R1–R7
├── data-model.md        # Regras de entrada; estados do preview
├── quickstart.md        # Rodar, testar, roteiro manual
├── contracts/
│   └── ui.md            # Stepper, ExerciseSheet, PlanExerciseList, /treinos/proximo
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/src/
├── lib/
│   └── stepperInput.ts                     # NOVO: parseStepperInput, roundTo
├── components/
│   ├── ui/
│   │   ├── Stepper.tsx                     # valor digitável, max/decimals
│   │   └── CurrentSet.tsx                  # kg: decimals 2, max 500; reps: decimals 0, max 100
│   └── workout/
│       ├── ExerciseSheet.tsx               # onApply opcional (só leitura)
│       └── PlanExerciseList.tsx            # descanso + onSelect opcional
├── app/
│   ├── HomeClient.tsx                      # botão "Ver treino"
│   └── treinos/
│       ├── TreinosClient.tsx               # link "Ver treino completo" + lista tocável
│       └── proximo/
│           ├── page.tsx                    # NOVO (server)
│           └── ProximoTreinoClient.tsx     # NOVO
└── __tests__/
    ├── lib/stepperInput.test.ts            # NOVO
    ├── components/ui/Stepper.test.tsx      # ampliado
    ├── components/workout/ExerciseSheet.test.tsx
    ├── components/workout/PlanExerciseList.test.tsx
    └── app/proximo-treino.test.tsx         # NOVO
```

**Structure Decision**: Mudança contida em `apps/web`, na estrutura existente. A rota nova fica sob `/treinos` para manter a aba ativa no `NavBar`.

## Riscos

- **`startWorkout` sobrescreve uma sessão em andamento sem avisar** (comportamento atual da Home/Treinos). O preview evita isso ("Continuar treino"), mas a 026 não muda a Home e a aba Treinos. Fica registrado como observação, fora de escopo.
- **Reps 0**: o `Stepper` aceita 0 hoje, e a API exige `reps > 0`. A 026 mantém o mínimo 0 e o tratamento atual no salvamento, sem mudar comportamento.
- **Valor digitado e não confirmado** ao tocar direto no ✓ da série: o blur do campo acontece antes do clique, então o valor é confirmado primeiro. Coberto por teste (FR-006).

## Complexity Tracking

Nenhuma violação a justificar.
