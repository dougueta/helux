# Feature Specification: Banco de exercícios coerente com demonstração de execução para todos

**Feature Branch**: `028-banco-exercicios-demonstracao`  
**Created**: 2026-11-04  
**Status**: Draft  
**Input**: User description: "Banco de exercícios mais coerente, com detalhes de execução mais assertivos e, principalmente, demonstração visual (SVG/GIF) de como executar. Hoje alguns exercícios têm animação e outros não; a animação deve cobrir todos os exercícios do banco, incluindo as variantes, e o processo deve garantir que exercícios futuros também nasçam com demonstração. Definir qual é a melhor maneira de fazer isso de forma sustentável."

## Contexto: situação atual medida *(2026-11-04)*

O banco tem 122 exercícios de força e 30 animações. A spec 013 mediu cobertura por categoria de movimento, por isso a medição atual indica 0% de animação incorreta mesmo quando o desenho não representa o exercício.

| Problema | Evidência |
|----------|-----------|
| A animação representa a categoria, não o exercício | Só 6 dos 122 exercícios têm animação exclusiva. Pullover mostra uma puxada, Cadeira Adutora mostra uma abdução (movimento oposto), Flexão Pike e Handstand Push-up mostram um desenvolvimento em pé, Mesa Flexora mostra a pessoa sentada, Russian Twist mostra uma rotação em pé no cabo |
| O equipamento desenhado pode estar errado | Máquina e cabo são tratados como a mesma coisa, então máquinas como Leg Press e Peck Deck são desenhadas com cabo |
| Variantes de outro músculo | 60 dos 122 exercícios têm ao menos uma variante de outro grupo muscular principal. Exemplo: Rosca Direta (Barra) oferece Cadeira Extensora, Crucifixo e Mergulho no Banco. Parte dos casos é aceitável (glúteo e posterior), mas nos isolamentos não é |
| Variante sem demonstração antes da troca | A aba "Variantes" lista apenas nome e etiquetas; a demonstração só aparece depois de trocar |
| Variante sem orientação de execução | Ao ativar uma variante alternativa, a lista de passos fica vazia, e os músculos e a cadência continuam os do exercício planejado |
| Telas sem demonstração | Itens de aquecimento, volta à calma, cardio e mobilidade não têm demonstração. Um exercício principal fora do banco fica sem variantes e, portanto, sem o acesso à execução |
| Itens sem catálogo | Aquecimento, volta à calma e mobilidade têm nome livre, escrito pela IA a cada plano, e por isso não há a que vincular uma demonstração. O cardio tem catálogo de 11 modalidades, sem demonstração nem orientação |
| Animação errada como último recurso | Um movimento desconhecido é mostrado como supino reto |
| Mapa muscular impreciso | Glúteo, posterior de coxa e panturrilha aparecem como quadríceps. Mesa Flexora, por exemplo, destaca o quadríceps |
| Orientações sem padrão | Apenas 46 dos 122 exercícios têm o "erro comum"; 28 orientações são frases de recomendação ("Boa opção para…"), não instruções de execução |

## Clarifications

### Session 2026-11-04

- Q: Qual formato usar nas demonstrações? → A: Manter o modelo atual de figura animada, de que o dono do produto gosta por mostrar bem a mecânica e a posição do corpo, e melhorar o movimento para ficar mais completo.
- Q: A cobertura inclui aquecimento, volta à calma, mobilidade e cardio? → A: Sim, tudo o que aparece no treino, nesta entrega.
- Q: O que aparece no app enquanto um item ainda não foi aprovado? → A: Publicação por etapas: cada demonstração nova aparece ao ser aprovada e, até lá, o item mantém o que tem hoje, inclusive uma animação imprecisa.
- Q: Como as demonstrações são validadas? → A: Por PR, sob demanda: cada demonstração nova ou alterada é renderizada automaticamente na resolução de celular e anexada ao PR, e o dono do produto aprova no próprio PR. Como um print não mostra movimento, a evidência inclui os quadros principais e a animação.
- Q: As variantes corrigidas valem para planos já existentes? → A: Sim. Planos existentes passam a mostrar a lista corrigida, e uma variante já ativada continua valendo mesmo que não esteja mais nela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver como executar qualquer exercício (Priority: P1)

