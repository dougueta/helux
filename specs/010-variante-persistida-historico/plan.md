# Implementation Plan: Variante Executada Persistida no Histórico

**Branch**: `010-variante-persistida-historico` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/010-variante-persistida-historico/spec.md`

## Summary

Fechar o débito técnico TD-004: hoje, trocar de variante durante o treino ativo (`ExerciseSheet` → "Usar esta variante") só atualiza `variantByExerciseIndex` no cliente para fins de exibição — `finishWorkout` sempre grava `ex.name` (o exercício originalmente planejado), nunca a variante escolhida. A sessão salva passa a carregar, por exercício, um campo opcional `executedVariant` (nome + match genético) quando o usuário de fato registrou séries sob uma variante diferente da recomendada — sem substituir o campo `name` existente (que continua sendo o exercício planejado). A tela de treino ativo passa a exibir o nome da variante ativa (não só o equipamento) e o indicador de fit passa a refletir o match real da variante ativa, no lugar do "96 fit" hardcoded.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — mesma stack de `006`–`009`
**Primary Dependencies**: `zod` (validação da rota, mesmo padrão de `workout-sessions.ts`), nenhuma dependência nova
**Storage**: Supabase Postgres — nenhuma tabela nem coluna nova; `workout_sessions.exercises` já é JSON, ganha mais um campo opcional por item
**Testing**: Vitest em `packages/types`, `apps/api`, `apps/web` — TDD obrigatório (constituição)
**Target Platform**: Web (`apps/web`), fluxo de treino ativo compartilhado por qualquer plano
**Project Type**: Web application dentro do monorepo — nenhum workspace novo; toca `packages/types`, `apps/api`, `apps/web`
**Performance Goals**: N/A — leitura de estado local já em memória (`variantByExerciseIndex`), sem chamada de rede adicional
**Constraints**: Fluxo em que o usuário nunca troca de variante não pode mudar em nada (FR-003/SC-003) — o campo novo só aparece quando há de fato uma variante diferente executada
**Scale/Scope**: Usuário único, uso pessoal — mesmo padrão do projeto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Mudanças contidas em `apps/api`, `apps/web`, `packages/types` — sem workspace novo |
| II. Test-First (TDD) | ✅ PASS | Novo estado de "variante executada" no hook, mudança no badge de fit, novo campo no schema Zod e na tela de detalhe do histórico ganham teste antes — a detalhar em `/speckit-tasks` |
| III. Independent Deployability | ✅ PASS | `apps/web` continua chamando `apps/api` só via HTTP; nenhum acoplamento novo entre workspaces |
| IV. Shared Code via Packages | ✅ PASS | `executedVariant` é adicionado uma vez em `packages/types` (`ExerciseSet`); `WorkoutSessionRow` (hoje uma cópia solta do formato em `apps/web`) passa a importar `ExerciseSet` de `@helux/types` em vez de duplicar o shape — reduz duplicação existente em vez de aumentá-la |
| V. Simplicity (YAGNI) | ✅ PASS | Nenhuma tabela nova, nenhuma máquina de estados nova; `executedVariant` guarda só `{name, match}` (o suficiente para exibir no histórico), não o objeto `Variant` completo (que carrega campos só relevantes à demonstração em vídeo, como `motion`/`implement`) |

## Project Structure

### Documentation (this feature)

```text
specs/010-variante-persistida-historico/
├── plan.md              ← this file
├── spec.md               ← feature specification
├── data-model.md         ← Phase 1 output
├── contracts/
│   └── api.md             ← contrato modificado de POST /api/workouts/sessions
├── checklists/
│   └── requirements.md    ← spec quality checklist
└── tasks.md               ← Phase 2 output (/speckit-tasks, ainda não gerado)
```

### Source Code (repository root)

```text
packages/types/src/
└── workout.ts                                  ← MODIFICADO: ExerciseSet ganha
                                                    campo executedVariant?: { name:
                                                    string; match: number }

apps/api/src/routes/
└── workout-sessions.ts                          ← MODIFICADO: ExerciseSchema aceita
                                                    executedVariant opcional

apps/web/src/
├── hooks/
│   └── useActiveWorkout.ts                      ← MODIFICADO: novo estado
│                                                    executedVariantByExerciseIndex,
│                                                    travado na primeira série
│                                                    registrada de cada exercício
│                                                    (deriva de variantByExerciseIndex
│                                                    no momento); finishWorkout inclui
│                                                    executedVariant quando a variante
│                                                    travada difere da recomendada
├── hooks/
│   └── useWorkoutHistory.ts                     ← MODIFICADO: WorkoutSessionRow
│                                                    importa ExerciseSet de
│                                                    @helux/types em vez de duplicar
│                                                    o shape
├── app/workout/
│   └── page.tsx                                  ← MODIFICADO: badge de fit usa
│                                                    selectedVariant.match (ou
│                                                    currentEx.match como fallback)
│                                                    em vez de "96 fit" hardcoded;
│                                                    indicador de variante ativa
│                                                    passa a mostrar o nome da
│                                                    variante, não só o equipamento
├── app/history/[id]/
│   └── page.tsx                                  ← MODIFICADO: quando
│                                                    ex.executedVariant existe, exibe
│                                                    a variante executada junto ao
│                                                    nome do exercício planejado
└── __tests__/
    ├── hooks/useActiveWorkout.test.ts            ← MODIFICADO: novos casos de
    │                                                executedVariant/finishWorkout
    ├── components/workout/... (page.tsx não tem
    │   teste de componente hoje — cobertura via
    │   useActiveWorkout + teste manual do
    │   quickstart, mesmo padrão de "96 fit" já
    │   não testado isoladamente)
    └── app/history/[id]/page.test.tsx             ← NOVO (se não existir) ou
                                                       estendido, cobrindo exibição
                                                       da variante executada
```

**Structure Decision**: Estende os workspaces já existentes seguindo o padrão de `006`–`009` — nenhuma nova app/serviço, nenhuma migration. `executedVariant` vive dentro do mesmo item de `exercises` que já ganhou `skipped` na spec 009, evitando um segundo campo/tabela paralela para o mesmo registro histórico.

## Complexity Tracking

*Sem violações da constituição a justificar.*
