# Feature Specification: Helux Design System v2 no App Web

**Feature Branch**: `012-design-system-unificado`
**Created**: 2026-09-23 (reescrita em 2026-09-23 a partir do Design System v2)
**Status**: Draft
**Input**: User description: "Segue a implementação da spec 012 mas com base no novo design system (`design_handoff_helux_v2`), adaptando tudo no processo SDD."

## Contexto

A primeira versão desta spec (unificar as telas no padrão visual existente) foi implementada quase por inteiro (T001–T026) e pausada: o usuário redesenhou o sistema visual no Claude Design. O resultado é o **Helux Design System v2**, entregue em `design_handoff_helux_v2/`:

- `README.md` traz as regras de implementação, os tokens, os componentes, as telas e as interações;
- `v2/helux-v2.css` é a fonte da verdade dos tokens e do CSS dos componentes;
- `v2/*.jsx` e `Helux Design System v2.html` são protótipos de referência, de alta fidelidade.

A v2 **não troca a identidade** (continua escura, com tom verde, acento verde-limão e Space Grotesk). Ela impõe disciplina:
- uma assinatura visual ligada ao DNA, a "hélice projetada", que representa o fit genético;
- três níveis de superfície, cada um com uma função;
- uma escala tipográfica fechada, com números em fonte mono;
- regras rígidas de onde o acento pode aparecer;
- acessibilidade não negociável: alvos de 44 px, contraste AA, foco visível e respeito ao `reduced-motion`.

Esta spec substitui a versão anterior. O que já foi feito no branch continua valendo onde não conflita com a v2: o Tailwind removido, os tokens em variáveis CSS, o teste de guarda e o formatador de dicas.

## Clarifications

### Session 2026-09-23

- Q: Partes do desenho sem dado hoje ("Anterior" nas séries, "Novo recorde" e a contagem de recordes na conclusão, "Como molda seu treino" no DNA)? → A: **Só visual.** A 012 implementa o visual com os dados que já existem. Blocos sem dado real ficam ocultos, ou mostram "—" onde o próprio desenho prevê isso. Dado inventado nunca aparece. Os dados novos viram specs próprias depois.
- Q: Progresso e Histórico? → A: **Juntar.** Progresso ganha a seção Histórico, com os últimos treinos no formato do desenho e um link para a lista completa. A lista completa e o detalhe de um treino continuam existindo, no visual novo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Base visual v2 em todo o app (Priority: P1)

O usuário percebe o app inteiro com a mesma linguagem visual da v2:
- cores e superfícies em três níveis;
- tipografia com números em fonte mono;
- botões em pílula e etiquetas em retângulo;
- acento verde-limão só onde a regra permite;
- foco de teclado visível;
- animações que respeitam a preferência de movimento reduzido;
- menu inferior com o item ativo marcado por um traço no topo.

**Why this priority**: Todas as outras histórias dependem dos tokens, dos componentes e das regras. Sozinha, ela já muda a aparência de todas as telas para a v2.

**Independent Test**: Abrir qualquer tela e verificar três coisas:
- **Regras:** acento só nos lugares permitidos, alvos de toque com 44 px ou mais, foco visível pelo teclado, números em fonte mono no formato pt-BR.
- **Componentes:** botão, etiqueta, seletor, card e skeleton no visual do handoff.
- **Movimento reduzido:** com a preferência do sistema ligada, as animações ficam instantâneas.

**Acceptance Scenarios**:

1. **Given** qualquer tela, **When** o usuário a vê, **Then** o acento verde-limão aparece só nos usos permitidos:
   - botão primário;
   - item ativo do menu;
   - ✓ de série concluída e traço de série feita;
   - fit alto;
   - ícone do timer de descanso.

   Ele não aparece em títulos, gráficos, recordes, na seleção de cansaço, em bordas decorativas nem em brilhos.
