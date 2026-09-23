# Feature Specification: Salvar o Treino ao Concluir

**Feature Branch**: `016-salvar-treino-ao-concluir`
**Created**: 2026-09-22
**Status**: Draft
**Input**: User description: "Salvar a sessão de treino ao confirmar a finalização, não ao tocar 'Voltar ao início' (débito técnico TD-007). Hoje a tela 'Treino concluído' afirma que o Helux registrou as cargas, mas o salvamento só acontece se o usuário tocar 'Voltar ao início'; se sair por outro caminho (fechar a aba, menu inferior, voltar do navegador) a sessão não é salva."

## Contexto

Problema confirmado em teste manual em 2026-09-22. Ao finalizar o treino (direto, ou após confirmar exercícios pulados — spec 009), o app mostra a tela "Treino concluído — Mandou bem! O Helux registrou suas cargas e vai recalibrar o próximo treino." sem ter gravado nada. A gravação só ocorre quando o usuário toca "Voltar ao início". Qualquer outra saída deixa o treino sem registro no histórico, embora a tela tenha dito o contrário. O treino continua guardado localmente e reabrir a tela de treino o retoma, mas o usuário não sabe disso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Treino é gravado no momento da conclusão (Priority: P1)

O usuário termina o último exercício e toca em "Finalizar treino" (confirmando os exercícios pulados, se houver). O treino é gravado nesse momento. Depois disso, ele pode sair da tela por qualquer caminho — botão "Voltar ao início", menu inferior, botão voltar do navegador ou fechando a aba — e o treino aparece no histórico.

**Why this priority**: É o defeito em si: dados de treino perdidos silenciosamente comprometem o histórico e a recalibração de cargas, que são o valor central do Helux.

**Independent Test**: Concluir um treino, esperar a tela de conclusão confirmar o registro e sair pelo menu inferior (sem tocar "Voltar ao início"); o treino deve constar no histórico.

**Acceptance Scenarios**:

1. **Given** um treino ativo sem exercícios pulados, no último exercício, **When** o usuário toca "Finalizar treino", **Then** o sistema inicia a gravação imediatamente, sem depender de nenhum toque adicional.
2. **Given** um treino com exercícios pulados, **When** o usuário confirma a finalização no aviso de exercícios pulados, **Then** o sistema inicia a gravação imediatamente.
3. **Given** a gravação foi concluída com sucesso, **When** o usuário sai por qualquer caminho, **Then** o treino consta no histórico e não é mais retomado ao reabrir a tela de treino.
4. **Given** o aviso de exercícios pulados está aberto, **When** o usuário cancela, **Then** nada é gravado e ele continua no treino (comportamento da spec 009 preservado).

---

### User Story 2 - A tela de conclusão só afirma o registro depois que ele aconteceu (Priority: P1)

Enquanto o treino está sendo gravado, a tela de conclusão mostra que está salvando. Só depois do sucesso ela exibe a mensagem de que o Helux registrou as cargas. Se a gravação falhar (sem conexão, erro do servidor), a tela informa o erro e oferece tentar de novo, sem perder o treino.

**Why this priority**: A mensagem falsa de sucesso é o que torna o defeito invisível ao usuário; honestidade no feedback é tão crítica quanto a gravação em si.

**Independent Test**: Simular falha na gravação ao finalizar; a tela deve mostrar erro e a opção "Tentar novamente", e o treino deve continuar retomável; em seguida, com a gravação funcionando, tentar novamente deve registrar e exibir a mensagem de sucesso.

**Acceptance Scenarios**:

1. **Given** a gravação está em andamento, **When** a tela de conclusão é exibida, **Then** ela mostra o estado "Salvando treino…" e não afirma que o treino foi registrado.
2. **Given** a gravação terminou com sucesso, **Then** a tela exibe "Treino concluído" com a mensagem de registro e o resumo (séries e minutos).
3. **Given** a gravação falhou, **Then** a tela exibe uma mensagem de erro clara, um botão "Tentar novamente" e um botão "Voltar ao treino"; o treino permanece guardado localmente e retomável.
4. **Given** a gravação falhou, **When** o usuário toca "Tentar novamente" e a gravação agora funciona, **Then** a tela passa para o estado de sucesso.
5. **Given** a gravação falhou, **When** o usuário toca "Voltar ao treino", **Then** ele retorna à tela do treino ativo com todas as séries registradas intactas.

---

### User Story 3 - Nenhum treino gravado em duplicidade (Priority: P2)

Toques repetidos (duplo toque em "Finalizar treino", em "Tentar novamente" ou em "Voltar ao início") nunca geram duas gravações do mesmo treino. "Voltar ao início" apenas navega para a tela inicial.

**Why this priority**: Duplicatas distorceriam volume semanal e progressão, mas é um risco secundário comparado à perda de dados.

