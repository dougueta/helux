# Feature Specification: Time de Agentes Especialistas de IA (Treino Personalizado, Medicina Esportiva e Nutrição Genética)

**Feature Branch**: `022-agentes-especialistas-ia`
**Created**: 2026-10-13
**Status**: Draft
**Input**: User description: "Agentes especialistas de IA no Helux: (1) melhorar o agente gerador de treinos para ser 100% personalizável, aproveitando toda informação disponível sobre o usuário (perfil, histórico de treinos, mesociclo, cansaço, genética, exames médicos, nutrição); (2) criar um agente especialista em medicina esportiva; (3) criar um agente especialista em nutrição com base em dados genéticos; (4) o agente de treinos passa a ser um dos agentes especialistas."

**Relação com specs anteriores**:
- **008 / 011 / 014**: o agente de treino continua respeitando o perfil declarado (objetivo, nível, lesão, tempo treinando/parado), o sinal de cansaço com níveis e a regra "nenhum ajuste no treino é silencioso — o usuário vê o que muda e confirma".
- **018 (Nutrição Genética)**: o Agente de Nutrição Genética desta spec **absorve e substitui** a US2 da 018 (chat do Agente Nutricionista). A 018 fica responsável pelas diretrizes diárias e telas de nutrição, que entram aqui como fonte de dados.
- **019 (Exames Médicos)**: o "Agente Integrador de Saúde/Performance" da 019 é **substituído** pela colaboração entre os três especialistas desta spec (US5). A 019 fica responsável por upload, extração e painel de biomarcadores, que entram aqui como fonte de dados.

## Clarifications

### Session 2026-10-13

- Q: Relação com 018 US2 e com o agente integrador da 019? → A: A 022 absorve ambos — o Agente de Nutrição Genética substitui a US2 da 018 e a colaboração entre especialistas substitui o agente integrador da 019; 018/019 ficam com dados e telas.
- Q: Como o usuário acessa os agentes? → A: Ambos — chat "Equipe Helux" com roteamento automático + acesso direto a cada especialista no contexto.
- Q: Preferências alteradas no meio de um mesociclo afetam as sessões pendentes? → A: Mudanças em restrições rígidas (equipamentos, exercícios a evitar, duração máxima) geram proposta de adaptação das sessões pendentes (antes → depois, com confirmação); preferências suaves (foco, estilo, favoritos, instruções livres) só valem a partir do próximo mesociclo.
- Q: O usuário pode editar o plano gerado diretamente, sem o agente? → A: Sim — troca de exercício por alternativa compatível e ajuste de séries/reps/carga nas sessões pendentes; o app avisa se a edição viola restrição de segurança; o agente usa as edições como sinal de preferência nos próximos planos.
- Q: Um agente enxerga as conversas que o usuário teve com outros especialistas? → A: Não o histórico completo; agentes compartilham fatos relevantes extraídos das conversas (sintomas, preferências declaradas, decisões), registrados no Perfil Integrado como fonte "Relatos nas conversas", visível, editável e removível pelo usuário.
- Q: Deve haver limite/controle de custo de IA? → A: Teto de gasto mensal configurável; aviso ao atingir 80%; em 100%, chats e gerações/ajustes por IA pausam até o próximo mês ou até o teto ser aumentado; treino vigente e edições manuais continuam funcionando.
- Q: Qual o tempo de resposta esperado nas conversas? → A: Resposta começa a aparecer em até 3 s e é exibida progressivamente; resposta completa em até 30 s.

---

## 1. Contexto e Visão Geral

Hoje o Helux tem um único agente de IA relevante — o gerador de treinos/mesociclos — que recebe um conjunto limitado de informações (perfil declarado, genética, histórico recente, recuperação). Dados que o app já possui ou vai possuir (cansaço diário, check-ins corporais, preferências de execução, exames de sangue, diretrizes nutricionais) não chegam ao agente de forma consistente, e o usuário não consegue dizer ao agente, com as próprias palavras, como quer que o treino seja.

Esta funcionalidade transforma o Helux em um **time de agentes especialistas** que compartilham um mesmo **Perfil Integrado do Usuário**:

1. **Agente de Treino** (evolução do gerador atual) — prescreve mesociclos e sessões 100% personalizáveis, usando todo o perfil integrado e as preferências explícitas do usuário, e explicando quais dados influenciaram cada decisão.
2. **Agente de Medicina Esportiva** (novo) — orienta sobre dor, lesão, prevenção, retorno ao treino e sinais fisiológicos de risco, sempre com postura de triagem/orientação, nunca de diagnóstico.
3. **Agente de Nutrição Genética** (novo) — orienta alimentação e suplementação fundamentada nas variantes genéticas, no treino do dia, no cansaço e nos exames.

Os três agentes leem o mesmo perfil integrado e podem registrar **recomendações/restrições compartilhadas** (ex.: "evitar carga axial por 2 semanas") que os demais passam a respeitar, sempre com confirmação do usuário.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Treino 100% personalizado usando todo o perfil do usuário (Priority: P1)

O usuário quer que o treino gerado reflita **tudo** o que o Helux sabe sobre ele — e também o que ele quer. Além do perfil já existente (objetivo, nível, lesão, tempo treinando/parado), ele define preferências de execução: dias e duração disponível por sessão, local e equipamentos disponíveis, exercícios favoritos e exercícios a evitar, grupos musculares prioritários, estilo de treino preferido e instruções livres em texto ("quero focar em posterior de coxa", "nada de agachamento livre"). Ao gerar um mesociclo ou uma sessão, o Agente de Treino combina essas preferências com genética, histórico de cargas, cansaço/recuperação, check-ins corporais, biomarcadores dos exames e diretrizes nutricionais, e entrega o plano junto com uma explicação de **quais dados pesaram em cada decisão**.

**Why this priority**: É a melhoria pedida explicitamente e o núcleo de valor do produto — hoje o treino ignora boa parte dos dados que o app já tem e não aceita a vontade do usuário de forma direta.

**Independent Test**: Preencher preferências (ex.: 45 min por sessão, só halteres e elástico, evitar agachamento livre, priorizar glúteos) com um exame recente marcando ferritina baixa; gerar um novo mesociclo e verificar que: nenhuma sessão excede 45 min estimados, só usa os equipamentos informados, não contém agachamento livre, há volume extra para glúteos, a densidade/descanso é ajustada pela ferritina baixa, e a justificativa cita cada um desses fatores.

**Acceptance Scenarios**:

1. **Given** preferências de equipamento, duração e exercícios a evitar preenchidas, **When** um novo mesociclo é gerado, **Then** todas as sessões respeitam integralmente essas restrições (nenhum exercício evitado, nenhum equipamento indisponível, duração estimada dentro do limite).
2. **Given** um plano gerado, **When** o usuário abre a justificativa, **Then** vê, por decisão relevante (divisão, volume, escolha/substituição de exercício, descanso), qual dado do perfil integrado motivou a decisão (ex.: "descanso maior entre séries — ferritina abaixo da referência no exame de 05/10").
3. **Given** uma instrução livre do usuário que conflita com outra informação (ex.: "quero treinar pesado de perna" com uma restrição ativa de joelho), **When** o plano é gerado, **Then** o agente respeita a restrição de segurança, explica o conflito e propõe a alternativa mais próxima do pedido.
4. **Given** que o usuário não tem algum dado (sem exames, sem genética, sem preferências), **When** um plano é gerado, **Then** o agente gera normalmente com os dados disponíveis e indica na justificativa quais fontes não foram usadas por ausência.
5. **Given** um mesociclo em andamento, **When** o usuário pede um ajuste em linguagem natural (ex.: "hoje só tenho 30 minutos e estou num hotel com halteres leves"), **Then** o agente propõe a sessão do dia adaptada, mostra o que muda em relação ao planejado e só aplica após confirmação do usuário.
6. **Given** uma sessão pendente, **When** o usuário troca um exercício por uma alternativa sugerida ou altera séries/reps/carga, **Then** a sessão é salva com a edição; se a edição violar uma restrição de segurança ativa, o app avisa o motivo antes de salvar.
7. **Given** que o usuário trocou o mesmo exercício em várias sessões, **When** o próximo mesociclo é gerado, **Then** esse exercício deixa de ser priorizado e a justificativa menciona as edições anteriores.

