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
3. *(Movido para a spec 022 em 2026-10-20 — fica aqui só como contexto.)* **Agente Especialista em Nutrição Esportiva com Viés Genético (IA)**: Um agente conversacional e consultor que fundamenta cada sugestão nas variantes genéticas do usuário (ex.: intolerância à lactose via MCM6, eficácia de dietas via FTO/TCF7L2, metabolização de cafeína via ADORA2A, densidade óssea via WNT16, tipo de fibra e potência via ACTN3), permitindo tirar dúvidas, solicitar substituições de alimentos e receber orientações táticas peri-treino.

---

## Clarifications

### Session 2026-10-20

- Q: O chat do agente nutricionista (US2) continua na 018? → A: Não. Foi absorvido pela 022 (Agente de Nutrição Genética). A 018 entrega fase de dieta, diretrizes diárias, troca rápida, card de recuperação e perfil nutrigenômico; a 022 consome esses dados.

### Session 2026-10-13

- Q: Quem monta as refeições do dia — regra determinística, IA ou híbrido? → A: Regra determinística. Metas por fórmula e refeições montadas a partir de um catálogo próprio de alimentos (macros + tags genéticas); a IA fica só no chat (explicar e sugerir trocas).
- Q: Como o sistema sabe o horário do treino para o timing peri-treino? → A: Pela hora real em que o treino ativo começa (o usuário pode treinar em qualquer horário, sem horário fixo). Antes de começar, o pré-treino é mostrado como orientação relativa ("60–90 min antes de treinar"); a partir do início, as janelas pós-treino passam a ter hora no relógio.
- Q: Faz sentido gerar um plano por dia? → A: Não como unidade principal. O plano alimentar é uma **fase de dieta** (objetivo + duração própria, independente do mesociclo) com metas-base de calorias/macros, **recalibrada por regra a cada check-in corporal** pela evolução real vs. esperada; o treino segue sendo calibrado pelo histórico e os dois se encontram no check-in. O **dia** é derivado da fase (treino/descanso, timing pelo início real do treino, ajuste de cansaço, refeições do catálogo). % de gordura pelo **método da Marinha dos EUA** com fita métrica (cintura + pescoço + altura; quadril para mulheres); proteína por kg de peso; calorias por fórmula com peso, altura, idade e sexo.
- Q: Como fica a conversa com o agente ao longo dos dias? → A: Uma conversa por fase de dieta: dura a fase inteira; a IA recebe as últimas N mensagens da fase, mais o contexto do dia (treino, cansaço, plano do dia), da fase e da genética. Nova fase = nova conversa; as conversas de fases anteriores ficam salvas para leitura.
- Q: O que entra nesta spec? → A: Tudo — US0 a US4 na 018. A US4 (perfil nutrigenômico) reaproveita os componentes visuais da tela DNA da 020 (cards de marcador) dentro do módulo de Nutrição, sem duplicar a lógica de leitura do perfil.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 0 - Fase de Dieta Recalibrada a Cada Check-in (Priority: P1)

O usuário inicia uma fase de dieta escolhendo o objetivo (ex.: perder gordura, ganhar massa, recomposição, manutenção) e a duração. O sistema define as metas-base de calorias e macros a partir do último check-in (peso, cintura, pescoço → % de gordura pelo método da Marinha), dos dados fixos do perfil (altura, idade, sexo), do objetivo e da genética. A cada novo check-in, a fase é recalibrada por regra: a evolução real de peso, cintura e % de gordura é comparada à esperada para o objetivo, e as metas sobem, descem ou se mantêm, com o motivo visível.

**Why this priority**: É a base de tudo — o dia só é coerente se derivar de uma estratégia com objetivo. Treino e dieta passam a ser avaliados juntos no mesmo check-in.

**Independent Test**: Criar uma fase "perder gordura" com check-in de 80 kg; registrar um novo check-in com perda abaixo da esperada; verificar que as metas calóricas descem um degrau e o motivo cita a evolução medida.