Durante o treino, a pessoa abre a execução de qualquer exercício do banco e vê uma demonstração que corresponde àquele exercício: posição do corpo, equipamento, trajetória e amplitude reais, de modo que consiga reproduzir o movimento sem pesquisar fora do app.

**Why this priority**: É o pedido principal. A demonstração evita execução incorreta e dá confiança para treinar sozinho.

**Independent Test**: Revisar a evidência visual dos PRs (US5) e confirmar que cada demonstração é reconhecível como o exercício nomeado.

**Acceptance Scenarios**:

1. **Given** um exercício do banco no treino, **When** a pessoa abre a execução, **Then** vê a demonstração daquele exercício, com o equipamento correto.
2. **Given** dois exercícios com execução visivelmente diferente (ex.: Pullover e Puxada Alta; Cadeira Abdutora e Cadeira Adutora), **When** a pessoa compara as demonstrações, **Then** consegue distinguir os movimentos.
3. **Given** dois exercícios que diferem em um detalhe difícil de ver na demonstração (ex.: tipo de pegada), **When** a pessoa abre a execução, **Then** esse detalhe aparece destacado em legenda.
4. **Given** um plano gerado antes desta funcionalidade, **When** a pessoa abre um exercício, **Then** vê a demonstração atual do exercício, sem precisar gerar um novo plano.
5. **Given** um item sem demonstração disponível (ex.: nome fora do banco em um plano antigo), **When** a pessoa abre a execução, **Then** vê um aviso claro de indisponibilidade, nunca a animação de outro exercício.
6. **Given** a preferência de movimento reduzido ativa no dispositivo, **When** a pessoa abre a execução, **Then** vê a demonstração parada em uma posição representativa, sem animação contínua.

---

### User Story 6 - Ver como fazer tudo o que está no treino (Priority: P2)

No aquecimento, na volta à calma, na mobilidade e no cardio, a pessoa também abre a execução do item e vê a demonstração e as orientações, com o mesmo modelo visual dos exercícios de força.

**Why this priority**: O dono do produto pediu cobertura total. Hoje esses itens só mostram um nome e uma duração, e é neles que a pessoa fica sem saber o que fazer quando o nome é pouco conhecido.

**Independent Test**: Gerar um plano novo e abrir cada item de aquecimento, volta à calma, mobilidade e cardio, confirmando que todos têm demonstração e orientações.

**Acceptance Scenarios**:

1. **Given** um item de aquecimento, volta à calma ou mobilidade em um plano novo, **When** a pessoa abre a execução, **Then** vê a demonstração e as orientações daquele item.
2. **Given** um plano novo sendo gerado, **When** a IA monta aquecimento, volta à calma e mobilidade, **Then** todos os itens vêm do catálogo, com a duração ou as repetições ajustadas ao plano.
3. **Given** uma modalidade de cardio no treino, **When** a pessoa abre a execução, **Then** vê a demonstração da modalidade e orientações de postura e de como manter a intensidade pedida.
4. **Given** uma série de aproximação de um exercício de força no aquecimento, **When** a pessoa abre a execução, **Then** vê a demonstração desse exercício, com a indicação de que é uma série leve de preparação.
5. **Given** um item de nome livre em um plano antigo, **When** ele corresponde com segurança a um item do catálogo, **Then** a demonstração é exibida; **When** não corresponde, **Then** aparece o aviso de indisponibilidade.

---

### User Story 2 - Conhecer a variante antes de trocar (Priority: P2)

Na lista de variantes, a pessoa vê a demonstração e a orientação de execução de cada opção antes de decidir. Depois da troca, toda a tela reflete a variante ativa.

**Why this priority**: O pedido cita as variantes de forma explícita. Hoje é preciso trocar o exercício para ver como ele é feito, e a orientação não aparece mesmo depois da troca.

**Independent Test**: Abrir a aba de variantes de um exercício, visualizar a demonstração de uma alternativa sem trocar e confirmar que o exercício atual continua o mesmo; depois trocar e conferir os dados exibidos.

