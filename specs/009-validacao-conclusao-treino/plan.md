# Implementation Plan: Validação de Conclusão de Treino

**Branch**: `009-validacao-conclusao-treino` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-validacao-conclusao-treino/spec.md`

## Summary

Fechar a brecha que hoje permite finalizar um treino sem nenhuma série registrada (a API aceita `exercises: []`, o botão "Finalizar treino" nunca é desabilitado). Ao detectar exercício(s) sem nenhuma série no momento da finalização — incluindo o caso extremo de treino totalmente vazio — a UI exibe uma confirmação explícita nomeando a quantidade de exercícios pulados antes de salvar. A sessão salva passa a registrar, por exercício, se foi executado (≥1 série) ou pulado, sem exigir tabela nova (o array `exercises` já é armazenado como JSON em `workout_sessions`, só ganha um campo a mais por item). A validação é reforçada também na API, para não ser contornável por uma chamada direta que ignore a confirmação da UI.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — mesma stack de `006`/`007`/`008`
**Primary Dependencies**: `zod` (validação da rota, mesmo padrão de `workout-sessions.ts`/`checkins.ts`), nenhuma dependência nova
**Storage**: Supabase Postgres — nenhuma tabela nem coluna nova; `workout_sessions.exercises` já é armazenado como JSON, só ganha um campo `skipped?: boolean` por item da lista
**Testing**: Vitest em `packages/types`, `apps/api`, `apps/web` — TDD obrigatório (constituição)
**Target Platform**: Web (`apps/web`), fluxo de treino ativo compartilhado por qualquer plano (mesociclo ou geração legada de sessão única)
**Project Type**: Web application dentro do monorepo — nenhum workspace novo; toca `packages/types`, `apps/api`, `apps/web`
**Performance Goals**: N/A — validação síncrona local (contagem de séries já em memória), sem chamada de rede adicional
**Constraints**: Fluxo normal (nenhum exercício pulado) não pode ganhar nenhuma etapa ou fricção a mais (FR-006/SC-003) — a confirmação só aparece quando há algo a confirmar
**Scale/Scope**: Usuário único, uso pessoal — mesmo padrão do projeto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Mudanças contidas em `apps/api`, `apps/web`, `packages/types` — sem workspace novo |
| II. Test-First (TDD) | ✅ PASS | Novo componente de confirmação, mudança em `finishWorkout` e reforço do schema Zod ganham teste antes — a detalhar em `/speckit-tasks` |
| III. Independent Deployability | ✅ PASS | `apps/web` continua chamando `apps/api` só via HTTP; nenhum acoplamento novo entre workspaces |
| IV. Shared Code via Packages | ✅ PASS | O campo `skipped` no item de exercício é adicionado uma vez em `packages/types` (`WorkoutSession`/`ExerciseSet`) e consumido por `apps/api` e `apps/web` sem duplicação |
| V. Simplicity (YAGNI) | ✅ PASS | Confirmação é um único diálogo (sem fluxo multi-etapas); `skipped` é um boolean simples derivado de `sets.length === 0`, não uma máquina de estados nova; nenhuma tabela/migration nova |

## Project Structure

### Documentation (this feature)

```text
specs/009-validacao-conclusao-treino/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── data-model.md         ← Phase 1 output
├── contracts/
│   └── api.md            ← contrato modificado de POST /api/workouts/sessions
├── checklists/
│   └── requirements.md   ← spec quality checklist
└── tasks.md               ← Phase 2 output (/speckit-tasks, ainda não gerado)
```

### Source Code (repository root)

```text
packages/types/src/
└── workout.ts                                  ← MODIFICADO: ExerciseSet ganha
                                                    campo skipped?: boolean

apps/api/src/routes/
└── workout-sessions.ts                          ← MODIFICADO: ExerciseSchema aceita
                                                    skipped; SessionBodySchema exige
                                                    que todo exercício com sets vazio
                                                    venha explicitamente marcado
                                                    skipped: true (refina.superRefine),
                                                    rejeitando o payload caso contrário

apps/web/src/
├── hooks/
│   └── useActiveWorkout.ts                      ← MODIFICADO: finishWorkout calcula
│                                                    skipped por exercício (sets.length
│                                                    === 0) e inclui no payload;
│                                                    expõe getSkippedExercises() para
│                                                    a tela decidir se confirma
├── components/workout/
│   └── FinishWorkoutConfirmDialog.tsx           ← NOVO: diálogo de confirmação
│                                                    ("N exercícios serão salvos como
│                                                    pulados — confirma finalizar?")
├── app/workout/
│   └── page.tsx                                  ← MODIFICADO: botão "Finalizar
│                                                    treino" consulta
│                                                    getSkippedExercises() antes de
│                                                    chamar finishWorkout; abre
│                                                    FinishWorkoutConfirmDialog quando
│                                                    houver pulados, senão finaliza
│                                                    direto (sem fricção extra)
└── __tests__/
    ├── hooks/useActiveWorkout.test.ts            ← MODIFICADO: novos casos de
    │                                                skipped/getSkippedExercises
    └── components/workout/
        └── FinishWorkoutConfirmDialog.test.tsx   ← NOVO
```

**Structure Decision**: Estende os workspaces já existentes seguindo o padrão de `006`/`007`/`008` — nenhuma nova app/serviço, nenhuma migration. O diálogo de confirmação vive em `components/workout/` (mesmo diretório de `TirednessToggle`/`RecoveryAdjustedBadge`, componentes de domínio de treino), seguindo o padrão visual inline-style + CSS vars já majoritário nessa pasta.

## Complexity Tracking

*Sem violações da constituição a justificar.*