**Acceptance Scenarios**:
1. **Given** um check-in com peso, cintura e pescoço e o perfil com altura, idade e sexo, **When** o usuário inicia uma fase de dieta, **Then** o sistema calcula % de gordura (Marinha), calorias e macros-base (proteína por kg) e mostra as metas da fase.
2. **Given** uma fase em andamento, **When** um novo check-in é registrado, **Then** a fase é recalibrada por regra determinística (aumentar, manter ou reduzir calorias/macros) e a recalibração fica registrada com o motivo.
3. **Given** um check-in sem pescoço (ou sem cintura), **When** a fase é calculada, **Then** o % de gordura fica ausente e as metas usam só o peso (sem bloquear o usuário).

---

### User Story 1 - Diretrizes Nutricionais Diárias Alinhadas ao Treino e Genética (Priority: P1)

Ao acessar a tela de Nutrição, o usuário visualiza o plano e as diretrizes do dia vigente. O sistema identifica automaticamente o treino planejado para o dia (ou se é dia de descanso) e cruza as exigências fisiológicas do treino com os marcadores de `Genera Nutri` e `Genera Fit`. O usuário visualiza o resumo de calorias/macros, a distribuição das refeições com foco no timing peri-treino (pré-treino e pós-treino) e badges explicativos destacando o porquê genético de cada decisão (ex.: "Isento de lactose", "Carboidratos concentrados no peri-treino", "Suporte a Vitamina D e B6").

**Why this priority**: É o cerne de valor da nutrição esportiva de precisão — sem as diretrizes integradas do dia, o usuário não tem orientação prática para executar sua alimentação alinhada ao treino.

**Independent Test**: Com o treino do dia ativo (ex.: Treino de Força/Hipertrofia de Membros Inferiores) e o perfil genético carregado de `genera.json`, abrir a tela de Nutrição e verificar que as metas de macros e o cardápio sugerido priorizam refeições sem lactose, alocam carboidratos no peri-treino e trazem calorias proporcionais ao volume do treino.

**Acceptance Scenarios**:
1. **Given** um treino de musculação de alta intensidade agendado para o dia, **When** o usuário abre a aba Nutrição, **Then** o sistema exibe meta calórica de dia de treino com macros otimizados, timing de pré-treino (60-90 min antes) e pós-treino (síntese proteica adaptada para recuperação), com todas as sugestões livres de lactose (MCM6 G,G).
2. **Given** um dia sem treino (dia de descanso / rest day), **When** o usuário consulta as diretrizes do dia, **Then** a meta calórica e de carboidratos é reduzida para refletir a menor demanda glicolítica e a predisposição favorável a dietas controladas em carboidratos (FTO T,T), mantendo alta densidade proteica para recuperação tecidual.
3. **Given** as refeições do dia geradas, **When** o usuário expande os detalhes de uma refeição, **Then** visualiza a justificativa nutrigenômica dos alimentos recomendados (ex.: fontes de cálcio não lácteas para WNT16, fontes de B6 para ALPL, ausência de lactose para MCM6).

---

### User Story 2 - ~~Agente Conversacional Especialista em Nutrição Genética~~ *(movida para a 022)*

> **Fora do escopo da 018 (atualização 2026-10-20).** O chat com o agente nutricionista foi absorvido pela spec **022-agentes-especialistas-ia** (Agente de Nutrição Genética, US4 da 022), que usa a fase de dieta, o plano do dia e o perfil nutrigenômico desta spec como fonte de dados. A numeração das demais histórias foi mantida.

---

### User Story 3 - Sinergia Reativa com Sinal de Cansaço e Recuperação (Priority: P2)

Quando o usuário atualiza seu nível de cansaço na Home ou no início do treino (ótimo, normal, cansado, exausto via Spec 011) ou quando dados de baixa recuperação por HRV são registrados, o Módulo de Nutrição reage oferecendo recomendações de suporte compensatório para aquele dia: reforço na hidratação com eletrólitos, inclusão de alimentos anti-inflamatórios e ajuste calórico/carboidrato de suporte imune.

