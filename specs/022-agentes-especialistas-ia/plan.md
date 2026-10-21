# Implementation Plan: Time de Agentes Especialistas de IA

**Branch**: `022-agentes-especialistas-ia` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/022-agentes-especialistas-ia/spec.md`

---

## Summary

Transformar o gerador de treinos em um **time de três agentes especialistas** (Treino, Medicina Esportiva, Nutrição Genética) que leem o mesmo **Perfil Integrado** do usuário e conversam com ele por chats com streaming: um chat "Equipe Helux" que roteia automaticamente e um acesso direto por especialista.

Abordagem técnica:
1. **Perfil Integrado** montado na API a partir de todas as fontes (perfil, preferências novas, histórico, mesociclo, cansaço, check-ins, genética, exames*, nutrição*, relatos, restrições, edições), com liga/desliga por fonte e um snapshot estável e cacheável para o prompt. (*exames ficam vazios até a 019; nutrição depende da 018.)
2. **Agente de Treino** reescrito sobre o Perfil Integrado, com **structured outputs** e um **validador determinístico** de restrições rígidas (equipamento, exercícios a evitar, duração, restrições de segurança) que garante 100% de conformidade (SC-001), justificativa por decisão com fontes, ajustes por linguagem natural e edição manual com alternativas compatíveis.
3. **Runtime de agentes** em `@helux/ai` (Opus 5.5, streaming SSE, prompt caching em três blocos, ferramentas *strict* que só criam propostas pendentes, relatos e encaminhamentos), reaproveitando e generalizando o desenho de chat da 018.
4. **Controle de custo**: registro do `usage` de cada chamada, custo calculado por tabela de preços e teto mensal com aviso em 80% e bloqueio em 100%.

Decisões detalhadas em [research.md](./research.md); entidades em [data-model.md](./data-model.md); contratos em [contracts/](./contracts/).

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), Node 22, React 18 / Next.js 14 App Router, Fastify 5
**Primary Dependencies**: `@anthropic-ai/sdk` (atualizado da `^0.52` para a versão atual), `@supabase/supabase-js`, `@helux/types`, `@helux/genetics`, `@helux/workouts`, `@helux/nutrition` (da 018)
**Storage**: Supabase Postgres — 9 tabelas novas (preferências + histórico, fontes, conversas, mensagens, relatos, orientações compartilhadas, propostas, edições, uso de IA, teto) + 2 colunas em `mesocycle_plans`; RLS por usuário
**Testing**: Vitest (+ Testing Library na web), TDD estrito; `@anthropic-ai/sdk` mockado nos testes unitários; eval de segurança separado com chamadas reais, sob demanda
**Target Platform**: Web responsiva (decisão web-only do MVP) + API Fastify
**Project Type**: Monorepo web app + API + pacotes compartilhados
**Performance Goals**: chat — primeiro texto ≤ 3 s e resposta completa ≤ 30 s em 95% (SC-004a); proposta de ajuste ≤ 30 s (SC-004); Perfil Integrado montado ≤ 1 s
**Constraints**: nenhuma mudança no treino sem confirmação; nada de diagnóstico/medicamento; teto mensal de IA; histórico de mensagens só acrescentado (nunca editado) para manter thinking e cache válidos; dados de saúde fora dos logs
**Scale/Scope**: uso individual; 3 especialistas + roteador; ~12 rotas novas; 4 ferramentas de agente; ~6 telas/seções web novas ou alteradas

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Tudo em `apps/api`, `apps/web`, `packages/ai`, `packages/types`. |
| **II. Test-First (TDD)** | ✅ PASS | Funções puras (validador, duração, alternativas, sinais de edição, custo, alerta médico, render do snapshot) e handlers de ferramentas nascem com testes em RED; rotas com testes de API; streaming testado com SDK mockado. O eval de segurança complementa (não substitui) os testes. |
| **III. Independent Deployability** | ✅ PASS | API e web continuam deployáveis separadamente; campos novos nas respostas existentes são opcionais. Dependência da 018 é de código (pacote), não de deploy simultâneo. |
| **IV. Shared Code via Packages** | ✅ PASS | Tipos em `@helux/types`; toda chamada à Anthropic e a lógica pura em `@helux/ai`; regras de nutrição reaproveitadas de `@helux/nutrition` (sem duplicar). |
| **V. Simplicity (YAGNI)** | ✅ PASS com nota | Sem pacote novo e sem agendador (expiração calculada na leitura). Roteador é uma chamada extra justificada pela FR-023. Ver Complexity Tracking. |

**Re-check pós-design (Phase 1)**: ✅ mantém PASS — o data model é aditivo, os contratos preservam as rotas existentes, e o único item de complexidade continua justificado abaixo.

---

## Project Structure

### Documentation (this feature)

```text
specs/022-agentes-especialistas-ia/
├── plan.md              # Este arquivo
├── spec.md
├── research.md          # Phase 0 — R0..R13
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── agents-api.md    # rotas HTTP + eventos SSE
│   └── agent-runtime.md # superfície de @helux/ai, pedidos à Anthropic, ferramentas
├── checklists/
│   └── requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code

