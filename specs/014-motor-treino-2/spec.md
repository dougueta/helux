# Feature Specification: Motor de Geração de Treino 2.0

**Feature Branch**: `014-motor-treino-2`
**Created**: 2026-09-27
**Status**: Draft
**Input**: User description: "Motor de geração de treino 2.0: (1) o plano gerado (mesociclo) passa a ter 3 fases por sessão — aquecimento, treino principal e volta à calma/alongamento/cardio — com conteúdo sugerido pela IA (schema ganha campo de fase); (2) suporte a biset/superset com agrupamento explícito no schema e UI do treino ativo alternando entre os dois exercícios sem descanso entre eles; (3) progressão automática de carga entre mesociclos: o próximo mesociclo lê o desempenho do anterior (cargas atingidas, reps, esforço relatado, variante executada, exercícios pulados) e decide a progressão com lógica determinística e testável (não delegada só ao LLM) — cálculo inteligente e sustentável de quantos kg adicionar dada a percepção e capacidade do usuário. Objetivo do usuário: treino 100% personalizado e adaptável. Planos antigos devem continuar funcionando. Não implementar descanso personalizado (spec 015), mas não bloqueá-lo."

**Relação com specs anteriores**: estende o mesociclo das specs 006/007/008 (geração, exibição e avanço de sessões), mantém o ajuste do dia por cansaço da spec 011 (que passa a valer só para o treino principal), usa a variante executada gravada no histórico (spec 010) e o registro de exercícios pulados (spec 009), e segue o Design System v2 (spec 012). O descanso personalizado entre séries (spec 015) fica fora do escopo, mas o tempo de descanso passa a ser decidido num ponto único para que a 015 possa substituí-lo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Treino do dia em 3 fases: aquecimento, principal e volta à calma (Priority: P1)

Cada sessão do mesociclo gerado passa a ter três fases: **aquecimento** (mobilidade, cardio leve, séries de preparação), **treino principal** (os exercícios de musculação, como hoje) e **volta à calma** (alongamento, cardio leve ou mobilidade). O conteúdo do aquecimento e da volta à calma é sugerido pela IA de acordo com o foco da sessão e com o perfil do usuário (ex.: restrição de intensidade de cardio). O usuário vê as fases separadas na lista do treino e, no treino ativo, passa pelo aquecimento, depois pelo principal e termina na volta à calma. Itens de aquecimento e volta à calma são marcados como feitos com um toque, sem carga e sem descanso entre eles.

**Why this priority**: É a base estrutural do motor 2.0 (as outras histórias dependem de o plano ter blocos com tipo) e entrega sozinha um treino mais completo e seguro — hoje o plano só tem musculação.

**Independent Test**: Gerar um mesociclo (com a IA simulada) contendo as três fases, abrir Treinos e ver três seções; iniciar o treino, marcar os itens de aquecimento, fazer o principal, marcar a volta à calma e finalizar; verificar que o histórico salvo contém os exercícios do principal.

**Acceptance Scenarios**:

1. **Given** um mesociclo novo gerado com as três fases, **When** o usuário abre a lista do treino de hoje, **Then** vê os itens agrupados em "Aquecimento", "Treino principal" e "Volta à calma", nessa ordem.
2. **Given** o treino ativo num item de aquecimento, **When** o usuário marca o item como feito, **Then** não começa contagem de descanso e ele pode seguir para o próximo item.
3. **Given** o treino ativo, **When** o usuário está num item de qualquer fase, **Then** a tela indica a fase atual (aquecimento, musculação ou volta à calma).
4. **Given** o usuário concluiu o principal mas não marcou itens da volta à calma, **When** finaliza o treino, **Then** o treino é salvo sem pedir confirmação por causa dos itens de volta à calma/aquecimento não marcados (a confirmação de exercícios pulados vale só para o principal).
5. **Given** um usuário que está "cansado"/"exausto" no dia, **When** o treino do dia é ajustado (spec 011), **Then** só os exercícios do treino principal têm séries/carga reduzidas; aquecimento e volta à calma permanecem como planejados.
6. **Given** um mesociclo antigo, gravado antes desta feature, sem fases, **When** o usuário abre e executa o treino, **Then** tudo funciona como antes, com todos os exercícios tratados como treino principal.

