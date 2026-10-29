# Feature Specification: Melhorias pós primeiro uso — digitação de carga e preview do próximo treino

**Feature Branch**: `026-melhorias-pos-uso`  
**Created**: 2026-10-27  
**Status**: Draft

## Clarifications

### Session 2026-10-27

- Q: Repetições também digitáveis? → A: Sim, carga e repetições. A carga aceita decimais finos (até duas casas, ex.: 10,25 / 10,50 kg em máquinas), sem arredondar para uma casa; repetições são inteiras.
- Q: Onde fica o preview? → A: Tela própria, aberta pela Home e pela aba Treinos; a lista da aba Treinos também abre o detalhe de cada exercício.  
**Input**: User description: "Melhorias após o primeiro uso do app: (1) Os campos de registro de peso devem também aceitar digitação direta do usuário, mantendo os controles laterais (botões de incremento/decremento) da proposta inicial. (2) Hoje, para ver o treino, o usuário precisa iniciar a sessão e preencher ou pular o formulário inicial (check-in); o usuário quer ter uma pré-visualização (preview) do seu próximo treino sem precisar iniciá-lo."

## Contexto observado

- Durante o treino, a série atual é registrada com dois controles "− valor +": carga (passo de 2,5 kg) e repetições (passo de 1). O valor do meio só pode ser alterado pelos botões laterais. Para ir de 20 kg a 60 kg o usuário precisa tocar 16 vezes.
- Ao tocar em "Iniciar treino", uma sessão é criada e o check-in pré-treino aparece antes de qualquer exercício ficar visível. Detalhes como dicas de execução, demonstração do movimento, variantes e descanso só aparecem dentro da sessão ativa.
- A Home mostra só o primeiro exercício e os nomes dos seguintes. A aba Treinos já lista os exercícios principais com séries × reps e carga, mas sem os detalhes de execução.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Digitar carga e repetições da série (Priority: P1)

Durante o treino, o usuário quer registrar a carga que de fato usou tocando no valor e digitando o número, sem precisar tocar várias vezes em "+" ou "−". Os botões laterais continuam funcionando como hoje para ajustes pequenos.

**Why this priority**: É o atrito mais frequente: acontece em toda série cuja carga difere da sugerida. A mudança é pequena, contida e entrega valor sozinha.

**Independent Test**: Iniciar um treino, tocar no valor de carga da série atual, digitar "62,5", confirmar e ver 62,5 kg registrado; depois tocar em "+" e ver 65 kg.

**Acceptance Scenarios**:

1. **Given** uma série com carga sugerida de 20 kg, **When** o usuário toca no valor, digita "60" e confirma, **Then** a carga da série passa a ser 60 kg e o teclado se fecha.
2. **Given** a carga em 60 kg depois de digitada, **When** o usuário toca em "+", **Then** a carga vai para 62,5 kg (os botões continuam com passo de 2,5 kg a partir do valor atual).
3. **Given** o campo de carga em edição, **When** o usuário digita "42.5" ou "42,5", **Then** os dois formatos são aceitos como 42,5 kg.
4. **Given** o campo de carga em edição, **When** o usuário apaga tudo e sai do campo, **Then** o valor anterior é mantido (nada é registrado como vazio).
5. **Given** o campo de carga em edição, **When** o usuário digita um valor negativo, letras ou um valor acima do limite, **Then** o valor é rejeitado ou corrigido para o limite válido mais próximo, sem travar a tela e sem perder a série.
6. **Given** um celular, **When** o usuário toca no valor de carga, **Then** abre um teclado numérico com separador decimal.
7. **Given** uma máquina com incremento fino, **When** o usuário digita "10,25", **Then** a carga registrada e exibida é exatamente 10,25 kg; **And When** ele toca em "+", **Then** vai para 12,75 kg.
8. **Given** a série atual, **When** o usuário toca no valor de repetições e digita "12", **Then** a série passa a ter 12 repetições, e os botões −/+ continuam com passo de 1.

---

### User Story 2 - Ver o próximo treino sem iniciá-lo (Priority: P1)

