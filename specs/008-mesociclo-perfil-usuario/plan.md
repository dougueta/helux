# Implementation Plan: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Branch**: `008-mesociclo-perfil-usuario` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/008-mesociclo-perfil-usuario/spec.md`

## Summary

Substituir os valores hoje fixos no código (`userGoals`, `userLevel`) usados na geração do mesociclo por dados reais de um novo perfil de treino situacional editável pelo usuário (objetivo, nível, tempo treinando, tempo parado, lesão atual) — persistido numa tabela nova e injetado no prompt de geração do mesociclo (`mesocycle-prompts.ts`), com a lesão declarada tratada como um alerta situacional que evita/adapta exercícios, no mesmo padrão já usado pelos alertas genéticos. Além disso, adiciona uma sinalização manual de cansaço para o dia atual, que se combina com o ajuste automático por HRV já existente (`recovery-adjustment.ts`) usando sempre o ajuste mais conservador entre os dois. Estende o fluxo já construído em `006-mesociclo-treino-backend`/`007-mesociclo-treino-ui`, sem alterar o fluxo legado de sessão única (`POST /workout/generate`).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — mesma stack de `006`/`007`
**Primary Dependencies**: `@anthropic-ai/sdk` (mesocycle-planner, inalterado), `zod` (validação das novas rotas, mesmo padrão de `checkins.ts`), `@supabase/supabase-js`, `@testing-library/react` + `vitest` (web)
**Storage**: Supabase Postgres — 2 tabelas novas (`user_training_profile`, `daily_tiredness_signals`), RLS por `auth.uid() = user_id` (mesmo padrão de todas as tabelas existentes)
**Testing**: Vitest em `packages/ai`, `apps/api`, `apps/web` — TDD obrigatório (constituição)
**Target Platform**: Web (`apps/web`), mesmo público de `004-web-mvp`/`007`
**Project Type**: Web application dentro do monorepo — nenhum workspace novo; toca `packages/types`, `packages/ai`, `apps/api`, `apps/web`
**Performance Goals**: Leitura de `daily_tiredness_signals` é uma query por chave primária composta, sem impacto perceptível em `GET /workout/latest-plan` (mesmo padrão de latência de `health_samples` hoje)
**Constraints**: Nenhuma alteração no fluxo legado de sessão única (`POST /workout/generate`) — débito técnico já rastreado, fora de escopo (ver research.md Decisão 7)
**Scale/Scope**: Usuário único, uso pessoal — mesmo padrão do projeto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Mudanças contidas em `apps/api`, `apps/web`, `packages/types`, `packages/ai` — sem workspace novo |
| II. Test-First (TDD) | ✅ PASS | Cada rota nova, hook novo e componente novo ganha teste antes da implementação — a detalhar em `/speckit-tasks` |
| III. Independent Deployability | ✅ PASS | `apps/web` continua chamando `apps/api` só via HTTP; `packages/ai`/`packages/types` continuam sendo dependências de build, não runtime cruzado |
| IV. Shared Code via Packages | ✅ PASS | `UserTrainingProfile`/`UserTrainingProfileInput`/`DailyTirednessSignal` centralizados em `packages/types`, consumidos por `apps/api` e `apps/web` sem duplicação |
| V. Simplicity (YAGNI) | ✅ PASS | Lesão como texto livre (não lista estruturada), tempo treinando/parado como texto livre (não campos numéricos), sinalização de cansaço reaproveita a escala de 3 níveis já existente em vez de criar uma nova — todas decisões documentadas em `research.md` com a alternativa mais complexa explicitamente rejeitada |

## Project Structure

### Documentation (this feature)

```text
specs/008-mesociclo-perfil-usuario/
├── plan.md              ← this file
├── spec.md              ← feature specification (com seção Clarifications)
├── research.md          ← Phase 0 findings (8 decisões)
├── data-model.md         ← UserTrainingProfile, DailyTirednessSignal, migration SQL
├── contracts/
│   ├── api.md            ← rotas novas/modificadas
│   └── ui-contracts.md   ← contratos de props dos componentes novos
├── checklists/
│   └── requirements.md   ← spec quality checklist
└── tasks.md               ← Phase 2 output (/speckit-tasks, ainda não gerado)
```

### Source Code (repository root)

