# Research: Time de Agentes Especialistas de IA (022)

Decisões técnicas que resolvem os pontos abertos da spec (após o clarify de 2026-10-13). Formato: Decision / Rationale / Alternatives.

## R0 — Pré-requisito: base de código da 018

- **Decision**: a 022 é implementada **depois que a 018 (US1/US3/US4) for integrada à `main`**, e a branch `022-agentes-especialistas-ia` é rebaseada sobre a `main` nesse momento. Enquanto isso, as tarefas que não dependem da nutrição (Perfil Integrado, Agente de Treino, Medicina Esportiva) podem avançar. A US2 da 018 (chat do nutricionista) **sai do escopo da 018**: o `tasks.md` da 018 deve marcar essas tarefas como "movidas para a 022". O desenho de chat da 018 (`contracts/chat-stream.md`, research R9) é **reaproveitado e generalizado** aqui.
- **Rationale**: o Agente de Nutrição Genética precisa de `@helux/nutrition` (plano do dia, fase, regras genéticas) e das tabelas `diet_phases`/`daily_nutrition_plans`, que só existem na branch 018. Hoje a 022 saiu da 021, que não contém a 018.
- **Alternatives**: fazer merge da 018 na 022 agora (mistura revisões de duas features num PR); duplicar regras de nutrição na 022 (viola a Constituição IV).
- **Tabela `nutrition_chat_messages` da 018**: se a migration da 018 ainda não tiver sido aplicada no Supabase, remover a tabela da migration da 018 antes do merge; se já foi aplicada, ela fica sem uso (a 022 não a lê) e é removida numa migration de limpeza da 022.

## R1 — Onde mora o código dos agentes

- **Decision**:
  - **`@helux/ai`** (existente) ganha `src/agents/`: definições dos 3 especialistas (persona, regras, ferramentas), roteador, montagem de prompt, laço de streaming com ferramentas e cálculo de custo. Continua sendo o único pacote que fala com a API da Anthropic.
  - **`@helux/types`** ganha `src/agents.ts`: tipos de Perfil Integrado, preferências, conversa, mensagem, proposta, relato, restrição, eventos SSE e uso de IA. Assim a web consome os tipos sem depender de `@helux/ai`.
  - **Lógica determinística pura** (validação de restrições rígidas do plano, estimativa de duração, filtro de alternativas compatíveis, cálculo de custo) fica em `@helux/ai/src/agents/` como funções puras, sem I/O, testadas isoladamente.
  - **`apps/api`** orquestra I/O: montagem do Perfil Integrado a partir do Supabase, persistência, rotas e SSE.
- **Rationale**: o mesmo padrão da 018 (regra pura em pacote, API orquestra). Não cria pacote novo (Simplicidade): os agentes são a evolução do que já está em `@helux/ai`.
- **Alternatives**: pacote `@helux/agents` separado (seria um segundo pacote falando com a Anthropic, com duplicação de cliente/caching); lógica direto em `apps/api/src/services` (não testável fora da API e sem reuso dos tipos pela web).

## R2 — Modelo, esforço e fallback

- **Decision**: todas as chamadas usam **`claude-opus-5-5`** (padrão atual), com thinking adaptativo (não pode ser desligado nesse modelo) e:
  - **chats dos especialistas**: `output_config.effort: "low"` (latência, SC-004a);
  - **roteador do chat "Equipe Helux"**: `effort: "low"`, resposta por structured output (R4);
  - **geração de mesociclo e proposta de ajuste de sessão**: `effort: "medium"` (decisão com muitas variáveis; ainda dentro de SC-004);
  - **fallbacks**: `betas: ["server-side-fallback-2026-07-01"]` + `fallbacks: "default"` em todas as chamadas; `stop_reason: "refusal"` final → mensagem amigável, nada gravado.
  - A chamada atual do mesociclo (`claude-sonnet-4-6`, `generateMesocyclePlan`) **migra para `claude-opus-5-5`** nesta spec, já que o Agente de Treino passa a ser um dos especialistas.
  - O SDK `@anthropic-ai/sdk` em `packages/ai` (hoje `^0.52`) é **atualizado** para a versão atual (necessário para `output_config`, `fallbacks`, `strict` em ferramentas). Se a 018 já tiver atualizado, só conferir.
- **Rationale**: um modelo só = um namespace de cache e um preço a rastrear. Ajustar o esforço por rota é a alavanca de custo e latência recomendada antes de trocar de modelo.
- **Alternatives**: Haiku 5.5 no roteador (bem mais barato, US$ 0,10/0,50 por MTok). **Ponto para revisão do usuário**: se o custo do roteador pesar no teto mensal, trocar só o roteador para Haiku 5.5 é a primeira alavanca.

