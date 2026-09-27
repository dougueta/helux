# Tasks: Banco de exercícios — variedade de animações + equivalência genética

**Input**: `specs/013-banco-exercicios/` (spec, plan, research, data-model, contracts)
**Tests**: obrigatórios (constituição II — TDD). Cada tarefa de teste deve falhar antes da implementação correspondente.

## Phase 1: Setup

- [X] T001 Medir a linha de base atual e registrar no spec: rodar a contagem de exercícios por padrão e a distribuição de `motionFor()` sobre `packages/ai/src/exercise-bank.ts` (esperado 63/102 supino, 81/102 genérico/incorreto)

## Phase 2: Foundational (bloqueia US1–US3)

- [X] T002 [P] Teste do catálogo em `packages/types/src/__tests__/motion.test.ts`: `MOTION_CATALOG` tem as 30 chaves do contrato, `GENERIC_MOTION === 'press-flat'`, toda entrada com `isolamento` declara `muscleGroups`
- [X] T003 Implementar `packages/types/src/motion.ts` (`MOTION_CATALOG`, `MotionKey`, `GENERIC_MOTION`) e exportar em `packages/types/src/index.ts`
- [X] T004 [P] Acrescentar `crossPattern?: boolean` a `Variant` em `packages/types/src/workout.ts`

## Phase 3: User Story 1 — Animação certa do exercício (P1) 🎯 MVP

**Goal**: cada exercício recebe uma animação específica do seu movimento; supino ≤ 12%, genérico/incorreto ≤ 10%, nenhuma animação > 20%.
**Independent Test**: `motions.test.ts` (antes/depois) + `ExerciseDemo.test.tsx`.

- [X] T005 [P] [US1] Teste de medição em `packages/ai/src/__tests__/motions.test.ts`: `measureMotionCoverage` com resolvedor legado (cópia de `motionFor`) sobre as 102 entradas originais → 81 genéricos (79,4%) e 63 supino (61,8%); com `resolveMotion` sobre o banco atual → genericPct ≤ 10, pressFlatPct ≤ 12, maxShare ≤ 20; casos pontuais (Agachamento Livre→squat, Leg Press→leg-press, Afundo→lunge, Levantamento Terra→hinge, Elevação Pélvica→hip-thrust, Remada Curvada→row, Barra Fixa→pull-vertical, Prancha→plank, Rosca Direta→curl, Supino Inclinado→press-incline, Elevação Lateral→raise-lateral, Tríceps Testa→ext-lying, Flexão de Braço→push-up)
- [X] T006 [US1] Implementar `packages/ai/src/motions.ts` (`resolveMotion(entry)` por regras ordenadas padrão/grupo/nome; `measureMotionCoverage(bank, resolve)`)
- [X] T007 [US1] Em `packages/ai/src/variants.ts`, trocar `motionFor(pattern)` por `resolveMotion(entry)` e mapear `peso-corporal` → `bodyweight`; ajustar/estender `packages/ai/src/__tests__/variants.test.ts` (variante de agachamento tem `motion: 'squat'`)
- [X] T008 [P] [US1] Testes em `apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx`: todo `MotionKey` do catálogo renderiza o próprio preset (`svg[data-motion=key]`), chave desconhecida → `data-motion="press-flat"`, preset de pose renderiza pernas (joelho/tornozelo), movimento reduzido em pose para no meio, acento só no implemento para presets de pose, `bodyweight` sem implemento
- [X] T009 [US1] Implementar em `apps/web/src/components/workout/ExerciseDemo.tsx` os presets de braço novos (pull-vertical, curl, fly, upright-row, ext-overhead, cable-rotation) e o tipo `pose` com cenários (chão, banco, assento, barra fixa, polia) e presets squat, lunge, leg-press, hinge, hip-thrust, row, push-up, plank, crunch, leg-raise, rollout, dip, raise-front, shrug, leg-ext, leg-curl, hip-abduction, calf-raise; `data-motion` no `svg`; só tokens do DS v2
- [X] T010 [US1] Rodar os testes direcionados de ai/types/web da US1 e commitar

## Phase 4: User Story 2 — Equivalente genético de outro padrão (P2)

**Goal**: alertas articulares geram até 2 equivalentes de outro padrão com menos carga articular, marcados e justificados.
**Independent Test**: `variants.test.ts` (cenários joelho/ombro/lombar/sem alerta).