---

### User Story 2 - Ver e controlar o que os agentes sabem sobre mim (Priority: P1)

O usuário acessa uma tela de **Perfil Integrado** onde vê, organizado por fonte (perfil declarado, preferências de treino, histórico/cargas, cansaço/recuperação, check-ins corporais, genética, exames, nutrição, relatos nas conversas, restrições ativas), o que os agentes consideram ao responder. Ele pode editar as preferências, ver a data da última atualização de cada fonte e desligar o uso de uma fonte pelos agentes (ex.: não usar exames).

**Why this priority**: "100% personalizável" exige que o usuário saiba e controle o que alimenta as decisões; também é a base comum que os três agentes compartilham.

**Independent Test**: Abrir o Perfil Integrado, verificar que todas as fontes disponíveis aparecem com data de atualização; desligar "exames"; gerar um plano e verificar que a justificativa não cita nenhum biomarcador e informa que a fonte foi desativada pelo usuário.

**Acceptance Scenarios**:

1. **Given** dados existentes em várias fontes, **When** o usuário abre o Perfil Integrado, **Then** vê um resumo por fonte com data da última atualização e indicação de fontes vazias.
2. **Given** o usuário desliga uma fonte, **When** qualquer agente responde ou gera um plano, **Then** essa fonte não é usada e a resposta indica que ela está desativada.
3. **Given** um mesociclo em andamento, **When** o usuário altera uma restrição rígida (ex.: passa a ter só halteres), **Then** o app propõe a adaptação das sessões pendentes mostrando antes → depois e só aplica após confirmação; sessões concluídas não mudam.
4. **Given** um mesociclo em andamento, **When** o usuário altera uma preferência suave (ex.: novo grupo prioritário), **Then** o mesociclo vigente não muda e a preferência é aplicada no próximo mesociclo gerado, o que é informado ao usuário.

---

### User Story 3 - Consultar o Agente de Medicina Esportiva (Priority: P2)

O usuário conversa com o **Agente de Medicina Esportiva** para tirar dúvidas sobre dor durante/após o treino, lesões, prevenção, aquecimento/mobilidade, retorno após lesão ou pausa, e sobre o significado de biomarcadores ligados a desgaste e recuperação. O agente responde considerando o perfil integrado (lesão declarada, treino atual, cargas recentes, cansaço, exames, genética relevante — ex.: perfil de tecido conjuntivo/colágeno). Quando identifica sinais de alerta, orienta procurar atendimento médico presencial. Quando julgar útil, propõe uma **restrição ou recomendação compartilhada** (ex.: "evitar movimentos acima da cabeça por 10 dias") que, se aceita pelo usuário, passa a valer para o Agente de Treino.

**Why this priority**: Aumenta a segurança e a confiança do usuário no treino personalizado; depende do perfil integrado (US2) para ter contexto rico.

**Independent Test**: Relatar "dor na frente do ombro direito ao fazer supino há 3 dias"; verificar que o agente faz perguntas de triagem pertinentes, cita o treino recente com supino, sugere conduta conservadora, deixa claro que não é diagnóstico, e oferece registrar uma restrição; aceitar a restrição e gerar a próxima sessão verificando que exercícios que agravam o ombro foram substituídos.

**Acceptance Scenarios**:

1. **Given** um relato de dor/lesão, **When** o usuário pergunta ao agente, **Then** a resposta considera o treino e as cargas recentes, faz perguntas de triagem quando faltar informação e inclui o aviso de que não substitui avaliação médica.
2. **Given** um relato com sinal de alerta (ex.: dor no peito, perda de força súbita, inchaço importante, dormência persistente), **When** o usuário descreve o sintoma, **Then** o agente orienta prioritariamente procurar atendimento médico e não sugere continuar treinando.
3. **Given** o agente propõe uma restrição compartilhada, **When** o usuário aceita, **Then** a restrição aparece no Perfil Integrado com motivo, origem e prazo, e o Agente de Treino passa a respeitá-la; **When** o usuário recusa, **Then** nada é registrado.
4. **Given** um exame com CPK ou PCR elevados, **When** o usuário pergunta se pode treinar pesado, **Then** o agente interpreta o biomarcador no contexto do treino recente e recomenda a conduta de carga de forma explicada.

