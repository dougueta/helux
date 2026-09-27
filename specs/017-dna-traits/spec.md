# Feature Specification: Marcadores Genéticos na Tela DNA

**Feature Branch**: `017-dna-traits`
**Created**: 2026-09-27
**Status**: Draft
**Input**: User description: "Tela DNA do app web deve mostrar os marcadores genéticos reais do usuário (gene, genótipo, interpretação), a partir do achado #22 da spec 012: GET /genetic-profile devolve o GeneticProfile sem `traits`, então a tela DNA mostra estado vazio em produção mesmo havendo dados genéticos. Corrigir o contrato da API expondo os marcadores (derivados do arquivo Genera em data/genetics/genera.json), ligar na tela DNA v2 com estado vazio correto só quando realmente não houver dados, e resolver o hook órfão useGeneticProfile."

## Contexto

Achado 22 da spec 012 (`specs/012-design-system-unificado/research.md`, "Achados da implementação (Parte 2)"). A tela "Seu DNA" (Design System v2) foi desenhada para listar marcadores genéticos: gene, genótipo, traço, nível em três barras e o impacto no treino, com destaque âmbar nos pontos de risco. O perfil genético que o app recebe hoje traz apenas o resumo derivado (metabolismo, recuperação, risco cardiovascular, predisposição e alertas), sem a lista de marcadores. Resultado: mesmo com o teste Genera do usuário carregado no sistema, a tela mostra "Marcadores ainda não disponíveis".

O teste Genera do usuário já contém os marcadores ligados a treino (seção de aptidão física e painel de saúde esportiva): por exemplo WNT16 (densidade óssea), ACTN3 (força e explosão), COL1A1 (lesões de ligamento e ombro), CHRM2 (recuperação da frequência cardíaca). Esta feature expõe esses marcadores e os mostra na tela.

Há ainda um hook de leitura do perfil genético no app web que não é usado por nenhuma tela desde antes da 012; ele deve ser reaproveitado ou removido.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver meus marcadores genéticos reais (Priority: P1)

O usuário abre "Seu DNA" pelo Perfil. A tela mostra o resumo ("N marcadores do teste Genera…"), a fita com os genes em destaque e um card por marcador com gene, genótipo, traço, nível (baixo/médio/alto) e a interpretação do teste. Marcadores de risco (pontos de atenção, cuidados relevantes, lesões) aparecem com o ponto âmbar.

**Why this priority**: É o defeito em si: a tela existe, mas nunca mostra dado real. Sem isso a tela DNA não entrega valor algum.

**Independent Test**: Com o arquivo Genera do usuário presente, abrir a tela DNA; ela deve listar os marcadores de treino do teste (por exemplo WNT16 C,T "Densidade óssea…" com ponto âmbar e ACTN3 C,C "Performance atlética").

**Acceptance Scenarios**:

1. **Given** o teste Genera do usuário está carregado, **When** ele abre a tela DNA, **Then** vê um card para cada marcador de treino do teste, com gene, genótipo, traço, nível e interpretação.
2. **Given** um marcador classificado no teste como ponto de atenção, cuidado relevante ou lesão, **When** a tela é exibida, **Then** o card desse marcador mostra o ponto âmbar de risco.
3. **Given** o teste traz o mesmo gene para dois traços diferentes (por exemplo COL1A1 para lesões de ombro e de ligamento cruzado), **When** a tela é exibida, **Then** os dois traços aparecem, cada um no seu card.
4. **Given** a tela está exibida, **Then** a contagem "N de N lidos" e o texto de resumo refletem o número real de marcadores.
5. **Given** muitos marcadores (mais de 4), **When** a fita é exibida em tela de 320 px, **Then** os nomes de gene na fita não se sobrepõem nem vazam da coluna.

---

### User Story 2 - Estado vazio honesto (Priority: P2)

Quando realmente não há dados, a tela diz o motivo certo: teste genético não carregado, perfil sem marcadores de treino, ou falha ao buscar o perfil. Nunca mostra estado vazio quando há marcadores.

**Why this priority**: O estado vazio atual mascarou o defeito em produção; distinguir "sem dados" de "falha" evita repetir isso.

**Independent Test**: Remover o arquivo Genera: a tela diz que o perfil genético não foi carregado. Simular falha do serviço: a tela diz que não foi possível carregar e sugere tentar mais tarde.

**Acceptance Scenarios**:

1. **Given** não existe teste genético carregado para o usuário, **When** ele abre a tela DNA, **Then** vê "Perfil genético não carregado" com orientação em linguagem de usuário.
2. **Given** o teste existe mas não tem nenhum marcador de treino, **When** a tela abre, **Then** vê "Marcadores ainda não disponíveis".
3. **Given** o serviço de perfil genético falha ou está fora do ar, **When** a tela abre, **Then** vê uma mensagem de erro de carregamento, distinta dos dois estados vazios.
4. **Given** há marcadores, **Then** nenhum estado vazio ou de erro é exibido.

