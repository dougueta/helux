# Feature Specification: Módulo de rotinas diárias e complementares (alongamento, abdominal e cardio)

**Feature Branch**: `030-rotinas-complementares`  
**Created**: 2026-11-08  
**Status**: Draft  
**Input**: User description: "Especificar módulo distinto do Helux: hoje o treino é composto por exercícios de academia, mas por exemplo, se eu tivesse um módulo de exercícios diários de alongamento, ou abdominal ou cardio. Pode ser que eu faça cardio de manhã e treine à noite na academia, ou faça uma rotina de alongamentos para potencializar o resultado dos treinos."

## Contexto

Hoje o treino no Helux funciona como uma fila única de sessões do mesociclo (A → B → C → D). Mesmo com fases de aquecimento e volta à calma dentro da sessão (spec 014) e sessões dedicadas na semana (spec 024), há três limitações práticas para quem quer fazer mais de uma atividade no dia ou manter hábitos diários fora da academia:

1. **Uma única sessão por vez na fila**: quando o cardio ou a mobilidade entra como sessão avulsa do mesociclo, ele ocupa o lugar do treino do dia até ser concluído; quando fica preso dentro da sessão de academia (volta à calma), não dá para fazer o cardio de manhã e a musculação à noite separadamente.
2. **Sem rotinas diárias recorrentes**: alongamento/mobilidade diária e rotinas rápidas de core/abdominal têm cadência própria (todo dia ou X vezes por semana, em casa ou na academia, em 5–15 min) e não seguem a rotação de cargas da musculação.
3. **Treino ativo único**: hoje só pode existir uma sessão em andamento; abrir outra atividade substituiria o treino de academia em aberto.

Esta feature cria um **módulo próprio de Rotinas Complementares** (Alongamento & Mobilidade, Core / Abdominal e Cardio), paralelo ao treino de academia, mas integrado ao perfil, às condições de saúde, ao catálogo visual (spec 028) e à análise do mesociclo (spec 024). As sessões avulsas de cardio e mobilidade deixam de ocupar letras na fila A/B/C/D do mesociclo (que fica dedicada aos treinos de academia) e passam a viver neste módulo complementar.

## Clarifications

### Session 2026-11-08

- Q: Onde o módulo de Rotinas Complementares deve ficar na interface do Helux? → A: Sub-aba em Treinos (`Academia` | `Rotinas`) + seção de Rotinas do Dia na Home (FR-001, FR-012).
- Q: Como ficam as sessões de cardio e mobilidade que hoje entram como dias avulsos na fila A/B/C/D do mesociclo (spec 024)? → A: Migram para Rotinas Complementares — a fila A/B/C/D do mesociclo fica exclusiva para os treinos de academia, e cardio/alongamento/abdominal vivem no módulo complementar; aquecimento e volta à calma curtos dentro da sessão de academia continuam existindo (FR-002a).
- Q: Como as rotinas de Alongamento, Abdominal e Cardio são montadas para o usuário? → A: Prescrição determinística instantânea sobre o catálogo (usando objetivo, condições articulares e foco do mesociclo), com opção de ajustar foco, frequência e duração a qualquer momento sem gastar chamada de IA (FR-005, FR-008).
- Q: Qual variedade de rotinas deve existir dentro de cada categoria (Alongamento, Abdominal, Cardio)? → A: Uma única rotina fixa por categoria durante todo o mesociclo: 1 de Alongamento & Mobilidade, 1 de Core / Abdominal e 1 de Cardio (FR-001a).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executar rotinas complementares no mesmo dia do treino de academia (Priority: P1)

Na aba **Treinos** (sub-aba **Rotinas**) e na **Home**, o usuário tem acesso às suas três rotinas complementares fixas do ciclo: **Alongamento & Mobilidade**, **Core / Abdominal** e **Cardio**. A fila sequencial do mesociclo (`A → B → C → D`) fica exclusiva para os treinos de academia. O usuário pode fazer seu cardio pela manhã e treinar musculação à noite na academia, ou cumprir sua rotina diária de alongamento em qualquer horário, sem que isso avance, substitua ou bloqueie a sessão de musculação do mesociclo.

