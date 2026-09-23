# Feature Specification: Design System Unificado no App Web

**Feature Branch**: `012-design-system-unificado`
**Created**: 2026-09-23
**Status**: Draft
**Input**: User description: "Spec 012 — Design system unificado no app web. Auditar todas as telas e unificar num único padrão visual (estilo inline + variáveis CSS, o padrão já majoritário), migrando as telas e componentes que ainda usam classes utilitárias; resolver o bug B3 (classes de estilo inexistentes que viram no-op); reapresentar a descrição/dicas de execução do exercício com melhor hierarquia visual (item #10 do roadmap). Sem mockup, sem redesign de identidade visual, sem app mobile."

## Contexto

O app web tem 11 telas (Hoje, Treinos, Treino ativo, Histórico, Detalhe do treino, Check-in, Histórico de check-ins, DNA, Perfil, Progresso/Recovery e Login). Elas foram construídas em momentos diferentes e com dois jeitos de estilizar. A maioria (a tela de treino ativo, a Home, o perfil, a folha de execução do exercício) já segue o padrão visual atual do Helux: fundo escuro, superfícies em camadas, destaque verde-limão, raios e espaçamentos padronizados. Uma parte das telas ainda usa um conjunto de estilos antigo. Na auditoria feita em 2026-09-23:

- 19 arquivos de telas e componentes ainda usam o estilo antigo.
- 22 usos de estilo antigo apontam para cores que **não existem** ("muted" e "border"), então não produzem efeito nenhum: textos que deveriam ser secundários e bordas que deveriam aparecer ficam com a aparência padrão (bug B3, que o roadmap atribuía só ao card de traço genético, mas se espalha por Histórico, DNA, Login e outras telas).
- Os carregamentos (skeletons) de algumas telas usam o visual antigo, então a tela "pisca" de um estilo para outro ao terminar de carregar.
- As dicas de execução do exercício aparecem como um bloco de texto corrido (ex.: "Desça até paralelo ou abaixo — carga óssea controlada favorece densidade (WNT16). Joelhos alinhados com os dedos dos pés; evite valgismo para proteger o ligamento cruzado (COL1A1 C,C). Descanso 90-120s entre séries.") difícil de ler de relance durante o treino.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Telas com aparência consistente (Priority: P1)

O usuário navega por todas as telas do app (Hoje, Treinos, Histórico, detalhe de um treino, Check-in, DNA, Perfil, Progresso, Login) e todas têm a mesma linguagem visual: mesmas cores de fundo e superfície, mesmo destaque, mesma hierarquia de texto (título, texto principal, texto secundário), mesmos cantos arredondados e espaçamentos, mesmos componentes para elementos equivalentes (cartões, etiquetas, badges de fit, botões).

**Why this priority**: É o objetivo central da spec. Hoje algumas telas parecem de outro app, e parte dos estilos nem funciona (B3).

**Independent Test**: Percorrer as 11 telas, lado a lado com a tela de treino ativo (referência do padrão atual), e verificar que cartões, textos secundários, bordas, etiquetas e botões equivalentes têm a mesma aparência.

**Acceptance Scenarios**:

1. **Given** o usuário abre o Histórico e o detalhe de um treino, **When** compara com a tela de treino ativo, **Then** cartões, bordas, textos secundários e etiquetas seguem a mesma aparência.
2. **Given** qualquer tela que hoje tem texto secundário ou borda sem efeito (B3), **When** ela é exibida, **Then** o texto secundário aparece com a cor secundária do padrão e a borda aparece com a cor de borda do padrão.
3. **Given** uma tela está carregando, **When** o carregamento termina, **Then** o esqueleto de carregamento e a tela final usam o mesmo padrão visual (sem trocar de estilo ao terminar).
4. **Given** um elemento equivalente aparece em mais de uma tela (ex.: badge de fit genético, etiqueta, cartão), **When** o usuário o vê em telas diferentes, **Then** ele tem a mesma aparência em todas.

---

### User Story 2 - Dicas de execução legíveis durante o treino (Priority: P1)