```text
packages/types/src/
└── agents.ts                         ← NOVO: IntegratedProfile, SourceKey, TrainingPreferences, AgentMessage,
                                         ConversationFact, SharedGuidance, WorkoutAdjustmentProposal, SessionEdit,
                                         PlanDecision, HardConstraints, AgentStreamEvent, UsageRecord

packages/ai/src/
├── mesocycle-planner.ts              ← EVOLUI: Perfil Integrado, Opus 5.5, structured outputs, validação + retry, decisions
├── mesocycle-prompts.ts              ← EVOLUI: prompt a partir do snapshot + preferências + restrições
├── agents/
│   ├── personas.ts                   ← NOVO: prompts estáveis dos 3 especialistas (escopo, regras de segurança)
│   ├── tools.ts                      ← NOVO: definições strict das 4 ferramentas por agente
│   ├── stream-agent.ts               ← NOVO: streamAgentReply (stream + laço de ferramentas + refusal)
│   ├── router.ts                     ← NOVO: routeMessage (structured output) + matchesMedicalRedFlag
│   ├── render-profile.ts             ← NOVO: snapshot ordenado/estável para o prompt
│   ├── session-adjustment.ts         ← NOVO: proposeSessionAdjustment
│   ├── constraints.ts                ← NOVO (puro): validatePlanAgainstConstraints, estimateSessionMinutes, compatibleAlternatives
│   ├── edit-signals.ts               ← NOVO (puro): preferenceSignalsFromEdits
│   ├── guidance-conflict.ts          ← NOVO: detectGuidanceConflict
│   └── cost.ts                       ← NOVO (puro): tabela de preços + computeCostUsd
├── agents/__evals__/medicina.eval.ts ← NOVO: eval de segurança (chamadas reais, script eval:medicina)
└── __tests__/agents/*.test.ts        ← TESTES

apps/api/src/
├── services/
│   ├── integrated-profile.service.ts ← NOVO: monta IntegratedProfile + HardConstraints (substitui plan-context)
│   ├── plan-context.service.ts       ← REMOVIDO/ABSORVIDO pelo serviço acima
│   ├── plan-generation.service.ts    ← EVOLUI: usa perfil integrado, grava decisions/sources/usage
│   ├── agent-chat.service.ts         ← NOVO: orquestra conversa, roteamento, handlers de ferramentas, persistência
│   ├── proposals.service.ts          ← NOVO: criar/aceitar/recusar propostas (incl. obsoleta)
│   ├── guidance.service.ts           ← NOVO: orientações compartilhadas (aceite, expiração na leitura, conflito)
│   ├── session-edit.service.ts       ← NOVO: edição manual + alternativas
│   └── ai-budget.service.ts          ← NOVO: registro de uso, consumo do mês, checagem de teto
├── routes/
│   ├── agents-profile.ts             ← NOVO: /api/agents/profile, /sources, /budget, /facts
│   ├── agents-chat.ts                ← NOVO: conversas + SSE
│   ├── agents-guidance.ts            ← NOVO
│   ├── training-preferences.ts       ← NOVO
│   ├── workout-proposals.ts          ← NOVO: proposals accept/reject + /workout/adjust
│   ├── workout-session-edit.ts       ← NOVO: alternativas + PATCH exercício
│   └── workout-latest-plan.ts        ← EVOLUI: campos novos opcionais
└── __tests__/*.test.ts               ← TESTES por rota/serviço

apps/web/src/
├── app/
│   ├── equipe/                       ← NOVO: chat Equipe Helux (?agente= para acesso direto)
│   ├── perfil/integrado/             ← NOVO: fontes, relatos, restrições, teto/consumo
│   ├── perfil/preferencias/          ← NOVO: formulário de preferências
│   ├── treinos/                      ← EVOLUI: edição manual, "Falar com o treinador", proposta de adaptação
│   └── nutricao/                     ← EVOLUI (018): seção Chat passa a usar a API da 022
├── components/agents/
│   ├── AgentChat.tsx                 ← NOVO: mensagens, streaming SSE, indicador de especialista
│   ├── ProposalCard.tsx              ← NOVO: antes → depois, aceitar/recusar
│   ├── GuidanceCard.tsx / FactNote.tsx / HandoffCard.tsx ← NOVO
│   └── SourceToggleList.tsx          ← NOVO
├── components/layout/Shell.tsx       ← EVOLUI: botão "Equipe" no cabeçalho
├── services/agents.service.ts        ← NOVO: cliente das rotas + leitor de SSE
└── mocks/                            ← EVOLUI (021): fixtures e stream simulado dos agentes

supabase/migrations/
└── 2026MMDDHHMMSS_specialist_agents.sql ← NOVO (aditiva)

specs/018-nutricao-genetica/tasks.md  ← AJUSTE: tarefas da US2 marcadas "movidas para a 022"
```