**Acceptance Scenarios**:

1. **Given** a lista de variantes, **When** a pessoa pede para ver uma alternativa, **Then** vê a demonstração e as orientações dela, sem alterar o treino.
2. **Given** a pré-visualização de uma variante, **When** a pessoa desiste, **Then** o exercício atual permanece inalterado.
3. **Given** uma variante ativada, **When** a pessoa abre a execução, **Then** demonstração, orientações, músculos, cadência e equipamento são os da variante.
4. **Given** um exercício sinalizado como "Equivalente" (spec 013), **When** a pessoa o visualiza, **Then** ele tem o mesmo nível de demonstração e detalhe das demais variantes.

---

### User Story 3 - Confiar nas alternativas e nos dados do banco (Priority: P3)

As variantes oferecidas fazem sentido para o objetivo do exercício, e músculos e equipamento correspondem ao que a pessoa vê e faz.

**Why this priority**: Uma demonstração correta perde valor se o app sugere trocar uma rosca por uma cadeira extensora.

**Independent Test**: Executar a verificação de coerência sobre todo o banco e revisar as variantes dos exercícios de isolamento.

**Acceptance Scenarios**:

1. **Given** um exercício de isolamento, **When** a pessoa abre as variantes, **Then** todas trabalham o mesmo músculo principal.
2. **Given** um exercício sem alternativas coerentes para um equipamento, **When** as variantes são montadas, **Then** a lista fica menor, sem preencher com um exercício de outro músculo.
3. **Given** um exercício de posterior de coxa, glúteo ou panturrilha, **When** a pessoa vê os músculos trabalhados, **Then** a região destacada é a realmente trabalhada.
4. **Given** um exercício em máquina ou em cabo, **When** a pessoa vê a etiqueta e a demonstração, **Then** o equipamento informado é o correto.

---

### User Story 4 - Receber instruções objetivas de execução (Priority: P4)

Cada exercício apresenta a execução na mesma estrutura: como se posicionar, como executar, o que sentir ou controlar, e o erro mais comum, em frases curtas que possam ser lidas entre as séries.

**Why this priority**: Complementa a demonstração com o que uma imagem não mostra, como pontos de atenção e sensação muscular.

**Independent Test**: Verificar que todos os exercícios têm os campos obrigatórios e revisar uma amostra por padrão de movimento.

**Acceptance Scenarios**:

1. **Given** qualquer exercício do banco, **When** a pessoa abre a execução, **Then** encontra posição inicial, execução e erro comum.
2. **Given** as orientações de um exercício, **When** a pessoa as lê, **Then** cada item descreve uma ação ou um ponto de atenção, não uma recomendação genérica sobre o exercício.
3. **Given** uma informação de contexto útil (ex.: "boa opção quando não há barra"), **When** ela é mantida, **Then** aparece separada dos passos de execução.

---

### User Story 5 - Garantir que exercícios novos nasçam completos (Priority: P5)

Quem mantém o banco adiciona um exercício seguindo um único caminho, e o projeto impede a publicação se faltar demonstração, orientação ou dado obrigatório. Cada PR traz a evidência visual do que mudou, e o dono do produto aprova ali, sob demanda, sem precisar rodar o projeto.

**Why this priority**: Responde à pergunta sobre os próximos exercícios. Sem essa trava, as lacunas voltam a aparecer aos poucos.

**Independent Test**: Adicionar um exercício de teste sem demonstração e confirmar que a verificação do projeto falha, apontando o que falta; completar os dados e confirmar que passa.

**Acceptance Scenarios**:

1. **Given** um exercício novo sem demonstração, **When** a verificação do projeto roda, **Then** ela falha e informa o exercício e o item faltante.
2. **Given** um exercício novo com demonstração ainda não aprovada, **When** a verificação do projeto roda, **Then** ela falha até a aprovação ser registrada.
3. **Given** um PR com demonstrações novas ou alteradas, **When** o dono do produto o abre, **Then** vê, para cada uma, o nome do item, os quadros principais, a animação na resolução de celular e as orientações de execução, sem precisar rodar o projeto.
4. **Given** uma demonstração aprovada que foi alterada, **When** a verificação do projeto roda, **Then** ela volta a exigir aprovação.

