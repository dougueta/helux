# Research: Módulo de Nutrição Esportiva Genética (018)

Decisões técnicas que resolvem os pontos abertos do spec (após o clarify de 2026-10-13). Formato: Decision / Rationale / Alternatives.

## R1 — Onde mora a lógica: novo pacote `@helux/nutrition`

- **Decision**: toda a regra determinística (fórmulas, % de gordura, fase, recalibração, derivação do dia, catálogo, montagem de refeições, trocas, regras genéticas de nutrição, âncora de horários) fica em `packages/nutrition`, pura e sem I/O. A API persiste e orquestra; a web só exibe e ancora horários com a mesma função.
- **Rationale**: é o mesmo padrão que deu certo em `@helux/workouts` (progressão da 014): regra testável em isolamento, usada por API e web (Constituição IV). O domínio é grande e distinto do treino — misturar em `@helux/workouts` deixaria o pacote com duas responsabilidades.
- **Alternatives**: lógica dentro de `apps/api/src/services` (não reaproveitável pela web para a âncora de horários e as trocas); dentro de `@helux/workouts` (acoplamento de domínios).

## R2 — Metas-base da fase (FR-014)

- **Decision**:
  - **TMB** por Mifflin-St Jeor: homem `10·peso + 6,25·altura − 5·idade + 5`; mulher `… − 161` (kg, cm, anos).
  - **Fator de atividade** pela frequência do mesociclo ativo (`days_per_week`): ≤ 2 → 1,375; 3–4 → 1,55; 5–6 → 1,725; sem mesociclo → 1,375. **GET** = TMB × fator.
  - **Ajuste por objetivo**: perder gordura −20% (déficit máximo 600 kcal); ganhar massa +10%; recomposição −10%; manutenção 0.
  - **Proteína (g/kg de peso)**: perder gordura 2,2; recomposição 2,0; ganhar massa 1,8; manutenção 1,8.
  - **Gordura**: 25% das calorias, com mínimo de 0,8 g/kg. **Carboidrato**: o restante.
  - **Pisos**: calorias nunca abaixo de max(TMB, 1.200 kcal); carboidrato nunca abaixo de 2 g/kg em dia de treino.
  - Arredondamento: kcal ao múltiplo de 10; macros ao grama.
- **Rationale**: Mifflin-St Jeor é a equação de referência para adultos sem medição de composição corporal (não depende de % de gordura, que é opcional — clarify Q3). Proteína por kg é o padrão esportivo e não exige massa magra. Percentuais conservadores de déficit/superávit preservam massa magra.
- **Alternatives**: Katch-McArdle (exige % de gordura confiável); fator de atividade por questionário (mais atrito; o treino já informa a frequência).

## R3 — % de gordura pelo método da Marinha (FR-016)

- **Decision**: fórmula da US Navy em centímetros:
  - homem: `495 / (1,0324 − 0,19077·log10(cintura − pescoço) + 0,15456·log10(altura)) − 450`
  - mulher: `495 / (1,29579 − 0,35004·log10(cintura + quadril − pescoço) + 0,22100·log10(altura)) − 450`
  - Resultado com 1 casa; fora de 3–60% ou com medida faltando → ausente (sem erro).
  - Calculado na leitura (função pura), não gravado. Se o usuário digitou `body_fat_pct` no check-in, esse valor prevalece.
- **Rationale**: só fita métrica e altura (pedido do usuário); validação ±3–4% contra DEXA é suficiente para tendência entre check-ins.
- **Alternatives**: bioimpedância via Apple Health (fica no backlog do onboarding); gravar o valor calculado (duplicaria a fonte de verdade).

## R4 — Recalibração a cada check-in (FR-015)

