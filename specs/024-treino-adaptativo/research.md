# Research — 024 Treino adaptativo de verdade

Decisões técnicas da Phase 0. Cada item: **Decisão**, **Motivo**, **Alternativas rejeitadas**.

Levantamento do estado atual (2026-10-24):

- O Agente de Treino (`packages/ai/src/mesocycle-planner.ts`) gera **uma rotação** de sessões (`MesocycleSession[]`) com Opus 5.5, `effort: 'medium'`, structured outputs e validador de restrições rígidas (`agents/constraints.ts`: equipamento, exercícios a evitar, duração, padrões/exercícios bloqueados).
- O banco de exercícios (`exercise-bank.ts`, 122 itens) já tem **carga articular por exercício** (`stress: { joelho, ombro, lombar }` de 0 a 2, spec 013), padrão de movimento, grupo muscular e equipamento.
- `mesocycle_plans.sessions` é um JSONB lido em vários pontos pelo índice da primeira sessão com `completedAt = null` (`findPendingSessionIndex`).
- O perfil (`user_training_profile`) tem `goal`, `level`, `training_time`, `time_off`, `current_injury` em texto; as preferências (`training_preferences`, 022) têm dias, minutos, local, equipamentos, favoritos, a evitar, estilo e instruções livres.
- Restrições compartilhadas (`shared_guidance`, 022) já têm fluxo de proposta → aceite, com `blocked_patterns` e `blocked_exercises`.
- A genética é lida de `data/genetics/genera.json` por quatro módulos da API; o arquivo está versionado num repositório **público** e é excluído da imagem Docker (`.dockerignore` → `data/`), então a fonte fica vazia em produção.
- `POST /workout/generate` (gerador legado, `planner.ts`) **não exige autenticação** e chama a Anthropic com valores vindos do corpo da requisição.
- O histórico real do dono tem sessões de 84–167 s geradas em validações manuais de specs anteriores.

---

## R0 — Ordem de entrega

**Decisão**: entregar em 6 fases, cada uma em um PR independente e deployável:

| Fase | Conteúdo | Histórias |
|---|---|---|
| F0 | Eval do Agente de Treino + linha de base com o agente atual | US8 |
| F1 | Genética no banco (privacidade), gerador único autenticado, robustez (resposta cortada, nova tentativa, estado de geração), remoção do legado | US6 (genética), US7 |
| F2 | Onboarding + condições de saúde (catálogo + "outra") + crise de gota + validador articular | US1, US2 |
| F3 | Regras de método + mesociclo semanal com cardio e mobilidade + novo prompt | US3 |
| F4 | Sensações antes/depois + validade de sessões + adaptação da sessão por dor | US4, US6 (dados) |
| F5 | Análise do ciclo + tendência de check-ins | US5 |

**Motivo**: SC-004 exige linha de base **antes** das mudanças (F0). F1 fecha um risco de privacidade e um endpoint sem autenticação que gasta dinheiro de IA. F2 e F3 resolvem o caso do dono (joelho/gota/entrar em forma). F4 alimenta F5.

**Alternativas**: um PR único (grande demais para revisar e testar manualmente); começar pelo mesociclo semanal sem eval (não daria para provar melhora).

---

## R1 — Condições de saúde: catálogo em código + "outra" via restrições compartilhadas

**Decisão**:
- Catálogo fixo em `packages/workouts/src/conditions.ts` (`CONDITION_CATALOG`), com chave, rótulo, regiões possíveis e **regras por condição**: limite de carga articular por região (`maxJointStress`), padrões bloqueados, impacto máximo de cardio, cuidados de execução (texto exibido) e se pede orientação médica em crise.
- Itens iniciais: `lca-reconstrucao`, `artrose`, `lesao-ligamentar`, `lesao-menisco`, `gota`, `lombalgia`, `hipertensao`, `tendinopatia-ombro`.
- A condição "outra" grava a condição e pede ao Agente de Medicina regras propostas, salvas como `shared_guidance` (kind `restricao-seguranca`, status `pendente`) ligadas à condição por uma coluna nova `condition_id`. O aceite reaproveita o fluxo da 022.
- As regras ativas viram campos novos de `HardConstraints` (R3) e passam pelo validador determinístico.

**Motivo**: regras fixas são testáveis (SC-001) e não dependem da IA para o caso comum; a "outra" reaproveita um fluxo que já existe (YAGNI), sem nova tela de aceite.

**Alternativas**: regras em tabela editável (ninguém além do dono edita; vira configuração sem uso); tudo via IA (regras variáveis, não testáveis).