---

### Edge Cases

- Exercícios que só se diferenciam pelo equipamento (ex.: Rosca Direta com barra e com halteres) podem reaproveitar o mesmo movimento, desde que o equipamento desenhado seja o de cada um.
- Exercícios unilaterais ou alternados (ex.: Rosca Alternada, Remada Unilateral) mostram um lado por vez, não os dois lados juntos.
- Exercícios isométricos (ex.: Prancha, Hollow Hold) mostram a posição sustentada e indicam a sustentação, sem sugerir repetições.
- Movimentos com fases (ex.: Rosca 21, Desenvolvimento Arnold) mostram as fases principais ou explicam em legenda o que a demonstração não cobre.
- Um exercício removido ou renomeado no banco não pode quebrar planos nem históricos existentes.
- A demonstração deve continuar legível nos temas do app e na miniatura da tela de treino.
- A demonstração deve continuar disponível com conexão instável durante o treino.
- Alongamentos e posições sustentadas mostram a posição final e indicam o tempo de sustentação.
- Itens feitos por lado (ex.: "10 por lado") mostram um lado e indicam a troca.
- O Circuito com o peso do corpo reúne vários movimentos e mostra a sequência, ou cada movimento do circuito, em vez de um único gesto.
- Modalidades cíclicas (ex.: bike, remo, natação, corrida) mostram um ciclo contínuo do movimento, sem início e fim de repetição.
- Se a IA propuser um item fora do catálogo ao gerar o plano, ele é corrigido antes de chegar à pessoa, sem deixar o plano incompleto.

## Requirements *(mandatory)*

### Functional Requirements

**Demonstração**

- **FR-001**: Todo exercício do banco DEVE ter uma demonstração própria que represente seu movimento real: posição do corpo, equipamento, trajetória e amplitude.
- **FR-002**: As demonstrações DEVEM manter o modelo visual atual: figura articulada animada própria, que evidencia a mecânica do movimento e a posição do corpo. GIF ou vídeo de terceiros não serão usados.
- **FR-002a**: O movimento DEVE ficar mais completo que o atual sempre que isso ajudar a entender o exercício, mostrando as articulações envolvidas, as fases do movimento e a trajetória real do corpo e do equipamento, sem descaracterizar o modelo visual.
- **FR-003**: Exercícios PODEM reaproveitar o mesmo movimento base somente quando a diferença entre eles for mostrada ou descrita em legenda (equipamento, pegada, apoio, base dos pés ou amplitude).
- **FR-004**: A demonstração DEVE ser vinculada à identidade do exercício, e não deduzida do nome ou da categoria.
- **FR-005**: Os planos existentes DEVEM exibir a demonstração atual de cada exercício, sem depender de uma nova geração do plano.
- **FR-006**: Quando não houver demonstração, o sistema DEVE informar a indisponibilidade e NÃO DEVE exibir a animação de outro exercício. A única exceção é a transição descrita na FR-032, enquanto a cobertura não termina.
- **FR-007**: A demonstração DEVE oferecer pausar e repetir, e respeitar a preferência de movimento reduzido.
- **FR-008**: As demonstrações DEVEM seguir o Design System do app e permanecer legíveis nos temas e tamanhos em que são exibidas.
- **FR-009**: A obrigatoriedade de demonstração e de orientação DEVE valer para tudo o que aparece no treino: exercícios de força, aquecimento, volta à calma, mobilidade e cardio.

**Aquecimento, volta à calma, mobilidade e cardio**

