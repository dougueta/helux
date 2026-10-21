# Implementation Plan: Módulo de Nutrição Esportiva Genética

**Branch**: `018-nutricao-genetica` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/018-nutricao-genetica/spec.md` (clarify de 2026-10-13: refeições por regra, horário pelo início real do treino, fase de dieta recalibrada a cada check-in com % de gordura da Marinha, chat por fase, escopo US0–US4)

> **Atualização 2026-10-20**: a US2 (chat) saiu da 018 e foi para a spec 022. As partes deste plano sobre chat (`nutrition-prompts`, `nutrition-chat`, `chat-stream.md`, SC-003) ficam como histórico; a tabela `nutrition_chat_messages` fica na migration, mas sem uso.

## Summary

Um novo pacote puro, **`@helux/nutrition`**, concentra toda a regra determinística: TMB (Mifflin-St Jeor), % de gordura pelo método da Marinha, metas da **fase de dieta** por objetivo, **recalibração** a cada check-in (taxa semanal de peso + cintura), derivação do **dia** (treino/descanso, periodização de carboidrato com FTO, hidratação, ajuste por cansaço da 011), **montagem das refeições** a partir de um catálogo próprio com filtro genético obrigatório (zero lactose), **trocas rápidas** e **âncora de horários** pelo início/fim real do treino. `@helux/genetics` ganha a leitura do módulo `nutri` do `genera.json`; uma tabela de regras por SNP classifica os marcadores (US4) e gera as flags usadas pelo motor.

A API grava fase, recalibrações, plano do dia (upsert a cada leitura) e a conversa por fase; recalibra ao salvar um check-in. O agente de IA (`@helux/ai`) responde em **streaming** (SSE) com `claude-opus-5-5`, prompt com bloco estável em cache (persona + genética + fase) e contexto do dia, janela de 20 mensagens da fase. A web ganha a aba **Nutrição** (Hoje · Chat · Fase · Perfil genético), os campos novos de Perfil (altura, nascimento, sexo) e Check-in (pescoço), tudo com o DS v2.

## Technical Context

**Language/Version**: TypeScript 5 (Node 22 na API e no CI, Next.js 14 / React 18 na web)
**Primary Dependencies**: Fastify + Supabase JS + zod (API); `@anthropic-ai/sdk` atualizado para a versão atual em `@helux/ai` (streaming, `output_config`, `fallbacks`); Next.js App Router (web)
**Storage**: Supabase Postgres — migration aditiva `20261014002645_nutrition.sql`: 4 tabelas novas (`diet_phases`, `diet_phase_calibrations`, `daily_nutrition_plans`, `nutrition_chat_messages`) e 4 colunas (`user_training_profile.height_cm/birth_date/sex`, `body_checkins.neck_cm`), RLS por usuário
**Testing**: Vitest em todos os workspaces; Testing Library na web; SDK da Anthropic mockado; e2e local (spec 017) segue cobrindo o mesociclo — nutrição não entra no e2e nesta spec
**Target Platform**: Web responsiva (mobile-first) + API Node (decisão web-only do MVP)
**Project Type**: Monorepo pnpm/turbo (apps/web, apps/api, packages/*)
**Performance Goals**: SC-001 plano do dia < 1,5 s (cálculo puro, O(catálogo × refeições)); SC-003 primeiro token do chat < 2 s (streaming + effort `low` + cache do bloco estável); SC-004 mudança de cansaço/tipo do dia refletida < 1 s (recalculo na leitura)
**Constraints**: zero lactose garantido por filtro no catálogo (SC-002); mesmas entradas → mesmo plano; só classes do `helux-v2.css` (guard); sem chamada real à Anthropic em teste; RAM baixa (suítes direcionadas por story, completa uma vez no fim)
**Scale/Scope**: 1 usuário (dados genéticos pessoais em `genera.json`), ~70 alimentos no catálogo, 5 refeições/dia, check-ins mensais, conversa por fase com janela de 20 mensagens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|---|---|---|
| I. Monorepo-First | ✅ | Pacote novo `packages/nutrition` (com `package.json`, testes e README); resto em pacotes e apps existentes. |
| II. Test-First | ✅ | Cada função do motor nasce com teste vermelho (invariantes do contrato); rotas com testes de rota; telas com Testing Library; IA mockada. |
| III. Independent Deployability | ✅ | Migration aditiva (colunas opcionais, tabelas novas); API nova com web antiga funciona; web nova sem fase mostra "inicie uma fase". |
| IV. Shared Code via Packages | ✅ | Motor em `@helux/nutrition` usado por API (cálculo/validação) e web (âncora de horários); tipos em `@helux/types`; leitura do `genera.json` em `@helux/genetics`. |
| V. Simplicity | ✅ (com justificativa) | Um pacote novo — ver Complexity Tracking. Catálogo estático em código (sem tabela); plano recalculado na leitura (sem gatilhos/cache); sem tool use no agente. |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/018-nutricao-genetica/
├── plan.md
├── research.md            # R1–R13
├── data-model.md          # migration, tipos, transições
├── quickstart.md
├── contracts/
│   ├── nutrition-api.md     # rotas REST (fase, dia, trocas, histórico, perfil genético, perfil/check-in estendidos)
│   ├── chat-stream.md       # SSE do chat + pedido à Anthropic
│   └── nutrition-engine.md  # funções puras de @helux/nutrition e invariantes
└── tasks.md               # /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── nutrition/                      # NOVO — motor determinístico
│   ├── package.json · tsconfig.json · README.md
│   └── src/
│       ├── biometrics.ts           # ageOn, bmrMifflin, navyBodyFat, activityFactor
│       ├── phase.ts                # phaseTargets, recalibrate
│       ├── genetics-rules.ts       # NUTRI_MARKER_RULES, classifyMarkers, nutritionFlags
│       ├── catalog.ts              # FOOD_CATALOG (~70 itens, TACO)
│       ├── day.ts                  # dayTargets, buildDayPlan, recoveryNote
│       ├── swaps.ts                # swapOptions
│       ├── timing.ts               # anchorMealTimes
│       ├── index.ts
│       └── __tests__/*.test.ts
├── types/src/nutrition.ts          # NOVO — tipos do data-model; profile.ts e checkin.ts estendidos
├── genetics/src/nutrition.ts       # NOVO — parseGeneraNutrition
└── ai/src/
    ├── nutrition-prompts.ts        # NOVO — buildNutritionSystemPrompt (estável + dia)
    └── nutrition-chat.ts           # NOVO — streamNutritionChat

apps/api/src/
├── routes/
│   ├── nutrition-phase.ts          # NOVO — GET/POST /api/nutrition/phase, POST …/end
│   ├── nutrition-today.ts          # NOVO — GET/PUT today, swap-options, swap, history
│   ├── nutrition-chat.ts           # NOVO — GET/POST chat (SSE)
│   ├── nutrition-genetic-profile.ts# NOVO
│   ├── checkins.ts                 # + neck_cm, recalibração após gravar
│   └── profile.ts                  # + heightCm, birthDate, sex
├── services/
│   ├── nutrition-context.service.ts# NOVO — junta perfil, último check-in, fase, cansaço, mesociclo, treino de hoje, genética
│   └── diet-phase.service.ts       # NOVO — criar/encerrar fase, recalibrar, gravar calibração
└── app.ts                          # registra as rotas novas

apps/web/src/
├── app/nutricao/                   # NOVO — page + NutricaoClient (Hoje · Chat · Fase · Perfil genético)
├── components/nutrition/           # NOVO — DayTargets, MealCard, SwapSheet, RecoveryCard, PhaseCard, CalibrationList, ChatPanel, ProfileGate
├── hooks/useNutritionChat.ts       # NOVO — fetch + ReadableStream (SSE)
├── components/layout/NavBar.tsx    # + aba Nutrição
├── app/helux-v2.css                # .hx-nav com 5 colunas
├── app/perfil/…                    # + altura, nascimento, sexo
└── app/checkin/…                   # + pescoço e % de gordura calculado

supabase/migrations/20261014002645_nutrition.sql   # NOVO
```