**Structure Decision**: os agentes vivem em `packages/ai/src/agents/` (único ponto de contato com a Anthropic, lógica pura testável); a API faz I/O, persistência e SSE; a web ganha componentes de chat genéricos em `components/agents/` usados pelo chat Equipe e pelos acessos diretos.

---

## Ordem de entrega (por história)

| Fase | Conteúdo | Depende de |
|---|---|---|
| Fundação | migration, tipos, SDK atualizado, `cost.ts` + `ai-budget.service`, `integrated-profile.service` com fontes existentes | — |
| US1 (P1) | preferências, validador, mesociclo novo (structured outputs + decisions), edição manual, proposta de adaptação, ajuste por linguagem natural (`/workout/adjust`) | Fundação |
| US2 (P1) | tela Perfil Integrado, liga/desliga de fontes, teto/consumo | Fundação |
| Runtime de chat | `stream-agent`, ferramentas, SSE, `AgentChat`, Agente de Treino no chat | US1 |
| US3 (P2) | persona Medicina, restrições compartilhadas, alerta médico, eval | Runtime |
| US4 (P2) | persona Nutrição + fonte `nutricao` | Runtime + **018 integrada** |
| US5 (P3) | chat Equipe + roteador, relatos compartilhados, conflitos, handoff | US3, US4 |

---

## Riscos e pontos para revisão do usuário

1. **Dependência da 018** (R0): US4 e a fonte `nutricao` esperam a 018 na `main`. Branch precisará de rebase.
2. **Latência com thinking sempre ligado** no Opus 5.5: medir `firstTokenMs`; se SC-004a falhar, opções em ordem: reduzir o snapshot, trocar o roteador para Haiku 5.5, rever o modelo dos chats (decisão do usuário).
3. **Custo**: estimativa grosseira — mensagem de chat com ~6 k tokens de prompt (majoritariamente em cache) e ~600 de saída ≈ US$ 0,02–0,04; mesociclo ≈ US$ 0,20–0,40. O teto padrão de US$ 20/mês cobre ~500 mensagens.
4. **Edição manual com override de segurança** (R7): o usuário pode salvar mesmo com aviso; registrado em `session_edits.safety_override`.

---

## Complexity Tracking

| Violação / complexidade | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Chamada extra de roteamento por mensagem no chat Equipe | FR-023 exige chat único com encaminhamento automático e indicação do especialista | Um agente "faz-tudo" perde escopos e regras de segurança por especialista; handoff só por ferramenta gasta uma resposta inteira antes de encaminhar |
| Validador determinístico + retry além do prompt | SC-001 exige 100% de conformidade com restrições rígidas | Confiar só no prompt não garante 100% |
