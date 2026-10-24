# Implementation Plan: Treino adaptativo de verdade

**Branch**: `024-treino-adaptativo` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/024-treino-adaptativo/spec.md`

---

## Summary

Fazer o Agente de Treino usar de verdade o que o Helux sabe do usuário, com o que é método e segurança em **código verificável** e o que é julgamento na **IA**, com a configuração de maior qualidade.

Abordagem técnica:
1. **Eval primeiro** (F0): perfis de teste + checagens determinísticas + juiz LLM, para medir a linha de base e cada mudança.
2. **Privacidade e gerador único** (F1): genética por usuário no banco (sai do repositório público e passa a funcionar em produção); remoção do gerador legado sem autenticação; rota autenticada de regeneração; estado de geração com nova tentativa; detecção de resposta cortada.
3. **Onboarding e condições** (F2): objetivo estruturado; catálogo de condições com regras fixas (carga articular por região, impacto de cardio, RIR mínimo) + "outra" via restrições compartilhadas da 022; crise de gota; validador estendido.
4. **Método e mesociclo semanal** (F3): `prescribeMethod` determinístico (semanas, divisão, frequência, séries semanais, RIR por semana, deload, cardio, mobilidade); a IA gera a semana-modelo dentro da moldura e o código expande as semanas em `mesocycle_plans.sessions` sem quebrar os leitores atuais; catálogo de cardio com impacto; prompt reescrito, `effort: 'xhigh'`.
5. **Sensações e dados confiáveis** (F4): check-ins antes/depois; dor relatada adapta a sessão do dia; sessões suspeitas fora dos cálculos e revisáveis.
6. **Análise do ciclo** (F5): `analyzeCycle` e `checkinTrend` determinísticos; achados viram modificadores da prescrição e regras do pedido; resumo exibido ao usuário.

Decisões em [research.md](./research.md) (R0–R15); entidades em [data-model.md](./data-model.md); contratos em [contracts/](./contracts/).

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), Node 22, React 18 / Next.js 14 App Router, Fastify 5
**Primary Dependencies**: `@anthropic-ai/sdk` ^0.133, `@supabase/supabase-js`, `zod`, `@helux/types`, `@helux/genetics`, `@helux/workouts`, `@helux/ai`
**Storage**: Supabase Postgres — 5 tabelas novas (`genetic_reports`, `mesocycle_generation`, `health_conditions`, `session_checkins`, `cycle_analyses`) + colunas em `user_training_profile`, `shared_guidance`, `mesocycle_plans`, `workout_sessions`; RLS por usuário; migrations aplicadas por fase no projeto `wgrlavmynbingemdbkjg`
**Testing**: Vitest (+ Testing Library na web), TDD estrito; SDK da Anthropic mockado nos testes; eval com chamadas reais sob demanda (`eval:treino`)
**Target Platform**: Web responsiva (Vercel) + API Fastify (Render, Docker)
**Project Type**: Monorepo web + API + pacotes compartilhados
**Performance Goals**: próximo mesociclo disponível em ≤ 3 min em 95% (SC-008, geração em segundo plano com `xhigh`); check-in de sensação ≤ 30 s e onboarding ≤ 5 min (SC-006); funções determinísticas (método, validação, análise) < 50 ms
**Constraints**: nenhuma violação de regra de condição (SC-001); teto mensal de IA da 022 continua valendo; genética nunca em local público; dados de saúde fora dos logs; o mesociclo em andamento (formato `rotacao`) segue até o fim
**Scale/Scope**: uso pessoal; ~10 rotas novas, 1 removida, ~4 alteradas; 3 telas novas (onboarding, condições, revisar treinos) e ~5 alteradas (Home, Treinos, treino ativo, conclusão, Perfil)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo em `apps/api`, `apps/web`, `packages/{types,workouts,ai,genetics}`. |
| **II. Test-First (TDD)** | ✅ PASS | Lógica nova é pura e testável primeiro: `prescribeMethod`, `rulesFor`, validador estendido, `validateAgainstMethod`, `expandWeeks`, `sessionValidity`, `checkinTrend`, `analyzeCycle`, adaptação por dor; rotas com testes de API; SDK mockado. O eval mede qualidade, não substitui testes. |
| **III. Independent Deployability** | ✅ PASS | Cada fase é deployável sozinha; campos novos opcionais nas respostas; a web trata `status` novos; migrations aditivas aplicadas antes do deploy da API da fase. |
| **IV. Shared Code via Packages** | ✅ PASS | Regras de método, condições, análise e validade em `@helux/workouts`; catálogos e IA em `@helux/ai`; tipos em `@helux/types`. Nada duplicado entre API e web. |
| **V. Simplicity (YAGNI)** | ✅ PASS com nota | Reaproveita `mesocycle_plans.sessions` (expansão em vez de tabela de slots), `shared_guidance` para condições "outra" e o ajuste do dia da 011 para dor/crise. Ver Complexity Tracking. |

**Re-check pós-design (Phase 1)**: ✅ mantém PASS — modelo aditivo, uma rota removida por segurança, complexidade justificada abaixo.

---

## Project Structure

### Documentation (this feature)

```text
specs/024-treino-adaptativo/
├── plan.md              # Este arquivo
├── spec.md
├── research.md          # Phase 0 — R0..R15
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── api.md           # rotas HTTP
│   └── agent-runtime.md # Agente de Treino, schema, pedido, eval
├── checklists/
│   └── requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code

