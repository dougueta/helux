# Tasks: Cansaço Percebido com Níveis e Confirmação de Ajuste

**Input**: `specs/011-cansaco-niveis/` (spec.md, plan.md, research.md, data-model.md, contracts/api.md, quickstart.md)
**Tests**: obrigatórios (constituição, princípio II — TDD). Cada teste deve falhar (RED) antes da implementação correspondente (GREEN).

## Phase 1: Setup

- [X] T001 Adicionar `"@helux/workouts": "workspace:*"` em `apps/web/package.json` e `apps/api/package.json`, incluir `'@helux/workouts'` em `transpilePackages` de `apps/web/next.config.mjs` e rodar `pnpm install`
- [X] T002 [P] Criar migration `supabase/migrations/20260922000000_tiredness_levels.sql`: adicionar `level text not null default 'exausto'` com check nos 4 níveis, remover o default em seguida, adicionar `override_automatic boolean not null default false` e `updated_at timestamptz not null default now()` em `daily_tiredness_signals` (NÃO aplicar no banco)

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T003 Criar tipos `TirednessLevel`, `TirednessSource`, `TirednessAssessment`, `ExerciseAdjustmentChange` em `packages/types/src/tiredness.ts` (exportar em `packages/types/src/index.ts`); adicionar `plannedExercises?`, `changes?`, `tiredness?` a `AdjustedSession` em `packages/types/src/mesocycle.ts`; remover `DailyTirednessSignal` de `packages/types/src/profile.ts`
- [X] T004 [P] RED: testes do domínio em `packages/workouts/src/__tests__/tiredness.test.ts` — `hrvToTirednessLevel` (limiares 40/60), `tirednessTier`, `assessTiredness` (sem automático; automático prevalece; override manual; conflict por tier; ótimo×normal sem conflito), `adjustExercisesForLevel` (cansado −1 série mín. 2; exausto −1 série e −10% em `NNkg` arredondado a 0,5; peso não numérico intacto), `diffExercises`, `buildAdjustedSession` (motivos manual/automático/override; `plannedExercises`/`changes`), `previewTirednessChoice` (conflict, skip de conflito se já sobreposto, `needsSave`, `changesFromCurrent`, `changesFromPlanned`)
- [X] T005 GREEN: implementar `packages/workouts/src/tiredness.ts` (incluindo `TIREDNESS_LEVELS` e `TIREDNESS_LABELS`) e exportar em `packages/workouts/src/index.ts`
- [X] T006 [P] RED: testes em `apps/api/src/__tests__/tiredness.service.test.ts` (`getTodayTirednessAssessment` combina sinal do dia + HRV das amostras de 48 h) e reescrever `apps/api/src/__tests__/tiredness-today.test.ts` para `GET` (200 com avaliação, 401) e `PUT` (upsert com `level`/`override_automatic`, 400 para nível inválido, 401, 500)
- [X] T007 GREEN: criar `apps/api/src/services/tiredness.service.ts` e reescrever `apps/api/src/routes/tiredness-today.ts` com GET/PUT (zod), removendo POST/DELETE
- [X] T008 RED: atualizar `apps/api/src/__tests__/workout-latest-plan.test.ts` — `today` traz `tiredness`, `plannedExercises`, `changes` e motivo novo; nível manual "exausto" reduz séries e carga; HRV prevalece sobre manual sem override; override manual prevalece
- [X] T009 GREEN: `apps/api/src/routes/workout-latest-plan.ts` usa `getTodayTirednessAssessment` + `buildAdjustedSession`; remover `packages/ai/src/recovery-adjustment.ts`, seu teste e o export em `packages/ai/src/index.ts`
- [X] T010 [P] RED→GREEN: reescrever `apps/web/src/__tests__/services/tiredness.service.test.ts` e `apps/web/src/services/tiredness.service.ts` com `getTirednessToday()` (GET) e `setTirednessToday(level, overrideAutomatic)` (PUT)

## Phase 3: User Story 1 — Nível na Home com resumo antes de aplicar (P1) 🎯 MVP