**Why this priority**: É a dor central relatada pelo usuário: desacoplar cardio, alongamento diário e abdominal do momento da academia, permitindo dois turnos no dia ou hábitos diários independentes sem travar a fila do mesociclo.

**Independent Test**: Com um mesociclo ativo na sessão B (musculação), concluir a rotina de cardio pela manhã e a rotina de alongamento à tarde, e verificar que ambas ficam registradas como concluídas hoje enquanto a sessão B da academia permanece pronta para ser iniciada à noite.

**Acceptance Scenarios**:

1. **Given** um usuário com treino de academia pendente hoje (ex.: Sessão B), **When** ele inicia e conclui a rotina complementar de Cardio ou Alongamento, **Then** a rotina complementar é salva como concluída no dia e a Sessão B da academia continua sendo o treino principal pendente.
2. **Given** um usuário com um treino de academia já iniciado e pausado/em andamento, **When** ele abre e conclui uma rotina complementar rápida, **Then** o progresso das séries do treino de academia não é perdido nem sobrescrito.
3. **Given** um dia sem ida à academia, **When** o usuário abre a sub-aba `Rotinas` ou a seção da `Home`, **Then** pode executar suas rotinas complementares (alongamento, abdominal ou cardio) normalmente e vê o dia contabilizado na meta semanal de cada categoria.
4. **Given** o usuário já concluiu uma rotina complementar hoje, **When** ele olha a lista do dia na `Home` ou na sub-aba `Rotinas`, **Then** a rotina aparece marcada como feita hoje, permitindo repetir ou fazer outra categoria se desejar.
5. **Given** um novo mesociclo gerado, **When** o usuário visualiza as sessões A/B/C/D na sub-aba `Academia`, **Then** todas as sessões da fila são treinos de academia (força), enquanto o cardio e a mobilidade da semana ficam prescritos na sub-aba `Rotinas`.

---

### User Story 2 - Prescrição determinística para potencializar o treino e proteger articulações (Priority: P1)

Para cada mesociclo, o Helux monta instantaneamente, por regra determinística sobre o catálogo, **uma rotina fixa por categoria** (1 de Alongamento & Mobilidade, 1 de Core / Abdominal e 1 de Cardio) alinhada ao objetivo do usuário, às condições de saúde/articulações (spec 024) e aos grupos musculares do mesociclo atual. Por exemplo, uma rotina diária de alongamento e mobilidade focada nas articulações sensíveis e nos músculos trabalhados na semana para melhorar amplitude e recuperação; uma rotina de abdominal/core segura para a coluna; e uma prescrição de cardio na modalidade e zona compatíveis com o joelho.

**Why this priority**: Potencializar o resultado dos treinos e proteger as articulações de forma previsível, rápida e sem custo de IA é o que torna o módulo confiável e imediato.

**Independent Test**: Para um usuário com histórico de cirurgia de joelho (LCA/artrose) e treino de membros inferiores no mesociclo, calcular as 3 rotinas complementares e verificar que a rotina de mobilidade trabalha quadril/tornozelo/posterior com segurança, o cardio respeita o limite de impacto, o core respeita a coluna e cada rotina explica como ajuda no treino principal.

**Acceptance Scenarios**:

1. **Given** um usuário com condições articulares registradas no perfil, **When** as 3 rotinas complementares são montadas, **Then** nenhum exercício ou modalidade viola as restrições de impacto, carga articular ou amplitude das condições ativas.
2. **Given** qualquer uma das 3 rotinas complementares (Alongamento, Core ou Cardio), **When** o usuário abre os detalhes dela, **Then** vê o objetivo da rotina, o tempo estimado, a frequência semanal recomendada e uma explicação curta de como ela potencializa os treinos do mesociclo.
3. **Given** que o usuário fará treino pesado de pernas no dia, **When** ele abre o cardio complementar no mesmo dia, **Then** o sistema sinaliza a recomendação adequada (ex.: manter intensidade leve/sem impacto pela manhã para não comprometer o treino de pernas à noite).
4. **Given** o catálogo de exercícios e demonstrações (spec 028), **When** cada rotina complementar é montada, **Then** todos os itens vêm do catálogo oficial com demonstração visual e instruções de execução.
5. **Given** o mesmo perfil, condições, mesociclo e preferências de duração/foco, **When** a prescrição determinística roda, **Then** produz sempre a mesma rotina fixa para cada categoria durante o mesociclo, sem depender de chamada à IA.

---

### User Story 3 - Execução rápida e guiada por tipo de rotina (Priority: P1)

Cada uma das 3 rotinas complementares tem uma experiência de execução enxuta e adequada ao seu formato, sem a burocracia de digitar carga de anilha em cada série:
- **Alongamento & Mobilidade**: fluxo guiado com demonstração animada, tempo de sustentação (cronômetro regressivo) ou repetições por lado, avançando de um movimento ao outro.
- **Core / Abdominal**: sequência curta de exercícios (repetições ou tempo de isometria, como prancha), com descanso curto entre exercícios.
- **Cardio**: modalidade prescrita (com opção de trocar por outra compatível do catálogo), duração-alvo e zona de intensidade, com registro simples de tempo concluído e percepção de esforço.

**Why this priority**: Rotinas diárias de 5 a 20 minutos precisam ser fáceis de começar e concluir com poucos toques; se tiverem a mesma fricção de um treino completo de musculação, o usuário abandona.

**Independent Test**: Iniciar a rotina de alongamento, usar o cronômetro de sustentação até concluir todos os itens e salvar; verificar que leva apenas toques simples sem pedir carga em kg.

**Acceptance Scenarios**:

1. **Given** a rotina de Alongamento & Mobilidade aberta, **When** o usuário toca em "Iniciar", **Then** vê a demonstração e as instruções do movimento atual, um cronômetro para os itens por tempo (com aviso ao fim do tempo/troca de lado) e botão de concluir o item com um toque.
2. **Given** a rotina de Core / Abdominal aberta, **When** o usuário a executa, **Then** marca cada série por repetições ou tempo de sustentação (sem obrigar preenchimento de carga em kg) e vê o descanso curto automático entre séries.
3. **Given** a rotina complementar de Cardio, **When** o usuário a conclui, **Then** registra a modalidade realizada, os minutos feitos e o esforço percebido em menos de 15 segundos.

---

### User Story 4 - Visão na Home, sub-aba em Treinos e ajuste instantâneo (Priority: P2)

Na **Home**, o usuário vê uma seção **Rotinas do Dia** abaixo do treino principal, com atalho de 1 toque para iniciar cada rotina e o placar semanal (`concluídas / meta`). Na aba **Treinos**, um seletor no topo alterna entre **Academia** e **Rotinas**. Na sub-aba **Rotinas**, o usuário vê suas 3 rotinas fixas do ciclo e pode ajustar a frequência semanal (ex.: Alongamento 7×/semana, Abdominal 3×/semana, Cardio 3×/semana) ou a duração/foco (ex.: alongamento de 10 min para 5 min), recalculando a rotina instantaneamente sem chamada de IA e sem regerar o mesociclo da academia.

**Why this priority**: Hábitos diários dependem de visibilidade rápida na Home e controle simples da meta semanal sem poluir a tela do treino de musculação.

**Independent Test**: Abrir a Home e ver a seção "Rotinas do Dia"; ir em Treinos → sub-aba "Rotinas", ajustar a meta de Alongamento para 5×/semana e duração para 5 min, concluir uma sessão e verificar que o placar atualiza para "1/5" tanto na sub-aba quanto na Home.

**Acceptance Scenarios**:

1. **Given** um usuário logado, **When** ele abre a Home, **Then** vê o cartão do treino de academia e, logo abaixo, a seção "Rotinas do Dia" com as 3 rotinas complementares, seu estado hoje (pendente/concluída) e o progresso na semana.
2. **Given** o usuário na aba Treinos, **When** ele alterna do seletor `Academia` para `Rotinas`, **Then** vê as 3 rotinas fixas do mesociclo (Alongamento & Mobilidade, Core / Abdominal, Cardio), o histórico recente e as metas semanais de cada uma.
3. **Given** o usuário altera a frequência semanal, a duração-alvo ou o foco de uma das 3 rotinas, **When** ele salva o ajuste, **Then** a rotina e a meta semanal são recalculadas na hora por regra determinística, sem chamada de IA e sem alterar o mesociclo de academia.

---

### User Story 5 - Sinergia com o treino da noite e com a análise do mesociclo (Priority: P2)

Quando o usuário faz a rotina complementar de Cardio ou Alongamento no dia, o treino de academia daquele mesmo dia reconhece o que já foi feito (sinalizando como já cumprido o cardio ou alongamento equivalente da volta à calma para não duplicar sem necessidade). Ao final do mesociclo, a análise do ciclo (spec 024) inclui a constância nas 3 rotinas complementares e cruza com os relatos de dor, esforço e evolução.

**Why this priority**: Fecha o ciclo entre o módulo complementar e o treino principal, fazendo os dois conversarem de verdade.

**Independent Test**: Concluir a rotina complementar de Cardio pela manhã num dia em que a sessão de academia da noite tinha cardio na volta à calma; abrir o treino da noite e verificar que o app indica que o cardio do dia já foi feito pela manhã.

**Acceptance Scenarios**:

1. **Given** que o usuário concluiu a rotina complementar de Cardio ou Alongamento hoje, **When** ele abre a sessão de academia do mesmo dia que possui cardio ou alongamento na volta à calma, **Then** o app indica que essa parte já foi cumprida na rotina complementar do dia (permitindo pular sem alerta ou repetir se quiser).
2. **Given** um mesociclo concluído, **When** a análise do ciclo (spec 024) é gerada, **Then** o resumo apresenta a aderência às 3 rotinas complementares (Alongamento, Core e Cardio) junto da evolução do treino de força.

---

### Edge Cases

- **Cardio pesado de manhã antes de treino de pernas à noite**: se o usuário iniciar o cardio complementar num dia em que a próxima sessão pendente da academia é de membros inferiores, o app avisa antes de começar e sugere manter intensidade leve/baixo impacto para não prejudicar o treino da noite, sem bloquear.
- **Mais de uma rotina complementar no mesmo dia**: o usuário pode fazer Alongamento + Cardio + Core no mesmo dia, além da academia; cada conclusão é salva separadamente no histórico do dia.
- **Dor aguda ou crise de gota ativa (spec 024)**: as 3 rotinas complementares também respeitam o estado de dor/crise relatado, substituindo ou ocultando movimentos que carreguem a articulação afetada.
- **Troca de mesociclo de academia**: quando um novo mesociclo é gerado, as 3 rotinas complementares fixas são recalculadas deterministicamente para refletir o novo foco e condições, preservando as preferências de frequência e duração do usuário.
- **Planos existentes com sessões avulsas de cardio/mobilidade na fila (spec 024)**: planos já gravados antes desta feature continuam abrindo sem quebrar; novos mesociclos gerados passam a colocar na fila A/B/C/D apenas as sessões de academia, movendo o cardio e a mobilidade dedicados para a sub-aba `Rotinas`.
- **Conexão instável**: assim como no treino principal, a execução da rotina complementar (cronômetro, demonstrações do catálogo e marcação de itens) funciona mesmo se a internet oscilar durante os exercícios.

## Requirements *(mandatory)*

### Functional Requirements

**Estrutura, navegação e independência do módulo**