---

### User Story 2 - Biset: dois exercícios alternados sem descanso entre eles (Priority: P2)

A IA pode agrupar dois exercícios consecutivos do treino principal em um **biset**. No treino ativo, o usuário faz a série 1 do primeiro exercício e o app leva direto (sem descanso) à série 1 do segundo; ao concluir essa série, começa o descanso e o app volta ao primeiro exercício para a série 2, e assim por diante. A lista do treino e a tela do treino ativo deixam claro quais exercícios formam o biset.

**Why this priority**: É um método de treino pedido explicitamente que economiza tempo e aumenta densidade; depende da estrutura de blocos (US1 não é pré-requisito técnico estrito, mas o biset só existe no treino principal).

**Independent Test**: Com um plano contendo um biset (A1/A2), iniciar o treino, concluir a série 1 de A1 e verificar que a tela passa para A2 sem descanso; concluir a série 1 de A2 e verificar que o descanso começa e a tela volta para A1.

**Acceptance Scenarios**:

1. **Given** um treino com os exercícios X e Y em biset, **When** o usuário vê a lista do treino, **Then** X e Y aparecem identificados como biset (ex.: marcador "Biset" e os dois juntos).
2. **Given** o treino ativo em X (primeiro do biset) com séries pendentes em Y, **When** o usuário conclui uma série de X, **Then** nenhum descanso é iniciado e a tela passa para Y.
3. **Given** o treino ativo em Y (segundo do biset), **When** o usuário conclui uma série de Y e X ainda tem séries pendentes, **Then** o descanso começa e a tela volta para X.
4. **Given** um biset em que o parceiro já tem todas as séries concluídas, **When** o usuário conclui uma série do outro exercício, **Then** o comportamento é o de um exercício comum (descanso normal, permanece no exercício).
5. **Given** o treino ativo num exercício de biset, **When** o usuário olha a tela, **Then** vê que o exercício faz parte de um biset e com qual exercício ele alterna.
6. **Given** a IA devolveu um agrupamento inválido (um só exercício no grupo, mais de dois, ou exercícios não consecutivos, ou fora do treino principal), **When** o plano é salvo, **Then** o agrupamento inválido é descartado e os exercícios ficam como exercícios comuns.

---

### User Story 3 - Progressão automática de carga entre mesociclos (Priority: P2)

Ao final de um mesociclo, o próximo é gerado já com as cargas ajustadas a partir do que o usuário realmente fez: carga usada, repetições atingidas em relação à faixa prescrita, séries completadas e o esforço que ele relatou. A decisão de quanto aumentar, manter ou reduzir é feita por uma regra fixa e previsível (não fica só a critério da IA): progride quando o usuário atingiu o topo da faixa de repetições com folga, aumenta menos quando chegou perto do limite, mantém quando ainda está dentro da faixa, e reduz quando não completou o prescrito e relatou esforço máximo. O aumento é sustentável: proporcional à carga, arredondado a incrementos reais de anilha/halter e com teto. Para relatar o esforço, o usuário pode indicar, em cada exercício do treino ativo, como foi (ex.: fácil, moderado, difícil, no limite). No novo plano, o usuário vê para cada exercício que progrediu a carga anterior, a nova e o motivo.

**Why this priority**: Responde diretamente à pergunta do usuário ("quantos kg adicionar de forma inteligente e sustentável") e fecha o ciclo "personalizado e adaptável"; depende de haver histórico de pelo menos um mesociclo.

