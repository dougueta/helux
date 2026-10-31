# Feature Specification: Esforço-alvo de cada exercício durante o treino

**Feature Branch**: `027-esforco-por-exercicio`  
**Created**: 2026-10-29  
**Status**: Draft  
**Input**: User description: "Indicação do esforço que o usuário deve fazer para executar cada exercício (ideia de esforço por exercício)". Escolha do usuário: mostrar o esforço-alvo durante o treino e comparar com o esforço registrado.

## Contexto observado

- O plano já define um esforço-alvo por exercício principal, em "repetições na reserva" (quantas repetições ainda daria para fazer ao terminar a série). O alvo muda ao longo do ciclo: semanas iniciais mais leves, semanas finais mais perto do limite e semana de descarga mais leve.
- Esse alvo só aparece na lista do plano e no preview ("Deixe 2 repetições na reserva"). Durante o treino, onde o usuário decide quanto se esforçar, ele não aparece.
- Depois de concluir ao menos uma série, o usuário responde "Como foi o esforço?" com Fácil, Moderado, Difícil ou No limite. Essa resposta já alimenta a progressão de carga, mas o app não diz se ela ficou dentro, abaixo ou acima do que o plano pedia.
- "Repetições na reserva" é um termo que nem todo usuário conhece; quem não conhece não sabe como transformar o número em esforço.

## Clarifications

### Session 2026-10-29

- Q: Qual correspondência entre repetições na reserva e nível registrado conta como "No alvo"? → A: A da spec: 4+ → Fácil; 3 → Moderado; 2 → Moderado ou Difícil; 1 → Difícil; 0 → No limite (FR-008 mantido).
- Q: O resumo de esforço ao final do treino (US3) entra nesta entrega? → A: Sim, completo (contagem + lista dos fora do alvo), implementado depois de US1 e US2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o esforço-alvo do exercício durante o treino (Priority: P1)

Durante a sessão, o usuário quer saber, para o exercício atual, quanto deve se esforçar em cada série, numa linguagem que entenda sem conhecer o termo técnico.

**Why this priority**: É a informação que falta no momento da execução. Sem ela, o usuário treina leve demais ou vai à falha em toda série, e a progressão de carga recebe relatos que não correspondem ao plano.

**Independent Test**: Iniciar um treino cujo exercício atual tem alvo de 2 repetições na reserva e ver, na área do exercício, o alvo em linguagem simples ("Moderado a difícil · sobrar 2 repetições") com uma explicação curta acessível em um toque.

**Acceptance Scenarios**:

1. **Given** um exercício principal com alvo de 2 repetições na reserva, **When** o usuário está nesse exercício durante o treino, **Then** vê o alvo como nível de esforço e número de repetições que devem sobrar (ex.: "Esforço-alvo: Moderado a difícil · sobrar 2 repetições").
2. **Given** o alvo visível, **When** o usuário toca para saber mais, **Then** vê uma explicação curta de como sentir esse esforço (ex.: "Termine a série sentindo que conseguiria fazer mais 2 com boa técnica").
3. **Given** a semana de descarga do ciclo, **When** o usuário está num exercício principal, **Then** o alvo mostrado é o da descarga (mais leve) e indica que é semana de descarga.
4. **Given** um aquecimento, volta à calma, cardio, mobilidade ou um plano antigo sem alvo, **When** o usuário está nesse item, **Then** nenhum esforço-alvo é mostrado.

---

### User Story 2 - Comparar o esforço registrado com o alvo (Priority: P1)

Depois de responder "Como foi o esforço?", o usuário quer saber se ficou no alvo e, se não ficou, o que fazer na próxima série ou no próximo treino.

**Why this priority**: Fecha o ciclo do alvo: mostrar o alvo sem dizer se ele foi atingido deixa o usuário sem saber se deve ajustar a carga.

**Independent Test**: Num exercício com alvo "Moderado a difícil", concluir uma série, escolher "Fácil" e ver a comparação "Abaixo do alvo" com a sugestão de aumentar a carga na próxima série; trocar para "Difícil" e ver "No alvo".

**Acceptance Scenarios**:

1. **Given** um alvo de 2 repetições na reserva, **When** o usuário registra "Moderado" ou "Difícil", **Then** vê "No alvo".
2. **Given** o mesmo alvo, **When** o usuário registra "Fácil", **Then** vê "Abaixo do alvo" e a sugestão de aumentar a carga na próxima série, se ainda houver série pendente.
3. **Given** o mesmo alvo, **When** o usuário registra "No limite", **Then** vê "Acima do alvo" e a sugestão de reduzir a carga ou parar antes da falha nas próximas séries.
4. **Given** que o usuário muda a resposta, **When** escolhe outro nível, **Then** a comparação é atualizada na hora.
5. **Given** um exercício sem esforço-alvo, **When** o usuário registra o esforço, **Then** nenhuma comparação é mostrada (o registro continua funcionando como hoje).

---

### User Story 3 - Resumo do esforço ao final do treino (Priority: P2)

Ao finalizar o treino, o usuário quer ver em quais exercícios ficou fora do alvo, para saber onde ajustar a carga no próximo treino.

**Why this priority**: Útil, mas secundário: a comparação durante o treino (US2) já entrega a maior parte do valor.

**Independent Test**: Finalizar um treino com um exercício registrado como "Fácil" e alvo de 1 repetição na reserva, e ver no resumo esse exercício marcado como "Abaixo do alvo".

**Acceptance Scenarios**:

1. **Given** um treino finalizado com exercícios com alvo e esforço registrado, **When** o resumo aparece, **Then** mostra quantos exercícios ficaram no alvo e lista os que ficaram abaixo ou acima, com o alvo e o esforço registrado.
2. **Given** um treino em que todos os exercícios com alvo ficaram no alvo, **When** o resumo aparece, **Then** mostra só a contagem, sem lista.
3. **Given** um treino sem nenhum esforço registrado ou sem exercícios com alvo, **When** o resumo aparece, **Then** a seção de esforço não aparece.

