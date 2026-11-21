# Feature Specification: Calendário visual de treino, saldo semanal e curiosidades do período

**Feature Branch**: `031-calendario-treino`  
**Created**: 2026-11-20  
**Status**: Draft  
**Input**: User description: "eu quero um calendario de treino, de forma visual para que eu veja os dias que eu fui, o saldo da semana em termos de esforço, peso ou outras informações relevantes e curiosidades da semana ou do mes"

## Contexto

Hoje o histórico do Helux (`/history`) é apenas uma lista cronológica linear de sessões concluídas, e a Home mostra somente o contador de sequência de semanas (`streak`) e o progresso do ciclo atual (`CycleProgress`). Isso deixa três lacunas para o usuário que quer enxergar sua consistência e evolução no tempo:

1. **Falta visão espacial dos dias treinados**: o usuário não consegue bater o olho no mês ou na semana e ver claramente em quais dias foi à academia, em quais fez rotinas complementares (cardio, alongamento, abdominal — spec 030) e onde estão os dias de descanso.
2. **Sem "saldo da semana" consolidado**: os dados de volume movimentado (toneladas/séries), esforço médio percebido (esforço por exercício da spec 027 e RPE da sessão da spec 024), tempo total ativo e evolução do peso corporal / tendência (spec 029) estão espalhados em telas diferentes (`/history`, `/checkin`, `/treinos`).
3. **Falta leitura rápida de destaques ("curiosidades")**: o usuário acumula dados ricos (tonelagem equivalente, exercício mais forte, recordes batidos, dia da semana preferido, tempo total investido, sequência de dias/semanas), mas o app não transforma esses números em curiosidades e marcos motivadores da semana ou do mês.

Esta feature cria o **Calendário de Treino** do Helux, combinando:
- **Grade visual mensal e semanal** com marcação clara dos dias de treino de academia, rotinas complementares e pesagens, permitindo tocar em qualquer dia ou semana para inspecionar o que foi feito;
- **Saldo da Semana** consolidando frequência, esforço médio, volume/séries, tempo ativo e variação do peso corporal (peso de tendência / pesagens da semana);
- **Curiosidades da Semana e do Mês** geradas por regras determinísticas instantâneas (0 chamadas de IA) sobre os registros reais do usuário.

## Clarifications

### Session 2026-11-20

- Q: Onde o Calendário de Treino deve viver na navegação do Helux? → A: Na tela de Histórico (`/history`), com seletor `Calendário` | `Lista` (Calendário como visão padrão), mais uma tira semanal compacta na Home que abre o calendário completo com 1 toque (FR-009, FR-010).
- Q: Quais métricas devem compor o cartão de Saldo da Semana? → A: Visão completa: Assiduidade (academia vs. meta + rotinas complementares), Esforço médio (qualitativo + numérico + Δ vs. semana anterior), Peso médio/tendência (kg + Δ vs. semana anterior) e Carga de trabalho (volume em t/kg, séries concluídas e tempo ativo somado) (FR-005, FR-006).
- Q: Como devem funcionar as Curiosidades da Semana e do Mês? → A: 100% determinísticas e instantâneas (0 chamadas de IA), cobrindo equivalência de tonelagem em objetos concretos (ex.: carros), PRs/destaques de força, dia da semana mais fiel, exercício dominante e tempo total investido (FR-007, FR-008).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calendário visual com os dias de treino e detalhe do dia (Priority: P1)

O usuário abre o Calendário de Treino (a partir de **Treinos / Histórico** ou de um atalho na **Home**) e enxerga o mês atual em formato de grade semanal (segunda a domingo). Cada dia mostra visualmente se houve **treino de academia**, **rotina complementar** (cardio, alongamento, core) ou ambos, além de destacar o dia de hoje. O usuário pode navegar entre meses anteriores e tocar em qualquer dia com atividade para ver o resumo daquele dia (sessões concluídas, duração, volume, esforço e peso registrado no dia), com link direto para o detalhe completo da sessão.

