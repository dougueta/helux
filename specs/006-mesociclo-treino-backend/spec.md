# Feature Specification: Geração de Mesociclo de Treino com Ajuste por Recovery

**Feature Branch**: `006-mesociclo-treino-backend`
**Created**: 2026-07-21
**Status**: Draft
**Input**: User description: "Fase 3.5 — Geração de mesociclo de treino: substituir a geração diária de 1 sessão por vez por um mesociclo completo (ciclo de divisão muscular A/B/C/D, gerado de uma só vez via IA com o mesmo prompt/regras de periodização já existentes). A "próxima sessão" é a primeira sessão não concluída do mesociclo. O gatilho de regeneração em background só dispara uma nova geração quando todas as sessões do mesociclo atual estiverem concluídas (fila avança só ao completar, não por data). Ajuste do treino do dia por recovery é determinístico (sem chamada IA extra): aplicado em tempo de leitura, ajustando séries/carga/descanso da próxima sessão pendente conforme o HRV do dia, sem mutar o plano armazenado. Este é o spec de backend (packages/ai, packages/types, apps/api, persistência); a UI (carrossel de próximos treinos na home) é um spec separado que consome esses dados."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar um mesociclo completo de treino (Priority: P1)

O usuário (Doug) quer, ao concluir seu mesociclo atual (ou na primeira vez que usa o produto), receber de uma só vez o próximo ciclo completo de treinos — não apenas a próxima sessão isolada — já estruturado segundo a divisão muscular adequada aos seus dias disponíveis por semana e ao seu perfil genético.

**Why this priority**: É a mudança central pedida — hoje o sistema gera uma sessão por vez a cada treino concluído; sem essa mudança nenhuma visibilidade de "próximos treinos" é possível.

**Independent Test**: Pode ser testado disparando a geração de um mesociclo com um `PlanInput` válido e verificando que o resultado contém múltiplas sessões ordenadas, cada uma com sua identificação de posição no ciclo (ex.: Treino A, B, C…) e prescrição completa.

**Acceptance Scenarios**:

1. **Given** um perfil genético parseado, restrições derivadas, histórico de treinos e dados de recuperação recentes, **When** o sistema gera um novo mesociclo, **Then** o resultado contém todas as sessões do ciclo (uma por letra da divisão aplicável aos dias/semana do usuário), cada uma com exercícios, séries, repetições e carga sugerida.
2. **Given** que o usuário está iniciando o programa (sem histórico), **When** o mesociclo é gerado, **Then** a primeira sessão do ciclo é o Treino A.
3. **Given** que `ANTHROPIC_API_KEY` não está configurada, **When** o sistema tenta gerar um mesociclo, **Then** o mesociclo anterior (se existir) continua disponível para consulta e o erro de geração é reportado de forma clara, sem apagar o ciclo vigente.

---

### User Story 2 — Consultar o treino do dia ajustado pelo recovery (Priority: P1)

O usuário quer, ao abrir o app, ver o próximo treino pendente do seu mesociclo já ajustado (volume/carga/descanso) de acordo com o seu estado de recuperação daquele dia — sem precisar gerar um novo plano e sem esperar uma nova chamada à IA.

**Why this priority**: É o comportamento que substitui a "justificativa narrativa" de recovery que hoje só aparece no texto gerado pela IA — agora precisa alterar a prescrição de fato, instantaneamente.

**Independent Test**: Pode ser testado consultando o treino do dia em dois momentos com dados de recovery diferentes (ex.: HRV bom vs. HRV comprometido) e verificando que a prescrição retornada (séries/carga/descanso) muda de acordo, sem nova chamada ao serviço de IA.

**Acceptance Scenarios**:

1. **Given** um mesociclo ativo com uma sessão pendente e dados de recovery do dia indicando boa recuperação, **When** o usuário consulta o treino do dia, **Then** a sessão é retornada com a prescrição original do mesociclo, sem reduções.
2. **Given** a mesma sessão pendente e dados de recovery do dia indicando recuperação comprometida, **When** o usuário consulta o treino do dia, **Then** a sessão é retornada com volume e/ou carga reduzidos, e o mesociclo armazenado permanece inalterado (a próxima consulta em dia de recovery normal volta a mostrar a prescrição original).
3. **Given** nenhum dado de recovery disponível para o dia, **When** o usuário consulta o treino do dia, **Then** a sessão é retornada sem ajuste, com a prescrição original do mesociclo.

---

### User Story 3 — Progressão do mesociclo por conclusão (Priority: P2)

O usuário quer que a fila de treinos avance apenas quando ele efetivamente completa uma sessão — pular um dia não deve "queimar" um treino do ciclo — e quer que um novo mesociclo seja gerado automaticamente assim que o atual terminar, sem precisar solicitar manualmente.

**Why this priority**: Garante que a experiência funcione mesmo com dias pulados (realidade do usuário) e que o app nunca fique "sem próximo treino" depois de terminar um ciclo.

**Independent Test**: Pode ser testado concluindo sessões em sequência (inclusive pulando dias entre elas) e verificando que a sessão "próxima" só avança após cada conclusão registrada, e que um novo mesociclo aparece automaticamente assim que a última sessão do ciclo anterior é concluída.

**Acceptance Scenarios**:

1. **Given** um mesociclo com a sessão B como próxima pendente, **When** o usuário não treina por vários dias, **Then** a sessão próxima continua sendo a sessão B ao reabrir o app.
2. **Given** um mesociclo com a sessão B como próxima pendente, **When** o usuário conclui e registra essa sessão, **Then** a próxima sessão pendente passa a ser a sessão C (ou a próxima da sequência).
3. **Given** um mesociclo em que a última sessão acabou de ser concluída, **When** o sistema processa essa conclusão, **Then** um novo mesociclo é gerado automaticamente em segundo plano, ficando disponível para consulta sem ação adicional do usuário.

