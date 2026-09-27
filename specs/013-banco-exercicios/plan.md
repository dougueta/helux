# Implementation Plan: Banco de exercícios — variedade de animações + equivalência genética

**Branch**: `013-banco-exercicios` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/013-banco-exercicios/spec.md`

## Summary

Três frentes, todas determinísticas (sem LLM):

1. **Catálogo de animações** (`packages/types`): um catálogo único `MOTION_CATALOG` (chave → padrões/grupos musculares que a animação representa) compartilhado entre `@helux/ai` (resolução da animação por exercício + medição) e `apps/web` (presets visuais do `ExerciseDemo`, com teste garantindo que todo item do catálogo tem preset).
2. **Resolução por exercício + medição** (`packages/ai`): `resolveMotion(entry)` troca o `motionFor(pattern)` atual por regras ordenadas (padrão + grupo muscular + palavras do nome), com `press-flat` só como último recurso; `measureMotionCoverage()` calcula % de exercícios em animação genérica/incorreta e % em supino, com teste que reproduz a linha de base antiga (61,8% / 79,4%) e trava a meta nova.
3. **Equivalência genética entre padrões** (`packages/ai`): o banco ganha carga articular (joelho/ombro/lombar, 0–2) derivada por padrão + ajustes por id; `buildVariants()` extrai as articulações sinalizadas dos alertas, ajusta a compatibilidade por articulação (±4/nível vs. original) e adiciona até 2 equivalentes de outro padrão da mesma família que reduzem a carga sinalizada, marcados `crossPattern: true` com justificativa genética.

Na web, o `ExerciseDemo` ganha um segundo tipo de preset (**pose de corpo inteiro**, com cenário: chão, banco, assento, barra fixa, polia) além dos presets de braço existentes; a `ExerciseSheet` mostra a etiqueta "Equivalente". O banco cresce de 102 para 122 exercícios.

## Technical Context

**Language/Version**: TypeScript 5 (strict)
**Primary Dependencies**: Next.js 15 / React 19 (apps/web), Vitest + Testing Library; `@helux/ai`, `@helux/types`
**Storage**: N/A (planos já são JSON no Supabase; `Variant` ganha só um campo opcional — sem migração)
**Testing**: Vitest (`packages/ai`, `packages/types`, `apps/web`)
**Target Platform**: Web responsiva (MVP web-only)
**Project Type**: Monorepo pnpm/turbo (packages + apps)
**Performance Goals**: animação a 60 fps via `requestAnimationFrame` (mesmo loop atual); `buildVariants` O(n) sobre ~120 entradas
**Constraints**: Design System v2 (só tokens/classes `helux-v2.css`; acento só no implemento); movimento reduzido; RAM baixa (testes direcionados, suíte completa só no fim); não mexer em geração de plano/tela de treino ativo além do necessário (spec 014 em paralelo)
**Scale/Scope**: 122 exercícios, ~27 animações

## Constitution Check

| Princípio | Status | Nota |
|---|---|---|
| I. Monorepo-First | ✅ | Tudo em `packages/ai`, `packages/types`, `apps/web` |
| II. Test-First | ✅ | Cada tarefa começa por teste vermelho (medição, carga articular, equivalência, presets, etiqueta) |
| III. Independent Deployability | ✅ | Contrato via `@helux/types` (`Variant.crossPattern?`, `MOTION_CATALOG`); campo opcional, retrocompatível com planos salvos |
| IV. Shared Code via Packages | ✅ | Catálogo de animações em `packages/types` evita duplicar a lista entre ai e web |
| V. Simplicity | ✅ | Regras em tabelas; sem motor de física/esqueleto genérico — só interpolação linear entre duas poses, como hoje |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/013-banco-exercicios/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── motion-catalog.md
│   └── variants.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/types/src/
├── motion.ts                  # NOVO: MOTION_CATALOG, MotionKey, GENERIC_MOTION
├── workout.ts                 # Variant.crossPattern?: boolean
└── __tests__/motion.test.ts   # NOVO

packages/ai/src/
├── exercise-bank.ts           # +20 exercícios; campo stress derivado (PATTERN_STRESS + STRESS_OVERRIDES)
├── motions.ts                 # NOVO: resolveMotion(entry), measureMotionCoverage()
├── variants.ts                # articulações sinalizadas, ajuste por articulação, equivalentes entre padrões
└── __tests__/
    ├── motions.test.ts        # NOVO: linha de base vs. meta (SC-001/002/003)
    ├── exercise-bank.test.ts  # + tamanho/cobertura por padrão, stress
    └── variants.test.ts       # + equivalência genética (SC-004/005)

apps/web/src/
├── components/workout/ExerciseDemo.tsx      # presets de pose + cenários; data-motion
├── components/workout/ExerciseSheet.tsx     # etiqueta "Equivalente"
└── __tests__/components/workout/
    ├── ExerciseDemo.test.tsx                # + todo item do catálogo tem preset, pose renderiza, reduzido
    └── ExerciseSheet.test.tsx               # + etiqueta Equivalente
```

**Structure Decision**: monorepo existente; nenhum novo workspace. `planner.ts`/`mesocycle-planner.ts` (tocados pela 014) **não mudam** — eles já chamam `buildVariants()`, que carrega as mudanças.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Segundo tipo de preset no `ExerciseDemo` (pose de corpo inteiro) | O rig atual só anima ombro-cotovelo-mão sobre um corpo parado; agachar/dobrar quadril/core exigem mover quadril, joelho e tronco | Reusar só o rig de braço deixaria os padrões de membros inferiores e core sem animação correta (o problema central da spec) |