**Why this priority**: É o núcleo do pedido ("ver de forma visual os dias que eu fui"). Entrega valor imediato mesmo isoladamente, substituindo a leitura árdua de uma lista corrida por uma visão espacial clara de consistência.

**Independent Test**: Com sessões de academia e rotinas complementares registradas em diferentes dias do mês, abrir o calendário, verificar os marcadores visuais nos dias corretos, navegar para o mês anterior e tocar em um dia treinado para abrir o resumo daquele dia.

**Acceptance Scenarios**:

1. **Given** um usuário com treinos registrados no mês corrente, **When** ele abre o Calendário de Treino, **Then** vê a grade do mês atual (segunda a domingo) com marcadores visuais distintos para dias com treino de academia, dias com rotinas complementares e dias sem atividade, além do total de dias ativos no mês.
2. **Given** o calendário aberto em qualquer mês, **When** o usuário toca em um dia que possui treino de academia, rotina complementar ou pesagem, **Then** o app exibe o painel de detalhe daquele dia com os treinos/rotinas realizados (nome/foco, séries, volume, duração, esforço) e o peso do dia, permitindo abrir o detalhe completo do treino (`/history/[id]`).
3. **Given** o usuário no calendário, **When** ele navega para meses anteriores ou volta ao mês atual, **Then** a grade, o saldo e as curiosidades atualizam imediatamente para o período selecionado, bloqueando navegação para meses futuros.
4. **Given** um dia em que o usuário fez treino de academia e também uma rotina complementar (ex.: cardio de manhã e musculação à noite), **When** o dia é renderizado na grade, **Then** o marcador visual do dia reflete ambas as conquistas e o detalhe do dia lista as duas atividades separadamente.

---

### User Story 2 - Saldo da semana (esforço, peso, volume e assiduidade) (Priority: P1)

Ao visualizar o calendário, o usuário vê o cartão de **Saldo da Semana** correspondente à semana selecionada (por padrão, a semana atual). O saldo reúne em um único lugar:
- **Assiduidade**: dias treinados na semana vs. meta semanal do plano/perfil (ex.: `4 de 4 dias` na academia + rotinas complementares cumpridas);
- **Esforço da semana**: esforço médio percebido das sessões da semana (combinando o esforço por exercício da spec 027 / RPE pós-treino da spec 024 em uma faixa clara como *Leve*, *Moderado*, *Forte* ou *Muito forte*, junto do valor numérico) e comparação com a semana anterior;
- **Peso corporal na semana**: peso médio/tendência da semana e o delta em relação à semana anterior (ex.: `81,8 kg · -0,4 kg vs. sem. anterior`, usando as pesagens da spec 029);
- **Carga de trabalho**: volume total movimentado (em toneladas ou kg), total de séries concluídas e tempo total em atividade (academia + cardio/rotinas).

O usuário pode tocar em qualquer linha (semana) do calendário para inspecionar o Saldo da Semana daquela semana específica.

**Why this priority**: Responde diretamente ao pedido de ver "o saldo da semana em termos de esforço, peso ou outras informações relevantes", conectando treino e resposta corporal na mesma leitura.

**Independent Test**: Selecionar uma semana com 3 treinos, esforço registrado e pesagens na semana atual e na anterior; verificar que o Saldo da Semana exibe corretamente os dias ativos, a média/classificação de esforço, o volume/séries, a duração somada e a variação de peso em relação à semana anterior.

**Acceptance Scenarios**:

1. **Given** uma semana selecionada com treinos concluídos, **When** o usuário visualiza o Saldo da Semana, **Then** vê a contagem de dias treinados (academia e rotinas), o volume total (t/kg), o total de séries, o tempo ativo somado e o esforço médio da semana com rótulo qualitativo e valor numérico.
2. **Given** um usuário com pesagens registradas na semana selecionada e na semana anterior (spec 029), **When** o Saldo da Semana é exibido, **Then** mostra o peso de referência da semana (tendência/média semanal) e a variação em kg em relação à semana anterior.
3. **Given** uma semana sem pesagens registradas, **When** o Saldo da Semana é exibido, **Then** o bloco de peso informa que não houve pesagem naquela semana (com atalho rápido para registrar peso se for a semana atual), sem inventar valores.
4. **Given** o calendário mensal na tela, **When** o usuário toca em outra semana do mês, **Then** o Saldo da Semana atualiza para refletir exatamente os dados de segunda a domingo da semana escolhida, incluindo o comparativo com a semana imediatamente anterior a ela.

---

### User Story 3 - Curiosidades da semana e do mês (Priority: P2)

Abaixo do calendário e do saldo semanal, o usuário encontra a seção de **Curiosidades**, podendo alternar ou visualizar destaques **da Semana** e **do Mês** selecionado. Todas as curiosidades são calculadas deterministicamente a partir do histórico real (sem chamada de IA e sem latência), traduzindo os números brutos em fatos interessantes e comparáveis, tais como:
- **Equivalência de peso levantado**: tonelagem total da semana ou do mês comparada a referências concretas do dia a dia (ex.: *"Você moveu 18,4 toneladas este mês — o equivalente a ~12 carros populares"*);
- **Recorde e destaque de força**: maior carga ou melhor série do período e eventuais recordes pessoais (PRs) batidos na semana ou no mês;
- **Padrão de hábito**: dia da semana em que o usuário mais treinou no mês (ex.: *"Terça-feira foi o seu dia mais fiel: 4 de 4"*), maior sequência de dias ativos ou treino mais longo/denso;
- **Esforço & consistência**: exercício ou grupo muscular com mais séries no período, total de minutos investidos em saúde (academia + cardio + mobilidade) e evolução de volume vs. mês/semana anterior.

**Why this priority**: Transforma dados frios de log em recompensa visual e engajamento ("curiosidades da semana ou do mês"), diferenciando o calendário de uma simples planilha de presença.

**Independent Test**: Com dados de treino em uma semana e em um mês, alternar entre as curiosidades da semana e do mês e verificar que pelo menos 3 cartões de curiosidades relevantes e verídicos são exibidos com base nos registros daquele período.

**Acceptance Scenarios**:

1. **Given** uma semana ou mês com pelo menos 1 treino ou rotina concluída, **When** o usuário visualiza a seção de Curiosidades, **Then** o sistema exibe um conjunto de curiosidades determinísticas baseadas nos dados reais daquele período (semana selecionada ou mês visível).
2. **Given** o usuário na seção de Curiosidades, **When** ele alterna entre `Semana` e `Mês`, **Then** os cartões mudam instantaneamente para refletir os fatos da semana selecionada ou do mês inteiro.
3. **Given** um período com recorde pessoal (PR) de carga em algum exercício, **When** as curiosidades do período são calculadas, **Then** o novo recorde aparece destacado entre as curiosidades do período.
4. **Given** uma semana ou mês ainda sem nenhuma atividade registrada, **When** o usuário olha a seção de Curiosidades, **Then** vê um estado vazio encorajador (ou comparativo com o último período ativo) sem exibir curiosidades com zeros quebrados (ex.: nunca exibir *"0 carros levantados"*).

---

### User Story 4 - Acesso integrado na Home e no Histórico/Treinos (Priority: P2)

O usuário encontra o Calendário de Treino facilmente nos fluxos naturais do app:
- Na tela de **Histórico (`/history`)** (acessada a partir de **Treinos**), que passa a oferecer a visão de **Calendário** como destaque (com opção de alternar para a **Lista** corrida tradicional);
- Na **Home**, um resumo compacto da semana atual (tira dos 7 dias da semana com os dias já treinados marcados + atalho de 1 toque) leva diretamente ao Calendário de Treino completo.

**Why this priority**: Garante descoberta imediata e hábito diário — o usuário bate o olho na semana logo na Home e aprofunda no calendário completo quando quiser ver o saldo e as curiosidades.

