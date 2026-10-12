# Feature Specification: Módulo de Nutrição Esportiva Genética Integrado ao Treino e Agente Especialista

**Feature Branch**: `018-nutricao-genetica`  
**Created**: 2026-10-10  
**Status**: Draft  
**Input**: User description: "Construir um módulo de nutrição com base nas informações genéticas (data/genetics/genera.json), que se comunique e tenha relação direta com o treino para potencializar os resultados esportivos com total sinergia com o que está sendo proposto. Deve ter um agente especialista em nutrição esportiva com viés genético, diretrizes diárias dinâmicas (timing pré/pós-treino, macros adaptados ao treino do dia e ao nível de cansaço/recuperação) + plano alimentar base e chat interativo para dúvidas e substituições."

---

## 1. Contexto e Visão Geral

O Helux possui um motor avançado de treino e periodização (mesociclos, treinos diários e adaptação por cansaço/recuperação via HRV na Spec 011), além de um mapeamento genético individualizado registrado em `data/genetics/genera.json` (com dados reais de nutrigenômica no módulo `Genera Nutri` e dados atléticos no módulo `Genera Fit` / `Painel Saúde Esportiva`).

Atualmente, o usuário não conta com um módulo de nutrição que traduza seus dados genéticos em recomendações dietéticas práticas e alinhadas ao seu cronograma de treino.

Esta funcionalidade introduz o **Módulo de Nutrição Esportiva Genética**, composto por:
1. **Motor de Diretrizes Nutricionais Diárias**: Calcula metas de calorias, macronutrientes, micronutrientes-chave e janelas de refeição (timing pré/intra/pós-treino) ajustadas especificamente para a demanda metabólica do treino do dia (volume, grupos musculares, dia de descanso) e o perfil genético do atleta.
2. **Sinergia Dinâmica com Cansaço & Recuperação**: Comunica-se com o sinal de cansaço da Spec 011 (ótimo, normal, cansado, exausto) para sugerir reforços nutricionais de recuperação (hidratação, densidade de micronutrientes, ajuste de carboidrato).
3. **Agente Especialista em Nutrição Esportiva com Viés Genético (IA)**: Um agente conversacional e consultor que fundamenta cada sugestão nas variantes genéticas do usuário (ex.: intolerância à lactose via MCM6, eficácia de dietas via FTO/TCF7L2, metabolização de cafeína via ADORA2A, densidade óssea via WNT16, tipo de fibra e potência via ACTN3), permitindo tirar dúvidas, solicitar substituições de alimentos e receber orientações táticas peri-treino.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Diretrizes Nutricionais Diárias Alinhadas ao Treino e Genética (Priority: P1)

Ao acessar a tela de Nutrição, o usuário visualiza o plano e as diretrizes do dia vigente. O sistema identifica automaticamente o treino planejado para o dia (ou se é dia de descanso) e cruza as exigências fisiológicas do treino com os marcadores de `Genera Nutri` e `Genera Fit`. O usuário visualiza o resumo de calorias/macros, a distribuição das refeições com foco no timing peri-treino (pré-treino e pós-treino) e badges explicativos destacando o porquê genético de cada decisão (ex.: "Isento de lactose", "Carboidratos concentrados no peri-treino", "Suporte a Vitamina D e B6").

**Why this priority**: É o cerne de valor da nutrição esportiva de precisão — sem as diretrizes integradas do dia, o usuário não tem orientação prática para executar sua alimentação alinhada ao treino.

**Independent Test**: Com o treino do dia ativo (ex.: Treino de Força/Hipertrofia de Membros Inferiores) e o perfil genético carregado de `genera.json`, abrir a tela de Nutrição e verificar que as metas de macros e o cardápio sugerido priorizam refeições sem lactose, alocam carboidratos no peri-treino e trazem calorias proporcionais ao volume do treino.

**Acceptance Scenarios**:
1. **Given** um treino de musculação de alta intensidade agendado para o dia, **When** o usuário abre a aba Nutrição, **Then** o sistema exibe meta calórica de dia de treino com macros otimizados, timing de pré-treino (60-90 min antes) e pós-treino (síntese proteica adaptada para recuperação), com todas as sugestões livres de lactose (MCM6 G,G).
2. **Given** um dia sem treino (dia de descanso / rest day), **When** o usuário consulta as diretrizes do dia, **Then** a meta calórica e de carboidratos é reduzida para refletir a menor demanda glicolítica e a predisposição favorável a dietas controladas em carboidratos (FTO T,T), mantendo alta densidade proteica para recuperação tecidual.
3. **Given** as refeições do dia geradas, **When** o usuário expande os detalhes de uma refeição, **Then** visualiza a justificativa nutrigenômica dos alimentos recomendados (ex.: fontes de cálcio não lácteas para WNT16, fontes de B6 para ALPL, ausência de lactose para MCM6).