## R3 — Chats com streaming via SSE (generaliza a 018)

- **Decision**: `POST /api/agents/chat` responde `text/event-stream` (Fastify `reply.raw`), consumido na web com `fetch` + `ReadableStream` (EventSource não envia `Authorization`). Eventos: `start`, `routed` (só no chat Equipe), `delta`, `proposal`, `fact`, `handoff`, `done`, `error` (contrato em `contracts/agents-api.md`). No servidor: `client.beta.messages.stream(...)` → repassa `text_delta` como `delta`; ao final `finalMessage()` → trata `tool_use`/`refusal`/`max_tokens`, grava a resposta e o uso.
- **Histórico**: últimas **20 mensagens** da conversa (mesma regra da 018); conversa nova = histórico vazio (FR-022). *Na implementação (2026-10-20): as respostas voltam como texto, sem blocos de raciocínio/ferramenta — com a janela andando, reenviá-los conta como edição do histórico e o Opus 5.5 rejeita; o `api_content` fica gravado só para auditoria.*
- **Thinking**: `display` omitido (o usuário não vê raciocínio). O primeiro texto visível pode atrasar alguns segundos com thinking adaptativo; esforço `low` mantém isso dentro de 3 s na maioria das mensagens (SC-004a). Medir na validação.
- **Rationale**: SSE é unidirecional por mensagem, suficiente e já desenhado na 018.
- **Alternatives**: WebSocket (bidirecional sem necessidade); resposta inteira de uma vez (descartado no clarify).

## R4 — Roteamento do chat "Equipe Helux" (FR-023)

- **Decision**: duas etapas por mensagem no chat Equipe:
  1. **roteador**: chamada curta, não-streaming, com `output_config.format` (JSON schema `{ agent: "treino" | "medicina" | "nutricao", reason: string }`), recebendo a mensagem nova + as últimas 4 mensagens da conversa Equipe + a lista de especialistas com seus escopos;
  2. **especialista escolhido** responde em streaming (como no acesso direto), e o SSE emite `routed { agent }` antes do primeiro `delta` (a UI mostra quem está respondendo).
  - **Atalho de segurança determinístico**: antes do roteador, um verificador de palavras de alerta médico (lista fechada, R10) força `medicina` sem gastar a chamada de roteamento.
  - A conversa Equipe é uma conversa própria (`channel = 'equipe'`); cada mensagem do agente guarda qual especialista respondeu.
- **Rationale**: structured output dá um roteamento verificável e barato; separar o roteador do especialista mantém cada especialista com seu prompt estável e cacheável.
- **Alternatives**: um único agente com os três papéis no mesmo prompt (perde escopo claro e regras de segurança por especialista); handoff só via ferramenta (o primeiro agente sempre gasta uma resposta antes de passar adiante).

## R5 — Ferramentas dos agentes (propostas, relatos, encaminhamento)

- **Decision**: ferramentas **do cliente**, definidas por nós, com `strict: true` e `tool_choice: auto`, todas **não destrutivas**: elas só registram algo **pendente**, que a UI mostra como cartão de confirmação. Nada muda no treino ou no perfil sem o usuário aceitar (FR-009, FR-018).

  | Ferramenta | Agentes | Efeito |
  |---|---|---|
  | `propose_shared_guidance` | todos | cria Restrição/Recomendação Compartilhada `pendente` (texto, tipo, motivo, prazo opcional) |
  | `propose_session_adjustment` | treino | gera Proposta de Ajuste para a sessão pendente (antes → depois, R7) |
  | `record_conversation_fact` | todos | grava Relato de Conversa (categoria, texto curto) — visível e removível no Perfil Integrado (FR-020a) |
  | `suggest_specialist` | todos | sinaliza handoff (FR-020); a UI oferece "continuar com X" |

  - Laço: após `finalMessage()`, se `stop_reason === "tool_use"`, o servidor valida cada `input` contra o schema (com `strict` + validação local antes de executar), executa, devolve **todos** os `tool_result` numa única mensagem `user` e continua o stream (máx. **3 iterações** por mensagem do usuário). Cada efeito vira um evento SSE (`proposal`, `fact`, `handoff`).
  - `eager_input_streaming: true` nas ferramentas (padrão para streaming + ferramentas de cliente), com validação do input antes de executar (o input pode chegar truncado).
  - Relatos não pedem confirmação (só registram fatos ditos pelo próprio usuário), mas aparecem como aviso discreto na conversa ("anotei: dor no ombro direito") e podem ser apagados.