```text
packages/types/src/
└── profile.ts                                ← NOVO: UserTrainingProfile, UserTrainingProfileInput,
                                                   DailyTirednessSignal
└── plan.ts                                    ← MODIFICADO: PlanInput ganha trainingTime/timeOff/
                                                   currentInjury opcionais

packages/ai/src/
├── mesocycle-prompts.ts                       ← MODIFICADO: buildMesocycleSystemPrompt ganha bloco
│                                                  "Alertas Situacionais"; buildMesocycleUserPrompt/
│                                                  buildContextBody (prompts.ts) ganham linhas de
│                                                  tempo treinando/parado
├── prompts.ts                                  ← MODIFICADO: buildContextBody aceita os novos campos
│                                                   (compartilhado entre sessão única e mesociclo —
│                                                   ver Nota de Escopo abaixo)
└── recovery-adjustment.ts                      ← MODIFICADO: applyRecoveryAdjustment ganha parâmetro
                                                    manualTirednessToday?: boolean

apps/api/src/
├── routes/
│   ├── profile.ts                              ← NOVO: GET/POST /api/profile
│   ├── tiredness-today.ts                      ← NOVO: POST/DELETE /api/tiredness-today
│   └── workout-latest-plan.ts                  ← MODIFICADO: busca daily_tiredness_signals do dia
└── services/
    └── plan-context.service.ts                 ← MODIFICADO: gatherPlanInput busca
                                                    user_training_profile real

apps/web/src/
├── app/
│   ├── perfil/
│   │   ├── page.tsx                            ← NOVO: tela de configurações do perfil
│   │   └── loading.tsx                         ← NOVO: mesmo padrão das demais rotas
│   └── HomeClient.tsx                          ← MODIFICADO: ícone de acesso a /perfil no cabeçalho;
│                                                   renderiza TirednessToggle
├── components/
│   └── workout/
│       └── TirednessToggle.tsx                 ← NOVO
├── hooks/
│   ├── useProfile.ts                           ← NOVO: mesmo padrão de useCheckin.ts
│   └── useTiredness.ts                         ← NOVO: GET implícito (via plan) + toggle
├── services/
│   ├── profile.service.ts                      ← NOVO: getProfile()/upsertProfile()
│   └── tiredness.service.ts                    ← NOVO: markTiredToday()/clearTiredToday()
└── __tests__/
    ├── components/workout/TirednessToggle.test.tsx
    ├── hooks/useProfile.test.ts
    ├── hooks/useTiredness.test.ts
    └── services/profile.service.test.ts

supabase/migrations/
└── <timestamp>_create_user_training_profile_and_tiredness_signals.sql   ← NOVO
```

**Structure Decision**: Estende os workspaces já existentes seguindo os padrões estabelecidos por `006`/`007` — nenhuma nova app/serviço. A tela `/perfil` segue o padrão de `checkin/` (rota + hook + service dedicados); `TirednessToggle` vive em `components/workout/` (mesmo diretório de `RecoveryAdjustedBadge`, componente de domínio de treino, não primitivo genérico).

### Nota de Escopo — `buildContextBody` é compartilhado

`buildContextBody` (`packages/ai/src/prompts.ts`) já é reaproveitado tanto pela geração de sessão única (`buildUserPrompt`) quanto pela geração de mesociclo (`buildMesocycleUserPrompt`, ver `mesocycle-prompts.ts:145`). Ao adicionar os novos parâmetros de contexto (tempo treinando/parado) a essa função compartilhada, o fluxo legado de sessão única passa a receber esses dados automaticamente nas linhas de contexto — o que é aceitável (mais contexto, sem quebra de contrato) e não constitui alteração do fluxo legado em si (nenhuma mudança de comportamento/regra nova é adicionada a `buildSystemPrompt`/`buildUserPrompt`). O bloco de "Alertas Situacionais" (lesão), por ser uma regra nova de restrição obrigatória, é adicionado **apenas** em `buildMesocycleSystemPrompt`, não em `buildSystemPrompt` — mantendo o fluxo legado sem novas obrigações de comportamento, conforme Decisão 7 de `research.md`.

## Complexity Tracking

*Sem violações da constituição a justificar.*

**Dependência explícita**: esta spec estende `006-mesociclo-treino-backend` (mesocycle-planner, applyRecoveryAdjustment) e `007-mesociclo-treino-ui` (HomeClient.tsx, padrão de Chip/Badge) — ambas já mescladas em `main`. Nenhuma dependência bloqueante nova.

**Gap que permanece herdado**: o botão "Gerar Novo Plano" (`POST /workout/generate`) continua fora do escopo (fluxo de sessão única desalinhado com a visão de mesociclo, já rastreado como débito técnico desde `007`) — não recebe os novos alertas situacionais de lesão.