---

### User Story 2 - Agente Conversacional Especialista em Nutrição Genética (Priority: P1)

Na tela de Nutrição, o usuário tem acesso a uma interface de chat com o **Agente Nutricionista Esportivo Genético**. O usuário pode fazer perguntas sobre a dieta, tirar dúvidas sobre suplementos, relatar sintomas de digestão ou pedir substituições imediatas de alimentos (ex.: "Não tenho batata-doce hoje, o que posso comer no pré-treino?"). O agente responde levando em consideração o contexto completo: o treino de hoje, o histórico de cansaço e o laudo genético do usuário.

**Why this priority**: Fornece a flexibilidade e humanização necessárias para a adesão à dieta, garantindo que o viés genético seja explicado com embasamento científico e linguagem clara e motivadora.

**Independent Test**: Enviar uma mensagem ao agente perguntando "Qual o melhor pré-treino para mim hoje e posso tomar cafeína?", e verificar que a resposta referencia tanto o tipo de treino do dia quanto a variante de sensibilidade à cafeína (ADORA2A) e a intolerância à lactose (evitando cafeína com leite ou wheys concentrados normais).

**Acceptance Scenarios**:
1. **Given** o chat do Agente Nutricionista aberto, **When** o usuário solicita uma substituição de alimento para o pós-treino, **Then** o agente propõe alternativas equivalentes em macronutrientes e valida explicitamente que as sugestões não possuem lactose nem interferem negativamente no perfil metabólico.
2. **Given** uma dúvida do usuário sobre dosagem de cafeína, **When** o usuário pergunta se deve suplementar cafeína antes do treino de explosão, **Then** o agente avalia o genótipo ADORA2A (baixa propensão a ansiedade induzida por cafeína) e o perfil ACTN3 C,C (fibras rápidas), recomendando o timing e a faixa segura de dosagem.
3. **Given** uma conversa em andamento, **When** o usuário envia múltiplas mensagens sequenciais, **Then** o agente preserva o histórico da conversa e o contexto do dia.

---

### User Story 3 - Sinergia Reativa com Sinal de Cansaço e Recuperação (Priority: P2)

Quando o usuário atualiza seu nível de cansaço na Home ou no início do treino (ótimo, normal, cansado, exausto via Spec 011) ou quando dados de baixa recuperação por HRV são registrados, o Módulo de Nutrição reage oferecendo recomendações de suporte compensatório para aquele dia: reforço na hidratação com eletrólitos, inclusão de alimentos anti-inflamatórios e ajuste calórico/carboidrato de suporte imune.

**Why this priority**: Conecta a nutrição dinamicamente à fisiologia diária do usuário, impedindo que uma dieta rígida prejudique um corpo sob alto estresse físico ou baixa recuperação.

**Independent Test**: Na Home, selecionar nível de cansaço "exausto" e abrir a Nutrição; verificar que o topo da tela exibe um alerta de "Ajuste Nutricional de Recuperação" sugerindo reposição energética protetora e aumento de micronutrientes antioxidantes.

**Acceptance Scenarios**:
1. **Given** o usuário sinalizou cansaço "cansado" ou "exausto", **When** acessa o módulo de Nutrição, **Then** visualiza um card de destaque recomendando protocolo de recuperação celular (foco em hidratação, magnésio, vitamina B6 e fontes anti-inflamatórias).
2. **Given** um treino que foi reduzido em séries/carga pela Spec 011 devido a exaustão, **When** as diretrizes nutricionais são recalculadas, **Then** as calorias peri-treino são mantidas em patamar de sustentação e o agente nutricionista adiciona uma nota no chat orientando como acelerar o restabelecimento do sistema nervoso central e muscular.

---

### User Story 4 - Visualização do Perfil Nutrigenômico e Recomendações de Suplementação (Priority: P2)