- **FR-026**: DEVE existir um catálogo de itens de aquecimento, volta à calma e mobilidade, com identidade estável, região trabalhada, demonstração e orientação, cobrindo as regiões que os planos usam.
- **FR-027**: A geração de planos DEVE usar somente itens desse catálogo, mantendo a liberdade de ajustar duração, repetições e ordem. Item fora do catálogo DEVE ser corrigido antes de o plano ser entregue.
- **FR-028**: As regras de saúde e de segurança articular já aplicadas a esses itens DEVEM continuar valendo com o catálogo, e o catálogo NÃO DEVE reduzir a capacidade de prescrever mobilidade para uma condição de saúde da pessoa.
- **FR-029**: Cada modalidade do catálogo de cardio DEVE ter demonstração e orientação, incluindo postura e como manter a zona de intensidade prescrita.
- **FR-030**: Séries de aproximação DEVEM usar a demonstração do exercício de força correspondente, indicando que são séries leves de preparação.
- **FR-031**: Itens de nome livre em planos existentes DEVEM mostrar a demonstração apenas quando corresponderem com segurança a um item do catálogo. Caso contrário, vale o aviso de indisponibilidade (FR-006).

**Variantes**

- **FR-010**: A pessoa DEVE poder ver a demonstração e as orientações de cada variante antes de trocar, sem alterar o treino.
- **FR-011**: Com uma variante ativa, a tela de execução DEVE exibir demonstração, orientações, músculos, cadência e equipamento dessa variante.
- **FR-012**: As variantes de um exercício DEVEM ter o mesmo padrão de movimento e a mesma função muscular principal, com grupos afins definidos de forma explícita. Os equivalentes da spec 013 continuam permitidos, com a etiqueta "Equivalente".
- **FR-013**: O sistema NÃO DEVE preencher a lista de variantes com um exercício incoerente para completar a quantidade.
- **FR-035**: Planos existentes DEVEM exibir a lista de variantes corrigida, sem nova geração do plano. Uma variante já ativada DEVE continuar valendo e visível como atual, mesmo que não esteja mais na lista, e o histórico NÃO DEVE ser alterado.

**Coerência dos dados**

- **FR-014**: Cada exercício DEVE informar seu equipamento real, distinguindo máquina de cabo, em etiqueta e demonstração.
- **FR-015**: Cada exercício DEVE indicar os músculos realmente trabalhados, e o mapa muscular DEVE destacar a região correta, incluindo glúteo, posterior de coxa, panturrilha e adutores.
- **FR-016**: O banco DEVE ser revisado para corrigir classificações incoerentes de padrão de movimento, grupo muscular e equipamento, mantendo um registro das alterações.
- **FR-017**: As correções do banco NÃO DEVEM quebrar planos, históricos, progressão de carga nem as regras de segurança articular da spec 013. Mudanças em dados de carga articular DEVEM ser justificadas.

**Orientações de execução**

- **FR-018**: Cada exercício DEVE ter orientações estruturadas com, no mínimo: posição inicial, execução e erro comum.
- **FR-019**: Os passos DEVEM ser frases curtas, no imperativo, com ação ou ponto de atenção específico do exercício. Informações de contexto DEVEM ficar separadas dos passos.
- **FR-020**: A orientação de execução DEVE ser a mesma para o exercício e para sua versão como variante. As observações personalizadas do plano permanecem como complemento.

**Sustentação**

- **FR-021**: A inclusão de exercício ou item DEVE seguir um caminho único e documentado por catálogo, em que ele já nasce com todos os dados obrigatórios. Um exercício de força também nasce disponível como variante.
- **FR-022**: A verificação automática do projeto DEVE falhar quando um exercício ou item de qualquer catálogo não tiver demonstração, orientação estruturada, dados obrigatórios do seu tipo ou aprovação registrada, informando o item e o que falta.
- **FR-023**: A medição de cobertura DEVE considerar o vínculo por exercício e por item, em todos os catálogos, substituindo a medição por categoria da spec 013.
- **FR-024**: DEVE existir uma galeria de revisão, fora de produção, com todos os exercícios e itens, a demonstração, as orientações e a situação de revisão. Ela é a base para gerar a evidência visual.
- **FR-025**: A aprovação DEVE ficar registrada por exercício no repositório, junto com o código, e voltar a ser exigida quando a demonstração mudar.
- **FR-033**: Todo PR com demonstração nova ou alterada DEVE trazer, gerada automaticamente na resolução de celular, a evidência de cada item: nome, quadros principais (início, meio e fim), animação e orientações de execução. Só é registrada a aprovação dos itens que o dono do produto aprovar no PR, e os demais continuam pendentes.
- **FR-034**: As demonstrações DEVEM poder ser enviadas para revisão em lotes pequenos, sob demanda, sem exigir a revisão do banco inteiro de uma vez.
- **FR-032**: A publicação DEVE ser feita por etapas: cada demonstração nova aparece ao ser aprovada e, até lá, o item mantém o que tem hoje. Itens existentes ainda não migrados ficam em uma lista de pendências dispensada da verificação da FR-022. Essa lista só pode diminuir, nenhum item novo pode entrar nela, e a funcionalidade só é concluída quando ela estiver vazia.