- **Rationale**: ferramentas estruturadas tornam as propostas testáveis e garantem que o modelo nunca aplica nada sozinho. Relato por ferramenta evita uma segunda chamada só para extrair fatos.
- **Alternatives**: extrair relatos com uma chamada separada após cada conversa (custo extra); aplicar mudanças direto pela ferramenta (contradiz FR-009/FR-018).

## R6 — Perfil Integrado: montagem, snapshot e cache

- **Decision**:
  - `buildIntegratedProfile(userId)` no `apps/api` lê em paralelo as fontes e devolve um `IntegratedProfile` com, por fonte: `status` (`ativa` | `vazia` | `desativada`), `updatedAt`, `summary` (resumo textual curto para o prompt) e `data` (estruturado para a tela).
  - Fontes e origens:
    | Fonte | Origem | Observação |
    |---|---|---|
    | perfil | `user_training_profile` | existente (008) |
    | preferencias | `training_preferences` (nova) | R8 |
    | historico | `workout_sessions` (últimas 10) + progressão de carga (014) | hoje o contexto usa só 5 |
    | mesociclo | `mesocycle_plans` ativo | existente |
    | cansaco | sinal efetivo do dia (011) + HRV 48 h | só o dia corrente |
    | checkins | `body_checkins` (últimos 2) | existente |
    | genetica | `data/genetics/genera.json` | existente |
    | exames | adaptador `getLatestBiomarkers` → **vazia** até a 019 existir | fonte declarada, sem dados |
    | nutricao | `@helux/nutrition` (fase ativa + plano do dia) | depende da 018 (R0) |
    | relatos | `conversation_facts` (nova) | R5 |
    | restricoes | `shared_guidance` ativas (nova) | R9 |
    | edicoes | `session_edits` agregadas (nova) | R7, sinal de preferência |
  - Fonte desativada pelo usuário (`agent_source_settings`) → `status: desativada`, nenhum dado vai ao prompt (FR-003). Exames com coleta > 6 meses → marcados "desatualizado" no resumo.
  - **Prompt em três blocos de sistema**: (1) persona + regras do especialista + definições de ferramentas — estável, `cache_control` com TTL de 1 h; (2) snapshot do Perfil Integrado (resumos por fonte, ordem fixa de fontes, JSON com chaves ordenadas) — `cache_control` 5 min, muda só quando os dados mudam; (3) contexto do dia (data, treino do dia, cansaço) — sem cache. Histórico depois disso, com auto-caching no fim.
  - Cada resposta grava `sourcesUsed` (lista de fontes ativas/ausentes/desativadas) na mensagem, e o texto da resposta cita as fontes relevantes (FR-004).
- **Rationale**: o snapshot estável e ordenado maximiza acerto de cache; a lista de fontes por resposta atende FR-004 sem depender do modelo lembrar.
- **Alternatives**: deixar o modelo buscar fontes por ferramenta (`get_source`) — mais idas e voltas e latência no chat; snapshot completo com dados brutos (tokens demais).

## R7 — Geração de mesociclo e ajustes do Agente de Treino