2. **Given** qualquer tela, **When** o usuário navega pelo teclado, **Then** todo elemento interativo mostra o anel de foco claro (não verde).
3. **Given** a preferência de movimento reduzido ligada, **When** o usuário usa o app, **Then** transições e animações ficam instantâneas, e o skeleton fica sem brilho.
4. **Given** qualquer número de treino (kg, reps, tempo, fit, contadores), **When** exibido, **Then** aparece em fonte mono com dígitos tabulares, a unidade em fonte de texto menor e o formato pt-BR (82,0 kg; 9.840 kg).
5. **Given** o menu inferior, **When** o usuário está numa das 4 seções, **Then** o item ativo tem ícone em acento e um traço de 3 px no topo, e o menu respeita a área segura inferior do celular.

---

### User Story 2 - Treino ativo e folha de execução no v2 (Priority: P1)

Na academia, entre séries, o usuário olha o treino ativo e entende de relance três coisas: onde está (barra de progresso com um traço por série), o que fazer (dicas uma por linha, com o gene como etiqueta) e qual é a série atual. A série atual fica numa área de foco, com controles grandes de kg e reps e um ✓ grande. As séries feitas e as próximas aparecem compactas.

Ao concluir uma série, o ✓ faz uma pequena animação, o traço correspondente acende e o descanso começa num bloco acima do botão principal. Enquanto o descanso corre, "Próximo exercício" deixa de ser o botão principal. A folha "Ver execução" segue o desenho: área de demonstração, passos numerados com "Erro comum" destacado, mapa muscular e lista de variantes com "Trocar".

**Why this priority**: É a tela de uso principal do app, e é a que o desenho mais muda.

**Independent Test**: Iniciar um treino e verificar o cenário completo:
- a barra de progresso por série;
- a série atual em destaque, com controles de kg (± 2,5) e reps (± 1);
- concluir uma série, com a animação, o traço aceso e o descanso começando;
- durante o descanso, "+15s", "Pular" e o botão "Próximo exercício" em versão secundária;
- tocar numa série compacta para editá-la;
- "Adicionar série";
- abrir e fechar a folha de execução;
- trocar de variante pela folha.

**Acceptance Scenarios**:

1. **Given** um treino ativo, **When** a tela abre, **Then** o menu inferior não aparece, e o cabeçalho mostra o botão de encerrar, o nome do exercício atual, o contador "N/total séries" e o timer.
2. **Given** um treino com vários exercícios, **When** o usuário olha o topo, **Then** vê uma barra com um traço por série, agrupada por exercício. O grupo atual tem traços mais altos. Tocar num grupo leva ao exercício correspondente.
3. **Given** a série atual (a primeira não concluída, ou a que o usuário tocou para editar), **When** exibida, **Then** ela aparece em área de foco, com "Série N de M", o valor anterior quando houver ("—" quando não houver), controles de kg e reps de 44 px ou mais e um ✓ de 52 px.
4. **Given** o usuário toca no ✓ da série atual, **When** a série é concluída, **Then**:
   - o ✓ anima;
   - a linha passa para o formato compacto;
   - o traço correspondente acende na barra do topo;
   - o contador do cabeçalho atualiza;
   - o descanso começa com o tempo do exercício.
5. **Given** o descanso correndo, **When** o usuário olha o rodapé, **Then** vê o bloco de descanso (anel, tempo, "+15s" e "Pular") e o botão "Próximo exercício" na versão secundária. Quando o descanso termina, o bloco some e o botão volta a ser o principal.
6. **Given** uma série concluída, **When** o usuário toca no ✓ dela, **Then** a conclusão é desfeita.
7. **Given** as dicas do exercício, **When** exibidas, **Then** aparecem como lista, uma orientação por linha. As orientações com marcador genético ganham o marcador visual de alerta e a etiqueta do gene: símbolo em itálico, genótipo ao lado. Nunca aparecem como parágrafo, em texto verde ou com o prefixo "ATENÇÃO".
8. **Given** a folha "Ver execução", **When** aberta, **Then** ela sobe por cima do treino, com fundo escurecido, e mostra:
   - área de demonstração com cadência e controles;
   - nome, fit e etiquetas;
   - abas Execução e Variantes;
   - passos numerados, com "Erro comum" em âmbar;
   - mapa muscular com legenda;
   - na aba Variantes, uma lista com fit, etiquetas e "Atual" ou o botão "Trocar";
   - "Fechar" no rodapé.