---

### User Story 4 - Consultar o Agente de Nutrição Genética (Priority: P2)

O usuário conversa com o **Agente de Nutrição Genética** sobre alimentação, timing peri-treino, substituições de alimentos e suplementação. O agente fundamenta as respostas nas variantes genéticas do usuário (ex.: lactose/MCM6, cafeína/ADORA2A, resposta a carboidrato/FTO-TCF7L2, vitamina D/GC, B6/ALPL), no treino do dia, no nível de cansaço e nos exames mais recentes. Pode propor recomendações compartilhadas (ex.: "priorizar carboidrato no pós-treino nos dias de perna") visíveis aos demais agentes.

**Why this priority**: Fecha o tripé treino–saúde–nutrição; parte do valor já está prevista na 018, por isso vem depois do treino personalizado.

**Independent Test**: Perguntar "o que comer no pré-treino hoje e posso tomar café?" num dia de treino de pernas; verificar que a resposta cita o treino do dia, a variante de cafeína e a intolerância à lactose, e propõe opções sem lactose com timing adequado.

**Acceptance Scenarios**:

1. **Given** um dia com treino planejado, **When** o usuário pede orientação de pré/pós-treino, **Then** a resposta considera o tipo/volume do treino do dia e as variantes genéticas pertinentes, citando-as.
2. **Given** um exame com deficiência confirmada (ex.: vitamina D baixa com predisposição genética), **When** o usuário pergunta sobre suplementação, **Then** o agente relaciona genética e exame e recomenda conversar com médico/nutricionista sobre dosagem.
3. **Given** um pedido de substituição de alimento, **When** o usuário pergunta, **Then** o agente propõe alternativas equivalentes em macronutrientes compatíveis com as restrições genéticas.

---

### User Story 5 - Agentes que trabalham juntos (Priority: P3)

O usuário quer que os agentes se comportem como uma equipe: o que um especialista recomenda e o usuário aceita passa a ser considerado pelos outros, e quando a pergunta envolve outra especialidade, o agente consultado reconhece isso e indica (ou traz) a visão do especialista adequado.

**Why this priority**: Diferencial de produto, mas só agrega depois que os agentes individuais existem.

**Independent Test**: Aceitar uma restrição proposta pelo Agente de Medicina Esportiva; perguntar ao Agente de Nutrição sobre recuperação e verificar que ele leva a restrição em conta; perguntar ao Agente de Treino algo de nutrição e verificar que ele encaminha ao especialista correto.

**Acceptance Scenarios**:

1. **Given** uma restrição/recomendação compartilhada ativa, **When** qualquer agente responde algo relacionado, **Then** a resposta é coerente com ela e a menciona quando relevante.
2. **Given** que o usuário relatou ao Agente de Medicina Esportiva uma dor no ombro, **When** ele conversa depois com o Agente de Treino ou de Nutrição, **Then** esse agente conhece o relato (registrado em "Relatos nas conversas") sem ter acesso à conversa original; se o usuário remover o relato, nenhum agente o considera mais.
3. **Given** uma pergunta fora da especialidade do agente consultado, **When** o usuário pergunta, **Then** o agente sinaliza qual especialista é o mais indicado e oferece continuar com ele, sem inventar orientação fora do seu escopo.
4. **Given** duas recomendações compartilhadas conflitantes, **When** o conflito é detectado, **Then** o usuário é avisado e a recomendação de segurança (medicina esportiva) prevalece até que ele decida.

---

### Edge Cases