Durante o treino, o usuário olha rapidamente para as dicas do exercício (no bloco de dicas da tela de treino e na aba Execução da folha do exercício) e consegue identificar de relance o que fazer, sem ler um parágrafo inteiro.

**Why this priority**: É o único item da spec com impacto direto no uso durante o treino (item #10 do roadmap). O resto é consistência.

**Independent Test**: Abrir um treino, olhar o bloco de dicas de um exercício com dicas longas e verificar que a informação está separada em partes identificáveis, na forma decidida em FR-009.

**Acceptance Scenarios**:

1. **Given** um exercício com dicas longas contendo várias orientações, **When** o usuário vê o bloco de dicas na tela de treino, **Then** as orientações aparecem com a hierarquia definida em FR-009, e não como um parágrafo único.
2. **Given** as dicas citam marcadores genéticos (ex.: "(WNT16)", "(COL1A1 C,C)"), **When** exibidas, **Then** a referência genética aparece visualmente distinta da orientação prática, sem ser removida.
3. **Given** uma variante alternativa ativa (spec 010), **When** o bloco de dicas mostra a justificativa genética da variante, **Then** ela segue o mesmo padrão visual das dicas do exercício planejado.
4. **Given** um exercício sem dicas, **When** a tela é exibida, **Then** nenhum bloco vazio aparece.

---

### User Story 3 - Um único jeito de estilizar para manter (Priority: P2)

Quem mantém o app (o desenvolvedor) encontra um único padrão para estilizar telas novas: todas as cores, superfícies, raios e espaçamentos vêm do mesmo conjunto de tokens do tema, e o conjunto de estilos antigo deixa de existir.

**Why this priority**: Evita que o problema volte (novas telas no estilo antigo, cores inexistentes). Não é visível ao usuário final, por isso P2.

**Independent Test**: Buscar no código do app web por estilos do conjunto antigo e por cores fixas fora do tema — nenhum resultado. Uma verificação automatizada falha se alguém reintroduzir o estilo antigo.

**Acceptance Scenarios**:

1. **Given** a migração concluída, **When** se busca por classes do conjunto de estilos antigo em telas e componentes do app web, **Then** não há nenhuma ocorrência.
2. **Given** um desenvolvedor reintroduz um estilo do conjunto antigo, **When** a verificação automatizada roda, **Then** ela falha apontando o arquivo.

---

### Edge Cases

- Telas de erro (tela de erro genérica do app) também seguem o padrão, inclusive quando exibidas antes de qualquer dado carregar.
- A tela de Login é exibida sem usuário logado e sem os dados do app: precisa seguir o padrão sem depender de nada além do tema.
- Estados vazios (sem histórico, sem check-in, sem DNA) seguem o padrão do app, com o mesmo estilo de texto secundário.
- A barra de navegação inferior mantém o comportamento atual (inclusive ficar abaixo dos diálogos, spec 011) e a área segura inferior do celular.
- Dicas de execução curtas (uma frase) não devem ficar com aparência de lista vazia ou "estrutura sobrando".
- Dicas sem marcador genético não mostram espaço reservado para ele.
- Telas nas larguras de celular (a partir de 320 px) não podem ganhar rolagem horizontal com a migração.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todas as 11 telas do app web e seus estados de carregamento, erro e vazio DEVEM usar o padrão visual atual do Helux (o mesmo da tela de treino ativo): cores, superfícies, hierarquia de texto, raios e espaçamentos vindos do conjunto único de tokens do tema.
- **FR-002**: Nenhuma tela ou componente do app web DEVE continuar usando o conjunto de estilos antigo (classes utilitárias) após a migração.
- **FR-003**: Os textos secundários e bordas que hoje não produzem efeito (B3) DEVEM passar a aparecer com a cor secundária e a cor de borda do padrão.
- **FR-004**: Elementos equivalentes em telas diferentes (cartão, etiqueta, badge de fit genético, botão principal, botão secundário, cabeçalho de seção, esqueleto de carregamento) DEVEM usar os mesmos componentes compartilhados, com a mesma aparência.
- **FR-005**: A identidade visual atual DEVE ser preservada: nenhuma cor, fonte ou tom de destaque novo; o padrão de referência é o que já existe nas telas atualizadas.
- **FR-006**: O comportamento das telas (dados exibidos, navegação, ações, textos) NÃO DEVE mudar — só a aparência. Os testes existentes de comportamento continuam passando.
- **FR-007**: Os esqueletos de carregamento DEVEM ter o mesmo padrão visual da tela que antecedem.
- **FR-008**: O app DEVE ter uma verificação automatizada que falha se uma tela ou componente voltar a usar o conjunto de estilos antigo ou uma cor que não exista no tema.
- **FR-009**: As dicas de execução (bloco de dicas da tela de treino e aba Execução da folha do exercício) DEVEM ser exibidas com hierarquia visual que permita leitura de relance. Formato (decidido com o usuário em 2026-09-23, opção A): o texto é separado em itens, **uma orientação por linha**, e a referência genética de cada orientação aparece como etiqueta discreta junto ao item correspondente. Nada fica recolhido ou escondido. Um texto com uma única orientação aparece como um único item, sem marcador de lista sobrando.
- **FR-010**: Referências genéticas nas dicas (ex.: "(WNT16)", "(COL1A1 C,C)") DEVEM permanecer visíveis e visualmente distintas da orientação prática.
- **FR-011**: A justificativa genética de uma variante alternativa (spec 010) DEVE usar o mesmo formato das dicas.
- **FR-012**: A migração NÃO DEVE introduzir rolagem horizontal em larguras de celular a partir de 320 px.

### Key Entities

- **Token de tema**: valor nomeado do padrão visual (cor de fundo, superfície, destaque, texto principal/secundário/apagado, borda, raio, espaçamento) — fonte única de verdade para a aparência de todas as telas.
- **Componente compartilhado**: elemento visual reutilizável (cartão, etiqueta, badge de fit, botão, cabeçalho de seção, esqueleto) com aparência única em todo o app.
- **Dica de execução**: texto de orientação de um exercício, gerado para o usuário, que pode conter várias orientações e referências genéticas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das 11 telas (e seus estados de carregamento, erro e vazio) seguem o padrão visual único, verificado pela verificação automatizada (FR-008) e por inspeção visual tela a tela.
- **SC-002**: Zero usos do conjunto de estilos antigo e zero referências a cores inexistentes no app web (hoje: 19 arquivos com estilo antigo e 22 usos de cor inexistente).
- **SC-003**: Durante o treino, o usuário identifica a orientação principal de um exercício em até 3 segundos olhando o bloco de dicas (verificado na verificação manual com as dicas mais longas do plano atual).
- **SC-004**: Nenhuma regressão de comportamento: todos os testes existentes do app web continuam passando e nenhuma tela perde dado, ação ou texto que exibia antes.
- **SC-005**: Nenhuma tela ganha rolagem horizontal entre 320 px e 430 px de largura.

## Assumptions

- A referência do "padrão visual atual" é a tela de treino ativo, a Home e a folha de execução do exercício, como estão na `main` em 2026-09-23 (depois das specs 010, 011 e 016).
- As telas migradas podem mudar de aparência para se alinhar ao padrão (é o objetivo), mas não de conteúdo nem de comportamento.
- O app mobile (`apps/mobile`) está fora do escopo (decisão de 2026-08-29: MVP é web).
- Não há etapa de mockup nem de validação de design externa: a verificação é a inspeção manual das telas depois da migração.
- O selo "Ajustado pelo recovery de hoje" (que diz "recovery" mesmo com ajuste manual, spec 011) e o corte do nome da variante no cabeçalho do treino (spec 010) são problemas de conteúdo, não de estilo, e ficam fora desta spec.
- O texto das dicas continua vindo como hoje (gerado para o usuário); esta spec muda só como ele é exibido, não como é gerado. A separação em itens é feita na exibição, a partir do texto como ele chega (orientações separadas por ponto final ou ponto e vírgula); se uma orientação não puder ser separada com segurança, ela aparece inteira como um único item — nunca se perde texto.