```text
packages/types/src/
├── conditions.ts                     ← NOVO: Goal, Region, HealthCondition, ConditionRules
├── method.ts                         ← NOVO: MethodPrescription, SessionKind
├── cycle.ts                          ← NOVO: SessionCheckin, CycleSummary, CycleFinding, CheckinTrend, GenerationStatus
├── agents.ts                         ← EVOLUI: HardConstraints (+maxJointStress, maxCardioImpact, minRir), regras de violação, tópicos de decisão
├── mesocycle.ts                      ← EVOLUI: week/kind/deload na sessão; week/kind/status novos na view
├── workout.ts                        ← EVOLUI: rirTarget, cardio, region no PlannedExercise
└── profile.ts                        ← EVOLUI: goalPrimary/Secondary/Target, cardio likes/avoid, onboarding

packages/workouts/src/
├── conditions.ts                     ← NOVO: CONDITION_CATALOG, rulesFor, mergeRules (mais restritiva), aplica crise
├── method.ts                         ← NOVO: prescribeMethod, validateAgainstMethod, expandWeeks
├── session-validity.ts               ← NOVO: sessionValidity
├── checkin-trend.ts                  ← NOVO: checkinTrend (deltas, implausível, modificadores)
├── cycle-analysis.ts                 ← NOVO: analyzeCycle (aderência, e1RM, RPE, dores, achados)
└── pain-adjustment.ts                ← NOVO: adapta a sessão do dia por dor/crise (usa alternativas de menor carga)

packages/ai/src/
├── cardio-bank.ts                    ← NOVO: CARDIO_BANK
├── mesocycle-planner.ts              ← EVOLUI: entrada com método/condições/ciclo; xhigh; 64k; IncompleteResponseError; semana-modelo
├── mesocycle-prompts.ts              ← REESCRITO: método, regras de escrita, pedido com prescrição e achados
├── agents/mesocycle-schema.ts        ← EVOLUI: semana-modelo com kind, cardio, mobilidade, rirTarget
├── agents/constraints.ts             ← EVOLUI: carga articular, impacto, RIR mínimo
├── agents/condition-rules.ts         ← NOVO: Agente de Medicina propõe regras para condição "outra" (structured output)
├── agents/__evals__/treino.eval.ts   ← NOVO
├── agents/__evals__/treino-profiles.ts ← NOVO
├── planner.ts, prompts.ts (legado)   ← REMOVIDOS (F1)
└── index.ts                          ← exports atualizados

packages/genetics/src/                ← EVOLUI: força da evidência por traço; parser aceita o JSON vindo do banco

apps/api/src/
├── routes/workout-generate.ts        ← REMOVIDO (F1)
├── routes/genetics-report.ts         ← NOVO
├── routes/mesocycle-actions.ts       ← NOVO: regenerate, repeat-week, analysis
├── routes/onboarding.ts              ← NOVO
├── routes/conditions.ts              ← NOVO (+ flare)
├── routes/session-checkins.ts        ← NOVO
├── routes/workout-review.ts          ← NOVO: review, confirm, delete
├── routes/workout-latest-plan.ts     ← EVOLUI: status novos, semana, gatilho de nova tentativa, crise/dor do dia
├── routes/workout-sessions.ts        ← EVOLUI: checkinIds
├── routes/genetic-profile.ts, nutrition-genetic-profile.ts ← EVOLUEM: leem do banco
├── services/genetics.service.ts      ← NOVO: lê/grava o laudo por usuário
├── services/generation-status.service.ts ← NOVO
├── services/plan-generation.service.ts   ← EVOLUI: prescrição, condições, análise, expansão, estado
├── services/integrated-profile.service.ts ← EVOLUI: genética do banco, condições, sessões válidas, objetivo estruturado
└── services/nutrition-context.service.ts  ← EVOLUI: genética do banco

apps/web/src/
├── app/onboarding/                   ← NOVO: passos + retomada
├── app/perfil/condicoes/             ← NOVO: lista, catálogo, "outra", crise
├── app/perfil/ (genética)            ← EVOLUI: envio do laudo
├── app/progresso/revisar/ (ou seção) ← NOVO: revisar treinos suspeitos
├── app/HomeClient.tsx, app/treinos/  ← EVOLUEM: semana X de N, tipo do dia, estados gerando/falhou/onboarding, repetir semana
├── app/workout/page.tsx              ← EVOLUI: check-in de antes, RIR alvo, itens de cardio/mobilidade, check-in de depois
├── components/cycle/                 ← NOVO: resumo do ciclo
├── hooks/useWorkoutPlan.ts           ← EVOLUI: remove o caminho legado/localStorage do plano gerado; regenerate
└── mocks/                            ← EVOLUI: fixtures e rotas do modo mock (021) para tudo o que é novo

supabase/migrations/
├── 2026xxxx_024_f1_genetics_generation.sql
├── 2026xxxx_024_f2_onboarding_conditions.sql
├── 2026xxxx_024_f3_mesocycle_weekly.sql
├── 2026xxxx_024_f4_session_checkins.sql
└── 2026xxxx_024_f5_cycle_analyses.sql

data/genetics/genera.json            ← REMOVIDO do repositório (F1); fixture fictícia para e2e/mocks
```