- **FR-001**: O sistema MUST oferecer o módulo de **Rotinas Complementares** acessível por uma sub-aba `Rotinas` dentro da aba **Treinos** (seletor `Academia` | `Rotinas`) e por uma seção **Rotinas do Dia** na **Home**.
- **FR-001a**: O módulo MUST manter exatamente **uma rotina fixa por categoria** durante o mesociclo: 1 de **Alongamento & Mobilidade**, 1 de **Core / Abdominal** e 1 de **Cardio**.
- **FR-002**: Concluir, pausar ou pular uma rotina complementar MUST NOT alterar o índice da sessão atual (`current_session_index`) nem modificar o estado do treino de academia em andamento no aparelho.
- **FR-002a**: Na geração de novos mesociclos, a fila sequencial de sessões (`A`, `B`, `C`, `D`...) MUST conter apenas as sessões de treino principal (academia/força, mantendo seu aquecimento e volta à calma curtos da spec 014); as sessões dedicadas de cardio e mobilidade que antes ocupavam letras na fila (spec 024) MUST migrar para as rotinas complementares de Cardio e Alongamento & Mobilidade. Planos antigos já salvos MUST continuar abrindo normalmente.
- **FR-003**: O usuário MUST poder executar uma, duas ou as três rotinas complementares no mesmo dia do treino de academia (ex.: manhã e noite) ou em dias sem academia.
- **FR-004**: O módulo MUST funcionar imediatamente para usuários que já possuem um mesociclo de academia em andamento, gerando as 3 rotinas complementares sem exigir a recriação do mesociclo atual.

**Prescrição determinística, segurança e catálogo**

- **FR-005**: As 3 rotinas complementares MUST ser geradas por **regra determinística** (sem chamada à IA) sobre o catálogo oficial, levando em conta o objetivo do usuário, as condições de saúde/articulações ativas (spec 024), os grupos musculares trabalhados no mesociclo e as preferências de duração/foco do usuário.
- **FR-006**: Todos os exercícios e modalidades das rotinas complementares MUST vir dos catálogos oficiais do Helux (`@helux/exercises` e catálogo de cardio, spec 028), exibindo demonstração animada e orientações de execução estruturadas, e respeitando 100% das restrições articulares e cardiovasculares ativas.
- **FR-007**: Cada uma das 3 rotinas MUST exibir seu propósito (como potencializa o treino ou protege articulações), duração estimada (em minutos) e meta de frequência semanal (dias/semana).
- **FR-008**: O usuário MUST poder ajustar a frequência semanal desejada (1 a 7 dias/semana), a duração-alvo (ex.: 5, 10, 15, 20+ min) e o foco/modalidade preferida de cada uma das 3 rotinas, com recálculo determinístico imediato.

**Execução por categoria**

- **FR-009**: A execução de **Alongamento & Mobilidade** MUST apresentar um fluxo guiado com demonstração, instruções, indicação de lado (quando unilateral) e cronômetro regressivo para itens por tempo de sustentação, permitindo concluir cada item com um toque sem exigir carga em kg.
- **FR-010**: A execução de **Core / Abdominal** MUST permitir registrar séries por repetições ou tempo de isometria, com cronômetro de descanso curto entre séries e sem exigir preenchimento de carga em kg para exercícios de peso corporal.
- **FR-011**: A execução de **Cardio** MUST exibir a modalidade prescrita, duração-alvo, zona de intensidade recomendada e orientações de postura/execução, permitindo concluir informando os minutos realizados, a modalidade (podendo escolher outra compatível do catálogo no momento da execução) e o esforço percebido.

**Organização do dia, histórico e sinergia**