- Perfil quase vazio (usuário novo): os agentes funcionam com padrões razoáveis e dizem quais dados melhorariam a resposta, sem bloquear.
- Dados desatualizados (exame com mais de 6 meses, genética sem mudança, cansaço de ontem): a idade do dado é considerada e citada; dados de cansaço só valem no próprio dia (011).
- Preferências impossíveis de cumprir juntas (ex.: 20 min por sessão + volume alto para todos os grupos): o agente informa o conflito e propõe o melhor compromisso, em vez de violar silenciosamente uma restrição.
- Todos os exercícios de um grupo prioritário estão em "evitar" ou exigem equipamento indisponível: o agente avisa e sugere alternativas.
- Restrição compartilhada expirada: deixa de valer automaticamente e o usuário é informado na próxima interação relevante.
- Teto mensal de IA atingido no meio de uma conversa ou geração: a operação em andamento é concluída, as próximas ficam pausadas com mensagem indicando como aumentar o teto; nada do treino vigente é perdido.
- Falha/indisponibilidade do serviço de IA: o app mantém o treino vigente utilizável e mostra mensagem clara; nenhuma alteração parcial é aplicada.
- Pergunta claramente de emergência médica: resposta prioriza orientação de buscar atendimento, independentemente do agente consultado.
- Pedido para ignorar uma restrição de segurança: o agente explica o risco e só desativa a restrição se o usuário a remover explicitamente no Perfil Integrado.

## Requirements *(mandatory)*

### Functional Requirements

**Perfil Integrado (base compartilhada)**

- **FR-001**: O sistema MUST consolidar, para uso dos agentes, um Perfil Integrado do Usuário contendo: perfil declarado, preferências de treino, histórico de sessões e cargas, mesociclo vigente, sinal de cansaço/recuperação do dia, check-ins corporais, perfil genético, biomarcadores de exames, diretrizes nutricionais, relatos nas conversas e restrições/recomendações compartilhadas ativas.
- **FR-002**: O usuário MUST poder visualizar o Perfil Integrado agrupado por fonte, com data da última atualização de cada uma e indicação de fontes vazias.
- **FR-003**: O usuário MUST poder desativar e reativar o uso de cada fonte pelos agentes; uma fonte desativada MUST NOT ser usada por nenhum agente.
- **FR-004**: Toda resposta ou plano gerado por um agente MUST indicar quais fontes foram consideradas e quais estavam ausentes ou desativadas.

**Agente de Treino**

- **FR-005**: O usuário MUST poder definir preferências de treino: dias disponíveis, duração máxima por sessão, local, equipamentos disponíveis, exercícios favoritos, exercícios a evitar, grupos musculares prioritários, estilo de treino preferido e instruções livres em texto.
- **FR-006**: O Agente de Treino MUST gerar mesociclos e sessões que respeitem integralmente as restrições rígidas (equipamentos, exercícios a evitar, duração máxima, restrições compartilhadas de segurança ativas).
- **FR-007**: O Agente de Treino MUST usar todas as fontes ativas do Perfil Integrado na prescrição, incluindo biomarcadores de exames e cansaço do dia.
- **FR-008**: Cada plano MUST vir acompanhado de justificativa que associe as decisões relevantes aos dados que as motivaram.
- **FR-009**: O usuário MUST poder pedir ajustes ao treino em linguagem natural; o agente MUST apresentar o que muda em relação ao planejado e só aplicar após confirmação explícita (mesmo princípio da 011).
- **FR-009a**: O usuário MUST poder editar manualmente as sessões pendentes: trocar um exercício por uma alternativa compatível (mesmo padrão de movimento/grupo e equipamentos disponíveis) e alterar séries, repetições e carga. Edições que violem uma restrição de segurança ativa MUST exibir aviso com o motivo antes de salvar; sessões concluídas MUST NOT ser editáveis por este fluxo.
- **FR-009b**: O Agente de Treino MUST considerar as edições manuais recorrentes como sinal de preferência ao gerar os próximos planos (ex.: exercício trocado repetidamente tende a não ser prescrito) e citar isso na justificativa.
- **FR-010**: Quando instruções do usuário conflitarem entre si ou com restrições de segurança, o agente MUST explicar o conflito, priorizar a segurança e propor a alternativa mais próxima do pedido.
- **FR-011**: Alterações de preferências MUST NOT alterar sessões já concluídas. Alterações em **restrições rígidas** (equipamentos, exercícios a evitar, duração máxima) MUST gerar uma proposta de adaptação das sessões pendentes do mesociclo vigente, exibindo antes → depois e aplicada só após confirmação; se recusada, as sessões pendentes permanecem como estavam. Alterações em **preferências suaves** (grupos prioritários, estilo, favoritos, instruções livres) MUST valer apenas a partir do próximo mesociclo gerado.