O usuário pode alternar para a aba/seção "Meu Perfil Genético Nutricional", onde encontra a síntese dos seus marcadores genéticos relevantes para a nutrição e performance, com suas respectivas recomendações práticas consolidadas (Vitamina D, B6, Densidade Óssea, Lactose, Metabolismo de Gorduras/Carbos, Cafeína e Fibras Musculares).

**Why this priority**: Confere transparência e empoderamento ao usuário, permitindo que ele compreenda os fundamentos de longo prazo da sua estratégia nutricional e compartilhe com profissionais de saúde.

**Independent Test**: Acessar a seção "Perfil Genético" dentro do módulo de nutrição e validar que todos os marcadores de `data/genetics/genera.json` pertencentes aos grupos nutrição e performance estão mapeados com status visual (Ponto de Atenção, Neutro, Favorável).

**Acceptance Scenarios**:
1. **Given** os dados de `data/genetics/genera.json`, **When** o usuário abre a visualização de perfil nutrigenômico, **Then** visualiza cards categorizados:
   - **Metabolismo & Sensibilidades**: Intolerância à Lactose (MCM6 G,G - Ponto de Atenção), Sensibilidade à Cafeína (ADORA2A C,G - Favorável), Saciedade (FTO T,T - Favorável).
   - **Micronutrientes & Vitaminas**: Vitamina D (GC A,C - Atenção), Vitamina B6 (ALPL A,G - Atenção), Densidade Óssea (WNT16 C,T - Atenção).
   - **Perfil Muscular & Dieta**: Resposta a Low Carb (FTO - Alta Eficácia), Potência e Explosão (ACTN3 C,C - Favorável).
2. **Given** um marcador com "Ponto de Atenção", **When** o usuário clica no marcador, **Then** abre uma explicação detalhada com conduta prática de alimentos recomendados e a evitar.

---

## 3. Edge Cases

- **Ausência de dados genéticos**: Caso o usuário ainda não possua o arquivo/registro genético carregado, o sistema deve exibir um estado de fallback (onboarding para carregar o arquivo ou utilizar diretrizes esportivas padrão baseadas em biometria básica, indicando que a personalização genômica está inativa).
- **Treino alterado no meio do dia**: Se o usuário trocar ou adiar o treino para outro horário, os horários e conteúdos das janelas peri-treino (pré e pós) devem se recalcular em relação ao novo horário programado.
- **Treino concluído antecipadamente**: Ao marcar o treino como concluído, a refeição pós-treino deve ser destacada como "Ação recomendada imediata" com temporizador de janela de recuperação.
- **Falha de conectividade ou indisponibilidade do Agente LLM**: O painel e as diretrizes calculadas deterministicamente (macros, refeições base salvas) continuam disponíveis offline/localmente; o chat do agente exibe feedback amigável de reconexão.
- **Alimentos proibidos por intolerância (Lactose)**: Nenhuma refeição sugerida, receita ou substituição automática pode conter derivados lácteos com lactose sem a indicação explícita "zero lactose" ou alternativa vegetal equivalente.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE carregar e interpretar os marcadores genéticos de nutrição e performance a partir de `data/genetics/genera.json` (ou endpoint de perfil genético existente na API).
- **FR-002**: O sistema DEVE calcular as metas de macronutrientes (Proteínas, Carboidratos, Gorduras) e Calorias Totais diárias integradas ao treino do dia (Volume, RPE planejado, grupamentos musculares) e à fase do mesociclo vigente.
- **FR-003**: O sistema DEVE discriminar dias de treino vs. dias de descanso, adaptando a partição de carboidratos conforme a predisposição genética do usuário (FTO T,T favorável a menor carboidrato em repouso).
- **FR-004**: O sistema DEVE estruturar o timing das refeições em torno do treino: refeição pré-treino (com tempo de digestão sugerido) e pós-treino imediato/refeição sólida seguinte.
- **FR-005**: O sistema DEVE filtrar e excluir estritamente fontes de lactose das sugestões padrão em conformidade com o marcador MCM6 G,G.
- **FR-006**: O sistema DEVE destacar recomendações preventivas para os micronutrientes identificados com risco de insuficiência no laudo genético: Vitamina D (GC A,C) e Vitamina B6 (ALPL A,G), além de aporte de cálcio não lácteo para proteção óssea (WNT16 C,T).
- **FR-007**: O sistema DEVE disponibilizar uma interface de chat conversacional alimentada por um agente especializado em nutrição esportiva e nutrigenômica.
- **FR-008**: O Agente Nutricionista DEVE receber no seu system prompt e contexto:
  1. O perfil genético consolidado do usuário (`Genera Nutri` e `Genera Fit`);
  2. O treino planejado para o dia atual (exercícios, volume, intensidade) e histórico recente;
  3. O nível de cansaço/recuperação do dia (sinal da Spec 011);
  4. O plano alimentar gerado para o dia.