**Independent Test**: Abrir a Home, ver a tira visual da semana atual com os dias treinados marcados, tocar nela para abrir o Calendário de Treino completo e alternar entre Calendário e Lista.

**Acceptance Scenarios**:

1. **Given** o usuário na Home, **When** a tela carrega, **Then** ele vê um resumo visual compacto dos 7 dias da semana corrente (segunda a domingo) indicando os dias já treinados e um toque abre o Calendário de Treino completo.
2. **Given** o usuário acessa o Histórico a partir de Treinos ou da Home, **When** a página abre, **Then** ele pode visualizar o **Calendário** (com grade mensal, Saldo da Semana e Curiosidades) ou alternar para a visão de **Lista** de sessões.

---

### Edge Cases

- **Mais de um treino de academia ou várias rotinas no mesmo dia**: o dia na grade contabiliza 1 dia ativo de presença, mas o Saldo da Semana soma o volume, séries e duração de todas as sessões/rotinas daquele dia, e o detalhe do dia lista todas as atividades individualmente.
- **Treino sem esforço preenchido (sessões antigas pré-spec 024/027)**: o cálculo de esforço médio da semana considera apenas as séries/sessões que possuem registro de esforço (`effort` por série ou `rpe` do check-in pós-treino); se nenhuma sessão da semana tiver esforço registrado, o campo de esforço no Saldo da Semana exibe *"Sem registro"* em vez de `0`.
- **Semana que cruza a virada do mês (ex.: 29 de out. a 4 de nov.)**: o Saldo da Semana sempre considera os 7 dias completos daquela semana (segunda a domingo), mesmo que parte dos dias pertença ao mês vizinho; os dias do mês adjacente aparecem na linha daquela semana na grade.
- **Fuso horário do usuário**: o agrupamento por dia (`YYYY-MM-DD`) e o início/fim da semana (segunda a domingo) respeitam a data local das sessões, rotinas e pesagens, evitando que um treino feito às 22h no Brasil apareça no dia seguinte (UTC).
- **Usuário recém-cadastrado sem histórico**: a grade do mês aparece limpa com o dia de hoje destacado, o Saldo da Semana mostra `0` dias ativos com a meta da semana atual e a área de Curiosidades mostra uma mensagem convidando a concluir o primeiro treino para desbloquear estatísticas.

## Requirements *(mandatory)*

### Functional Requirements

**Grade visual do calendário e navegação no tempo**

- **FR-001**: O sistema MUST disponibilizar o **Calendário de Treino** com grade mensal organizada em semanas de segunda-feira a domingo, destacando o dia atual e permitindo navegar entre meses anteriores e o mês corrente (sem permitir meses futuros).
- **FR-002**: Cada dia na grade do calendário MUST indicar visualmente a presença de:
  1. **Treino de academia** concluído (`workout_sessions`);
  2. **Rotina complementar** concluída (`complementary_routine_logs`: alongamento/mobilidade, core/abdominal ou cardio, spec 030);
  3. **Ambas as atividades** no mesmo dia.
- **FR-003**: Ao tocar em um dia do calendário, o sistema MUST exibir o detalhe daquele dia contendo todas as sessões de academia (com link para `/history/[id]`), rotinas complementares concluídas e a pesagem registrada naquela data (se houver).
- **FR-004**: O usuário MUST poder selecionar qualquer semana visível na grade (por padrão, a semana corrente ao abrir o mês atual, ou a última semana com atividade ao abrir um mês passado) para inspecionar o **Saldo da Semana** correspondente.

**Saldo da Semana**