**Independent test**: sem HRV, escolher "exausto" na Home → resumo → confirmar → treino reduzido; cancelar → nada muda.

- [X] T011 [P] [US1] RED: testes de `AdjustmentChangesList` (séries e carga "antes → depois") em `apps/web/src/__tests__/components/workout/AdjustmentChangesList.test.tsx` e de `TirednessSelector` (4 níveis, nível vigente marcado, texto de origem "Não informado"/"Informado por você", "Ver o que mudou" lista `today.changes`) em `apps/web/src/__tests__/components/workout/TirednessSelector.test.tsx`
- [X] T012 [P] [US1] RED: testes de `useTirednessFlow` modo Home em `apps/web/src/__tests__/hooks/useTirednessFlow.test.ts` — nível que muda o treino abre etapa `changes` sem salvar; confirmar salva (PUT) e chama `refetch`; cancelar não salva; nível sem efeito salva direto sem etapa; erro ao salvar expõe `error`
- [X] T013 [US1] GREEN: implementar `apps/web/src/components/workout/AdjustmentChangesList.tsx` e `apps/web/src/components/workout/TirednessSelector.tsx`
- [X] T014 [US1] GREEN: implementar `apps/web/src/hooks/useTirednessFlow.ts` (modo Home) usando `previewTirednessChoice`
- [X] T015 [US1] RED→GREEN: `TirednessDialog` etapa `changes` (título "Seu treino vai mudar", lista, "Aplicar"/"Cancelar") em `apps/web/src/components/workout/TirednessDialog.tsx` com teste em `apps/web/src/__tests__/components/workout/TirednessDialog.test.tsx`
- [X] T016 [US1] Integrar seletor + diálogo em `apps/web/src/app/HomeClient.tsx` no lugar do `TirednessToggle`
- [X] T017 [US1] RED→GREEN: `useWorkoutPlan` descarta cache local cujo `today.tiredness.date` não é hoje (`apps/web/src/__tests__/hooks/useWorkoutPlan.test.ts`, `apps/web/src/hooks/useWorkoutPlan.ts`)

## Phase 4: User Story 2 — Pergunta ao iniciar o treino (P1)

**Independent test**: "Iniciar treino" → pergunta com nível pré-selecionado → escolher "exausto" → resumo → treino ativo abre reduzido.

- [X] T018 [P] [US2] RED: testes de `useTirednessFlow` modo início — `openStart` abre etapa `question` com `effectiveLevel ?? 'normal'`; continuar sem mudança e sem ajuste chama `onStart(today.exercises)` sem salvar; nível que muda → `changes` → confirmar salva, `refetch` e `onStart(novoPlano.today.exercises)`; cancelar `changes` volta a `question`; fechar não inicia
- [X] T019 [P] [US2] RED: teste da etapa `question` do `TirednessDialog` ("Como você está hoje?", 4 opções, pré-seleção, "Continuar", fechar)
- [X] T020 [US2] GREEN: implementar modo início em `useTirednessFlow.ts` e etapa `question` em `TirednessDialog.tsx`
- [X] T021 [US2] Ligar "Iniciar treino" ao fluxo em `apps/web/src/app/HomeClient.tsx` (`startWorkout` + `router.push('/workout')` só após o fluxo)

## Phase 5: User Story 3 — Relógio prevalece, confirmação na discordância (P2)

**Independent test**: com HRV 45, escolher "ótimo" → confirmação citando os dois níveis; recusar → nada muda; aceitar → resumo → salva com override.

- [X] T022 [P] [US3] RED: testes de `useTirednessFlow` — nível discordante abre `conflict`; recusar fecha (Home) / volta à pergunta (início) sem salvar; aceitar segue para `changes` e salva com `overrideAutomatic: true`; nível concordante não abre `conflict`
- [X] T023 [P] [US3] RED: testes do `TirednessDialog` etapa `conflict` ("Seu relógio indica cansado, mas você marcou ótimo") e do `TirednessSelector` com origem automática ("Indicado pelo relógio (HRV 45 ms)"), aviso de discordância e indicação de sobreposição
- [X] T024 [US3] GREEN: implementar etapa `conflict` no hook e no diálogo e textos de origem no seletor