9. **Given** uma variante alternativa escolhida (spec 010), **When** o usuário volta ao treino, **Then** a tela continua refletindo a variante, com as regras da spec 010 preservadas.

---

### User Story 3 - Home no v2 (Priority: P1)

O usuário abre o app e vê:
- a saudação;
- o treino de hoje numa **única área de foco**, com o exercício inicial, o fit em hélice, os próximos exercícios ("Depois"), o seletor "Como você está hoje" e um único botão principal "Iniciar treino";
- abaixo, o ciclo atual e o último check-in, em superfície plana.

**Why this priority**: É a primeira tela e a porta de entrada do treino.

**Independent Test**: Abrir a Home no celular e no desktop (coluna central de 512 px) e comparar com o desenho. Recarregar para ver o skeleton, que precisa ter a forma do conteúdo final.

**Acceptance Scenarios**:

1. **Given** um treino para hoje, **When** a Home abre, **Then** ela mostra:
   - o topo com a marca, a sequência de semanas e o botão de perfil;
   - a data;
   - "Bom treino, {nome}" inteiro na cor de texto, sem nome em verde;
   - a área de foco com o treino;
   - o ciclo atual;
   - o último check-in;
   - o menu com "Hoje" ativo.
2. **Given** o seletor "Como você está hoje" (spec 011), **When** o usuário escolhe um nível, **Then** a seleção aparece no estilo neutro do seletor (fundo claro, sem acento), e todo o fluxo da spec 011 (confirmação e resumo de mudanças) continua funcionando.
3. **Given** a Home carregando, **When** exibida, **Then** a área de foco mostra skeletons com a forma final (título, fit, linhas, seletor e botão).
4. **Given** a Home no desktop, **When** exibida, **Then** a mesma estrutura aparece numa coluna central de 512 px, com o menu alinhado à coluna.

---

### User Story 4 - Treino concluído no v2 (Priority: P2)

Ao finalizar, o usuário vê a **fita de traços acendendo em sequência**, o único momento orquestrado do app. Em seguida aparecem "Treino concluído", o treino e a duração, e o resumo: volume, séries e duração. Os estados de salvando e de erro (spec 016) usam o visual novo.

**Why this priority**: O fluxo de salvar (spec 016) já funciona. Aqui a mudança é de apresentação.

**Independent Test**: Finalizar um treino e verificar a animação, o resumo e os três estados: salvando, salvo e erro.

**Acceptance Scenarios**:

1. **Given** o treino finalizado e salvo, **When** a tela aparece, **Then** a fita acende traço a traço, e o resumo mostra volume (kg), séries (feitas/total) e duração (min), em mono pt-BR.
2. **Given** o salvamento em andamento, **When** exibido, **Then** o botão principal aparece em estado de carregamento, com "Salvando treino…" anunciado a leitores de tela.
3. **Given** falha ao salvar, **When** exibido, **Then** aparecem o aviso de erro ("Não foi possível salvar", explicando que o treino está guardado no aparelho), o botão principal "Tentar de novo" e uma ação secundária para sair. As regras da spec 016 são preservadas.
4. **Given** que não há dado de recordes (Clarifications), **When** a tela é exibida, **Then** o bloco "Novo recorde" e a contagem de recordes não aparecem.

---

### User Story 5 - Progresso no v2, com o Histórico junto (Priority: P2)