**Independent Test**: Com um mesociclo anterior concluído e histórico em que o usuário fez 3×10 com 40 kg num exercício de faixa "8-10" relatando "moderado", gerar o próximo mesociclo (IA simulada mantendo o exercício) e verificar que a carga prescrita passa a ser maior que 40 kg, com o motivo exibido; repetir com "no limite" e 3×6 e verificar que a carga é reduzida.

**Acceptance Scenarios**:

1. **Given** o usuário completou todas as séries no topo da faixa de repetições relatando esforço fácil ou moderado, **When** o próximo mesociclo é gerado e mantém o exercício, **Then** a carga prescrita aumenta (mais para "fácil" do que para "moderado"), arredondada a um incremento realista.
2. **Given** o usuário completou as séries dentro da faixa, sem atingir o topo, **When** o próximo mesociclo é gerado, **Then** a carga é mantida e o motivo indica buscar mais repetições.
3. **Given** o usuário atingiu o topo da faixa mas relatou esforço difícil/no limite, **When** o próximo mesociclo é gerado, **Then** a carga é mantida.
4. **Given** o usuário não completou as séries ou ficou abaixo da faixa relatando esforço no limite, **When** o próximo mesociclo é gerado, **Then** a carga é reduzida.
5. **Given** o usuário executou o exercício com uma variante alternativa, pulou o exercício, ou o exercício é de peso corporal/sem carga numérica, **When** o próximo mesociclo é gerado, **Then** não há progressão calculada para esse exercício e a carga fica a critério da geração normal.
6. **Given** o usuário não relatou esforço num exercício, **When** a progressão é calculada, **Then** o esforço é tratado como moderado (o padrão atual do histórico).
7. **Given** o novo mesociclo com cargas progredidas, **When** o usuário abre a lista do treino, **Then** vê em cada exercício progredido a variação (ex.: "+2,5 kg") e pode ver o motivo.
8. **Given** o primeiro mesociclo de um usuário (sem mesociclo anterior), **When** ele é gerado, **Then** nenhuma progressão é aplicada e nada muda em relação ao comportamento atual.

---

### Edge Cases

- A IA não devolve nenhuma fase: todos os exercícios são tratados como treino principal.
- A IA devolve fases fora de ordem: os itens são reordenados para aquecimento → principal → volta à calma, preservando a ordem relativa dentro de cada fase.
- A IA devolve um valor de fase desconhecido: o item é tratado como treino principal.
- A sessão só tem aquecimento/volta à calma e nenhum exercício principal: o plano ainda é exibido; o treino pode ser iniciado e finalizado (histórico sem exercícios de musculação não é enviado como exercício pulado).
- Itens de aquecimento/volta à calma com nomes fora do catálogo de exercícios: são aceitos (o catálogo restringe apenas o treino principal) e não mostram variantes nem "fit" genético.
- Biset cujos dois exercícios têm número de séries diferente: a alternância acontece enquanto os dois têm séries pendentes; depois, o que sobrar segue como exercício comum.
- Usuário pula manualmente para outro exercício no meio de um biset: a navegação manual continua permitida.
- Usuário desmarca uma série concluída de um exercício de biset: nenhuma navegação automática acontece.
- Ajuste de cansaço do dia sobre carga progredida: o ajuste do dia (spec 011) é aplicado sobre a carga já progredida do mesociclo.
- Mesmo exercício aparece em mais de uma sessão do mesociclo anterior: a progressão usa a execução mais recente.
- Histórico com cargas diferentes entre séries (pirâmide): a referência é a maior carga efetivamente concluída.
- Faixa de repetições não numérica (ex.: "30s", "até a falha"): sem progressão calculada.
- Treino ativo salvo no aparelho antes da atualização (formato antigo): continua abrindo e finalizando normalmente.

## Requirements *(mandatory)*

### Functional Requirements

**Fases (US1)**