- **Decision**:
  - `generateMesocyclePlan` passa a receber o `IntegratedProfile` (em vez do `PlanInput` reduzido) e usa **structured outputs** (`output_config.format` com JSON schema do mesociclo, incluindo `decisions: [{ topic, choice, sources: SourceKey[], reason }]`), substituindo o parse por regex de bloco ```json. A justificativa por decisão alimenta FR-008/SC-002.
  - **Validador determinístico** `validatePlanAgainstConstraints(plan, constraints, bank)` — puro, roda **depois** da IA:
    - exercício fora do banco ou em `exercisesToAvoid` → violação;
    - equipamento do exercício (campo `equipment` do banco: `barra` / `halteres` / `maquina-cabo` / `peso-corporal`) fora de `availableEquipment` → violação;
    - duração estimada > `maxSessionMinutes` → violação. Estimativa: Σ séries × (tempo de execução por série 40 s + descanso prescrito) + 5 min de aquecimento;
    - restrição compartilhada de segurança com `blockedPatterns`/`blockedExercises` → violação.
    - Com violação: **1 nova tentativa** com a lista de violações no prompt; persistindo, a geração falha com mensagem clara e o treino vigente continua (FR-024). Garante SC-001 sem confiar só no modelo.
  - **Ajuste de sessão por linguagem natural** (`propose_session_adjustment`): a IA devolve a sessão ajustada; o servidor valida com o mesmo validador, monta o diff antes → depois (reaproveitando o formato de resumo de mudanças da 011) e grava uma `workout_adjustment_proposals` `pendente`. Aceitar aplica na sessão pendente do mesociclo; recusar descarta.
  - **Mudança de restrição rígida no meio do mesociclo** (FR-011): ao salvar preferências com mudança em equipamentos/evitar/duração, o servidor roda o validador nas sessões pendentes; se houver violação, gera **uma proposta de adaptação** (IA, só para as sessões afetadas) exibida antes → depois. Sem violação, nada a propor.
  - **Edição manual** (FR-009a): troca de exercício só por alternativas do banco com o mesmo `muscleGroup` e `pattern` (ou só o mesmo `muscleGroup` se não houver nenhuma), equipamento disponível e fora de `exercises_to_avoid` — lista calculada de forma determinística, sem IA. Edição que viole restrição de segurança → aviso com motivo; o usuário pode confirmar mesmo assim (restrições de segurança só são removidas no Perfil Integrado, mas a edição manual consciente é dele). Cada edição grava `session_edits`.
  - **Sinal de preferência** (FR-009b): agregação determinística das edições (exercício trocado ≥ 2 vezes nos últimos 60 dias → "evitar tendência"; exercício escolhido como substituto ≥ 2 vezes → "preferência") entra no snapshot da fonte `edicoes`.
- **Rationale**: validação determinística é o único jeito de garantir 100% (SC-001); structured outputs eliminam a falha de parse.
- **Alternatives**: confiar só no prompt (não garante SC-001); bloquear de vez a edição que viola restrição (tira a autonomia que o usuário pediu).

## R8 — Preferências de treino

- **Decision**: tabela `training_preferences` (1 linha por usuário, versionada por `updated_at` + histórico em `training_preferences_history` para justificar "a partir de quando"). Campos: `available_days` (dias da semana), `max_session_minutes`, `location` (`academia` | `casa` | `ao-ar-livre` | `hotel`), `available_equipment` (subconjunto dos 4 equipamentos do banco), `favorite_exercises` (ids do banco), `exercises_to_avoid` (ids do banco), `priority_muscle_groups`, `training_style` (texto curto de lista: `hipertrofia-classica` | `forca` | `funcional` | `circuito` | `misto`), `free_instructions` (texto ≤ 1000).
  - `available_days.length` substitui o `availableDaysPerWeek: 4` fixo de `plan-context.service.ts`.
  - Classificação rígida × suave fixa no código: rígidas = `available_equipment`, `exercises_to_avoid`, `max_session_minutes`; suaves = o resto (clarify Q1).
- **Rationale**: listas fechadas onde a validação depende disso (equipamento, exercícios por id); texto livre só onde é instrução ao agente.
- **Alternatives**: tudo em texto livre (não validável); colunas no `user_training_profile` (mistura perfil declarado com preferências e dificulta o histórico).

## R9 — Restrições/recomendações compartilhadas e conflitos

- **Decision**: tabela `shared_guidance` com `kind` (`restricao-seguranca` | `recomendacao`), `text`, `reason`, `origin_agent`, `status` (`pendente` → `ativa` | `recusada`; `ativa` → `expirada` | `removida`), `starts_at`, `expires_at` (opcional), e, para restrições de treino, `blocked_patterns`/`blocked_exercises` (opcionais, usados pelo validador R7).
  - **Expiração**: calculada na leitura (`expires_at < now()` → tratada como `expirada` e gravada como tal no primeiro acesso), e o primeiro agente que responder depois disso recebe no bloco do dia "restrição X expirou em …" para avisar o usuário.
  - **Conflito** (FR-021): ao aceitar uma recomendação, o servidor pede à IA (chamada curta, structured output) se ela conflita com alguma restrição de segurança ativa; havendo conflito, a UI avisa e a restrição prevalece enquanto ambas estiverem ativas (a recomendação é marcada `em-conflito` no prompt).
- **Rationale**: estado explícito permite testar SC-007; expiração na leitura evita agendador (Simplicidade).
- **Alternatives**: job agendado de expiração (infra extra); detecção de conflito puramente por regras (texto livre não permite).

## R10 — Segurança do Agente de Medicina Esportiva

- **Decision**:
  - Prompt com regras inegociáveis: não diagnosticar, não prescrever medicamento, aviso de que não substitui avaliação médica, triagem antes de orientar, sinais de alerta → orientação de atendimento e nada de "continue treinando" (FR-013 a FR-015).
  - **Lista fechada de sinais de alerta** (usada no atalho do roteador e como cenários de teste de SC-005): dor ou aperto no peito; falta de ar desproporcional; desmaio ou quase desmaio; palpitação com tontura; perda súbita de força ou sensibilidade; dormência persistente ou em um lado do corpo; dor de cabeça súbita e intensa; inchaço importante ou deformidade após trauma; estalo com incapacidade de apoiar/mover; urina escura após treino intenso (suspeita de rabdomiólise); febre com dor muscular intensa.
  - **Eval de segurança** em `packages/ai/src/agents/__evals__/` (fora do `vitest run` padrão, roda sob demanda com chave real): ~20 cenários (os 11 sinais + variações + falsos positivos) com verificação por LLM-juiz das regras. Os testes unitários (padrão do projeto) mockam `@anthropic-ai/sdk`.
- **Rationale**: a lista fechada torna SC-005 verificável; o eval cobre o comportamento real do modelo, que mocks não testam.
- **Alternatives**: confiar só no prompt (não mensurável).

## R11 — Teto mensal de custo de IA (FR-025/026, SC-009)

- **Decision**:
  - Toda chamada (roteador, chats, geração, ajustes, conflito) grava `ai_usage_events` (agente, operação, modelo, `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, custo em USD calculado, data).
  - **Custo** por função pura `computeCostUsd(usage, model)` com tabela de preços versionada no código (Opus 5.5: US$ 4/MTok entrada, US$ 20/MTok saída, escrita de cache 1,25× entrada para TTL de 5 min e 2× para 1 h, leitura de cache US$ 0,20/MTok). Se o fallback de refusal rodar em outro modelo, usa o `usage` e o modelo efetivo da resposta.
  - `ai_budget_settings` (teto mensal em USD, padrão **US$ 20**, editável no Perfil Integrado). Mês = mês civil no fuso `America/Sao_Paulo`.
  - **Antes** de cada operação: consumo do mês ≥ 100% → `409 { code: "budget-exceeded" }` e a UI mostra a mensagem com link para aumentar o teto; entre 80% e 100% → a operação roda e a resposta inclui `budgetWarning`. A operação em andamento sempre termina (SC-009 tolera a última operação).
  - O treino vigente, o registro de treinos e a edição manual não passam por esse controle.
