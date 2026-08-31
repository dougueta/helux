# Feature Specification: Variante Executada Persistida no Histórico

**Feature Branch**: `010-variante-persistida-historico`
**Created**: 2026-08-31
**Status**: Draft
**Input**: User description: "Variante executada persistida no histórico: hoje, quando o usuário troca de exercício para uma variante (via "Ver execução" / ExerciseSheet) durante o treino ativo, essa troca é só cosmética — o histórico de treino continua registrando o nome do exercício originalmente planejado, não a variante que o usuário de fato executou. Precisamos manter registrados tanto o exercício original planejado quanto a variante executada (não substituir um pelo outro, registrar os dois), e a variante escolhida precisa aparecer de forma visível na listagem de exercícios da tela de treino ativo, para o usuário ver/gerenciar qual variante está ativa (hoje isso é escondido, só aparece dentro do ExerciseSheet). Isso também resolve o badge "96 fit" hardcoded na tela de treino ativo — deve refletir o match genético real da variante ativa, não um valor fixo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Histórico reflete a variante realmente executada (Priority: P1)

Um usuário, durante um treino ativo, troca um exercício planejado por uma variante alternativa (por limitação de equipamento, lesão, ou preferência) e registra suas séries nessa variante. Ao finalizar o treino, o histórico deve mostrar qual variante foi de fato executada, sem perder a referência de qual era o exercício originalmente planejado pelo plano.

**Why this priority**: É o núcleo do problema relatado (débito técnico TD-004) — hoje a troca de variante é só cosmética e o histórico grava o nome errado, o que compromete qualquer análise futura de progressão de carga por exercício (a spec 014, de progressão automática, depende de um histórico correto).

**Independent Test**: Iniciar um treino, trocar a variante de um exercício, registrar séries nessa variante, finalizar o treino e verificar no histórico que a variante executada aparece corretamente, junto com o exercício originalmente planejado.

**Acceptance Scenarios**:

1. **Given** um treino ativo em que o exercício planejado é "Supino Reto (Barra)" e o usuário troca para a variante "Supino Reto com Halteres", **When** ele registra séries nessa variante e finaliza o treino, **Then** a sessão salva registra "Supino Reto com Halteres" como a variante executada, mantendo a referência de que o exercício originalmente planejado era "Supino Reto (Barra)".
2. **Given** um exercício em que o usuário nunca trocou de variante, **When** ele registra séries e finaliza o treino, **Then** a sessão salva registra normalmente o exercício planejado, sem nenhuma mudança de comportamento em relação a hoje.
3. **Given** um usuário trocou de variante e depois voltou para a variante recomendada/original antes de registrar qualquer série nesse exercício, **When** ele finaliza o treino, **Then** a sessão salva registra o exercício original, não uma variante temporariamente selecionada e depois descartada.

---

### User Story 2 - Variante ativa visível na tela de treino (Priority: P2)

Enquanto treina, o usuário consegue ver de forma clara, na tela principal do exercício em andamento, qual variante está ativa no momento — sem precisar reabrir a tela de detalhes/execução para confirmar.

**Why this priority**: Reduz a confusão sobre "qual exercício eu realmente vou fazer agora", especialmente relevante para quem troca de variante no meio do treino e pode esquecer qual escolheu.

**Independent Test**: Trocar a variante de um exercício, fechar a tela de detalhes, e confirmar que a identificação da variante ativa aparece visível na tela principal do exercício, sem exigir reabrir os detalhes.

**Acceptance Scenarios**:

1. **Given** o usuário trocou o exercício ativo para uma variante alternativa, **When** ele fecha a tela de detalhes e volta para a tela principal do treino, **Then** a identificação da variante ativa é exibida de forma visível junto ao exercício, sem exigir nova interação.
2. **Given** nenhuma troca de variante foi feita, **When** o usuário visualiza a tela principal do exercício, **Then** o exercício planejado original é exibido normalmente, sem nenhuma indicação de variante (comportamento atual preservado).

---

### User Story 3 - Indicador de compatibilidade genética reflete a variante ativa (Priority: P2)

O indicador de "fit" (compatibilidade genética) mostrado durante o exercício ativo passa a refletir o match real da variante que está sendo executada no momento, em vez de um valor fixo.

**Why this priority**: Hoje o valor é fixo/genérico e pode levar o usuário a acreditar que está com o encaixe genético ideal mesmo depois de trocar para uma variante com fit diferente — uma inconsistência visível que mina a confiança nesse indicador em toda a tela de treino.