## Phase 6: User Story 4 — Ajuste automático avisado antes do treino (P2)

**Independent test**: com HRV baixo e sem manual, "Iniciar treino" mantendo o nível → resumo vs. planejado antes do treino ativo.

- [X] T025 [US4] RED→GREEN: no modo início, se o resultado está ajustado vs. planejado (mesmo sem mudança de nível), mostrar `changes` com base no planejado antes de `onStart`; sem ajuste, iniciar direto (`useTirednessFlow.test.ts`, `useTirednessFlow.ts`)

## Phase 7: Polish

- [X] T026 Remover `TirednessToggle.tsx`, `useTiredness.ts` e seus testes (`apps/web/src/components/workout/`, `apps/web/src/hooks/`, `apps/web/src/__tests__/...`)
- [X] T027 Rodar `pnpm --filter @helux/workouts test`, `pnpm --filter @helux/web test`, `pnpm --filter @helux/api test`, `pnpm typecheck` — tudo verde
- [X] T029 Manter o default 'exausto' da coluna `level` em `supabase/migrations/20260922000000_tiredness_levels.sql` (remover o `drop default`) para que a API de produção anterior (spec 008), que insere sem `level`, continue funcionando entre a aplicação da migration e o deploy da API nova (`research.md` → "Compatibilidade da migration"). Sem teste automatizado (o repo não tem testes de SQL); verificação: aplicar a migration e conferir que um insert sem `level` resulta em `exausto`
- [ ] T028 Verificação manual do `quickstart.md` (a ser feita pelo agente principal)

## Phase 8: Correções da verificação manual (2026-09-22)

- [X] T030 [P] RED: teste de CORS em `apps/api/src/__tests__/cors.test.ts` usando `buildApp()` — preflight `OPTIONS /api/tiredness-today` com `origin: http://localhost:3000` e `access-control-request-method: PUT` deve devolver `access-control-allow-methods` contendo `PUT` (FR-016)
- [X] T031 GREEN: incluir `'PUT'` em `methods` do `@fastify/cors` em `apps/api/src/app.ts`
- [X] T032 [P] RED: em `apps/web/src/__tests__/components/workout/TirednessDialog.test.tsx`, o backdrop do diálogo é filho direto de `document.body` (portal) e tem `z-index` maior que o do menu inferior (`z-50`) (FR-017)
- [X] T033 GREEN: renderizar `TirednessDialog` via `createPortal` em `document.body` com `TIREDNESS_DIALOG_Z_INDEX = 60` e padding inferior com safe area em `apps/web/src/components/workout/TirednessDialog.tsx`
- [X] T034 [P] RED: em `apps/web/src/__tests__/hooks/useWorkoutPlan.test.ts`, cache do mesmo dia de plano de mesociclo sem `today.tiredness` é descartado e o plano é buscado de novo; plano legado (`mesocycleId: null`) continua vindo do cache (FR-018)
- [X] T035 GREEN: ajustar `loadFromStorage` em `apps/web/src/hooks/useWorkoutPlan.ts`
- [X] T036 Rodar `pnpm --filter @helux/web test`, `pnpm --filter @helux/api test`, `pnpm typecheck` — tudo verde

## Dependencies

- Setup → Foundational → US1 → US2 → US3/US4. US3 e US4 dependem do hook/diálogo de US1/US2 (mesmos arquivos), então são sequenciais entre si.
- Dentro de cada fase: RED antes do GREEN.

## Parallel examples

- Foundational: T004 (domínio), T006 (api), T010 (web service) em arquivos diferentes.
- US1: T011 e T012 em paralelo.

## Implementation strategy

MVP = Phases 1–3 (seletor na Home com resumo). Depois US2 (pergunta ao iniciar), US3 (discordância) e US4 (aviso do ajuste automático).