- **Rationale**: o `usage` da resposta é a fonte exata; checar antes da chamada garante o teto com folga de no máximo uma operação.
- **Alternatives**: Admin API de custo da Anthropic (exige chave admin e tem atraso); limite por número de mensagens (descartado no clarify).

## R12 — Interface web

- **Decision**:
  - **Chat "Equipe Helux"** em `/equipe`, aberto por um botão fixo no cabeçalho (Shell) e por um card na Home — sem nova aba na barra inferior (a 018 já leva a barra a 5 abas).
  - **Acesso direto**: Agente de Treino como seção "Falar com o treinador" em `/treinos` e na tela do treino do dia; Agente de Nutrição na seção Chat de `/nutricao` (a da 018, agora usando a API da 022); Medicina Esportiva em `/equipe?agente=medicina` e a partir do campo de lesão no Perfil.
  - Componentes compartilhados: `AgentChat` (mensagens, streaming, indicação do especialista, cartões de proposta/relato/encaminhamento), `ProposalCard` (antes → depois, aceitar/recusar), `IntegratedProfile` (`/perfil/integrado`: fontes, liga/desliga, relatos, restrições, preferências, teto de IA e consumo).
  - Preferências de treino em `/perfil/preferencias` (formulário único com listas de seleção; SC-003 < 3 min).
  - Edição manual nas telas de sessão pendente (`/treinos`): menu por exercício "trocar" (lista de alternativas compatíveis) e edição de séries/reps/carga.
  - Só componentes e classes do DS v2 (teste de guarda existente).
  - **Modo mock (021)**: o `mock-router` ganha as rotas da 022, e o chat em modo mock emite um stream SSE simulado a partir de fixtures (respostas pré-gravadas por agente, incluindo uma proposta e um relato), sem chamar a IA.
- **Rationale**: o chat é transversal e não merece aba própria; o acesso direto fica no contexto, como decidido no clarify.
- **Alternatives**: 6ª aba (barra apertada no celular); chat flutuante em todas as telas (conflita com a tela de treino ativo).

## R13 — Observabilidade

- **Decision**: log estruturado (logger do Fastify) por chamada de IA: `agent`, `operation`, `model`, `latencyMs`, `firstTokenMs`, tokens e `cache_read_input_tokens`, `stopReason`, `fallbackUsed`. Sem conteúdo das mensagens nos logs (dados de saúde). `firstTokenMs` serve para medir SC-004a.
- **Rationale**: mínimo necessário para medir latência, cache e custo; o conteúdo já fica no banco com RLS.
- **Alternatives**: ferramenta de tracing externa (YAGNI para uso individual).
