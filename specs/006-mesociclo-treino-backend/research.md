# Phase 0 Research: Geração de Mesociclo de Treino com Ajuste por Recovery

Nenhum `NEEDS CLARIFICATION` restou no Technical Context — as decisões abaixo já foram resolvidas durante o brainstorming que precedeu esta spec. Este documento registra as decisões e o porquê, para referência durante a implementação.

## Decisão 1 — Arquitetura de geração: prompt único vs. orquestrador

**Decision**: Um único prompt/chamada Claude gera o mesociclo inteiro (Abordagem A), reaproveitando quase integralmente o `buildSystemPrompt` existente (perfil genético, restrições, catálogo de exercícios, regras de periodização A/B/C/D) — só o formato de saída muda, de uma sessão para um array de sessões.

**Rationale**: Projeção de custo comparativa (ver histórico de brainstorming) mostrou que a Abordagem A custa **$0.10–$0.25 por mesociclo gerado**, contra **$0.15–$0.35** (orquestrador de 2 estágios) e **$0.35–$0.60+** (multi-agente completo) — e ainda é **mais barata** que o padrão atual de gerar 1 sessão a cada treino concluído (~$0.60/mês). O prompt atual já contém toda a lógica de divisão muscular e periodização necessária; não há ganho de qualidade esperado em separar em múltiplos agentes nesta fase do produto.

**Alternatives considered**:
- Orquestrador 2 estágios (1 chamada de estrutura macro + N chamadas por sessão) — mais controle teórico por sessão, mas mais lento (9–25 chamadas) e mais caro, sem necessidade comprovada.
- Multi-agente completo (especialistas por periodização/seleção de exercícios/alertas genéticos) — complexidade e custo desproporcionais ao ganho nesta fase.

## Decisão 2 — Modelo de dados: 1 linha por mesociclo com array de sessões vs. tabela normalizada

**Decision**: Nova tabela `mesocycle_plans` com uma coluna `sessions` (JSONB, array ordenado). Cada elemento do array carrega a prescrição completa da sessão (mesmo formato de `PlannedExercise[]` já usado) + `letter`/`focus` + `completed_at` (nullable).

**Rationale**: O acesso predominante é "leia o ciclo inteiro" (para exibir hoje + próximos) ou "leia a primeira sessão pendente" — ambos são operações naturais sobre um array já carregado, sem necessidade de joins. Uma tabela normalizada (`mesocycle_sessions` com FK para `mesocycle_plans`) adicionaria complexidade de escrita (transação multi-tabela ao gerar) sem benefício de consulta neste volume (poucas sessões por ciclo, usuário único). Consistente com o princípio de Simplicidade (YAGNI) da constituição.

**Alternatives considered**:
- Tabela normalizada `mesocycle_sessions` — mais "correta" relacionalmente, mas overhead desnecessário no volume/escala deste produto.
- Reaproveitar `workout_plans` adicionando uma coluna `sessions` — rejeitado porque o formato atual da tabela é fundamentalmente "1 linha = 1 sessão" (colunas `exercises`/`rationale` no nível raiz); misturar os dois formatos na mesma tabela criaria ambiguidade em toda leitura futura.

## Decisão 3 — Ajuste por recovery: onde vive e quando é aplicado

**Decision**: Função pura `applyRecoveryAdjustment(session, recoveryData)` em `packages/ai`, chamada em tempo de leitura dentro de `GET /workout/latest-plan` — nunca gravada no banco, nunca envolve uma chamada de IA.

**Rationale**: Confirmado no brainstorming ("regras determinísticas, sem nova chamada IA") — precisa ser instantâneo e refletir sempre o dado de recovery mais recente, mesmo que o usuário abra o app em dias diferentes sem novo treino registrado. Colocar em `packages/ai` (não num novo pacote) porque a lógica reaproveita diretamente os limiares de HRV já definidos no prompt de geração (`>=60` bom, `40-59` moderado, `<40` comprometido) — mantém as duas fontes de verdade sobre recovery no mesmo lugar.

**Alternatives considered**:
- Chamada de IA pontual só para a sessão de hoje — rejeitada explicitamente pelo usuário (custo/latência extra sem necessidade).
- Gravar o ajuste no banco ao calcular — rejeitado porque o recovery muda dia a dia; gravar criaria a necessidade de invalidar/recalcular, enquanto calcular em tempo de leitura é mais simples e sempre correto.

## Decisão 4 — Regras de ajuste determinístico (magnitude)

**Decision**: Reaproveitar os três buckets de HRV já usados na narrativa do prompt atual, mas convertê-los em regras numéricas objetivas:

| HRV do dia | Ajuste aplicado à sessão pendente |
|---|---|
| `>= 60` (boa recuperação) | Nenhum ajuste — prescrição original do mesociclo |
| `40–59` (moderada) | Reduzir volume: -1 série por exercício composto (mínimo 2 séries), sem alterar carga |
| `< 40` (comprometida) | Reduzir volume (-1 série, mínimo 2) **e** sinalizar carga sugerida com nota de redução (~10-20%) |
| Sem dado de HRV disponível | Nenhum ajuste — prescrição original, mesmo comportamento de hoje |

**Rationale**: Mantém consistência com o que a IA já comunica hoje na justificativa em texto ("HRV atual indica recuperação comprometida — reduzir volume e intensidade"), só que agora aplicado de forma mecânica e imediata em vez de apenas narrativa. Os limiares exatos (60/40) já são os usados em produção (`buildUserPrompt` em `packages/ai/src/prompts.ts`), evitando introduzir uma segunda fonte de verdade divergente.

**Alternatives considered**: Ajustar carga numericamente (ex.: -10% do peso sugerido) — mais preciso, porém a carga hoje é uma string livre (ex.: "80kg", "+2.5kg vs última sessão", "peso corporal"), não um número estruturado; parsear/reescrever essa string de forma confiável é complexidade desnecessária nesta fase. Reduzir séries é uma operação segura sobre um campo numérico existente.

## Decisão 5 — Gatilho de regeneração em background

**Decision**: `triggerBackgroundPlanGeneration` passa a checar, após marcar a sessão concluída, se **todas** as sessões do mesociclo ativo têm `completed_at` preenchido. Só então dispara `generateMesocyclePlan` para o próximo ciclo. Continua fire-and-forget (não bloqueia a resposta de `POST /api/workouts/sessions`), preservando o comportamento não-throwing atual.

**Rationale**: Direto da User Story 3 do spec — a fila só avança por conclusão, e o próximo mesociclo deve existir automaticamente antes do usuário precisar dele, sem ação manual.

**Alternatives considered**: Gerar o próximo mesociclo antecipadamente (ex.: quando restam N sessões) — mais complexo e sem necessidade demonstrada; gerar sob demanda quando `GET /workout/latest-plan` não encontra sessão pendente — rejeitado porque adicionaria latência de geração de IA (segundos) numa chamada de leitura que hoje é instantânea.

## Gap identificado (fora do escopo desta spec)

`POST /workout/generate` (o botão manual "Gerar Novo Plano" já existente no web) continua chamando `generateWorkoutPlan` (sessão única) — não foi incluído nas user stories aprovadas para esta spec. Isso significa que, após esta mudança, esse botão manual fica desalinhado com a leitura baseada em mesociclo. Documentado no `plan.md` (Complexity Tracking) como débito técnico a resolver antes de reabilitar esse fluxo na UI.