- **Decision**: ao gravar um check-in com fase ativa, compara-se com o check-in da última calibração (ou o de início da fase):
  - intervalo em semanas pelas datas de criação (`created_at`); **< 2 semanas → não recalibra** (registra "intervalo curto");
  - **taxa semanal de peso** (% do peso inicial por semana) vs. faixa esperada:
    - perder gordura: −0,25% a −1,0%/sem;
    - ganhar massa: +0,1% a +0,5%/sem;
    - recomposição e manutenção: −0,25% a +0,25%/sem;
  - **abaixo da faixa** (perdendo devagar / ganhando pouco) → calorias **−150** (perder gordura) ou **+150** (ganhar massa); **acima da faixa** → o oposto; **dentro** → manter;
  - **cintura como desempate**: em perder gordura/recomposição, peso parado mas cintura ≥ 1 cm menor → **manter** ("recomposição em curso"); em ganhar massa, cintura subindo > 2 cm no período → não aumenta;
  - ajuste aplicado só no carboidrato (proteína por kg é recalculada pelo peso novo; gordura mantém 25%); pisos de R2 continuam valendo;
  - cada recalibração gera um registro (antes, depois, ação, motivo legível, métricas).
- **Rationale**: regra de ajuste em degraus pequenos é a prática de coaching (evita oscilação); cintura separa perda de gordura de perda de músculo sem depender de % de gordura.
- **Alternatives**: recalcular metas do zero a cada check-in (ignora a resposta individual observada); ajuste proporcional ao desvio (mais instável com check-ins mensais).

## R5 — Tipo do dia: treino ou descanso

- **Decision**: o app não tem agenda de dias de treino (o mesociclo é uma fila de sessões). Regra: **o dia é de treino por padrão** (clarify Q2 — o usuário treina em qualquer horário); o usuário pode marcar "hoje é descanso" na tela; se um treino for iniciado ou salvo no dia, o dia vira treino automaticamente. Sem mesociclo ativo → descanso por padrão.
- **Rationale**: coerente com o edge case "até o treino começar, o dia é tratado como dia de treino"; o toggle cobre o descanso sem inventar calendário.
- **Alternatives**: inferir descanso pela frequência semanal (adivinhação frágil); agenda semanal fixa (contradiz a flexibilidade pedida). **Ponto para revisão do usuário.**

## R6 — Derivação do dia (FR-002, FR-003, FR-011)

- **Decision**:
  - metas da fase são a **média**; proteína e gordura constantes;
  - **carboidrato**: dia de treino × 1,15; descanso × 0,80 (× 0,75 com FTO "dieta low carb mais eficaz"); calorias seguem os macros;
  - **hidratação**: 35 ml/kg + 500 ml em dia de treino;
  - **cansaço** (Spec 011, `effectiveLevel`): `cansado` → +500 ml de água e card de recuperação; `exausto` → +750 ml, card, e **sem o corte de carboidrato do descanso** (fica no valor da fase — o dia de treino já está acima dela); `otimo`/`normal` → nada. *(Ajustado na implementação: a versão anterior, "em treino não cai abaixo da fase", não tinha efeito porque o treino já é × 1,15.)*
  - **piso**: em dia de treino, carboidrato ≥ 2 g/kg.
- **Rationale**: periodização de carboidrato por demanda é o padrão da nutrição esportiva e usa diretamente o marcador FTO do usuário.
- **Alternatives**: variar calorias por volume de séries do treino do dia (dado pouco confiável antes do treino acontecer).

## R7 — Catálogo de alimentos e montagem das refeições (FR-002a, FR-005, FR-010)