- **FR-005**: Para a semana selecionada (segunda a domingo), o sistema MUST calcular e exibir o **Saldo da Semana** contendo:
  1. **Dias ativos e assiduidade**: total de dias com treino de academia (comparado à frequência semanal planejada no mesociclo/perfil, quando disponível) e total de rotinas complementares concluídas na semana;
  2. **Saldo de esforço**: esforço médio da semana (calculado a partir do esforço das séries `effort` da spec 027 e/ou `rpe` pós-treino da spec 024), acompanhado de uma classificação legível (*Leve*, *Moderado*, *Forte*, *Muito forte*) e do delta em relação à semana anterior (quando ambas tiverem dados);
  3. **Saldo de peso corporal**: média das pesagens da semana (ou peso de tendência da spec 029 na semana) em `kg` e a variação (`±kg`) em relação à semana imediatamente anterior, ou indicação clara de *"Sem pesagem na semana"* quando não houver registros;
  4. **Volume, séries e tempo ativo**: tonelagem total movimentada (`kg` ou `t`), total de séries válidas concluídas e soma de minutos em atividade (treinos de academia + rotinas complementares).
- **FR-006**: O Saldo da Semana MUST incluir comparativos diretos (setas ou deltas de subida/descida/estabilidade) contra a semana imediatamente anterior para volume/séries, esforço médio e peso corporal, sempre que a semana anterior possuir dados para a métrica.

**Curiosidades da Semana e do Mês**

- **FR-007**: O sistema MUST gerar **Curiosidades da Semana** (para a semana selecionada) e **Curiosidades do Mês** (para o mês selecionado) de forma **100% determinística** (0 chamadas de IA), permitindo ao usuário visualizar ou alternar entre os dois recortes (`Semana` | `Mês`).
- **FR-008**: O motor determinístico de curiosidades MUST selecionar e exibir cartões apenas para fatos com dados reais positivos no período (mínimo de 3 curiosidades quando houver pelo menos 1 treino de academia no período), cobrindo categorias como:
  1. **Equivalência de tonelagem**: comparação do peso total levantado no período com referências tangíveis (ex.: carros populares, elefantes, pianos de cauda, malas de viagem), escolhendo automaticamente a escala adequada ao volume;
  2. **Destaques de força e recordes (PRs)**: maior carga levantada no período, exercício com maior tonelagem acumulada e recordes pessoais batidos naquela semana ou mês;
  3. **Hábito e consistência**: dia da semana mais frequente no mês, maior sequência de dias ativos no período, sessão mais longa ou com mais séries;
  4. **Investimento de tempo e equilíbrio**: soma de minutos dedicados a treino + cardio/mobilidade e distribuição entre academia e rotinas complementares.

**Pontos de entrada, integração e excelência de experiência (UX)**

- **FR-009**: O Calendário de Treino MUST estar diretamente acessível nas abas principais da barra de navegação inferior do Helux v2:
  1. Na aba **Progresso (`/recovery`)** (5ª aba da `NavBar`, onde vive o histórico/evolução na v2): exibir um seletor `Calendário` | `Evolução` no topo, com **`Calendário` como visão padrão** (e a visão `Evolução` preservando Recovery, Volume semanal, Recordes pessoais e histórico recente);
  2. Na aba **Treinos (`/treinos`)**: incluir **`Calendário`** como 3ª sub-aba no seletor do topo (`Academia` | `Rotinas` | `Calendário`);
  3. Na rota **`/history`**: manter o seletor `Calendário` | `Lista` (com `Calendário` como visão padrão).