O usuário abre Progresso ("Sua evolução") e vê, em sequência:
- o recovery de hoje, com o aviso de dados antigos quando for o caso;
- o volume semanal, com o número em destaque e as barras;
- os recordes pessoais;
- os últimos treinos, com acesso à lista completa.

**Why this priority**: Consolida duas telas numa só. Depende da base visual (US1).

**Independent Test**: Abrir Progresso com dados reais e verificar as quatro seções. Com dados de recovery antigos, verificar o aviso em âmbar.

**Acceptance Scenarios**:

1. **Given** dados de recovery recentes, **When** a tela abre, **Then** os 4 indicadores aparecem em cards, com ícone e número em mono.
2. **Given** dados de recovery antigos ou não confiáveis, **When** a tela abre, **Then** aparece o aviso em âmbar ("Dados antigos"), e os valores ficam atenuados.
3. **Given** o volume semanal, **When** exibido, **Then** aparece o número em destaque com a variação e as barras neutras, com a semana atual em cor de texto, sem verde e sem grade.
4. **Given** treinos no histórico, **When** exibidos em Progresso, **Then** aparecem os últimos, em linhas planas (nome, data, volume, séries e duração), com acesso à lista completa. A lista completa e o detalhe de um treino também usam o visual novo.
5. **Given** que não há dado, **When** uma seção está vazia, **Then** ela mostra um estado vazio que convida a uma ação.

---

### User Story 6 - DNA no v2 (Priority: P2)

O usuário abre o DNA e vê:
- a fita de marcadores, com os loci acesos e os nomes dos genes;
- os marcadores genéticos em cards, com gene em itálico, genótipo, nível em palavra e barras, traço e impacto;
- os traços de risco com o marcador de alerta.

**Why this priority**: A tela que mais expressa a assinatura visual. Depende da base (US1).

**Independent Test**: Abrir o DNA com o perfil real e comparar com o desenho.

**Acceptance Scenarios**:

1. **Given** um perfil genético, **When** a tela abre, **Then** aparece a fita de marcadores com os genes do perfil.
2. **Given** cada traço do perfil, **When** exibido, **Then** o card mostra gene (itálico mono), genótipo quando existir, nível em palavra (baixo/médio/alto) com barras neutras, nome do traço e impacto. O quadrado âmbar aparece quando o traço é de risco.
3. **Given** que não há dado para "Como molda seu treino" (Clarifications), **When** a tela é exibida, **Then** essa seção não aparece.

---

### User Story 7 - Demais telas no v2 (Priority: P3)

As telas que o desenho não detalha adotam os componentes e as regras da v2 por analogia: Treinos, lista e detalhe do histórico, Check-in, histórico de check-ins, Perfil, Login e a tela de erro.

**Why this priority**: Completa a consistência. Nenhuma dessas telas está no fluxo principal entre séries.

**Independent Test**: Percorrer cada tela e verificar as regras da US1:
- componentes do sistema, com campo numérico no Check-in;
- no máximo um botão principal por tela;
- acento só onde a regra permite;
- estados de carregando, vazio e erro.

**Acceptance Scenarios**:

1. **Given** o formulário de check-in, **When** exibido, **Then** os campos numéricos seguem o componente de campo da v2 (caixa de 52 px, valor em mono, unidade fixa, estados de foco e erro), com mensagem de erro que diz como resolver.
2. **Given** o Login, **When** exibido, **Then** o menu inferior não aparece e há um único botão principal.
3. **Given** qualquer uma dessas telas, **When** carregando, vazia ou em erro, **Then** o estado segue as regras obrigatórias da v2.

### Edge Cases