---

### Edge Cases

- O que acontece quando o histórico de treinos está vazio (primeiro mesociclo do usuário)?
- O que acontece quando não há dados de recovery para o dia da consulta?
- O que acontece se a IA retornar um mesociclo com menos sessões do que o esperado para os dias/semana configurados, ou em formato inesperado?
- O que acontece se a geração do próximo mesociclo falhar logo após a conclusão da última sessão do ciclo anterior (usuário fica sem "próximo treino")?
- O que acontece se o usuário completar uma sessão fora de ordem (ex.: pula a sessão pendente e registra manualmente uma sessão diferente)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE gerar, numa única solicitação, um mesociclo completo de treino contendo múltiplas sessões ordenadas, cobrindo a divisão muscular adequada aos dias disponíveis por semana e à predisposição genética do usuário.
- **FR-002**: Cada sessão do mesociclo DEVE conter a mesma prescrição completa hoje disponível por sessão individual (exercícios, séries, faixa de repetições, carga sugerida, notas) mais sua identificação de posição no ciclo (ex.: letra/foco muscular).
- **FR-003**: O sistema DEVE determinar a "sessão pendente atual" do mesociclo ativo como a primeira sessão do ciclo ainda não concluída.
- **FR-004**: Ao consultar o treino do dia, o sistema DEVE aplicar um ajuste automático de volume, carga e/ou descanso à sessão pendente atual com base nos dados de recuperação mais recentes, sem depender de uma nova chamada ao serviço de IA.
- **FR-005**: O ajuste por recovery NÃO DEVE alterar permanentemente a prescrição armazenada do mesociclo — deve ser recalculado a cada consulta, refletindo sempre o recovery mais recente disponível.
- **FR-006**: Ao registrar a conclusão de uma sessão de treino, o sistema DEVE marcar a sessão correspondente do mesociclo ativo como concluída.
- **FR-007**: O sistema só DEVE disparar a geração de um novo mesociclo quando todas as sessões do mesociclo ativo estiverem marcadas como concluídas.
- **FR-008**: Todas as sessões geradas dentro de um mesociclo DEVEM respeitar as restrições de treino derivadas do perfil genético do usuário (frequência máxima semanal, volume preferido, exercícios proibidos, limite de intensidade cardio).
- **FR-009**: Quando a geração de um novo mesociclo falhar (ex.: chave de acesso à IA ausente ou erro do serviço), o sistema DEVE preservar o mesociclo anterior disponível para consulta e reportar o erro de forma clara.
- **FR-010**: O sistema DEVE continuar suportando a consulta do mesociclo ativo (incluindo suas sessões futuras, não apenas a pendente atual) para uso por funcionalidades de visibilidade dos próximos treinos.

### Key Entities

- **MesocyclePlan**: O ciclo de treino gerado — contém a data de geração, a divisão muscular aplicada, os dias por semana considerados, a lista ordenada de sessões e a justificativa geral do ciclo.
- **MesocycleSession**: Uma sessão individual dentro do mesociclo — posição no ciclo (letra/foco), lista de exercícios com prescrição completa, e estado de conclusão (pendente ou concluída, com data de conclusão quando aplicável).
- **RecoveryAdjustment**: O resultado do ajuste determinístico aplicado a uma sessão pendente no momento da consulta — não é persistido, é derivado a cada leitura a partir da sessão original e do recovery mais recente.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma única solicitação de geração produz um mesociclo com todas as sessões da divisão muscular esperada para os dias/semana do usuário (ex.: 4 sessões para uma divisão ABCD).
- **SC-002**: A prescrição do treino do dia reflete o recovery mais recente do usuário imediatamente ao abrir o app, sem tempo de espera perceptível associado a geração de IA.
- **SC-003**: Em pelo menos 95% das aberturas do app após um dia sem treino, a sessão pendente exibida é a mesma que estava pendente antes — nenhuma sessão do ciclo é "pulada" por causa de dias sem treino.
- **SC-004**: Um novo mesociclo fica disponível para consulta em até alguns minutos após a conclusão da última sessão do ciclo anterior, sem exigir nenhuma ação manual do usuário.
- **SC-005**: Quando a geração automática do próximo mesociclo falha, o usuário nunca fica sem nenhum plano para consultar — o ciclo anterior permanece acessível até que a geração seja bem-sucedida.

---

## Assumptions

- A geração de cada sessão do mesociclo reaproveita o mecanismo de IA e as regras de periodização (divisão A/B/C/D, respeito a descanso muscular, variedade de exercícios) já validadas na geração de sessão única existente.
- Os limiares de recovery usados hoje apenas narrativamente pela IA (HRV ≥60 boa recuperação, 40–59 moderada, <40 comprometida) são reaproveitados como base do ajuste determinístico, mas a lógica exata de quanto reduzir/aumentar é definida na fase de planejamento técnico.
- A visibilidade dos próximos treinos na interface (ex.: lista/carrossel na tela inicial) é tratada em uma especificação separada, que consome os dados do mesociclo produzidos por esta funcionalidade.
- O produto continua de uso pessoal (usuário único), sem necessidade de suportar múltiplos perfis simultâneos.
- Um mesociclo tem duração aproximada de algumas semanas (definida pela divisão muscular e dias/semana disponíveis), sem calendário de datas fixas — a progressão é sempre por conclusão de sessão, nunca por data.