Antes de ir para a academia, ou ao chegar lá, o usuário quer ver o treino completo que vai fazer: todos os exercícios, na ordem, com séries, repetições, carga sugerida e descanso, e poder abrir cada exercício para ver a execução. Tudo isso sem criar uma sessão e sem passar pelo check-in pré-treino.

**Why this priority**: Hoje a única forma de conhecer o treino em detalhe é começá-lo, e isso mistura "consultar" com "executar" e força um check-in fora de hora. Saber o treino de antemão também ajuda a planejar a ida à academia (equipamentos, tempo).

**Independent Test**: Com um plano gerado e nenhuma sessão ativa, abrir o preview a partir da Home, percorrer todos os exercícios e abrir a execução de um deles. Voltar e confirmar que nenhuma sessão foi criada, nenhum check-in foi pedido e o progresso do ciclo não mudou.

**Acceptance Scenarios**:

1. **Given** um plano com o próximo treino pendente, **When** o usuário toca em "Ver treino" na Home, **Then** vê o treino completo agrupado por fase (aquecimento, principal, volta à calma) com séries × reps, carga sugerida, descanso e indicação de biset quando houver.
2. **Given** o preview aberto, **When** o usuário toca em um exercício, **Then** vê as dicas de execução, a demonstração do movimento e as variantes disponíveis, os mesmos detalhes da sessão ativa, em modo só leitura.
3. **Given** o preview aberto, **When** o usuário sai sem iniciar, **Then** nenhuma sessão é criada, nenhum check-in é pedido ou salvo e o progresso do ciclo não muda.
4. **Given** o preview aberto, **When** o usuário toca em "Iniciar treino", **Then** o fluxo atual segue normalmente (sessão criada e check-in pré-treino oferecido).
5. **Given** o treino de hoje ajustado por cansaço ou por ajuste manual, **When** o usuário abre o preview, **Then** vê o treino já com esses ajustes, igual ao que vai executar.
6. **Given** uma sessão já em andamento, **When** o usuário abre o preview, **Then** o app indica que há um treino em andamento e oferece continuar, sem criar uma segunda sessão.

---

### Edge Cases

- **Sem plano ou plano sendo gerado**: o preview não é oferecido. A Home continua mostrando "Gerar meu plano" ou o estado da geração.
- **Ciclo concluído**: não há próximo treino. O preview não aparece e vale o estado atual de fim de ciclo.
- **Carga com casas decimais**: aceitar até duas casas decimais, para refletir anilhas e máquinas com incrementos como 10,25 kg ou 10,50 kg. O valor é guardado e exibido sem arredondar para uma casa (10,25 continua 10,25, e "+" leva a 12,75).
- **Exercícios sem carga** (mobilidade, cardio, aquecimento por tempo): o preview mostra a prescrição em texto (ex.: "5 min", "10 por lado") em vez de séries × carga.
- **Digitação durante o descanso / edição de série já concluída**: a digitação vale também ao reabrir uma série concluída para corrigir, igual aos botões hoje.
- **Plano alterado entre abrir o preview e iniciar**: ao iniciar, vale o plano mais recente.

## Requirements *(mandatory)*

### Functional Requirements

**Carga digitável (US1)**

- **FR-001**: O valor de carga da série atual DEVE ser editável por digitação direta, além dos botões "−" e "+".
- **FR-002**: Os botões "−" e "+" DEVEM continuar existindo com o mesmo passo de hoje (2,5 kg), partindo do valor atual, seja ele digitado ou não, e preservando as duas casas decimais (10,25 + 2,5 = 12,75).
- **FR-003**: A digitação de carga DEVE aceitar vírgula ou ponto como separador decimal e guardar o valor com até duas casas decimais, sem arredondar para uma casa (ex.: 10,25 kg e 10,50 kg são guardados exatamente). Valores com mais de duas casas são arredondados para duas.
- **FR-004**: Valores inválidos (vazio, não numéricos, negativos ou acima de 500 kg) NÃO DEVEM ser registrados. Vazio ou não numérico mantém o valor anterior; fora da faixa é corrigido para o limite mais próximo.
- **FR-005**: Em dispositivos móveis, a edição DEVE abrir um teclado numérico com separador decimal.
- **FR-006**: O valor digitado DEVE ser confirmado ao sair do campo ou ao confirmar no teclado, e DEVE ser o valor salvo quando a série é concluída.
- **FR-007**: O controle DEVE continuar acessível: rótulo legível por leitores de tela e operável por teclado físico.
- **FR-008**: As repetições DEVEM aceitar digitação direta pelo mesmo controle, mantendo os botões −/+ com passo de 1. Repetições são números inteiros de 0 a 100: valor com decimal é arredondado para o inteiro mais próximo, e vazio ou não numérico mantém o valor anterior.
- **FR-008a**: A exibição da carga (série atual, séries concluídas, histórico, preview) DEVE mostrar o valor com as casas decimais registradas (10,25 kg, não 10,3 kg).