- **Decision**:
  - catálogo estático em `packages/nutrition/src/catalog.ts` (~70 itens, valores da Tabela TACO): id, nome, grupo (`proteina`, `carboidrato`, `gordura`, `fruta-vegetal`, `bebida`), porção de referência (g/ml + medida caseira), macros por porção, tags (`contem-lactose`, `zero-lactose`, `vegetal`, `rico-b6`, `fonte-calcio-nao-lactea`, `fonte-vitamina-d`, `cafeina`, `anti-inflamatorio`, `rapida-digestao`);
  - **refeições do dia**: treino → café, almoço, pré-treino, pós-treino, jantar; descanso → café, almoço, lanche, jantar, ceia; cada refeição tem uma fração das metas;
  - cada refeição usa um **molde** (ex.: proteína + carboidrato + vegetal + gordura); o alimento de cada posição é escolhido por rotação determinística (`hash(data + refeição + posição)`) entre os elegíveis, e a porção é escalada para bater a meta da refeição (múltiplos de ½ porção, entre ½ e 3 porções; **carboidrato até 4** para dietas de ganho; itens de gordura e frutas de café/lanche/ceia são **opcionais** e saem com 0 porção quando a meta já está coberta; leguminosa e vegetal variam entre ½ e 1½);
  - **ajuste fino global**: ±½ porção onde mais aproxima o total do dia das metas, avaliando os totais arredondados que o usuário vê; se não fechar, troca a proteína mais gordurosa pela mais magra da mesma posição (até 3 vezes). Validado em 4 perfis (1.200 a 3.440 kcal) × 60 dias × treino/descanso × com/sem genética, sem nenhum dia fora da tolerância;
  - **filtro genético obrigatório**: com intolerância à lactose, itens `contem-lactose` são excluídos de tudo (montagem, troca, sugestão aplicada);
  - preferência genética: refeições de vitamina D/B6/cálcio não lácteo priorizam itens com essas tags (desempate da rotação);
  - **tolerância**: total do dia dentro de ±5% das calorias e ±10% de cada macro;
  - **troca rápida**: alternativas do mesmo grupo, mesmas restrições, ordenadas pela menor diferença de macros na porção escalada; a escolha é gravada no plano do dia.
- **Rationale**: só um catálogo controlado garante SC-002 (100% sem lactose) de forma testável; rotação determinística dá variedade sem IA (mesmas entradas → mesmo plano).
- **Alternatives**: catálogo em tabela do banco (YAGNI — não há edição de catálogo); otimização linear das porções (complexidade desnecessária para a tolerância pedida).

## R8 — Horário do treino (FR-004, clarify Q2)

- **Decision**: função pura `anchorMealTimes(plan, { startedAt?, finishedAt? })` em `@helux/nutrition`:
  - sem início → pré-treino "60–90 min antes de treinar", pós-treino "logo após o treino", sem hora;
  - com início (treino ativo em `localStorage`, `helux:active-workout.startedAt`) → pós-treino "até 60 min após terminar";
  - com fim (sessão do dia salva: `created_at` da `workout_sessions`) → pós-treino com hora no relógio (fim → fim + 60 min) e destaque "ação recomendada" enquanto a janela estiver aberta.
  - a ancoragem é feita **na web** (que conhece o treino ativo do aparelho) com a mesma função; a API devolve o plano sem horários fixos.
- **Rationale**: a API só sabe do treino quando ele é salvo; o início real vive no aparelho. Uma função pura compartilhada evita duplicação.
- **Alternatives**: gravar `started_at` na API ao iniciar treino (mudança na 016/014 sem necessidade).

## R9 — Agente de IA no chat (FR-007, FR-008, FR-017, SC-003)

- **Decision**:
  - modelo `claude-opus-5-5` (padrão atual da Anthropic), com `output_config.effort: "low"` (chat, latência) e thinking adaptativo (não pode ser desligado nesse modelo; `display` omitido);
  - **streaming** com `client.messages.stream(...)`, repassado ao navegador por **SSE** a partir de `POST /api/nutrition/chat` (Fastify `reply.raw`), consumido na web com `fetch` + `ReadableStream` (EventSource não envia `Authorization`);
  - **prompt caching**: `system` em dois blocos — (1) persona + regras + perfil genético nutricional + fase de dieta, com `cache_control: {type: "ephemeral"}`; (2) contexto do dia (plano, treino, cansaço) sem cache, depois do bloco estável;
  - **janela de histórico**: últimas **20** mensagens da conversa da fase (FR-017);
  - **fallbacks**: `fallbacks: "default"` com o beta `server-side-fallback-2026-07-01` (refusal → modelo alternativo); `stop_reason: "refusal"` final → mensagem amigável;
  - o SDK `@anthropic-ai/sdk` em `packages/ai` (hoje `^0.52`) é **atualizado** para a versão atual para ter os tipos de `output_config`/`fallbacks`; a chamada do mesociclo (`claude-sonnet-4-6`) não muda de modelo nesta spec;
  - a mensagem do usuário é gravada antes da chamada; a resposta, só após `finalMessage()`; erro → evento `error` no SSE e nada gravado do agente;
  - disclaimer fixo no topo do chat (não substitui acompanhamento profissional).