**Why this priority**: Conecta a nutrição dinamicamente à fisiologia diária do usuário, impedindo que uma dieta rígida prejudique um corpo sob alto estresse físico ou baixa recuperação.

**Independent Test**: Na Home, selecionar nível de cansaço "exausto" e abrir a Nutrição; verificar que o topo da tela exibe um alerta de "Ajuste Nutricional de Recuperação" sugerindo reposição energética protetora e aumento de micronutrientes antioxidantes.

**Acceptance Scenarios**:
1. **Given** o usuário sinalizou cansaço "cansado" ou "exausto", **When** acessa o módulo de Nutrição, **Then** visualiza um card de destaque recomendando protocolo de recuperação celular (foco em hidratação, magnésio, vitamina B6 e fontes anti-inflamatórias).
2. **Given** um treino que foi reduzido em séries/carga pela Spec 011 devido a exaustão, **When** as diretrizes nutricionais são recalculadas, **Then** as calorias peri-treino são mantidas em patamar de sustentação e o card de recuperação orienta como acelerar o restabelecimento do sistema nervoso central e muscular.

---

### User Story 4 - Visualização do Perfil Nutrigenômico e Recomendações de Suplementação (Priority: P2)

O usuário pode alternar para a aba/seção "Meu Perfil Genético Nutricional", onde encontra a síntese dos seus marcadores genéticos relevantes para a nutrição e performance, com suas respectivas recomendações práticas consolidadas (Vitamina D, B6, Densidade Óssea, Lactose, Metabolismo de Gorduras/Carbos, Cafeína e Fibras Musculares).

**Why this priority**: Confere transparência e empoderamento ao usuário, permitindo que ele compreenda os fundamentos de longo prazo da sua estratégia nutricional e compartilhe com profissionais de saúde.

**Reuso**: a seção usa os mesmos componentes de card de marcador da tela DNA (spec 020) e a mesma leitura do perfil genético (`GET /genetic-profile`), acrescentando a classificação nutricional (Ponto de Atenção / Neutro / Favorável) e a conduta prática.

**Independent Test**: Acessar a seção "Perfil Genético" dentro do módulo de nutrição e validar que todos os marcadores de `data/genetics/genera.json` pertencentes aos grupos nutrição e performance estão mapeados com status visual (Ponto de Atenção, Neutro, Favorável).

**Acceptance Scenarios**:
1. **Given** os dados de `data/genetics/genera.json`, **When** o usuário abre a visualização de perfil nutrigenômico, **Then** visualiza cards categorizados:
   - **Metabolismo & Sensibilidades**: Intolerância à Lactose (MCM6 G,G - Ponto de Atenção), Sensibilidade à Cafeína (ADORA2A C,G - Favorável), Saciedade (FTO T,T - Favorável).
   - **Micronutrientes & Vitaminas**: Vitamina D (GC A,C - Atenção), Vitamina B6 (ALPL A,G - Atenção), Densidade Óssea (WNT16 C,T - Atenção).
   - **Perfil Muscular & Dieta**: Resposta a Low Carb (FTO - Alta Eficácia), Potência e Explosão (ACTN3 C,C - Favorável).
2. **Given** um marcador com "Ponto de Atenção", **When** o usuário clica no marcador, **Then** abre uma explicação detalhada com conduta prática de alimentos recomendados e a evitar.

---

## 3. Edge Cases