**Regras iniciais** (conservadoras, revisáveis em F2 com o eval):

| Condição | Regras |
|---|---|
| Reconstrução de LCA (estado controlada/resolvida) | joelho ≤ 1; sem pliometria/saltos; cardio impacto ≤ 1; cuidado: valgo, profundidade até o paralelo |
| Artrose (joelho) | joelho ≤ 1; cardio impacto ≤ 0 (bike, elíptico, natação, remo); cuidado: amplitude confortável |
| Lesão ligamentar/menisco | joelho ≤ 1; sem rotação com carga |
| Gota (sem crise) | cardio impacto ≤ 1; cuidado: hidratação; em crise: região afetada ≤ 0 e impacto 0 |
| Lombalgia | lombar ≤ 1; bloqueia `dobrar-quadril` com barra pesada (via exercícios bloqueados) |
| Hipertensão | sem esforço máximo (RIR mínimo 2); cuidado: não prender a respiração |
| Tendinopatia de ombro | ombro ≤ 1 |

Estado `ativa` reduz o limite em 1 nível (ex.: joelho ≤ 0) para as condições articulares; `resolvida` desliga as regras.

---

## R2 — Crise de gota

**Decisão**: colunas `flare_region` e `flare_until` em `health_conditions` (uma crise por condição por vez). Durante a crise, a região afetada fica com limite 0 e o impacto de cardio 0. A adaptação vale na **sessão do dia** (via a mesma camada que hoje aplica o cansaço em `GET /workout/latest-plan`), sem regenerar o mesociclo. Passado `flare_until`, a Home mostra o aviso de procurar o médico e pergunta se a crise acabou. Sem prazo informado: 5 dias.

**Motivo**: crise é temporária; regenerar o ciclo por causa dela desperdiça IA e perde a progressão.

**Alternativas**: tabela de crises com histórico (sem uso atual).

---

## R3 — Validador estendido: carga articular, impacto, esforço máximo

**Decisão**: `HardConstraints` ganha `maxJointStress: Partial<Record<Joint, 0|1|2>>`, `maxCardioImpact: 0|1|2|null`, `minRir: number|null`. `validatePlanAgainstConstraints` ganha as regras `carga-articular`, `impacto` e `esforco` (RIR alvo abaixo do mínimo). O cardio passa a vir de um catálogo (R6), que também tem impacto e carga articular. `compatibleAlternatives` respeita os limites novos.

**Motivo**: o banco já tem a carga articular por exercício; o caso do joelho vira regra verificável sem mudar o catálogo.

**Alternativas**: listas manuais de exercícios proibidos por condição (frágil, desatualiza com o banco).

---

## R4 — Objetivo estruturado e onboarding

**Decisão**:
- `user_training_profile` ganha `goal_primary` (enum: `condicionamento`, `hipertrofia`, `forca`, `emagrecimento`, `corrida`), `goal_secondary` (mesmo enum, opcional), `goal_target` (texto curto mensurável), `cardio_likes`/`cardio_avoid` (listas do catálogo de cardio), `onboarding_completed_at`.
- O `goal` em texto continua como "nas suas palavras" e é pré-preenchido no onboarding.
- Rota web `/onboarding` em passos (objetivo → experiência/pausa → condições → disponibilidade/equipamentos → cardio → revisão), salvando a cada passo (retomável). Reaproveita os formulários de preferências da 022.
- Gate: com `onboarding_completed_at` nulo, a geração de um **novo** mesociclo não roda; `GET /workout/latest-plan` devolve `status: 'onboarding-required'` quando não há mesociclo pendente. O mesociclo atual em andamento continua até ser concluído.

**Motivo**: os dados viram estruturados sem perder o que o usuário escreveu; o gate garante FR-001/002 sem quebrar o ciclo atual.

**Alternativas**: tabela separada para objetivo (mais junções sem ganho); onboarding num modal da Home (passos demais para um modal).

---

## R5 — Regras de método determinísticas

**Decisão**: função pura `prescribeMethod(input)` em `packages/workouts/src/method.ts`, que devolve uma **prescrição de método** (`MethodPrescription`) usada como moldura obrigatória pela IA e conferida pelo validador:

- **Semanas**: 4 (iniciante, retorno de pausa ≥ 3 meses) a 6 (intermediário/avançado), sendo a última de deload.
- **Divisão permitida** por dias de força: 2 → Full Body ×2; 3 → Full Body ×3 ou Superior/Inferior/Full; 4 → Superior/Inferior ×2; 5 → Superior/Inferior + Push/Pull/Legs; 6 → PPL ×2. Objetivo `forca` prioriza os padrões básicos; `corrida`/`condicionamento` reduzem os dias de força em favor de cardio.
- **Frequência mínima por grupo principal**: 2×/semana para hipertrofia/condicionamento com 3+ dias (FR-013).
- **Séries semanais por grupo** (faixas): iniciante 6–10, intermediário 10–16, avançado 12–20; retorno de pausa começa no piso e sobe ~20% por semana até o teto; deload = 50–60% do volume.
- **Faixas de repetição e RIR por objetivo**: hipertrofia 6–15 reps, RIR 3→1 ao longo das semanas; força 3–6 reps nos básicos, RIR 3→1; condicionamento/emagrecimento 8–15, RIR 3→2; deload RIR 4.
- **Cardio**: sessões ou blocos por semana conforme objetivo (emagrecimento/condicionamento 2–3, corrida 3 com progressão de caminhada/corrida só se as regras permitirem impacto, hipertrofia 1–2), minutos e zona (conversa confortável / moderada / intervalado leve), filtrado pelo impacto máximo das condições.
- **Mobilidade**: pelo menos 1 bloco dedicado por semana + mobilidade das regiões com condição nos dias de membros inferiores.
- **Ajustes de check-in e da análise do ciclo** (R10, R11) entram como modificadores da prescrição.

O validador confere a **saída da IA** contra a prescrição: frequência por grupo, séries semanais por grupo dentro da faixa, cardio e mobilidade presentes, número de sessões compatível com os dias.

**Motivo**: o que é método vira código testável (SC-002/003); a IA escolhe exercícios, ordem, distribuição e explicações dentro da moldura, onde ela agrega.

**Alternativas**: método só no prompt (situação atual; não verificável).

---

## R6 — Catálogo de cardio e mobilidade

**Decisão**:
- `CARDIO_BANK` em `packages/ai/src/cardio-bank.ts`: caminhada, caminhada inclinada, bike ergométrica, elíptico, remo ergométrico, natação, escada, corrida, intervalado em bike; cada um com impacto (0–2), carga articular e equipamento/local. Itens de cardio na saída da IA usam nome do catálogo (enum no schema) com duração e zona.
- Mobilidade/alongamento continuam com nome livre (como o aquecimento da 014), mas cada item declara a região trabalhada.

**Motivo**: cardio precisa de impacto verificável (joelho); mobilidade em texto livre já funciona e não tem risco relevante.

**Alternativas**: cardio em texto livre (não dá para validar impacto).

---

## R7 — Mesociclo semanal sem quebrar o formato atual

**Decisão**: a IA gera a **semana-modelo** (dias tipados `forca` | `cardio` | `mobilidade`, com exercícios) e o código **expande** para N semanas em `mesocycle_plans.sessions`, aplicando a progressão semanal da prescrição (séries, RIR alvo, carga) e o deload. Cada `MesocycleSession` ganha campos opcionais `week`, `kind`, `deload` e `rirTarget` por exercício. Novas colunas: `format` (`rotacao` | `semanal`), `weeks`, `method` (a prescrição usada). Planos antigos continuam `rotacao`.

Consequências: `findPendingSessionIndex`, conclusão de sessão, progresso e geração do próximo ciclo continuam funcionando sem mudança; a UI deriva "semana X de N" do `week` da sessão pendente. Sessões não são presas a dias do calendário: perder um dia não acumula sessões; a ordem continua (edge case da spec).

**Motivo**: progressão semanal determinística (não depende da IA lembrar), saída da IA ~5× menor do que gerar 30 sessões, e zero quebra nos leitores atuais.

**Alternativas**: a IA gerar todas as semanas (saída enorme, progressão inconsistente); nova tabela de "slots" (reescreve todos os leitores).

---

## R8 — Sensações antes e depois

**Decisão**:
- Tabela `session_checkins` (antes: energia 1–5, sono 1–5, motivação 1–5, dores `[{region, intensity 1–3}]`; depois: esforço percebido da sessão 1–10, dores, sensação 1–5, nota livre curta). `phase` = `antes` | `depois`; `workout_session_id` preenchido no "depois" (e no "antes", quando a sessão é salva).
- O check-in de antes é feito ao abrir o treino (`/workout`), em uma tela de 4 toques, com "pular". A energia alimenta o cansaço do dia (spec 011) quando o usuário ainda não marcou; dor numa região com condição registrada aplica a adaptação de R2 só naquela sessão (troca por alternativa de menor carga articular via `compatibleAlternatives`).
- O "depois" aparece na tela de conclusão existente, antes de salvar, também com "pular".