- **FR-009**: O Agente Nutricionista DEVE justificar suas respostas e recomendações correlacionando os dados genéticos com as demandas do treinamento atlético sempre que pertinente.
- **FR-010**: O usuário DEVE poder solicitar substituições de alimentos em uma refeição pelo chat ou por botão de troca rápida, mantendo a equivalência de macronutrientes e a conformidade genética.
- **FR-011**: O sistema DEVE integrar com o status de cansaço do dia (Spec 011). Caso o cansaço esteja marcado como "cansado" ou "exausto", o plano do dia deve exibir alerta e sugestões de hidratação e micronutrientes para restauração.
- **FR-012**: As diretrizes calculadas e as mensagens do chat DEVEM ser persistidas para que o usuário possa consultar o histórico de dias anteriores.
- **FR-013**: A interface DEVE seguir o design system unificado do Helux (Spec 012), mantendo suporte completo a tema escuro, tipografia e componentes visuais do app.

### Key Entities

- **GeneticNutritionProfile**: Perfil nutrigenômico processado do usuário (marcadores de sensibilidade alimentar, absorção de vitaminas, eficiência de dietas, tolerância à cafeína e densidade óssea).
- **DailyNutritionPlan**: Plano diário associado a uma data e a um `workout_id` (se houver), contendo metas de calorias, macros (proteína, carbo, gordura), nível de hidratação alvo e lista de refeições sugeridas.
- **NutritionMeal**: Refeição planejada (tipo: café da manhã, pré-treino, pós-treino, almoço, jantar, ceia, lanche), horário sugerido, relação de alimentos com porções, macros calculados e tags genéticas (ex.: "Sem Lactose", "Rico em B6").
- **NutritionChatMessage**: Mensagem trocada entre o usuário e o Agente Nutricionista Esportivo, com timestamp, remetente (`user` | `agent`), contexto do treino no momento do envio e metadados de recomendação.
- **RecoveryNutritionAdjustment**: Modificadores nutricionais aplicados quando o sinal de cansaço da Spec 011 for ativado (eletrólitos, antioxidantes, hidratação adicional).

---

## 5. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O tempo de carregamento inicial e cálculo das diretrizes diárias integradas ao treino deve ser inferior a 1,5 segundos.
- **SC-002**: 100% das refeições e sugestões geradas automaticamente devem obedecer às restrições genéticas absolutas (zero lactose para perfil MCM6 G,G).
- **SC-003**: O Agente Nutricionista deve responder a perguntas do usuário no chat com latência de primeiro token (streaming) inferior a 2 segundos.
- **SC-004**: Ao alternar o treino do dia (ou sinal de cansaço), as diretrizes de timing e macros devem refletir a nova condição em até 1 segundo na interface.
- **SC-005**: 90% das recomendações do agente no chat devem citar corretamente a correlação entre o treino planejado e o perfil biológico/genético quando questionado sobre o porquê de um alimento ou suplemento.

---

## 6. Assumptions & Scope Boundaries

- **Dados Genéticos**: O arquivo `data/genetics/genera.json` serve como fonte de dados primária do perfil de Douglas Lopes. Não é escopo inicial implementar upload de raw data multi-formato de terceiros (o JSON estruturado existente é a fonte autoritativa).
- **Natureza das Recomendações**: As recomendações geradas pelo agente e pelo sistema têm caráter informativo e esportivo de suporte ao treinamento, incluindo disclaimer padrão de que não substituem acompanhamento médico ou nutricional presencial.
- **Controle de Ingestão (Log de calorias)**: O MVP foca em *prescrição, diretrizes dinâmicas, timing peri-treino e consultoria via agente*, e não em diário calórico com pesagem de cada grama consumido pelo usuário (rastreador estilo MyFitnessPal fica para fase posterior).
- **Reaproveitamento de Componentes**: Utilização da estrutura de IA existente em `packages/ai`, do motor de treinos em `packages/workouts` e do design system unificado em `apps/web` e `apps/mobile`.