**Structure Decision**: monorepo existente; um pacote novo para o domínio de nutrição (mesmo padrão de `@helux/workouts`), rotas Fastify por recurso (padrão de `routes/*.ts`), uma página App Router com seções.

## Ordem de entrega (para o `/speckit-tasks`)

1. **Setup/Fundação**: pacote `@helux/nutrition`, tipos, migration, atualização do SDK da Anthropic, `parseGeneraNutrition`, regras genéticas, catálogo.
2. **US0 — Fase de dieta** (P1): biometria + Marinha, perfil/check-in estendidos, fase e recalibração, tela Fase. *MVP de dados.*
3. **US1 — O dia** (P1): derivação do dia, refeições, tipo do dia, horários, troca rápida, histórico, tela Hoje.
4. ~~**US2 — Chat**~~: movida para a 022 em 2026-10-20.
5. **US3 — Cansaço** (P2): ajuste de recuperação + nota determinística no card.
6. **US4 — Perfil nutrigenômico** (P2): classificação + tela reaproveitando `TraitCard`.
7. **Polish**: guard do DS, suíte completa/typecheck/build, quickstart.

Cada story termina com commit e suítes direcionadas verdes; suíte completa só no fim (RAM).

## Riscos e pontos para revisão do usuário

- **SC-003 (< 2 s no primeiro token)** com `claude-opus-5-5`: o modelo pensa antes de responder (thinking não desliga); `effort: low` + cache devem bastar, mas é o ponto a medir no quickstart. Se não bastar, a decisão de trocar para um modelo mais rápido é do usuário (R9).
- **Dia de treino por padrão** com botão "hoje é descanso" (R5) — decisão derivada do clarify, não perguntada diretamente.
- **Valores das fórmulas** (déficit de 20%, proteína 1,8–2,2 g/kg, faixas de recalibração) são padrões da literatura esportiva, não prescrição individual — o disclaimer do spec continua valendo.
- **Migration em produção**: `supabase db push` fica com o usuário, antes do deploy da API.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Novo pacote `packages/nutrition` | Regras usadas por dois consumidores concretos (API calcula/valida; web ancora horários e mostra trocas) e domínio grande, independente do treino | Colocar em `@helux/workouts` misturaria domínios; colocar só na API impediria a web de ancorar horários sem duplicar código |