**Motivo**: reaproveita o ajuste do dia que já existe; o "depois" fica junto do salvamento, sem tela extra.

**Alternativas**: colunas JSONB em `workout_sessions` (o "antes" acontece antes de a sessão existir).

---

## R9 — Validade de sessões

**Decisão**: função pura `sessionValidity(session)`: inválida se não tiver séries registradas, ou se `duration_s` existir e for < 600 s, ou se tiver < 3 séries no total. Coluna `review_status` em `workout_sessions` (`null` | `confirmada`). Sessões inválidas sem confirmação ficam fora da progressão, da regra de variedade, do resumo do histórico no Perfil Integrado e da análise do ciclo. Tela "Revisar treinos" em Progresso lista as suspeitas com "É real" / "Excluir" (a exclusão apaga a linha, por ação explícita do usuário).

**Motivo**: resolve o histórico contaminado sem apagar nada automaticamente.

**Alternativas**: limpar o banco à mão (resolve só o passado).

---

## R10 — Tendência de check-ins

**Decisão**: função pura `checkinTrend(prev, curr, goal)` em `packages/workouts`: calcula deltas por mês, marca implausível (peso > 6 kg/mês, cintura > 8 cm/mês, gordura > 4 pp/mês) e devolve modificadores da prescrição por objetivo, por exemplo:

| Objetivo | Tendência | Modificador |
|---|---|---|
| emagrecimento | cintura e peso estáveis ou subindo | +1 sessão de cardio ou +10 min por sessão |
| hipertrofia | peso caindo e cargas estagnadas | volume no piso da faixa; sugere revisar nutrição (agente Nutrição) |
| força | cargas de referência estagnadas | troca de variação nos básicos |
| meta atingida | peso/cintura na meta | sugere novo objetivo (pede aceite) |

**Motivo**: ajuste previsível e testável (FR-023), com explicação baseada nos números.

---

## R11 — Análise do ciclo

**Decisão**: função pura `analyzeCycle(mesocycle, sessions, checkins, tiredness, conditions)` em `packages/workouts/src/cycle-analysis.ts`, que devolve `CycleSummary`: aderência por tipo de sessão, evolução por exercício (carga × reps → 1RM estimado), esforço médio e por semana, dores por região e por exercício, cansaço médio, tendência de check-in (R10) e lista de **achados** tipados (`estagnacao`, `dor-recorrente`, `baixa-aderencia`, `progresso`, `cansaco-alto`). O resumo é salvo em `cycle_analyses` (ligado ao mesociclo), mostrado ao usuário e enviado ao Agente de Treino como bloco do pedido. Os achados viram modificadores da prescrição (R5) e regras do pedido (ex.: exercício com dor recorrente → proibido no próximo ciclo, com alternativa de menor carga articular).

Sem chamada de IA extra: a explicação do que mudou sai das `decisions` da própria geração, que passam a citar os achados.

**Motivo**: análise reproduzível e testável (SC-005), e a IA recebe fatos prontos em vez de dados crus.

**Alternativas**: pedir à IA para analisar o histórico cru (caro, não verificável, sujeito a erro em contas).

---

## R12 — Prompt e configuração do Agente de Treino

**Decisão**:
- `effort: 'xhigh'` como padrão (máximo resultado; a F0 mede `high`, `xhigh` e `max` no eval e a escolha final fica registrada aqui), `max_tokens: 64000`, streaming, fallback `default` (como hoje).
- Nova checagem de `stop_reason === 'max_tokens'` → erro `IncompleteResponseError`, que conta como tentativa e dispara nova chamada (FR-030).
- Prompt reescrito em três blocos com cache: (1) **método e regras de escrita** estáveis; (2) **Perfil Integrado** (snapshot); (3) **pedido**: prescrição de método (R5), regras das condições, achados do ciclo (R11), tendência de check-in (R10), progressão de carga e, no retry, violações.
- Estilo do prompt para o Opus 5.5: instruções diretas e explicadas, sem caixa-alta de "OBRIGATÓRIO" (o que é obrigatório vira validador), com o papel da genética explícito ("ajuste fino; nunca motivo único") e regras de escrita das notas ("instrução de execução para o usuário; não mencione datas de uso anterior, regras do sistema ou o que foi evitado").
- O schema separa `notes` (para o usuário) de `decisions` (justificativa com fontes), e as decisões ganham o tópico `condicao` e `cardio`/`mobilidade`.