- **FR-010**: A **Home (`/`)** MUST exibir a tira visual compacta da semana atual (`WeeklyCalendarStrip`, segunda a domingo, com os dias ativos marcados e resumo rápido da semana) logo abaixo do cartão do treino de hoje, com pré-carregamento no servidor (SSR) e esqueleto de carregamento (*skeleton*) para que nunca fique invisível durante o *cold start* da API, levando ao Calendário de Treino completo com 1 toque.
- **FR-011**: A experiência visual e tátil do Calendário de Treino MUST seguir rigorosamente o Design System v2 do Helux:
  1. **Leitura instantânea por contraste e forma**: dias com treino de academia destacam-se com o verde-ácido do sistema (`--accent`), dias com rotinas complementares exibem anel/indicador complementar distinto, dias com ambas as conquistas combinam os dois marcadores sem poluição visual e o dia de hoje possui assinatura própria mesmo antes de treinar;
  2. **Seleção fluida de semana e dia sem salto de layout (*zero layout shift*)**: tocar em qualquer dia ou linha semanal atualiza o Saldo da Semana e o painel do dia com transição suave (`--dur-2`, `--ease-out`, respeitando `prefers-reduced-motion`), mantendo a grade ancorada no topo;
  3. **Tipografia tabular e precisão editorial**: todos os números de peso, delta, esforço, volume e duração usam fonte monoespaçada tabular (`n-lg`, `n-md`, `n-sm`) com unidades discretas (`.u`), alvos de toque de no mínimo `44×44 px` e estados vazios elegantes que orientam a próxima ação.

### Key Entities

- **Dia do Calendário (`CalendarDaySummary`)**: agregação por data local (`YYYY-MM-DD`) contendo lista resumida de treinos de academia do dia (id, título/foco, séries, volume, duração, esforço médio), rotinas complementares concluídas no dia (categoria, duração, esforço), peso corporal registrado no dia (`weightKg`) e flags visuais de presença (`hasGymWorkout`, `hasComplementaryRoutine`).
- **Saldo da Semana (`WeeklyBalance`)**: resumo consolidado de um intervalo de segunda a domingo (`weekStart` a `weekEnd`) com contagem de dias ativos, meta semanal de treinos, sessões de academia, rotinas complementares, volume total (`tonnageKg`), total de séries, duração total em minutos, esforço médio numérico e qualitativo, peso médio/tendência da semana e deltas (`vsPreviousWeek`) para peso, esforço, volume e frequência.
- **Curiosidade do Período (`PeriodCuriosity`)**: destaque determinístico calculado para uma semana ou mês, contendo identificador da regra, escopo (`semana` | `mes`), categoria (`tonelagem`, `forca`, `habito`, `tempo`, `esforco`), título curto, valor em destaque e frase explicativa/comparativa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue identificar todos os dias treinados no mês, o Saldo da Semana selecionada (esforço, peso, volume e frequência) e as Curiosidades do período em uma única tela, com cálculo determinístico em menos de 100 ms (0 chamadas de IA).
- **SC-002**: 100% das sessões de academia (`workout_sessions`), rotinas complementares (`complementary_routine_logs`) e pesagens (`body_weights`) aparecem agrupadas na data local correta (`YYYY-MM-DD`) e na semana (segunda a domingo) correspondente.
- **SC-003**: A partir da Home ou da aba Treinos, o usuário chega ao Calendário de Treino completo em no máximo 1 toque e consegue inspecionar o detalhe de qualquer dia ou semana passada em mais 1 toque.
- **SC-004**: 100% das curiosidades exibidas para uma semana ou mês utilizam apenas dados reais existentes no período (nenhum cartão exibe comparações com zero ou métricas sem registro).

## Assumptions

- A semana no Helux começa na **segunda-feira** e termina no **domingo**, mantendo consistência com `workout-analytics` e com o progresso semanal de rotinas complementares (spec 030).
- O esforço nas séries (`effort` na escala 1–5 ou RPE equivalente da spec 027) e o RPE pós-treino (`session_checkins.rpe` na escala 1–10 da spec 024) são normalizados para uma escala única compreensível no Saldo da Semana (com rótulo qualitativo *Leve*, *Moderado*, *Forte*, *Muito forte* e valor numérico).
- O peso da semana usa as pesagens registradas na tabela `body_weights` (spec 029): média das pesagens daquela semana (segunda a domingo) e diferença para a média da semana anterior.
- Não é necessária nenhuma nova chamada de LLM/IA: todas as agregações de calendário, saldo semanal e curiosidades são funções puras determinísticas em `@helux/workouts`, testáveis em TDD e compartilhadas entre API e Web.