**Independent Test**: Trocar entre variantes com scores de fit diferentes e confirmar que o indicador exibido na tela principal do exercício muda de acordo com a variante ativa.

**Acceptance Scenarios**:

1. **Given** duas variantes do mesmo exercício com scores de fit diferentes, **When** o usuário troca de uma para a outra, **Then** o indicador de fit exibido na tela principal do exercício muda para refletir o score da variante agora ativa.
2. **Given** nenhuma variante foi trocada (a recomendada está ativa por padrão), **When** o usuário visualiza a tela principal, **Then** o indicador de fit exibido corresponde ao score real da variante recomendada, não a um valor fixo.

### Edge Cases

- Um exercício sem variantes disponíveis não é afetado por esta mudança — comportamento atual mantido.
- Trocar de variante múltiplas vezes antes de registrar qualquer série no exercício não deixa rastro — só a variante ativa no momento em que a primeira série é registrada (ou no momento da finalização, se nenhuma série foi registrada) importa para o histórico.
- Sessões já salvas antes desta mudança não são corrigidas retroativamente — o efeito vale só para novas finalizações, como na spec 009.
- Um usuário que troca de variante sem nunca ter registrado nenhuma série nesse exercício (exercício pulado, ver spec 009) não tem nenhuma variante "executada" a registrar — o exercício continua marcado como pulado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE registrar, ao salvar uma sessão de treino, qual variante estava ativa em cada exercício no momento em que suas séries foram registradas.
- **FR-002**: O sistema DEVE manter, junto com a variante executada, a referência de qual era o exercício originalmente planejado, sem que uma informação substitua a outra.
- **FR-003**: Quando o usuário não trocar de variante em um exercício, o sistema DEVE continuar registrando esse exercício exatamente como hoje — nenhuma mudança de comportamento para o caso comum.
- **FR-004**: O sistema DEVE exibir, na tela principal do exercício ativo, sem exigir abrir a tela de detalhes/execução, qual variante está ativa no momento.
- **FR-005**: O sistema DEVE exibir, na tela principal do exercício ativo, um indicador de compatibilidade genética que reflita o score real da variante atualmente ativa, substituindo o valor fixo atual.
- **FR-006**: Quando o usuário troca de variante depois de já ter registrado ao menos uma série na variante anterior do mesmo exercício, o sistema DEVE registrar como "executada" a variante que estava ativa no momento em que a primeira série daquele exercício foi registrada — trocas de variante posteriores, feitas só para consultar outras opções sem registrar novas séries com elas, não alteram esse registro.
- **FR-007**: O histórico consultado a partir desta mudança DEVE permitir distinguir, por exercício de sessões passadas, qual foi a variante executada e qual era o exercício originalmente planejado — sem exigir alteração de sessões já existentes.

### Key Entities

- **Sessão de Treino**: registro de um treino concluído (ver spec 009); cada exercício da sessão passa a também carregar qual variante foi de fato executada, quando diferente do exercício originalmente planejado.
- **Variante**: opção alternativa de um exercício planejado (equipamento, nível, score de compatibilidade genética) já existente no plano gerado; passa a ser referenciada no registro histórico quando escolhida pelo usuário durante o treino.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das sessões salvas em que o usuário trocou de variante e registrou séries nela refletem no histórico a variante realmente executada, não a originalmente planejada.
- **SC-002**: 100% das sessões salvas em que o usuário trocou de variante continuam identificando qual era o exercício originalmente planejado, sem perda dessa informação.
- **SC-003**: Usuários que nunca trocam de variante não percebem nenhuma mudança de comportamento no fluxo de treino ou no histórico em comparação a hoje.
- **SC-004**: 100% do tempo em que uma variante alternativa está ativa, sua identificação e seu indicador de fit aparecem visíveis na tela principal do exercício, sem exigir abrir telas adicionais.

## Assumptions

- A variante "ativa por padrão" de um exercício é a variante recomendada, que já corresponde ao exercício originalmente planejado — logo, nenhum usuário percebe mudança de comportamento até trocar explicitamente de variante.
- Esta mudança vale para o mesmo fluxo de treino ativo compartilhado por qualquer plano (gerado por mesociclo ou pela geração legada de sessão única), assim como a spec 009.
- Sessões já existentes no histórico (salvas antes desta mudança) não são corrigidas retroativamente; o escopo é só sobre finalizações futuras.
- Um exercício pulado (sem nenhuma série registrada, ver spec 009) nunca tem uma "variante executada" — a distinção executado/pulado da spec 009 continua sendo a fonte de verdade para esse caso.