**Motivo**: o raciocínio fica no lugar certo (validação em código, julgamento na IA) e o custo maior compensa: com mesociclos de 4–6 semanas, a geração acontece ~1×/mês.

**Alternativas**: `max` por padrão (latência alta sem ganho medido); manter `medium` (pedido explícito do dono por máxima qualidade).

---

## R13 — Gerador único, autenticado e com estado

**Decisão**:
- Remover `POST /workout/generate`, `packages/ai/src/planner.ts`, `prompts.ts` (o que só o legado usa) e o caminho do web que grava o plano em `localStorage`.
- Nova rota autenticada `POST /workout/mesocycle/regenerate` que dispara `generateAndSaveMesocycle` (com a análise do ciclo atual, mesmo incompleto) e devolve `202`.
- Tabela `mesocycle_generation` (uma linha por usuário: `status` `gerando` | `falhou` | `ok`, `started_at`, `attempts`, `error_code`). `GET /workout/latest-plan` usa esse estado: concluído sem próximo e sem geração em andamento (ou `gerando` há mais de 10 min) → dispara de novo (FR-031). Após 3 falhas seguidas, para e mostra o erro.
- `POST /workout/mesocycle/repeat-week` cria um mesociclo curto (1 semana) copiando a última semana com `completedAt` nulo e `format = 'semanal'`, para o usuário não ficar sem treino.

**Motivo**: fecha um endpoint aberto que gasta IA; resolve a tela presa em "gerando".

---

## R14 — Genética no banco, privada

**Decisão**:
- Tabela `genetic_reports` (`user_id` PK, `source` `genera`, `raw` JSONB, `uploaded_at`), RLS por usuário.
- Upload pelo Perfil (arquivo JSON do Genera) via `POST /api/genetics/report`; validação com o parser existente (`parseGeneraJson`/`parseGeneraTraits`).
- Os quatro leitores (`genetic-profile`, `nutrition-genetic-profile`, `nutrition-context.service`, `integrated-profile.service`) passam a ler do banco por usuário; o e2e usa fixture.
- Remover `data/genetics/genera.json` do repositório. Limpar o histórico do git e tornar o repositório privado são ações do dono, fora do código (registradas no quickstart).
- O resumo da genética no Perfil Integrado passa a listar só os traços relevantes para treino com a força da evidência (`forte`/`moderada`/`fraca`), e o prompt usa só `forte`/`moderada` como ajuste fino.

**Motivo**: FR-025/SC-009; a genética finalmente chega à produção; o uso proporcional ganha um dado concreto (força da evidência) em vez de depender do bom senso da IA.

**Alternativas**: variável de ambiente com o JSON (não é por usuário, vaza em logs de deploy); Supabase Storage (o JSON é pequeno; JSONB é mais simples de consultar).

---

## R15 — Eval do Agente de Treino

**Decisão**:
- `packages/ai/src/agents/__evals__/treino.eval.ts` + fixtures de perfis em `__evals__/treino-profiles.ts`: (1) dono (LCA ×3, artrose E, gota, retorno após 8 meses, entrar em forma + correr 5 km), (2) iniciante sem condições, hipertrofia, 3 dias, (3) pouco tempo (3×40 min), emagrecimento, (4) casa só halteres, condicionamento, lombalgia, (5) avançado, força, 5 dias, (6) ciclo concluído com dados conhecidos (estagnação no agachamento, dor recorrente no joelho no leg press, baixa aderência ao cardio) — este a partir da F5.
- Pontuação em duas camadas: **checagens determinísticas** (validador + prescrição de método: violações de segurança, frequência, séries semanais, cardio/mobilidade, estrutura) e **juiz LLM** (Opus 5.5, `effort: 'low'`, structured output) para aderência ao objetivo, coerência e honestidade das justificativas, genética como motivo único, notas que vazam raciocínio; 0–5 por critério.
- Saída: tabela por perfil × critério, total, custo da rodada (pela tabela de preços da 022) e comparação com a rodada anterior salva em `__evals__/results/`.
- Roda só sob demanda (`pnpm --filter @helux/ai eval:treino`), como o eval de Medicina; cada rodada é aprovada pelo dono (custo estimado mostrado antes).
- F0 roda o eval contra o agente **atual** (apenas as checagens que fazem sentido para o formato antigo + juiz) e salva a linha de base.

**Motivo**: SC-003/004 e FR-032–034; segue o padrão já usado na 022.