### Key Entities

- **Exercício**: Item do banco, com identidade estável, nome, padrão de movimento, função muscular, músculos trabalhados, equipamento real, carga articular e cadência. É a fonte única dos dados usados no treino e nas variantes.
- **Demonstração**: Representação visual da execução de um exercício, com movimento base (podendo ser compartilhado), equipamento, particularidades, legenda opcional e situação de revisão.
- **Orientação de execução**: Conteúdo estruturado do exercício: posição inicial, passos, erro comum e contexto opcional.
- **Revisão**: Registro de aprovação de uma versão da demonstração e das orientações de um exercício.
- **Item de preparação e mobilidade**: Item do novo catálogo, usado no aquecimento, na volta à calma e na mobilidade, com identidade estável, região trabalhada e forma de execução (repetições, por lado ou sustentação). O plano define só a dose.
- **Modalidade de cardio**: Item do catálogo de cardio já existente, que passa a ter demonstração e orientação, mantendo os dados de impacto e carga articular.
- **Variante**: Relação entre exercícios que cumprem a mesma função. Reutiliza demonstração e orientações do exercício relacionado e acrescenta compatibilidade e justificativa personalizadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos 122 exercícios atuais, e de todos os incluídos depois, têm demonstração própria aprovada na revisão visual.
- **SC-002**: 100% das variantes oferecidas podem ser visualizadas, com demonstração e orientações, sem alterar o treino.
- **SC-003**: 0 exercícios de isolamento oferecem variante de outra função muscular (hoje isso é comum, como na Rosca Direta).
- **SC-004**: 100% dos exercícios têm posição inicial, execução e erro comum (hoje 46 de 122 têm erro comum).
- **SC-005**: Um exercício novo sem demonstração, orientação ou aprovação é bloqueado em 100% das verificações do projeto.
- **SC-006**: Em um teste com 20 demonstrações aleatórias sem o nome, o revisor identifica o exercício, ou o grupo de variações a que ele pertence, em ao menos 90% dos casos.
- **SC-007**: A pessoa chega à demonstração de qualquer exercício do treino em até 2 toques, e ela começa a ser exibida em até 1 segundo.
- **SC-008**: Nenhum plano ou histórico existente perde dados ou deixa de abrir após as correções do banco.
- **SC-009**: 100% das 11 modalidades de cardio e dos itens do novo catálogo têm demonstração e orientação aprovadas.
- **SC-010**: Em planos novos, 100% dos itens do treino têm demonstração disponível, sem nenhum item de nome livre.

## Assumptions

- O escopo inclui os 122 exercícios de força, as 11 modalidades de cardio e o novo catálogo de preparação e mobilidade, sem meta de ampliar o banco de força. Exercícios podem ser reclassificados, e duplicados podem ser unificados com preservação dos históricos.
- O tamanho do novo catálogo será definido no plano, a partir dos itens que os planos realmente usam.
- O revisor das demonstrações e orientações é o dono do produto. A revisão não substitui a avaliação de um profissional de educação física, e o app mantém seu caráter informativo.
- A personalização do plano (compatibilidade genética, justificativas e observações) continua como está, somando-se às orientações do banco.
- As regras da spec 013 para equivalentes entre padrões continuam válidas.
- O app continua web responsivo; o app móvel nativo está fora do escopo.
- A produção começa por um piloto com exercícios difíceis de representar (ex.: Pullover e Russian Twist), aprovado pelo dono do produto antes de cobrir o restante do banco.
- A ampliação do mapa muscular limita-se às regiões necessárias para representar os exercícios do banco.