- **FR-001**: Cada item de uma sessão do plano MUST poder ter uma fase: aquecimento, principal ou volta à calma. Itens sem fase (planos antigos ou resposta incompleta da IA) MUST ser tratados como principal.
- **FR-002**: A geração do mesociclo MUST pedir à IA aquecimento e volta à calma em cada sessão, coerentes com o foco da sessão, o nível de risco cardiovascular/limite de intensidade de cardio e os alertas do usuário. O catálogo de exercícios MUST continuar restringindo apenas os exercícios do principal.
- **FR-003**: Ao salvar um plano gerado, o sistema MUST normalizar as fases: valor desconhecido vira principal e os itens ficam ordenados aquecimento → principal → volta à calma (ordem relativa preservada dentro de cada fase).
- **FR-004**: A lista do treino do dia (Treinos) MUST mostrar os itens agrupados por fase quando houver mais de uma fase; planos só com principal MUST aparecer como hoje.
- **FR-005**: No treino ativo, o usuário MUST ver a fase do item atual; itens de aquecimento e volta à calma MUST ser concluídos com um toque (sem carga/repetições editáveis) e MUST NOT iniciar descanso.
- **FR-006**: O histórico salvo ao finalizar o treino MUST conter apenas os exercícios do principal; a confirmação de exercícios pulados (spec 009) MUST considerar apenas o principal.
- **FR-007**: O ajuste do dia por cansaço (spec 011) MUST ser aplicado apenas aos exercícios do principal, e o resumo de mudanças MUST refletir isso.

**Biset (US2)**

- **FR-008**: Um exercício do principal MUST poder declarar um agrupamento de biset; um biset válido tem exatamente dois exercícios consecutivos do principal com o mesmo agrupamento.
- **FR-009**: Ao salvar um plano gerado, agrupamentos inválidos (um só membro, mais de dois, não consecutivos, fora do principal) MUST ser descartados.
- **FR-010**: A geração do mesociclo MUST permitir à IA propor bisets (no máximo dois por sessão), com orientação para pares adequados (ex.: antagonistas ou exercícios que não disputam o mesmo equipamento).
- **FR-011**: No treino ativo, ao concluir uma série do primeiro exercício do biset, se o segundo tiver séries pendentes, o sistema MUST levar ao segundo sem descanso; ao concluir uma série do segundo, se o primeiro tiver séries pendentes, MUST iniciar o descanso e levar de volta ao primeiro. Quando o parceiro não tem séries pendentes, MUST valer o comportamento de exercício comum.
- **FR-012**: A lista do treino e a tela do treino ativo MUST identificar os exercícios em biset e, no treino ativo, com qual exercício o atual alterna.
- **FR-013**: O tempo de descanso após cada série MUST ser decidido num ponto único (regra de descanso) que recebe o item e a posição no treino, para que a spec 015 possa personalizá-lo sem mudar o fluxo do biset.

**Progressão de carga (US3)**

- **FR-014**: No treino ativo, o usuário MUST poder relatar o esforço percebido de cada exercício do principal, em 4 níveis (fácil, moderado, difícil, no limite), gravado no histórico junto às séries. Sem relato, MUST ser gravado o valor padrão atual (equivalente a moderado).
- **FR-015**: Quando um novo mesociclo é gerado a partir de um mesociclo anterior concluído, o sistema MUST calcular, por regra determinística, uma decisão de progressão para cada exercício do principal do mesociclo anterior com dados comparáveis: aumentar, manter, reduzir ou sem dados, com carga anterior, carga nova e motivo legível.
- **FR-016**: A regra MUST considerar: maior carga concluída, repetições atingidas nessa carga em relação à faixa prescrita, séries concluídas em relação às prescritas, esforço relatado e nível de experiência do usuário. Execuções com variante alternativa, exercícios pulados, exercícios sem carga numérica e faixas não numéricas MUST resultar em "sem dados".
- **FR-017**: O aumento MUST ser proporcional à carga (maior com esforço fácil do que moderado, maior para iniciantes do que para avançados), arredondado ao incremento mínimo realista para a faixa de carga, com teto de 10% da carga anterior por mesociclo; a redução MUST ser de cerca de 10%, arredondada da mesma forma.
- **FR-018**: As decisões de progressão MUST ser informadas à IA na geração e MUST ser aplicadas deterministicamente depois da geração: todo exercício do principal do novo mesociclo que tenha decisão com carga nova MUST receber essa carga, independentemente do que a IA sugeriu.
- **FR-019**: Cada exercício com progressão aplicada MUST guardar a decisão (carga anterior, nova, tipo e motivo) no plano, e a lista do treino MUST exibir a variação de carga e permitir ver o motivo.
- **FR-020**: O primeiro mesociclo de um usuário e a geração manual avulsa ("Gerar novo plano") MUST NOT aplicar progressão.