**Structure Decision**: mesmo monorepo; lógica determinística nova em `@helux/workouts` (já dona da progressão e do cansaço), IA e catálogos em `@helux/ai`, tipos em `@helux/types`. Sem pacote novo.

---

## Fases de entrega

| Fase | PR | Depende de | Migração | Pronto quando |
|---|---|---|---|---|
| F0 | eval + linha de base | — | — | resultado da linha de base salvo e aprovado |
| F1 | genética no banco + gerador único + robustez | — | F1 | quickstart F1 ok; `/workout/generate` fora |
| F2 | onboarding + condições + crise + validador articular | F1 | F2 | quickstart F2 ok; eval segurança 5/5 |
| F3 | método + mesociclo semanal + cardio/mobilidade + prompt | F2 | F3 | quickstart F3 ok; SC-001/002/003 no eval; total ≥ linha de base |
| F4 | sensações + validade + dor do dia | F3 | F4 | quickstart F4 ok |
| F5 | análise do ciclo + tendência de check-in | F4 | F5 | quickstart F5 ok; SC-005 no eval |

Cada PR roda o CI (exigido pelo ruleset da `main`) e o eval quando mexer no Agente de Treino (com aprovação do custo).

---

## Riscos

| Risco | Mitigação |
|---|---|
| Regras de condição conservadoras demais deixam grupos sem exercício | edge case da spec: o plano omite e explica; o eval tem perfil com várias condições |
| `xhigh` aumenta a latência além de SC-008 | geração em segundo plano; F0 mede `high`/`xhigh`/`max` e registra a escolha em R12 |
| Reescrever o prompt piora algum critério | eval obrigatório a cada mudança; segurança não pode piorar (FR-034) |
| Mesociclo antigo (`rotacao`) convive com o novo | leitores tratam `week` ausente; o novo formato só começa no próximo ciclo |
| Laudo genético continua no histórico do git | ação do dono no quickstart (repositório privado + filter-repo) |

---

## Complexity Tracking

| Item | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| `MethodPrescription` determinística + validação contra o método | SC-002/003 exigem frequência, volume, cardio e mobilidade verificáveis | método só no prompt não é verificável (situação atual) |
| Tabela `mesocycle_generation` | FR-031: nova tentativa e estado visível sem ficar preso em "gerando" | inferir pelo último mesociclo não distingue "gerando" de "falhou" |
| Expansão de semanas no código | progressão semanal consistente e saída da IA menor | IA gerar 20–30 sessões: saída enorme e progressão inconsistente |
