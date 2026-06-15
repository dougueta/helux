# Implementation Plan: App Mobile Helux (Phase 4)

**Branch**: `002-workouts-mobile` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-mobile-app/spec.md`

## Summary

Criar `apps/mobile` (Expo SDK 52 + Expo Router) com 4 abas (Hoje, Treinos, DNA, Progresso) + tela modal Treino Ativo + Exercise Sheet (bottom sheet com demonstração e variantes genéticas). Criar `packages/workouts` com lógica de sessão pura e testada (TDD). Todos os dados usam mocks locais nesta fase. Design fiel ao handoff em `c:\Users\Doug\Downloads\helux\design_handoff_helux\`.

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: Expo SDK 52, Expo Router, React Native, React Native Reanimated 3, `@gorhom/bottom-sheet` v5, `@react-native-async-storage/async-storage`, `expo-font`, `@expo-google-fonts/space-grotesk`, `@expo-google-fonts/jetbrains-mono`  
**Storage**: AsyncStorage (chaves `helux:active-session`, `helux:workout-history`)  
**Testing**: Vitest 3.2.6 (para `packages/workouts` — funções puras, sem dependência de plataforma)  
**Target Platform**: iOS 16+ (Expo Go / Expo Build)  
**Project Type**: Mobile app (`apps/mobile`) + package de lógica (`packages/workouts`)  
**Performance Goals**: Abertura do sheet < 300ms; registro de série < 10s; render de tela < 100ms  
**Constraints**: Sem chamadas de rede na Phase 4; dados mock locais; TDD obrigatório em `packages/workouts`  
**Scale/Scope**: 1 usuário, 6 telas, ~30 componentes de UI

## Constitution Check

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Monorepo-First | ✅ | `apps/mobile` e `packages/workouts` residem neste repo |
| II. Test-First | ✅ | TDD estrito em `packages/workouts`; testes antes de cada função |
| III. Independent Deployability | ✅ | `apps/mobile` usa dados mock; não depende de `apps/api` em runtime (Phase 4) |
| IV. Shared Code via Packages | ✅ | Lógica de sessão em `packages/workouts`; tipos em `packages/types` |
| V. Simplicity | ✅ | `useReducer` local sem Zustand; `StyleSheet` sem NativeWind; sem abstrações desnecessárias |

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-app/
├── plan.md                    # Este arquivo
├── spec.md                    # Especificação de produto
├── research.md                # Decisões de design (Phase 0)
├── data-model.md              # Entidades e API de packages/workouts (Phase 1)
├── contracts/
│   └── navigation-screens.md  # Contratos de telas e componentes (Phase 1)
└── tasks.md                   # Tarefas TDD (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
packages/workouts/
├── package.json               # @helux/workouts
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts               # exports: funções puras + types
    ├── types.ts               # Variant, ActiveExercise, SetState, ActiveSession, WorkoutSummary
    ├── session.ts             # startSession, logSet, completeSet, swapVariant, addSet, finishSession
    ├── storage.ts             # StorageAdapter, saveSession, loadSession, clearSession
    └── __tests__/
        ├── session.test.ts
        └── storage.test.ts

apps/mobile/
├── package.json               # @helux/mobile
├── app.json                   # Expo config
├── tsconfig.json
├── app/
│   ├── _layout.tsx            # Root Stack + font loading
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Bottom tab navigator (ícones, cores)
│   │   ├── index.tsx          # Tela Hoje
│   │   ├── treinos.tsx        # Tela Treinos
│   │   ├── dna.tsx            # Tela DNA
│   │   └── progresso.tsx      # Tela Progresso
│   └── treino-ativo.tsx       # Tela Treino Ativo (modal stack)
└── src/
    ├── constants/
    │   └── theme.ts           # Design tokens (cores, fontes, raios)
    ├── data/
    │   └── mock.ts            # Dados mock (traduzido de helux-data.jsx)
    └── components/
        ├── shared/
        │   ├── Ring.tsx       # SVG ring animado
        │   ├── MatchBadge.tsx # Pill de fit genético
        │   ├── Chip.tsx       # Chip genérico
        │   ├── Label.tsx      # Label uppercase
        │   ├── Icon.tsx       # Ícones SVG inline
        │   └── HelixMark.tsx  # Logo SVG
        ├── home/
        │   ├── HeroCard.tsx
        │   ├── RecoveryCard.tsx
        │   ├── WeekDotsCard.tsx
        │   └── GeneticInsightCard.tsx
        ├── workout-list/
        │   ├── ProgramCard.tsx
        │   └── WorkoutRow.tsx
        ├── dna/
        │   ├── DnaHero.tsx
        │   ├── GeneticTraitRow.tsx
        │   └── DriverGrid.tsx
        ├── progress/
        │   ├── StatGrid.tsx
        │   ├── BarChart.tsx
        │   ├── PersonalRecordRow.tsx
        │   └── SessionHistoryRow.tsx
        └── active-workout/
            ├── ExerciseProgressSegments.tsx
            ├── ExerciseHeader.tsx
            ├── SetRow.tsx
            ├── SetTable.tsx
            ├── RestTimerBanner.tsx
            ├── WorkoutCompletionScreen.tsx
            ├── ExerciseSheet.tsx           # Bottom sheet container
            ├── ExerciseDemo.tsx            # Player de demonstração (placeholder SVG)
            ├── MuscleMapSVG.tsx            # Silhueta muscular
            ├── ExecutionTab.tsx            # Aba Execução no sheet
            └── VariantsTab.tsx             # Aba Variantes no sheet
```

**Structure Decision**: Monorepo com Turborepo. `packages/workouts` contém lógica pura testável; `apps/mobile` contém toda a UI. Componentes organizados por domínio de tela (shared, home, workout-list, dna, progress, active-workout).

## Complexity Tracking

| Decisão | Por que necessária | Alternativa rejeitada |
|---------|-------------------|-----------------------|
| `@gorhom/bottom-sheet` | Sheet com 94% de altura, gesture-to-dismiss e animação cubic-bezier não implementáveis de forma confiável com `Modal` nativo | `Modal` com `Animated` — rejeitado por complexidade de gesture no iOS |
| `packages/workouts` separado de `apps/mobile` | Constituição IV: lógica de negócio não pode residir em `apps/`; também permite testes com Vitest sem plataforma | Co-locação em `apps/mobile/src/` — rejeitado pela constituição |