- **Check-in desatualizado** *(validação da US0, 2026-10-14)*: para iniciar uma fase, o check-in mais recente precisa ter peso e no máximo 35 dias. Mais antigo que isso, a tela pede um check-in atual (com peso, cintura e pescoço) e, depois de salvo, volta para a Nutrição. A recalibração de fases já iniciadas não depende dessa regra.
- **Ausência de dados genéticos**: Caso o usuário ainda não possua o arquivo/registro genético carregado, o sistema deve exibir um estado de fallback (onboarding para carregar o arquivo ou utilizar diretrizes esportivas padrão baseadas em biometria básica, indicando que a personalização genômica está inativa).
- **Treino em qualquer horário**: Não há horário programado. Enquanto o treino do dia não começa, o plano não fixa hora para pré/pós-treino (só orientação relativa). Se o usuário começar a treinar sem ter feito a refeição pré-treino, o plano não "atrasa" nada: o pós-treino é recalculado a partir do início/conclusão real.
- **Dia com treino planejado que não acontece**: Até o treino começar, o dia é tratado como dia de treino (metas de dia de treino). Se o dia terminar sem treino iniciado, o histórico registra o plano como "treino não realizado" (sem recálculo retroativo).
- **Treino concluído antecipadamente**: Ao marcar o treino como concluído, a refeição pós-treino deve ser destacada como "Ação recomendada imediata" com temporizador de janela de recuperação.
- **Alimentos proibidos por intolerância (Lactose)**: Nenhuma refeição sugerida, receita ou substituição automática pode conter derivados lácteos com lactose sem a indicação explícita "zero lactose" ou alternativa vegetal equivalente.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE carregar e interpretar os marcadores genéticos de nutrição e performance a partir de `data/genetics/genera.json` (ou endpoint de perfil genético existente na API).
- **FR-002**: O sistema DEVE calcular as metas do dia (calorias, proteínas, carboidratos, gorduras) **derivando-as das metas-base da fase de dieta ativa**, distribuídas conforme o treino do dia (volume, grupamentos musculares, dia de descanso).
- **FR-014**: O usuário DEVE poder iniciar uma fase de dieta com objetivo e duração próprios (independentes do mesociclo). As metas-base DEVEM ser calculadas por fórmula a partir de peso, altura, idade, sexo, nível de atividade (vindo do treino), objetivo e marcadores genéticos; proteína por kg de peso.
- **FR-015**: A cada novo check-in corporal durante uma fase ativa, o sistema DEVE recalibrar as metas-base por regra determinística, comparando a evolução real (peso, cintura e % de gordura quando houver) com a esperada para o objetivo, e registrar a recalibração (antes, depois, motivo).
- **FR-016**: O % de gordura DEVE ser estimado pelo método da Marinha dos EUA com fita métrica (cintura, pescoço e altura; quadril para mulheres). O check-in DEVE ganhar o campo pescoço; o perfil DEVE ganhar altura, data de nascimento e sexo. Sem as medidas necessárias, o % de gordura fica ausente e nada é bloqueado.
- **FR-003**: O sistema DEVE discriminar dias de treino vs. dias de descanso, adaptando a partição de carboidratos conforme a predisposição genética do usuário (FTO T,T favorável a menor carboidrato em repouso).
- **FR-002a**: As refeições do dia DEVEM ser montadas por regra determinística a partir de um catálogo próprio de alimentos (cada item com porção de referência, macros e tags genéticas como "sem lactose", "rico em B6", "cálcio não lácteo"). A IA NÃO gera o plano do dia; o mesmo dia, treino, cansaço e perfil produzem sempre o mesmo plano.
- **FR-004**: O sistema DEVE estruturar o timing das refeições em torno do treino: refeição pré-treino (com tempo de digestão sugerido) e pós-treino imediato/refeição sólida seguinte. Não existe horário de treino agendado: antes do início, o pré-treino é exibido como orientação relativa ("60–90 min antes de treinar") e as demais refeições sem âncora no treino; quando o treino ativo começa, o horário real de início ancora as janelas e o pós-treino passa a mostrar hora no relógio (calculada a partir da conclusão, quando houver).
- **FR-005**: O sistema DEVE filtrar e excluir estritamente fontes de lactose das sugestões padrão em conformidade com o marcador MCM6 G,G.
- **FR-006**: O sistema DEVE destacar recomendações preventivas para os micronutrientes identificados com risco de insuficiência no laudo genético: Vitamina D (GC A,C) e Vitamina B6 (ALPL A,G), além de aporte de cálcio não lácteo para proteção óssea (WNT16 C,T).
- **FR-007 / FR-008 / FR-009**: *(movidos para a 022 — chat e contexto do Agente de Nutrição Genética.)*
- **FR-010**: O usuário DEVE poder solicitar substituições de alimentos em uma refeição por botão de troca rápida, mantendo a equivalência de macronutrientes e a conformidade genética. A troca rápida escolhe alternativas do catálogo (mesmo grupo, macros equivalentes, mesmas restrições). Substituições sugeridas em conversa ficam com a 022.
- **FR-011**: O sistema DEVE integrar com o status de cansaço do dia (Spec 011). Caso o cansaço esteja marcado como "cansado" ou "exausto", o plano do dia deve exibir alerta e sugestões de hidratação e micronutrientes para restauração.
- **FR-012**: As diretrizes calculadas DEVEM ser persistidas por dia, para consulta do histórico. (A persistência da conversa passou para a 022.)
- **FR-017**: *(movido para a 022.)*
- **FR-013**: A interface DEVE seguir o design system unificado do Helux (Spec 012), mantendo suporte completo a tema escuro, tipografia e componentes visuais do app.