- **Tela estreita (320 px):** nenhuma tela ganha rolagem horizontal. Na série atual, quando a largura útil fica em 300 px ou menos, o ✓ desce para uma linha inteira, como o desenho prevê.
- **Série sem valor anterior:** mostra "—". Vale inclusive para todas as séries enquanto o dado "Anterior" não existir (Clarifications).
- **"Adicionar série":** clona a última série, com o anterior em "—" e sem concluir.
- **Descanso ativo ao trocar de exercício:** segue a regra atual de descanso do app; só o visual muda.
- **Exercício sem dicas ou sem variantes:** os blocos correspondentes não aparecem.
- **Dica com marcador genético sem parênteses ou no meio da frase** (ex.: "alerta COL1A1 C,C indica…"): segue a decisão do formatador de dicas (research R7). A orientação nunca perde texto, e o prefixo "ATENÇÃO" não aparece na tela.
- **Folha ou diálogo aberto:** fica acima do menu e do rodapé fixo, com o próprio fundo escurecido. Tocar no fundo fecha a folha.
- **Fit nas três faixas** (≥ 75 alto, 50–74 médio, < 50 baixo): cor, comprimento e palavra acompanham o número. Cor nunca é o único portador da informação.
- **Movimento reduzido:** a demonstração do exercício fica parada no meio do movimento, e a fita da conclusão aparece já acesa.

## Requirements *(mandatory)*

### Functional Requirements

**Base (US1)**
- **FR-001**: O app DEVE adotar os tokens do Design System v2 como fonte única de aparência: cores, tokens semânticos (fit, traço, recovery, demonstração), raios, espaçamento, movimento e foco, conforme o handoff.
- **FR-002**: O app DEVE usar a escala tipográfica fechada da v2: 8 estilos de texto e 4 estilos numéricos. Todo número de treino fica em mono com dígitos tabulares e unidade atenuada, no formato pt-BR (vírgula decimal, ponto de milhar).
- **FR-003**: O acento verde-limão DEVE aparecer só nos usos permitidos pelo handoff (seção 1). Brilhos (glow), gradientes decorativos e formas decorativas NÃO DEVEM existir. Cada tela tem no máximo um botão principal visível.
- **FR-004**: Os elementos tocáveis DEVEM ter forma de pílula e as informações não tocáveis (etiquetas, marcadores genéticos, números de passo) forma de retângulo com raio de 6 px. Uma etiqueta nunca é tocável.
- **FR-005**: As superfícies DEVEM seguir os quatro níveis da v2: plano, card, área de foco (no máximo uma por tela) e elevado. Sombra só em quem flutua sobre outra tela.
- **FR-006**: O app DEVE oferecer os componentes da v2 com todos os estados obrigatórios (padrão, pressionado, foco, desabilitado, carregando, vazio, erro) onde se aplicarem:
  - botão nas variantes principal, secundário, fantasma e perigo, mais o botão de ícone;
  - etiqueta e marcador genético;
  - indicador de fit em hélice;
  - seletor segmentado e abas;
  - stepper;
  - linhas de série compacta e atual, com o ✓;
  - progresso do treino e do ciclo;
  - anel de descanso;
  - dicas e passos numerados;
  - menu inferior;
  - folha inferior, diálogo e toast;
  - campo numérico, aviso (banner), gráfico de barras e skeleton.
- **FR-007**: Acessibilidade DEVE ser garantida em todo o app:
  - alvos de toque de 44 px ou mais, conforme os tamanhos do handoff;
  - contraste AA em todo texto;
  - foco de teclado visível com o anel claro;
  - rótulo acessível em todo ícone isolado;
  - estado pressionado ou selecionado exposto em seletores e abas;
  - timer anunciado como timer e aviso de erro como alerta;
  - sem rolagem horizontal em 320 px.
- **FR-008**: Com a preferência de movimento reduzido, todas as animações e transições DEVEM ficar instantâneas. A demonstração fica parada no meio do movimento, e o skeleton fica sem brilho.
- **FR-009**: O menu inferior DEVE seguir o desenho: 4 itens, item ativo com ícone em acento e traço no topo, e área segura inferior. Ele NÃO DEVE aparecer no treino ativo, na tela de treino concluído nem no login. Folhas e diálogos ficam acima dele.
- **FR-010**: A verificação automatizada do design system DEVE falhar se uma tela usar:
  - uma classe de estilo que não exista na folha de estilos do sistema;
  - uma variável de cor ou token não declarada;
  - uma cor literal fora da camada de tokens;
  - um brilho (glow) do acento.