---

### Edge Cases

- **Biset**: cada exercício do par mostra o próprio alvo e a própria comparação.
- **Exercício trocado por variante**: a variante herda o alvo do exercício que substituiu.
- **Treino ajustado por cansaço**: se o ajuste do dia mudou o alvo, o treino mostra o alvo ajustado.
- **Treino retomado** (sessão em andamento reaberta): o alvo e as comparações aparecem como antes de sair.
- **Alvo de 0 repetições na reserva** (até a falha): "No limite" é "No alvo"; qualquer nível abaixo é "Abaixo do alvo".
- **Alvo alto (4 ou mais na reserva)**: "Fácil" é "No alvo".

## Requirements *(mandatory)*

### Functional Requirements

**Esforço-alvo no treino (US1)**

- **FR-001**: Durante o treino, cada exercício principal com esforço-alvo DEVE mostrar esse alvo na área do exercício atual, sem precisar abrir outra tela.
- **FR-002**: O alvo DEVE aparecer em linguagem simples, como um nível de esforço da mesma escala do registro (Fácil, Moderado, Difícil, No limite, ou uma faixa entre dois níveis), junto com o número de repetições que devem sobrar.
- **FR-003**: O usuário DEVE poder abrir, em um toque, uma explicação curta de como reconhecer esse esforço, sem sair do treino.
- **FR-004**: Na semana de descarga, o alvo DEVE indicar que é semana de descarga.
- **FR-005**: Itens sem esforço-alvo (aquecimento, volta à calma, cardio, mobilidade, planos antigos) NÃO DEVEM mostrar alvo nem espaço vazio no lugar dele.
- **FR-006**: A lista do plano e o preview DEVEM usar a mesma linguagem do treino para o alvo, para o usuário reconhecer a mesma informação nos três lugares.

**Comparação (US2)**

- **FR-007**: Ao registrar o esforço de um exercício com alvo, o app DEVE mostrar se ficou "No alvo", "Abaixo do alvo" ou "Acima do alvo".
- **FR-008**: A comparação DEVE seguir esta correspondência entre repetições na reserva e nível registrado: 4 ou mais → Fácil; 3 → Moderado; 2 → Moderado ou Difícil; 1 → Difícil; 0 → No limite. Registro mais leve que o esperado é "Abaixo do alvo"; mais pesado é "Acima do alvo".
- **FR-009**: Fora do alvo, o app DEVE mostrar uma sugestão curta de ação: aumentar a carga quando abaixo, reduzir a carga ou parar antes da falha quando acima. A sugestão fala da próxima série quando ainda há série pendente, e do próximo treino quando não há.
- **FR-010**: A comparação DEVE ser atualizada imediatamente quando o usuário muda o esforço registrado.
- **FR-011**: A comparação é só orientação: ela NÃO DEVE mudar a carga, as séries nem a regra de progressão já existentes.

**Resumo (US3)**

- **FR-012**: O resumo do treino finalizado DEVE mostrar quantos exercícios com alvo e esforço registrado ficaram no alvo e listar os que ficaram abaixo ou acima, com o alvo e o esforço registrado.
- **FR-013**: Sem exercícios com alvo e esforço registrado, o resumo NÃO DEVE mostrar a seção de esforço.

**Geral**

- **FR-014**: Alvo e comparação DEVEM ser legíveis por leitor de tela e não depender só de cor.

### Key Entities

- **Esforço-alvo**: repetições na reserva definidas pelo plano para um exercício principal numa semana do ciclo; exibido como nível de esforço (ou faixa) + repetições que devem sobrar.
- **Esforço registrado**: nível que o usuário escolhe em "Como foi o esforço?" (Fácil, Moderado, Difícil, No limite), já existente.
- **Comparação**: resultado entre alvo e registro — No alvo, Abaixo do alvo ou Acima do alvo — com uma sugestão de ação quando fora do alvo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos exercícios principais com alvo, o usuário vê o esforço-alvo durante o treino sem nenhum toque extra.
- **SC-002**: Um usuário que não conhece o termo "repetições na reserva" consegue dizer, olhando a tela do treino, quanto deve se esforçar na série (verificado no roteiro manual).
- **SC-003**: Depois de registrar o esforço, o usuário vê se ficou no alvo em menos de 1 segundo, sem trocar de tela.
- **SC-004**: Nenhuma mudança na carga sugerida, nas séries ou na progressão em relação ao comportamento atual (a suíte de progressão continua passando sem ajustes).

## Assumptions

- O esforço-alvo continua vindo do plano atual (repetições na reserva por semana do ciclo, já gerado e ajustado pelo cansaço). Esta feature não muda como o alvo é calculado.
- A escala de registro continua a mesma (Fácil, Moderado, Difícil, No limite) e continua sendo respondida por exercício, depois da primeira série concluída, como hoje.
- A correspondência do FR-008 segue a relação usual entre repetições na reserva e esforço percebido (0 = falha, 1 ≈ 9/10, 2 ≈ 8/10, 3 ≈ 7/10, 4+ ≈ 6/10 ou menos) e os valores que a escala do app já grava (Fácil 6, Moderado 7, Difícil 9, No limite 10). Com 2 na reserva, Moderado e Difícil contam como no alvo, porque o valor 8 fica entre os dois níveis.
- Orientação por série (séries de aproximação mais leves, última série perto do limite) e uma escala nova de esforço ficam fora de escopo.
- O resumo do treino (US3) usa a tela de resumo que já existe ao finalizar o treino.
