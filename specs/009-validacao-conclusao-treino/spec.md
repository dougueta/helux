# Feature Specification: Validação de Conclusão de Treino

**Feature Branch**: `009-validacao-conclusao-treino`
**Created**: 2026-08-29
**Status**: Draft
**Input**: User description: "Validação de conclusão de treino: hoje é possível clicar 'Finalizar treino' sem nenhuma série registrada. Permitir pular exercícios, mas exigir confirmação explícita do usuário antes de finalizar quando houver exercícios pulados ou nenhuma série registrada — não deve ser possível finalizar silenciosamente um treino vazio ou incompleto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aviso ao finalizar treino com exercícios pulados (Priority: P1)

Um usuário está no meio de um treino, decide não fazer um ou mais exercícios do plano (por tempo, cansaço, falta de equipamento) e toca em "Finalizar treino". Antes de o treino ser salvo, o sistema avisa explicitamente quantos exercícios ficaram sem nenhuma série registrada e pede confirmação para prosseguir.

**Why this priority**: É o núcleo do problema relatado — hoje o treino é salvo silenciosamente mesmo incompleto, o que compromete a confiança nos dados de histórico (usados por outras funcionalidades para acompanhar evolução e ajustar cargas futuras).

**Independent Test**: Iniciar um treino, pular pelo menos um exercício (não registrar nenhuma série nele), tocar em "Finalizar treino" e confirmar que aparece um aviso nomeando a quantidade de exercícios pulados antes de qualquer gravação ocorrer.

**Acceptance Scenarios**:

1. **Given** um treino ativo com 5 exercícios, onde 2 não têm nenhuma série registrada, **When** o usuário toca em "Finalizar treino", **Then** o sistema exibe uma confirmação informando que 2 exercícios serão salvos como pulados, antes de gravar a sessão.
2. **Given** a confirmação de exercícios pulados está sendo exibida, **When** o usuário cancela, **Then** o treino não é salvo e o usuário permanece na tela de treino ativo, podendo continuar registrando séries.
3. **Given** a confirmação de exercícios pulados está sendo exibida, **When** o usuário confirma, **Then** o treino é salvo e o usuário segue para a tela de conclusão normalmente.

---

### User Story 2 - Bloqueio de finalização de treino totalmente vazio sem aviso (Priority: P1)

Um usuário abre a tela de treino e, sem registrar nenhuma série em nenhum exercício, tenta finalizar imediatamente. O sistema trata esse caso com a mesma confirmação explícita da User Story 1 (todos os exercícios contam como pulados), nunca permitindo a gravação silenciosa de uma sessão vazia.

**Why this priority**: É o caso extremo do mesmo problema e o mais prejudicial aos dados — uma sessão totalmente vazia no histórico não tem nenhum valor informativo e pode distorcer análises futuras de progressão.

**Independent Test**: Abrir um treino e tocar em "Finalizar treino" sem registrar nenhuma série; confirmar que a mesma confirmação explícita aparece (mencionando todos os exercícios como pulados) e que cancelar impede a gravação.

**Acceptance Scenarios**:

1. **Given** um treino ativo recém-iniciado, nenhuma série registrada em nenhum exercício, **When** o usuário toca em "Finalizar treino", **Then** o sistema exibe a confirmação explícita antes de permitir salvar, sem exceção para o caso "vazio".

---

### User Story 3 - Registro correto de quais exercícios foram pulados (Priority: P2)

Depois que um treino com exercícios pulados é confirmado e salvo, o histórico distingue quais exercícios foram efetivamente executados (com ao menos uma série) e quais foram pulados, para que análises futuras de progressão não tratem "pulado" como "executado com carga zero".

**Why this priority**: Não é visível diretamente ao usuário no momento da ação, mas é o que dá valor à User Story 1/2 a médio prazo — sem essa distinção salva, o esforço de avisar o usuário não protege as funcionalidades futuras que dependem de histórico confiável.

**Independent Test**: Confirmar a finalização de um treino com exercícios pulados e verificar, na sessão salva, que os exercícios pulados estão identificáveis separadamente dos executados.

**Acceptance Scenarios**:

1. **Given** um treino salvo após confirmação com 2 exercícios pulados de 5, **When** essa sessão é consultada no histórico, **Then** os 2 exercícios pulados são identificáveis como tal, distintos dos 3 executados.

### Edge Cases

- Um exercício com pelo menos uma série registrada (mesmo que menos séries que o planejado) conta como **executado**, não como pulado — a confirmação só lista exercícios com zero séries.
- Se o usuário cancelar a confirmação e depois registrar ao menos uma série a mais antes de tentar finalizar de novo, a lista de exercícios pulados apresentada na nova tentativa deve refletir o estado atualizado.
- Um treino onde todos os exercícios foram executados normalmente (nenhum pulado) não deve exibir confirmação alguma — o fluxo de finalização permanece direto, sem fricção adicional.
- Sessões já salvas antes desta mudança (incluindo sessões vazias existentes) não são alteradas retroativamente — o efeito vale só para novas finalizações.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE verificar, no momento em que o usuário solicita finalizar o treino, se algum exercício do plano não tem nenhuma série registrada.
- **FR-002**: Quando um ou mais exercícios não tiverem nenhuma série registrada, o sistema DEVE exibir uma confirmação explícita antes de salvar, informando a quantidade de exercícios que serão registrados como pulados.
- **FR-003**: O sistema DEVE exibir essa mesma confirmação mesmo quando **todos** os exercícios do treino estiverem sem nenhuma série registrada (treino totalmente vazio) — não deve haver exceção que permita salvar esse caso sem aviso.
- **FR-004**: Se o usuário cancelar a confirmação, o sistema NÃO DEVE salvar o treino, mantendo o usuário na tela de treino ativo.
- **FR-005**: Se o usuário confirmar, o sistema DEVE salvar o treino normalmente, prosseguindo ao fluxo de conclusão já existente.
- **FR-006**: O sistema NÃO DEVE exibir confirmação alguma quando todos os exercícios tiverem ao menos uma série registrada — o fluxo de finalização direto atual permanece inalterado para o caso comum.
- **FR-007**: Ao salvar uma sessão com exercícios pulados, o sistema DEVE registrar de forma distinguível quais exercícios foram executados e quais foram pulados.
- **FR-008**: O sistema DEVE impedir, em qualquer camada onde a gravação da sessão ocorre, que um treino seja registrado com séries pendentes de confirmação — a validação não pode ser contornável pulando a interface (ex: uma chamada direta que tente salvar uma sessão vazia sem o sinal de confirmação deve ser rejeitada).

### Key Entities

- **Sessão de Treino**: registro de um treino concluído; passa a carregar, por exercício, se ele foi executado (ao menos uma série) ou pulado.
- **Exercício da Sessão**: item individual do plano executado numa sessão; ganha um estado explícito de "executado" ou "pulado" em vez de ser inferido apenas pela ausência de séries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das tentativas de finalizar um treino com pelo menos um exercício sem séries registradas resultam em uma confirmação explícita antes de qualquer gravação.
- **SC-002**: 0% das sessões salvas a partir desta mudança contêm exercícios pulados sem que o usuário tenha confirmado explicitamente essa finalização.
- **SC-003**: Usuários que completam todos os exercícios normalmente não percebem nenhuma etapa ou tempo adicional no fluxo de finalização em comparação ao comportamento atual.
- **SC-004**: 100% das novas sessões salvas permitem distinguir, exercício a exercício, se foi executado ou pulado — habilitando análises de progressão futuras a excluir exercícios pulados do cálculo.

## Assumptions

- Um exercício é considerado "pulado" quando não tem nenhuma série registrada no momento da finalização; um exercício com pelo menos uma série (mesmo que menos do que o planejado) conta como executado, não como pulado.
- A confirmação é uma única etapa (um diálogo/alerta com opção de confirmar ou cancelar), não um fluxo de múltiplas telas.
- Esta mudança vale para o fluxo de treino ativo compartilhado por qualquer plano (gerado por mesociclo ou pela geração legada de sessão única) — a tela e a lógica de finalização são as mesmas independentemente de como o plano foi gerado.
- Sessões já existentes no histórico (incluindo eventuais sessões vazias salvas antes desta mudança) não são corrigidas retroativamente; o escopo é só sobre finalizações futuras.