**Agente de Medicina Esportiva**

- **FR-012**: O usuário MUST poder conversar com o Agente de Medicina Esportiva, que responde considerando lesão declarada, treino/cargas recentes, cansaço, exames e genética relevante.
- **FR-013**: O agente MUST deixar claro que suas orientações não substituem avaliação médica e MUST NOT apresentar diagnósticos definitivos nem prescrever medicamentos.
- **FR-014**: Diante de sinais de alerta, o agente MUST orientar prioritariamente a busca por atendimento médico e MUST NOT recomendar continuar treinando.
- **FR-015**: O agente MUST fazer perguntas de triagem quando faltar informação essencial para orientar.

**Agente de Nutrição Genética**

- **FR-016**: O usuário MUST poder conversar com o Agente de Nutrição Genética, que fundamenta as respostas nas variantes genéticas, no treino do dia, no cansaço e nos exames, citando-as.
- **FR-017**: O agente MUST respeitar restrições alimentares derivadas da genética (ex.: lactose) em todas as sugestões e MUST recomendar acompanhamento profissional para dosagem de suplementos.

**Colaboração entre agentes**

- **FR-018**: Qualquer agente MUST poder propor uma restrição ou recomendação compartilhada (texto, motivo, agente de origem, prazo opcional); ela só passa a valer após aceite do usuário.
- **FR-019**: Restrições/recomendações compartilhadas aceitas MUST ser consideradas por todos os agentes, visíveis e removíveis pelo usuário no Perfil Integrado, e expirar automaticamente quando tiverem prazo.
- **FR-020**: Quando uma pergunta pertencer a outra especialidade, o agente MUST indicar o especialista adequado em vez de responder fora do escopo.
- **FR-020a**: Os agentes MUST registrar fatos relevantes extraídos das conversas (ex.: sintoma relatado, preferência declarada, decisão tomada) como itens da fonte "Relatos nas conversas" do Perfil Integrado, com data e agente de origem; o usuário MUST poder ver, editar e remover cada item. Agentes MUST NOT acessar o histórico completo de conversas com outros especialistas — apenas esses fatos registrados.
- **FR-021**: Em conflito entre recomendações compartilhadas, a de segurança (medicina esportiva) MUST prevalecer até decisão do usuário, que MUST ser avisado.
- **FR-022**: Cada agente MUST preservar o histórico da conversa com o usuário e permitir iniciar uma nova conversa.
- **FR-023**: O usuário MUST poder acessar os agentes de duas formas: (a) um chat "Equipe Helux" que encaminha automaticamente cada pergunta ao especialista adequado, indicando qual especialista respondeu; e (b) acesso direto a cada especialista a partir do contexto correspondente (ex.: Agente de Nutrição na tela de Nutrição, Agente de Treino na tela de Treino).
- **FR-023a**: As respostas dos agentes nas conversas MUST ser exibidas progressivamente à medida que são produzidas, com indicação de qual especialista está respondendo.

**Robustez**

- **FR-024**: Em falha do serviço de IA, o sistema MUST manter o treino vigente utilizável, informar o usuário com mensagem clara e MUST NOT aplicar alterações parciais.
- **FR-025**: O usuário MUST poder definir um teto de gasto mensal com IA e ver o consumo acumulado do mês.
- **FR-026**: Ao atingir 80% do teto, o sistema MUST avisar o usuário; ao atingir 100%, chats, geração de mesociclo e propostas de ajuste por IA MUST ficar pausados até a virada do mês ou até o teto ser aumentado, com mensagem clara. O treino vigente, o registro de treinos e as edições manuais (FR-009a) MUST continuar funcionando.