---

### User Story 3 - Código de leitura do perfil sem duplicidade (Priority: P3)

Existe um único caminho de leitura do perfil genético no app web, sem código morto.

**Why this priority**: Manutenção; não muda o que o usuário vê.

**Independent Test**: Não existe mais o hook órfão (ou ele passa a ser usado pela tela DNA); a suíte e o build do app web continuam verdes.

**Acceptance Scenarios**:

1. **Given** a feature concluída, **Then** nenhum módulo de leitura do perfil genético fica sem uso no app web.

### Edge Cases

- Marcador sem genótipo ou com gene descritivo ("Próximo ao gene X"): o card mostra o texto do gene como veio e omite o genótipo.
- Mesmo marcador (mesmo SNP e mesmo traço) repetido em duas seções do teste: aparece uma vez só.
- Teste Genera malformado (falta seção obrigatória): tratado como falha de carregamento (US2, cenário 3), sem quebrar a tela.
- Gerar treino pelo botão manual continua funcionando mesmo com o perfil agora trazendo marcadores.
- Os demais consumidores do perfil (planejamento de treino por IA, regras de restrição) continuam recebendo o mesmo resumo de hoje, sem mudança de comportamento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O perfil genético entregue ao app MUST incluir a lista de marcadores de treino do usuário, além do resumo que já entrega hoje (compatível com os consumidores atuais).
- **FR-002**: Cada marcador MUST ter: identificador estável e único, gene, genótipo (quando houver), traço (nome da característica), nível de 0 a 1, interpretação do teste e indicador de risco.
- **FR-003**: Os marcadores MUST vir das seções de aptidão física e do painel de saúde esportiva do teste Genera. Seções de saúde, farmacogenética, doenças, nutrição, pele, envelhecimento e personalidade MUST ficar de fora.
- **FR-004**: O indicador de risco MUST ser verdadeiro para marcadores classificados no teste como ponto de atenção, cuidado relevante ou lesão, e falso nos demais.
- **FR-005**: O nível MUST ser derivado da interpretação do teste: "alto" (≥ 0,67) para pontos de atenção e interpretações de maior predisposição/suscetibilidade; "baixo" (< 0,34) para interpretações sem ou com menor predisposição; "médio" nos demais casos.
- **FR-006**: Marcadores repetidos (mesmo SNP e mesmo traço) MUST aparecer uma única vez; mesmo SNP com traços diferentes MUST gerar marcadores distintos.
- **FR-007**: A ordem dos marcadores MUST pôr os de risco primeiro (pontos de atenção, depois cuidados relevantes e lesões), seguidos dos demais na ordem do teste.
- **FR-008**: A tela DNA MUST exibir os marcadores recebidos no visual v2 já existente (fita, "Marcadores genéticos", cards com nível e ponto âmbar).
- **FR-009**: A fita MUST destacar no máximo 4 genes (priorizando os de risco, sem repetir gene), para que os rótulos caibam em 320 px; todos os marcadores continuam listados nos cards.
- **FR-010**: A tela DNA MUST distinguir três situações sem marcadores: teste não carregado, teste sem marcadores de treino, e falha ao carregar — cada uma com mensagem própria em linguagem de usuário.
- **FR-011**: O hook órfão de leitura do perfil genético MUST ser removido (a tela DNA já lê o perfil no servidor), junto com seus testes, se houver.
- **FR-012**: A tela MUST continuar usando só as classes do Design System v2 (guarda da 012 verde).

### Key Entities

- **Perfil genético**: resumo derivado do teste Genera (metabolismo, recuperação muscular, risco cardiovascular, predisposição, alertas) + lista de marcadores.
- **Marcador genético (trait)**: um achado do teste ligado a treino — identificador, gene, genótipo, traço, nível 0–1, interpretação, risco.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com o teste Genera atual do usuário, a tela DNA mostra 100% dos marcadores de treino do teste (21 marcadores únicos) e nenhum estado vazio.
- **SC-002**: Os 3 casos sem marcadores (não carregado, sem marcadores, falha) mostram 3 mensagens distintas, verificadas por teste automatizado.
- **SC-003**: Em 320 px de largura, a tela não tem rolagem horizontal e os rótulos da fita não se sobrepõem.
- **SC-004**: Zero regressão: planejamento de treino e demais telas se comportam como antes (suítes da API e do web verdes).

## Assumptions

- O teste genético continua vindo do arquivo Genera único no servidor (app de usuário único), como hoje; não há tabela de genética no banco e esta feature não cria uma (sem migração).
- A tela "Como molda seu treino" e o score em anel continuam ocultos (FR-022/FR-024 da 012): não há dado que ligue marcador a decisão de treino.
- O insight de DNA na Home foi removido na 012 e não volta nesta feature.
- O acesso ao perfil genético segue sem autenticação, como hoje (limitação conhecida do modo usuário único; fora de escopo).