- **FR-012**: A **Home** MUST apresentar a seção **Rotinas do Dia** abaixo do cartão do treino de academia, exibindo as 3 rotinas complementares com seu status hoje (pendente ou concluída), progresso semanal (`concluídas / meta`) e ação rápida para iniciar.
- **FR-013**: Toda rotina complementar concluída MUST ser salva em histórico próprio com data, horário, categoria, duração em minutos, itens executados e esforço percebido (quando aplicável).
- **FR-014**: Quando o usuário concluir a rotina complementar de Cardio ou Alongamento no dia, a sessão de academia do mesmo dia MUST indicar que o bloco equivalente de volta à calma/cardio já foi cumprido naquele dia, evitando duplicação desnecessária.
- **FR-015**: Se o usuário iniciar o cardio complementar no mesmo dia em que a sessão pendente da academia trabalha membros inferiores, o sistema MUST exibir recomendação de intensidade/impacto que não comprometa o rendimento do treino de pernas.
- **FR-016**: A análise de fim de ciclo (spec 024) e o Perfil Integrado dos agentes de IA MUST incluir a aderência semanal às 3 rotinas complementares (Alongamento, Core e Cardio).

### Key Entities

- **Rotina Complementar (`ComplementaryRoutine`)**: prescrição fixa do ciclo para uma das 3 categorias (`alongamento-mobilidade`, `core-abdominal`, `cardio`), calculada deterministicamente, contendo título, objetivo/benefício para o treino, frequência semanal alvo (`daysPerWeek`), duração estimada (`minutes`), foco/modalidade e lista de itens do catálogo com dose (tempo de sustentação, repetições ou zona).
- **Preferência de Rotina Complementar (`ComplementaryRoutinePreference`)**: configuração opcional do usuário por categoria (frequência semanal, duração-alvo em minutos, modalidade de cardio preferida ou região de foco), persistida no perfil para manter a escolha entre ciclos.
- **Execução de Rotina Complementar (`ComplementaryRoutineLog`)**: registro histórico de uma rotina concluída pelo usuário numa data/hora, contendo categoria, duração realizada, itens/modalidade executados e esforço percebido opcional.
- **Progresso Semanal Complementar**: contagem da semana corrente (`concluídas / meta semanal`) e status no dia de hoje para cada uma das 3 categorias, independente do avanço das sessões A/B/C/D da academia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das rotinas complementares iniciadas ou concluídas preservam intactos o treino de academia em andamento e a posição atual da fila do mesociclo.
- **SC-002**: 100% dos exercícios e modalidades prescritos nas 3 rotinas complementares respeitam as regras das condições de saúde ativas do usuário, possuem demonstração e orientação no catálogo e são gerados em menos de 100 ms (regra determinística, 0 chamadas de IA).
- **SC-003**: O usuário consegue iniciar uma rotina complementar a partir da Home ou da sub-aba `Rotinas` em até 2 toques e registrar a conclusão de um cardio em menos de 15 segundos.
- **SC-004**: Quando o usuário faz cardio ou alongamento complementar pela manhã, 100% das sessões de academia abertas no mesmo dia sinalizam o bloco correspondente de volta à calma como já cumprido no dia.
- **SC-005**: 100% dos novos mesociclos gerados mantêm na fila A/B/C/D apenas sessões de academia, enquanto Cardio e Alongamento & Mobilidade dedicados ficam disponíveis nas Rotinas Complementares.

## Assumptions

- O módulo vive dentro do app web responsivo do Helux (mesmo login, perfil, condições de saúde e Design System v2), na sub-aba `Rotinas` de **Treinos** e na seção **Rotinas do Dia** da **Home**.
- Os exercícios de Alongamento & Mobilidade, Core/Abdominal (peso corporal/solo) e Cardio usam o catálogo unificado `@helux/exercises` e `CARDIO_BANK` (spec 028), seguindo a mesma regra de demonstração e orientação.
- Rotinas de Core/Abdominal priorizam exercícios de peso corporal/solo (como prancha, dead bug, bird dog, hollow hold, abdominal infra/supra compatíveis com a coluna do usuário) para que possam ser feitas tanto em casa quanto na academia.
- A semana de referência para a meta semanal (`concluídas / meta`) considera os últimos 7 dias da semana corrente (segunda a domingo no fuso do usuário).