**Treino ativo e folha (US2)**
- **FR-011**: O treino ativo DEVE seguir o desenho da seção 5.2 do handoff:
  - cabeçalho com encerrar, nome, contador de séries e timer;
  - barra de progresso por série, agrupada por exercício e navegável;
  - etiqueta e fit;
  - título e prescrição ("4 × 8–10 reps, descanso 90s");
  - dicas;
  - card com "Ver execução" e o atalho de variante com fit maior;
  - séries;
  - "Adicionar série";
  - rodapé fixo com o botão principal.
- **FR-012**: A série atual DEVE aparecer em área de foco, com steppers de kg (passo 2,5) e reps (passo 1), mínimo 0, valor anunciado ao mudar e ✓ de 52 px. As demais séries aparecem compactas: número, anterior ("—" quando não houver), valor e ✓ de 44 px. Tocar numa série compacta a torna a atual. Tocar no ✓ de uma concluída desfaz a conclusão.
- **FR-013**: Ao concluir uma série, o app DEVE executar a sequência do handoff (seção 6):
  1. animação do ✓;
  2. a linha passa para o formato compacto;
  3. o traço acende;
  4. o contador atualiza;
  5. o descanso começa.

  Durante o descanso, o bloco de descanso aparece acima do botão principal, com anel, tempo, "+15s" e "Pular", e "Próximo exercício" passa para a versão secundária.
- **FR-014**: As dicas de execução DEVEM usar o formato da v2 (seção 4, "Dicas de execução"): uma orientação por linha com divisória, a orientação com gene marcada em âmbar e a etiqueta do gene abaixo do texto. Nunca parágrafo, texto verde ou "ATENÇÃO".
- **FR-015**: A folha de execução DEVE seguir a seção 5.3 do handoff:
  - área de demonstração com cadência, pausar/reproduzir e "Repetir";
  - nome, fit e etiquetas;
  - abas Execução e Variantes;
  - na aba Execução, passos numerados com "Erro comum" em âmbar, e músculos trabalhados com mapa e legenda;
  - na aba Variantes, lista plana com "Atual" ou "Trocar" (versão secundária se o fit for maior que o atual, fantasma se for menor);
  - "Fechar" fixo no rodapé.
- **FR-016**: As regras de variante da spec 010 (a tela reflete a variante ativa; o histórico registra a variante da primeira série) e o salvamento ao concluir da spec 016 DEVEM continuar valendo sem mudança de comportamento.

**Home (US3)**
- **FR-017**: A Home DEVE seguir a seção 5.1 do handoff:
  - topo com marca, sequência e perfil;
  - data e saudação;
  - área de foco única com treino, exercício inicial, fit, "Depois" (até 2 próximos + "e mais N"), "Como você está hoje" e "Iniciar treino";
  - ciclo atual;
  - último check-in com "Novo check-in" e "Gerar novo plano";
  - menu.
- **FR-018**: O seletor de cansaço DEVE usar o seletor segmentado neutro da v2, preservando todo o comportamento da spec 011.
- **FR-019**: A Home carregando DEVE mostrar skeletons com a forma final da área de foco.

**Conclusão, Progresso e DNA (US4–US6)**
- **FR-020**: A tela de treino concluído DEVE seguir a seção 5.6 do handoff, com a fita acendendo em sequência, o título, o resumo (volume, séries, duração) e os estados de salvando e de erro. O bloco de recorde e a contagem de recordes ficam ocultos enquanto não houver dado.
- **FR-021**: Progresso DEVE seguir a seção 5.5 do handoff, com recovery de hoje (e aviso de dados antigos), volume semanal, recordes pessoais e histórico dos últimos treinos com acesso à lista completa. A lista completa e o detalhe de treino usam o visual da v2 (linha de histórico plana).
- **FR-022**: O DNA DEVE seguir a seção 5.4 do handoff, com fita de marcadores, cards de marcador (gene, genótipo, nível em palavra e barras, traço, impacto, alerta de risco) e "Como molda seu treino" oculto enquanto não houver dado.