**Compatibilidade**

- **FR-021**: Planos já gravados (sem fases, sem biset, sem progressão), treinos ativos salvos no aparelho no formato antigo e o histórico existente MUST continuar funcionando sem migração de dados.
- **FR-022**: As telas novas/alteradas MUST usar apenas os componentes e classes do Design System v2.

### Key Entities *(include if feature involves data)*

- **Item do plano (exercício planejado)**: passa a ter fase (aquecimento/principal/volta à calma, padrão principal), agrupamento de biset opcional e decisão de progressão opcional. Continua com nome, séries, repetições, carga e observações.
- **Decisão de progressão**: por exercício — tipo (aumentar/manter/reduzir/sem dados), carga anterior, carga nova, motivo.
- **Execução registrada (histórico)**: séries com carga, repetições e esforço (agora relatado pelo usuário), variante executada e pulado — sem mudança de formato.
- **Mesociclo**: continua com sessões ordenadas; o próximo mesociclo é gerado a partir do anterior concluído e do histórico desde a geração dele.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das sessões dos mesociclos novos em que a IA devolve as três fases são exibidas com aquecimento, principal e volta à calma separados e na ordem correta.
- **SC-002**: Em um biset, o usuário completa todas as séries dos dois exercícios sem precisar navegar manualmente entre eles nenhuma vez.
- **SC-003**: Para o mesmo histórico de entrada, a decisão de progressão é sempre a mesma (100% reprodutível) e nenhum aumento ultrapassa 10% da carga anterior.
- **SC-004**: Em 100% dos exercícios com decisão de progressão mantidos no novo mesociclo, a carga prescrita é a da decisão, mesmo que a IA sugira outra.
- **SC-005**: 100% dos planos e treinos ativos gravados antes da feature continuam abrindo, executando e salvando no histórico sem erro.
- **SC-006**: O relato de esforço de um exercício leva no máximo um toque.

## Assumptions

- Itens de aquecimento e volta à calma não são gravados no histórico (o histórico e as análises continuam focados em musculação); isso pode ser revisto em outra spec.
- O esforço relatado usa 4 níveis mapeados na escala de esforço já existente no histórico (1–10): fácil = 6, moderado = 7, difícil = 9, no limite = 10; sem relato = 8 (valor já gravado hoje), que a regra de progressão trata como moderado (faixa 7–8).
- Incrementos mínimos realistas: 1 kg para cargas abaixo de 20 kg, 2 kg entre 20 e 60 kg e 2,5 kg a partir de 60 kg.
- A progressão só é calculada na geração automática do próximo mesociclo (ao concluir o anterior); a geração avulsa pelo botão "Gerar novo plano" continua como está (lacuna já conhecida da spec 006).
- O tempo de descanso padrão continua fixo (90 s) nesta spec; a personalização é da spec 015.
- Não há mudança de estrutura no banco: os campos novos vivem dentro do plano já armazenado como documento.
- O catálogo de exercícios é mantido pela spec 013; esta spec não altera o catálogo nem as variantes.