### Key Entities

- **Perfil Integrado do Usuário**: visão consolidada de todas as fontes de dados do usuário usada pelos agentes; para cada fonte guarda conteúdo resumido, data de atualização e se está ativa.
- **Preferências de Treino**: dias, duração máxima, local, equipamentos, exercícios favoritos/a evitar, grupos prioritários, estilo, instruções livres; versionadas por data de alteração.
- **Agente Especialista**: Treino, Medicina Esportiva ou Nutrição Genética; tem escopo, fontes que utiliza e regras de segurança próprias.
- **Conversa**: sequência de mensagens entre usuário e um agente, com data e fontes consideradas em cada resposta.
- **Relato de Conversa**: fato relevante extraído de uma conversa (texto curto, categoria — sintoma, preferência, decisão —, data, agente de origem); compartilhado entre os agentes via Perfil Integrado e editável/removível pelo usuário.
- **Restrição/Recomendação Compartilhada**: orientação proposta por um agente e aceita pelo usuário; tem texto, tipo (restrição de segurança ou recomendação), motivo, agente de origem, data de início, prazo opcional e status (ativa, expirada, removida).
- **Edição Manual de Sessão**: alteração feita diretamente pelo usuário em uma sessão pendente (exercício trocado, séries/reps/carga antes → depois, data); serve de sinal de preferência para o Agente de Treino.
- **Proposta de Ajuste de Treino**: alteração sugerida pelo Agente de Treino com resumo antes/depois, pendente de confirmação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das sessões geradas respeitam as restrições rígidas definidas pelo usuário (equipamentos, exercícios evitados, duração máxima, restrições de segurança ativas), verificado em um conjunto de cenários de teste.
- **SC-002**: Em 100% dos planos gerados, a justificativa cita pelo menos um dado de cada fonte ativa que influenciou a prescrição e lista as fontes ausentes/desativadas.
- **SC-003**: O usuário consegue configurar todas as preferências de treino em menos de 3 minutos.
- **SC-004**: Um ajuste de sessão pedido em linguagem natural é proposto ao usuário em menos de 30 segundos.
- **SC-004a**: Nas conversas, a resposta começa a aparecer em até 3 segundos e está completa em até 30 segundos em 95% das mensagens.
- **SC-005**: Em 100% dos cenários de teste com sinais de alerta médico, o Agente de Medicina Esportiva orienta buscar atendimento e não recomenda treinar.
- **SC-006**: Em 100% das sugestões alimentares do Agente de Nutrição Genética, nenhuma viola restrições genéticas registradas (ex.: lactose).
- **SC-007**: Uma restrição compartilhada aceita é refletida no próximo plano/resposta de todos os agentes em 100% dos casos de teste.
- **SC-009**: O gasto mensal com IA nunca ultrapassa o teto definido pelo usuário em mais do que o custo de uma única operação em andamento.
- **SC-008**: O usuário avalia o treino gerado como "adequado a mim" em pelo menos 4 de cada 5 planos nas primeiras 4 semanas de uso.

## Assumptions

- O Helux continua sendo de uso individual (o próprio Doug como usuário principal); não há perfis profissionais (médico/nutricionista) acessando os dados nesta versão.
- Todas as fontes de dados começam ativas para os agentes; o usuário pode desativá-las (FR-003). Requisitos formais de LGPD continuam no backlog.
- A geração de mesociclo existente (008/014) e o ajuste por cansaço (011) são evoluídos, não substituídos: a lógica de periodização e o fluxo de confirmação de mudanças continuam valendo.
- Os exames (019) e as diretrizes nutricionais (018) entram como fontes de dados quando existirem; enquanto não existirem, os agentes funcionam sem elas (FR-004).
- Restrições compartilhadas sem prazo definido permanecem ativas até remoção pelo usuário.
- Exames são considerados "desatualizados" após 6 meses da data de coleta, e isso é sinalizado nas respostas.
- Interface web responsiva (decisão web-only do MVP).
