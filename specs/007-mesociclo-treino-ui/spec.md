# Feature Specification: Visibilidade do Mesociclo na Home

**Feature Branch**: `007-mesociclo-treino-ui`
**Created**: 2026-07-21
**Status**: Draft
**Input**: User description: "Visibilidade dos próximos treinos do mesociclo na home: além do treino de hoje em destaque (já ajustado por recovery), o usuário deve ver os próximos treinos do ciclo atual (letra/foco, sem datas fixas), um indicador quando o treino do dia foi ajustado por recovery, e um indicador de progresso do mesociclo (quantos treinos concluídos/restantes). Depende dos dados produzidos pela especificação de backend do mesociclo (006-mesociclo-treino-backend)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ver o treino de hoje e saber se foi ajustado por recovery (Priority: P1)

O usuário abre o app e vê, em destaque, o treino que deve fazer hoje — já com qualquer ajuste de volume/carga aplicado por causa do seu estado de recuperação — e consegue perceber imediatamente se esse ajuste aconteceu ou não.

**Why this priority**: É a tela que o usuário vê primeiro sempre que abre o app; sem isso não há valor visível da nova geração em mesociclo nem do ajuste por recovery.

**Independent Test**: Pode ser testado abrindo a home em dois cenários (com e sem ajuste por recovery aplicado ao treino do dia) e verificando que o indicador de ajuste aparece apenas quando aplicável.

**Acceptance Scenarios**:

1. **Given** que o treino do dia foi reduzido por recovery comprometido, **When** o usuário abre a home, **Then** o card do treino de hoje exibe um indicador visual claro de que houve ajuste.
2. **Given** que o treino do dia não sofreu nenhum ajuste (recovery bom ou sem dados), **When** o usuário abre a home, **Then** o card do treino de hoje é exibido normalmente, sem o indicador de ajuste.

---

### User Story 2 — Ver os próximos treinos do mesociclo (Priority: P1)

O usuário quer, ao abrir a home, ter uma ideia do que vem depois do treino de hoje — quais treinos fazem parte do ciclo atual e em que ordem — sem precisar navegar para outra tela.

**Why this priority**: É o pedido central desta mudança: dar visibilidade ao plano completo, não só à sessão do dia.

**Independent Test**: Pode ser testado abrindo a home com um mesociclo ativo contendo múltiplas sessões pendentes e verificando que as sessões após a de hoje aparecem listadas, na ordem correta, com sua identificação (ex.: letra/foco muscular).

**Acceptance Scenarios**:

1. **Given** um mesociclo ativo com o treino de hoje e mais 2 treinos pendentes, **When** o usuário abre a home, **Then** os 2 próximos treinos aparecem listados abaixo do treino de hoje, na ordem em que serão feitos, cada um com sua identificação de foco/grupo muscular.
2. **Given** que a lista de próximos treinos é exibida, **When** o usuário a observa, **Then** nenhuma data específica é mostrada para os próximos treinos (a ordem é por sequência, não por calendário).
3. **Given** que o usuário conclui o treino de hoje, **When** ele reabre o app depois, **Then** a lista de próximos treinos reflete o avanço — o treino que era "próximo" agora aparece em destaque como o treino do dia.

---

### User Story 3 — Ver o progresso dentro do mesociclo (Priority: P2)

O usuário quer entender rapidamente em que ponto do ciclo atual ele está — quantos treinos já concluiu e quantos faltam para fechar o mesociclo.

**Why this priority**: Reforça a sensação de progresso e de que existe um plano maior em andamento, mas não é indispensável para a funcionalidade central (ver hoje + ver próximos).

**Independent Test**: Pode ser testado com mesociclos em diferentes estados de conclusão (0%, parcialmente concluído, quase completo) e verificando que o indicador de progresso reflete a contagem correta.

**Acceptance Scenarios**:

1. **Given** um mesociclo com 4 sessões totais e 1 já concluída, **When** o usuário abre a home, **Then** o indicador de progresso mostra 1 de 4 sessões concluídas.
2. **Given** que a última sessão do mesociclo acaba de ser concluída, **When** o usuário abre a home antes do novo ciclo estar pronto, **Then** a tela comunica esse estado de transição de forma clara, sem parecer quebrada ou vazia.

---

### Edge Cases

- O que acontece quando o usuário ainda não tem nenhum mesociclo gerado (primeiro uso do produto)?
- O que acontece quando o mesociclo atual tem poucas sessões (ex.: 2 dias/semana) — a lista de próximos treinos deve continuar fazendo sentido visualmente com poucos itens?
- O que acontece quando não há dados de recovery suficientes para determinar se houve ajuste (o indicador de ajuste não deve aparecer de forma enganosa)?
- Como a tela se comporta em telas pequenas (iPhone) quando o mesociclo tem muitas sessões futuras — a lista deve permitir rolagem sem quebrar o layout de uma mão só?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A home DEVE continuar exibindo o treino do dia (sessão pendente atual) em destaque, incluindo qualquer ajuste por recovery já aplicado.
- **FR-002**: Quando o treino do dia tiver sido ajustado por recovery, a home DEVE exibir um indicador visual distinto comunicando que houve ajuste.
- **FR-003**: A home DEVE exibir uma lista ou carrossel dos próximos treinos do mesociclo ativo, na ordem em que serão realizados, cada um identificado ao menos por seu foco/grupo muscular.
- **FR-004**: A lista de próximos treinos NÃO DEVE exibir datas ou dias da semana fixos, refletindo que a progressão do ciclo é por conclusão de sessão, não por calendário.
- **FR-005**: A home DEVE exibir um indicador de progresso do mesociclo atual, mostrando quantas sessões já foram concluídas em relação ao total do ciclo.
- **FR-006**: Quando não houver mesociclo ativo disponível (primeiro uso, ou aguardando a geração do próximo ciclo após a conclusão do anterior), a home DEVE comunicar esse estado de forma clara ao usuário, sem exibir listas vazias sem contexto ou erros genéricos.
- **FR-007**: Toda a experiência DEVE permanecer utilizável em uma mão em iPhone, seguindo os mesmos padrões de responsividade e toque já estabelecidos no restante do produto.

### Key Entities

- **Mesociclo ativo** (consumido, não definido por esta spec): conjunto ordenado de treinos com identificação de foco/grupo muscular e estado de conclusão, conforme produzido pela especificação de backend `006-mesociclo-treino-backend`.
- **Ajuste por recovery** (consumido, não definido por esta spec): indicação de que o treino do dia foi modificado em relação à prescrição original do mesociclo, também produzida pela especificação de backend.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao abrir o app, o usuário vê tanto o treino de hoje quanto pelo menos os 2 próximos treinos do ciclo, sem precisar navegar para outra tela.
- **SC-002**: O usuário identifica se o treino do dia foi ajustado por recovery em poucos segundos, sem precisar ler texto explicativo longo.
- **SC-003**: O usuário consegue dizer quantas sessões faltam para terminar o mesociclo atual apenas olhando a home.
- **SC-004**: A home nunca exibe um estado quebrado ou confuso quando não há mesociclo ativo (primeiro uso ou transição entre ciclos) — sempre há uma mensagem clara sobre o que está acontecendo.

---

## Assumptions

- Esta especificação depende inteiramente dos dados produzidos pela especificação de backend `006-mesociclo-treino-backend` (mesociclo ativo, sessão do dia já ajustada, estado de conclusão de cada sessão) — não define como esses dados são gerados ou persistidos.
- Reaproveita os padrões visuais e componentes de UI já estabelecidos no produto (cards, badges, indicadores de progresso) sempre que aplicável, em vez de introduzir um novo sistema visual.
- Uma tela dedicada e separada para visualizar o mesociclo completo (ex.: "Meu Plano") está fora do escopo desta especificação — o foco é a visibilidade na home.
- O produto continua de uso pessoal (usuário único), sem necessidade de suportar múltiplos perfis simultâneos.