**Independent Test**: Tocar duas vezes rapidamente no botão de finalizar e depois em "Voltar ao início"; deve haver exatamente uma gravação.

**Acceptance Scenarios**:

1. **Given** uma gravação em andamento, **When** o usuário aciona a finalização novamente, **Then** nenhuma segunda gravação é iniciada.
2. **Given** a gravação já teve sucesso, **When** o usuário toca "Voltar ao início", **Then** o app navega para a tela inicial sem gravar de novo.

### Edge Cases

- Usuário sai da tela enquanto a gravação está em andamento: se a gravação não chegar ao servidor, o treino continua guardado localmente e é retomado ao reabrir a tela de treino (comportamento atual preservado).
- Gravação falha e o usuário sai sem tentar de novo: o treino não é perdido; reabrir a tela de treino o retoma.
- Após o sucesso, o treino local é descartado; a tela de conclusão continua exibindo o resumo (séries e minutos) e não redireciona sozinha para a tela inicial.
- Treino com todos os exercícios pulados (confirmado pelo aviso da spec 009): é gravado da mesma forma que hoje.
- A variante executada de cada exercício (spec 010) é gravada exatamente como hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE iniciar a gravação da sessão de treino no momento em que o usuário finaliza o treino (toque em "Finalizar treino" sem pulados, ou confirmação no aviso de pulados), sem exigir nenhuma ação adicional.
- **FR-002**: A tela de conclusão DEVE exibir um estado de "salvando" enquanto a gravação está em andamento, sem afirmar que o treino foi registrado.
- **FR-003**: A tela de conclusão DEVE exibir a mensagem de registro ("O Helux registrou suas cargas…") somente após a gravação ter sucesso.
- **FR-004**: Em caso de falha, a tela DEVE exibir uma mensagem de erro, uma ação "Tentar novamente" (que repete a gravação) e uma ação "Voltar ao treino" (que retorna ao treino ativo).
- **FR-005**: O treino guardado localmente DEVE ser descartado somente após a gravação ter sucesso; em falha, DEVE permanecer intacto e retomável.
- **FR-006**: O sistema DEVE impedir gravações concorrentes ou repetidas do mesmo treino (no máximo uma gravação em andamento; nenhuma nova gravação após sucesso).
- **FR-007**: "Voltar ao início" DEVE apenas navegar para a tela inicial, sem gravar, e só é oferecido após o sucesso.
- **FR-008**: Após o sucesso, a tela de conclusão DEVE permanecer visível (com o resumo de séries e minutos) até o usuário sair, sem redirecionamento automático.
- **FR-009**: O conteúdo gravado (exercícios, séries, pulados, variante executada, data e duração) DEVE ser idêntico ao gravado hoje; o fluxo de confirmação de exercícios pulados (spec 009) e a regra de variante executada (spec 010) NÃO DEVEM mudar.

### Key Entities

- **Sessão de treino concluída**: o registro gravado no histórico ao finalizar (data, duração, exercícios com séries, pulados e variante executada). Conteúdo inalterado por esta spec; muda apenas o momento da gravação.
- **Estado de finalização**: situação transitória da tela de conclusão — salvando, salvo ou falhou.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos treinos finalizados com gravação bem-sucedida aparecem no histórico, independentemente do caminho pelo qual o usuário sai da tela de conclusão.
- **SC-002**: Em 0% dos casos a tela afirma que o treino foi registrado antes de a gravação ter sucesso.
- **SC-003**: Em caso de falha de gravação, 0 treinos são perdidos: o treino permanece retomável e pode ser gravado com "Tentar novamente".
- **SC-004**: Cada finalização gera no máximo 1 registro no histórico, mesmo com toques repetidos.

## Assumptions

- A gravação começa junto com a exibição da tela de conclusão (o usuário vê "Salvando treino…" em vez de a tela de treino ficar travada); a tela de conclusão passa a ter três estados: salvando, salvo e erro.
- Em erro, as ações oferecidas são "Tentar novamente" e "Voltar ao treino"; não há "Voltar ao início" no estado de erro, para não sugerir que o treino foi salvo (o usuário ainda pode sair pelo menu, e o treino continua retomável).
- Não há gravação automática em segundo plano ao sair durante "salvando"/"erro", nem fila offline; isso fica fora do escopo. A retomada do treino guardado localmente já cobre a perda.
- Caso raro fora de escopo: se a gravação chega ao servidor mas a resposta se perde (ex.: aba fechada no instante exato), o treino local não é descartado e uma nova finalização poderia duplicá-lo. Idempotência no servidor exigiria mudar a API, o que esta spec não faz.
- Nenhuma mudança na API, no formato dos dados gravados ou no banco (nenhuma migration).
- O resumo exibido (séries concluídas e minutos) é calculado no momento da finalização.