**Demais telas (US7)**
- **FR-023**: Treinos, Histórico, detalhe de treino, Check-in, histórico de check-ins, Perfil, Login e a tela de erro DEVEM adotar os componentes e as regras da v2. O Check-in usa o campo numérico da v2.

**Transversal**
- **FR-024**: Nenhuma tela DEVE mostrar dado inventado. Onde o dado não existe, o bloco fica oculto, ou mostra "—" quando o desenho prevê isso (Clarifications).
- **FR-025**: Todos os comportamentos existentes (fluxos das specs 009, 010, 011 e 016, navegação, dados exibidos) DEVEM continuar funcionando. As únicas mudanças de interação permitidas são as do handoff: série atual em foco, bloco de descanso, menu oculto no treino e na conclusão, e grupos navegáveis na barra de progresso.

### Key Entities

- **Token do sistema**: valor nomeado da v2 (cor, cor semântica, raio, espaço, duração, curva, foco), fonte única de aparência.
- **Componente do sistema**: elemento reutilizável da v2, com estados obrigatórios.
- **Fit**: número de 0 a 100, com faixa (alto, médio, baixo), cor da faixa e comprimento na hélice.
- **Dica de execução**: orientação, com marcador genético opcional (gene e genótipo).
- **Série do treino ativo**: número, valor anterior (opcional), kg, reps e se está concluída. A série atual é a que está em edição ou a primeira não concluída.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: As 6 telas desenhadas (Hoje, Treino ativo, Folha de execução, DNA, Progresso, Treino concluído) correspondem ao handoff na comparação lado a lado em 375 px, sem diferença visível de cor, tipografia, espaçamento, raio ou estado nos elementos desenhados.
- **SC-002**: 100% das telas passam na verificação automatizada do design system (FR-010) e nas regras de acento, forma e acessibilidade (verificação manual com checklist).
- **SC-003**: Durante o treino, o usuário conclui uma série (✓), ajusta kg ou reps da próxima e usa "+15s" ou "Pular" no descanso só com o polegar, sem errar o alvo (alvos de 44 px ou mais).
- **SC-004**: Nenhuma regressão de comportamento: todos os testes de comportamento existentes continuam passando, e os fluxos das specs 009, 010, 011 e 016 funcionam na verificação manual.
- **SC-005**: Nenhuma tela tem rolagem horizontal entre 320 e 430 px, e todo texto atinge contraste AA.

## Assumptions

- O handoff (`design_handoff_helux_v2/`) é a referência final: alta fidelidade, conforme o README. `v2/helux-v2.css` é a fonte da verdade dos tokens e das classes dos componentes.
- Os dados de exemplo do handoff (genótipos, variantes, recordes e histórico) são ilustrativos. Tudo vem dos dados reais da API. Onde o dado real não existe, vale a Clarification "só visual".
- A saudação usa o nome disponível hoje no app (hoje é o identificador exibido na Home).
- A prescrição do exercício ("4 × 8–10 reps, descanso 90s") usa os dados atuais do plano. O descanso continua o que o app já usa hoje. O descanso personalizado é a spec 015.
- A demonstração do exercício continua usando as animações existentes. A variedade de animações é a spec 013.
- O app mobile (`apps/mobile`) está fora do escopo.
- O trabalho já feito no branch (remoção do Tailwind, tokens, teste de guarda, formatador de dicas, correção do viewport) é base reaproveitável. O teste de guarda passa a aceitar as classes definidas na folha de estilos do sistema, em vez de proibir qualquer classe.