### Key Entities

- **FoodItem** (catálogo): alimento com nome, grupo (proteína, carboidrato, gordura, fruta/vegetal, bebida), porção de referência, macros por porção e tags genéticas/restrições (contém lactose, rico em B6, fonte de cálcio não láctea, fonte de vitamina D, cafeína etc.).
- **GeneticNutritionProfile**: Perfil nutrigenômico processado do usuário (marcadores de sensibilidade alimentar, absorção de vitaminas, eficiência de dietas, tolerância à cafeína e densidade óssea).
- **DietPhase**: fase de dieta do usuário — objetivo, início, duração, metas-base (calorias, macros), estado (ativa/encerrada) e histórico de recalibrações (check-in de origem, metas antes/depois, motivo).
- **DailyNutritionPlan**: visão do dia **derivada da fase ativa** — data, treino do dia (se houver), metas do dia, hidratação alvo e refeições sugeridas; persistida para consulta do histórico.
- **NutritionMeal**: Refeição planejada (tipo: café da manhã, pré-treino, pós-treino, almoço, jantar, ceia, lanche), horário sugerido, relação de alimentos com porções, macros calculados e tags genéticas (ex.: "Sem Lactose", "Rico em B6").
- **RecoveryNutritionAdjustment**: Modificadores nutricionais aplicados quando o sinal de cansaço da Spec 011 for ativado (eletrólitos, antioxidantes, hidratação adicional).

---

## 5. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O tempo de carregamento inicial e cálculo das diretrizes diárias integradas ao treino deve ser inferior a 1,5 segundos.
- **SC-002**: 100% das refeições e sugestões geradas automaticamente devem obedecer às restrições genéticas absolutas (zero lactose para perfil MCM6 G,G).
- **SC-003**: *(movido para a 022.)*
- **SC-004**: Ao alternar o treino do dia (ou sinal de cansaço), as diretrizes de timing e macros devem refletir a nova condição em até 1 segundo na interface.
- **SC-005**: *(movido para a 022.)*

---

## 6. Assumptions & Scope Boundaries

- **Dados Genéticos**: O arquivo `data/genetics/genera.json` serve como fonte de dados primária do perfil de Douglas Lopes. Não é escopo inicial implementar upload de raw data multi-formato de terceiros (o JSON estruturado existente é a fonte autoritativa).
- **Natureza das Recomendações**: As recomendações geradas pelo agente e pelo sistema têm caráter informativo e esportivo de suporte ao treinamento, incluindo disclaimer padrão de que não substituem acompanhamento médico ou nutricional presencial.
- **Controle de Ingestão (Log de calorias)**: O MVP foca em *prescrição, diretrizes dinâmicas e timing peri-treino* (a consultoria via agente está na 022), e não em diário calórico com pesagem de cada grama consumido pelo usuário (rastreador estilo MyFitnessPal fica para fase posterior).
- **Reaproveitamento de Componentes**: Utilização da estrutura de IA existente em `packages/ai`, do motor de treinos em `packages/workouts` e do design system unificado em `apps/web` e `apps/mobile`.