**Preview do próximo treino (US2)**

- **FR-009**: A Home DEVE oferecer uma ação "Ver treino" ao lado de "Iniciar treino" sempre que houver um próximo treino pendente.
- **FR-010**: O preview DEVE mostrar o treino completo na ordem de execução, agrupado por fase, com: nome do exercício, séries × repetições, carga sugerida (e a progressão em relação à última vez, quando houver), descanso, repetições na reserva quando houver e indicação de biset.
- **FR-011**: O preview DEVE permitir abrir cada exercício para ver dicas de execução, demonstração do movimento e variantes, em modo só leitura.
- **FR-012**: Abrir, navegar e fechar o preview NÃO DEVE criar sessão, NÃO DEVE pedir nem salvar check-in e NÃO DEVE mudar o progresso do ciclo.
- **FR-013**: O preview DEVE refletir o treino exatamente como será executado, incluindo ajustes de cansaço e edições manuais já aplicados.
- **FR-014**: O preview DEVE ter uma ação "Iniciar treino" que leva ao fluxo atual sem mudanças (inclusive o check-in pré-treino).
- **FR-015**: Com uma sessão já em andamento, o preview DEVE oferecer "Continuar treino" em vez de iniciar outro.
- **FR-016**: O preview DEVE ser uma tela própria, aberta pela Home ("Ver treino") e pela aba Treinos. Na aba Treinos, tocar num exercício da lista DEVE abrir o mesmo detalhe (execução, dicas, variantes) em modo só leitura.

### Key Entities

- **Próximo treino**: a sessão pendente do ciclo atual (a mesma que hoje aparece como "treino de hoje"), já com os ajustes do dia. Só é lida pelo preview, nunca alterada.
- **Série registrada**: carga e repetições efetivas de cada série. Só muda a forma de entrada; o que é salvo continua igual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar uma carga 40 kg diferente da sugerida leva no máximo 3 interações (tocar, digitar, confirmar), contra 16 toques hoje.
- **SC-002**: O usuário vê todos os exercícios do próximo treino com séries, reps, carga e descanso em no máximo 1 toque a partir da Home, sem passar pelo check-in.
- **SC-003**: Em 100% das aberturas do preview sem iniciar, nenhuma sessão ou check-in é criado e o progresso do ciclo não muda (verificável por teste).
- **SC-004**: O treino no preview e o treino iniciado logo depois têm os mesmos exercícios, na mesma ordem, com a mesma prescrição, em 100% dos casos.
- **SC-005**: Nenhuma regressão no registro de séries pelos botões: os fluxos e testes atuais de "−"/"+" continuam passando.

## Assumptions

- O limite de 500 kg cobre qualquer exercício com carga do app.
- "Próximo treino" é a sessão pendente do ciclo, a mesma do "treino de hoje"; não há preview de treinos mais à frente do ciclo nesta feature.
- O preview é só leitura: trocar variante, editar exercício ou aplicar ajuste de cansaço continuam nos lugares de hoje (Home, aba Treinos e sessão ativa).
- O check-in pré-treino continua como está; só deixa de ser pré-requisito para *ver* o treino.
- Web responsiva (decisão vigente do projeto); nenhuma mudança no app mobile nativo.
- Nenhuma mudança na geração do plano nem nos dados salvos; a feature é de interface sobre dados que já existem.