- [X] T011 [P] [US2] Teste em `packages/ai/src/__tests__/exercise-bank.test.ts`: toda entrada tem `stress` com joelho/ombro/lombar ∈ {0,1,2}; Leg Press tem joelho < Agachamento Livre (Barra); Elevação Pélvica joelho 0; Levantamento Terra lombar 2
- [X] T012 [US2] Implementar `stress` derivado (`PATTERN_STRESS` + `STRESS_OVERRIDES`) em `packages/ai/src/exercise-bank.ts`
- [X] T013 [P] [US2] Testes em `packages/ai/src/__tests__/variants.test.ts`: detecção de articulações (joelho/ombro/lombar/genérico); agachamento + alerta de joelho → ≥1 `crossPattern` do padrão dobrar-quadril com joelho menor e `why` citando joelho; sem alerta → nenhum `crossPattern`; Puxada Alta (Cabo) + ombro → equivalentes de puxar-horizontal; Levantamento Terra + lombar → equivalentes de agachar; Desenvolvimento Militar + ombro → empurrar-horizontal; Supino + ombro → nenhum (vertical tem mais carga); isolamento/core → nenhum; ≤ 2 equivalentes com equipamentos distintos; ajuste ±4/nível (Leg Press 96 no cenário de referência); original mantém 74; faixa 50–99; ordenação
- [X] T014 [US2] Implementar em `packages/ai/src/variants.ts`: `flaggedJoints(alertas)`, ajuste por articulação no `match`, `PATTERN_FAMILY`, seleção de equivalentes e `why` de equivalência
- [X] T015 [P] [US2] Teste em `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`: variante com `crossPattern` mostra a etiqueta "Equivalente" e pode ser trocada
- [X] T016 [US2] Implementar a etiqueta `<Tag>Equivalente</Tag>` em `apps/web/src/components/workout/ExerciseSheet.tsx`
- [X] T017 [US2] Rodar testes direcionados da US2 e commitar

## Phase 5: User Story 3 — Mais opções por padrão (P3)

**Goal**: banco ≥ 115 exercícios; todo padrão ≥ 8 exercícios e ≥ 3 equipamentos.
**Independent Test**: `exercise-bank.test.ts` + `motions.test.ts` (novos exercícios continuam dentro da meta).

- [ ] T018 [P] [US3] Teste em `packages/ai/src/__tests__/exercise-bank.test.ts`: ≥ 115 entradas; cada um dos 8 padrões com ≥ 8 exercícios e ≥ 3 equipamentos
- [ ] T019 [US3] Acrescentar 20 exercícios em `packages/ai/src/exercise-bank.ts` (empurrar vertical +3, puxar vertical +4 incl. halteres e barra, empurrar horizontal +2, puxar horizontal +1, agachar +2, dobrar quadril +2 incl. máquina/cabo, core +4 incl. halteres e barra, isolamento +2), com 3–5 orientações e overrides de `stress` quando o movimento difere do padrão
- [ ] T020 [US3] Rodar `motions.test.ts`, `exercise-bank.test.ts`, `variants.test.ts`, `prompts`/`planner` tests de `packages/ai` e commitar

## Phase 6: Polish

- [ ] T021 Atualizar o spec com os números finais (depois) e marcar tarefas; rodar uma vez a suíte completa (`pnpm test`), `pnpm typecheck` e `pnpm build`; conferir o guard do DS v2
- [ ] T022 Commit final

## Dependencies

- T002→T003 bloqueiam US1 (catálogo) e o teste da web (T008).
- US1 (T005–T010) antes de US3 (novos exercícios precisam do resolvedor para manter a meta).
- US2 depende de T004 e T012; independente de US1 exceto pelo arquivo `variants.ts` (fazer T007 antes de T014).
- Polish por último.

## Parallel Opportunities

- T002 ∥ T004; T005 ∥ T008 (arquivos diferentes); T011 ∥ T013 ∥ T015.
- Web (T008/T009) pode ser feita por um subagente em paralelo com a parte `packages/ai` (T005–T007).

## Implementation Strategy

MVP = Phase 1–3 (animações certas; é o problema mais visível). Depois US2 (diferencial genético) e US3 (volume). Cada fase termina com commit.