- **Rationale**: streaming é o que viabiliza SC-003 (primeiro token < 2 s) e evita timeout; o cache corta custo/latência do bloco grande e estável; a janela de 20 mensagens limita custo sem perder o fio da conversa.
- **Alternatives**: Sonnet/Haiku (mais rápidos e baratos, mas a orientação da skill é Opus 5.5 salvo pedido do usuário — **ponto para revisão** se SC-003 não for atingido); WebSocket (SSE basta, é unidirecional por mensagem).

## R10 — Perfil nutrigenômico e flags genéticas (FR-001, FR-006, US4)

- **Decision**: `@helux/genetics` ganha `parseGeneraNutrition(raw)` (lê `nutri.*` + WNT16/ACTN3/FTO de `fit`), e `@helux/nutrition` mantém uma **tabela de regras por gene + traço** (`NUTRI_MARKER_RULES`) com: categoria da US4 (Metabolismo & Sensibilidades / Micronutrientes & Vitaminas / Perfil Muscular & Dieta), status (Ponto de Atenção / Neutro / Favorável) decidido pelo genótipo/resultado, conduta prática (alimentos recomendados e a evitar) e as **flags** usadas pelo motor: `intoleranciaLactose`, `vitaminaDBaixa`, `b6Baixa`, `densidadeOsseaBaixa`, `lowCarbEficaz`, `cafeinaTolerada`, `perfilPotencia`. Marcadores sem regra → Neutro, sem conduta. Sem `genera.json` → `genetics.active = false`, nenhuma flag, plano padrão com aviso.
- **Rationale**: regra explícita por SNP é testável e não depende de interpretar texto livre; a US4 reaproveita `TraitCard` da tela DNA (020).
- **Alternatives**: classificar pelo texto do resultado (frágil); IA classificando marcadores (não determinístico).

## R11 — Dados novos de perfil e check-in (FR-016)

- **Decision**: migration aditiva: `user_training_profile` + `height_cm`, `birth_date`, `sex` (`masculino`/`feminino`); `body_checkins` + `neck_cm`. Formulários de Perfil e Check-in ganham os campos; a tela de Nutrição pede altura/nascimento/sexo no primeiro acesso se faltarem (até existir o onboarding do backlog).
- **Rationale**: dados mínimos para TMB e Marinha; colunas opcionais não quebram nada existente.
- **Alternatives**: tabela separada de biometria (YAGNI).

## R12 — Persistência e histórico (FR-012)

- **Decision**: tabelas novas `diet_phases`, `diet_phase_calibrations`, `daily_nutrition_plans` (um por usuário e data; guarda o último plano calculado do dia, tipo do dia, cansaço, trocas e status "treino não realizado") e `nutrition_chat_messages` (por fase). O plano do dia é **recalculado a cada leitura** (rápido, determinístico) e gravado por upsert — o histórico é a última versão de cada dia. Dia passado com tipo "treino" e sem sessão salva → status `treino-nao-realizado` (sem recálculo retroativo).
- **Rationale**: recálculo na leitura mantém SC-004 (mudou cansaço → reflete) sem invalidação de cache; upsert dá o histórico pedido.
- **Alternatives**: gravar o plano uma vez por dia e só mudar por evento (precisaria de gatilhos em cansaço, treino e troca).

## R13 — Navegação web

- **Decision**: nova aba **Nutrição** (`/nutricao`) na barra inferior (5 abas; `.hx-nav` passa a `repeat(5,1fr)` em `helux-v2.css`), com seções Hoje · Chat · Fase · Perfil genético. Só componentes e classes do DS v2 (guard test).
- **Rationale**: o módulo é de uso diário, como Treinos; seções evitam multiplicar abas.
- **Alternatives**: entrar pelo Perfil (escondido para algo diário).
