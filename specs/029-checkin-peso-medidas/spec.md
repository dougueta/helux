# Feature Specification: Check-in de peso e medidas com dados confiáveis

**Feature Branch**: `029-checkin-peso-medidas`
**Created**: 2026-11-08
**Status**: Draft
**Input**: User description: "Melhorar os dados do check-in de peso e medidas. Problemas atuais: (1) check-in é mensal e a calibração da fase de dieta compara duas pesagens isoladas, sensíveis à flutuação diária de 1–2 kg; (2) não há protocolo nem guia de medição; (3) o usuário não tem como medir % de gordura por aparelho — o % estimado pela fita (método da Marinha) deve ser o padrão e ser salvo, com a origem do valor registrada, sem misturar origens na tendência; (4) faltam métricas derivadas: massa gorda e massa magra, relação cintura/altura, tendência de peso. Fora do escopo: importar peso do Apple Health, performance calculada dos treinos, fotos de progresso."

## Contexto

Hoje o check-in corporal é um formulário único por mês (peso, % de gordura digitado, cintura, quadril, pescoço, braço, coxa e cargas de agachamento/supino/terra). Um novo check-in no mesmo mês substitui o anterior. A fase de dieta (spec 018) recalibra as metas comparando o peso de dois check-ins isolados, o que é sensível à flutuação normal de 1–2 kg de um dia para o outro (água, sal, intestino). O % de gordura estimado pela fita (método da Marinha) aparece no formulário, mas não é salvo; quem não tem aparelho fica sem histórico de % de gordura.

Esta feature separa **pesagem** (rápida e frequente) de **medidas com fita** (espaçadas), passa a usar a **tendência** do peso em vez de pontos isolados, torna a estimativa pela fita o padrão (salva, com origem) e mostra métricas derivadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pesagem frequente com linha de tendência (Priority: P1)

O usuário se pesa de manhã (idealmente todo dia, no mínimo algumas vezes por semana) e registra só o peso, em poucos segundos. O app mostra o peso do dia e o **peso de tendência**, que suaviza a flutuação diária, além da variação da tendência por semana.

**Why this priority**: É a base de tudo: sem pesagens frequentes não existe tendência, e a calibração da dieta continua refém de um ponto isolado. Entrega valor sozinha (o usuário passa a enxergar a direção real do peso).

**Independent Test**: Registrar pesagens em vários dias e verificar que o histórico mostra cada pesagem, a linha de tendência e a variação semanal da tendência.

**Acceptance Scenarios**:

1. **Given** um usuário logado, **When** ele abre o registro de pesagem e informa "82,4", **Then** a pesagem é salva com a data de hoje e aparece no histórico em menos de 15 segundos desde a abertura da tela.
2. **Given** o usuário já registrou uma pesagem hoje, **When** ele registra outra no mesmo dia, **Then** a nova substitui a anterior daquele dia (fica uma pesagem por dia) e o usuário é avisado da substituição.
3. **Given** pesagens em pelo menos 3 dias dos últimos 7, **When** o usuário vê o histórico, **Then** ele vê o peso de tendência atual e a variação da tendência nos últimos 7 dias (kg e %).
4. **Given** menos de 3 pesagens nos últimos 7 dias, **When** o usuário vê o histórico, **Then** o app mostra as pesagens, explica que a tendência precisa de mais pesagens e não mostra uma tendência inventada.
5. **Given** o usuário esqueceu de registrar ontem, **When** ele registra uma pesagem escolhendo a data de ontem, **Then** ela entra no histórico na data escolhida (datas futuras não são aceitas).

---

### User Story 2 - % de gordura pela fita como padrão, salvo e com origem (Priority: P1)

Quem não tem aparelho registra medidas com fita (cintura, pescoço e, para mulheres, quadril). O app calcula o % de gordura pelo método da Marinha e **salva** esse valor junto das medidas, marcando a origem "fita (Marinha)". Quem tiver uma medição de aparelho (bioimpedância, adipômetro, DEXA) pode informá-la num campo opcional, escolhendo a origem.

**Why this priority**: É o pedido direto do usuário ("não tenho como ter o % de gordura"). Sem salvar a estimativa não há histórico nem massa magra/gorda.

**Independent Test**: Com altura e sexo no perfil, registrar medidas de cintura e pescoço sem digitar % de gordura e verificar que o histórico mostra o % estimado com a origem "fita".

**Acceptance Scenarios**:

1. **Given** perfil com altura e sexo e um registro de medidas com cintura e pescoço (e quadril, para mulheres), **When** o usuário salva, **Then** o % de gordura estimado é salvo com origem "fita (Marinha)" e aparece no histórico.
2. **Given** perfil sem altura ou sem sexo, **When** o usuário preenche cintura e pescoço, **Then** o app avisa que precisa desses dados no Perfil para estimar o % e salva as medidas sem % de gordura.
3. **Given** o usuário abre a opção "Tenho uma medição de aparelho", **When** informa 18% e escolhe a origem "bioimpedância", **Then** o valor é salvo com essa origem, ao lado (e não no lugar) da estimativa pela fita.
4. **Given** o histórico tem % de gordura de origens diferentes, **When** o usuário vê a evolução do % de gordura, **Then** cada origem aparece como uma série separada e nenhuma variação é calculada entre valores de origens diferentes.
5. **Given** o formulário de medidas, **When** o usuário o abre, **Then** o campo de % de gordura digitado não aparece entre os campos principais; ele fica atrás da opção "Tenho uma medição de aparelho".

---

### User Story 3 - Calibração da dieta pela tendência do peso (Priority: P2)

Com fase de dieta ativa, a recalibração das metas deixa de comparar duas pesagens isoladas e passa a comparar o **peso de tendência** no início do período com o peso de tendência atual. A cintura continua desempatando como hoje.

**Why this priority**: É o principal ganho de qualidade da decisão (menos ajustes de caloria por ruído), mas depende da US1.

**Independent Test**: Simular uma fase com pesagens diárias que oscilam ±1,5 kg em torno de uma tendência estável e verificar que a recalibração mantém as metas; com uma tendência caindo acima da faixa esperada, verificar que ela reduz as calorias.

**Acceptance Scenarios**:

1. **Given** fase de dieta ativa há pelo menos 2 semanas desde a última calibração e tendência disponível nos dois extremos do período, **When** uma nova calibração é avaliada, **Then** a taxa semanal é calculada entre os pesos de tendência e a explicação mostrada cita "peso de tendência".
2. **Given** pesagens que oscilam até 2 kg dia a dia sem mudança de tendência, **When** a calibração é avaliada, **Then** as metas são mantidas.
3. **Given** pesagens insuficientes para a tendência em um dos extremos do período, **When** a calibração seria avaliada, **Then** as metas são mantidas e o app explica que faltam pesagens (pedindo pelo menos 3 por semana).
4. **Given** menos de 2 semanas desde a última calibração, **When** o usuário registra pesagens, **Then** nenhuma recalibração acontece (regra atual de intervalo mínimo mantida).

---

### User Story 4 - Guia de medição no formulário (Priority: P2)

Ao registrar medidas, o usuário vê um guia curto, com ilustração, de quando e onde medir, para que uma medição seja comparável com a anterior.

**Why this priority**: Medidas inconsistentes (cintura em pontos diferentes, braço de lados diferentes) invalidam a estimativa de gordura e a comparação. Barato e independente.

**Independent Test**: Abrir o formulário de medidas e verificar que cada medida tem a instrução de onde medir e que o protocolo geral aparece.

**Acceptance Scenarios**:

1. **Given** o formulário de medidas, **When** o usuário o abre, **Then** vê o protocolo geral: de manhã, em jejum, depois de ir ao banheiro, antes de treinar, fita justa sem apertar, mesmo horário sempre.
2. **Given** um campo de medida (pescoço, cintura, quadril, braço, coxa), **When** o usuário pede ajuda nele, **Then** vê onde passar a fita: pescoço logo abaixo do pomo de Adão; cintura na altura do umbigo, barriga relaxada, no fim da expiração; quadril na parte mais larga dos glúteos; braço no ponto mais largo, relaxado; coxa no ponto médio entre virilha e joelho; braço e coxa sempre do lado direito.
3. **Given** o registro de pesagem, **When** o usuário o abre, **Then** vê o lembrete curto de pesar de manhã, em jejum, depois do banheiro e com pouca ou nenhuma roupa.

---

### User Story 5 - Métricas derivadas e lembrete de medidas (Priority: P3)

Em cada registro de medidas com % de gordura, o app mostra massa gorda e massa magra (kg). Com a altura do perfil, mostra a relação cintura/altura com uma referência simples. O app lembra o usuário de refazer as medidas quando o último registro tem mais de 4 semanas.

**Why this priority**: Enriquece a leitura do progresso (perder gordura mantendo massa magra), mas depende das US1 e US2.

**Independent Test**: Registrar peso, medidas e % estimado e verificar os valores de massa gorda, massa magra e cintura/altura; deixar o último registro de medidas com 29 dias e verificar o lembrete.

**Acceptance Scenarios**:

1. **Given** um registro de medidas com % de gordura e um peso de referência, **When** o usuário vê o registro, **Then** vê massa gorda = peso × % e massa magra = peso − massa gorda, em kg com uma casa decimal, indicando a origem do % usado.
2. **Given** altura no perfil e cintura registrada, **When** o usuário vê o registro, **Then** vê a relação cintura/altura com a referência "abaixo de 0,5 é a faixa saudável".
3. **Given** o último registro de medidas tem mais de 28 dias, **When** o usuário abre a Home ou o Check-in, **Then** vê um lembrete para registrar novas medidas; com menos de 14 dias, o app não sugere medir de novo.

---

### Edge Cases

- **Pesagem muito diferente da tendência** (ex.: 5 kg acima da tendência de ontem): o app pede confirmação antes de salvar (provável erro de digitação), sem bloquear.
- **Gap longo sem pesagens** (ex.: viagem de 3 semanas): a tendência recomeça a partir das novas pesagens; o gráfico não liga pontos através do vazio como se fossem contínuos.
- **Medidas sem pesagem no mesmo dia**: massa gorda/magra usam o peso de tendência daquela data; se não houver, a pesagem mais próxima em até 3 dias; se não houver nenhuma, as métricas não são mostradas.
- **Altura ou sexo alterados no perfil depois**: as estimativas já salvas não mudam (foram calculadas com os dados da época); só registros novos usam o perfil novo.
- **Usuário edita ou apaga uma pesagem/medida**: tendência, métricas e histórico refletem a mudança; calibrações já aplicadas à dieta não são refeitas.
- **Estimativa pela Marinha fora da faixa plausível** (medidas inconsistentes, ex.: pescoço maior que cintura): o app não salva o % e explica que as medidas parecem inconsistentes.
- **Check-ins mensais antigos**: continuam visíveis no histórico, convertidos em uma pesagem e um registro de medidas na data do check-in.

## Requirements *(mandatory)*

### Functional Requirements

**Pesagem**

- **FR-001**: O usuário MUST poder registrar uma pesagem contendo apenas peso (kg, aceitando vírgula decimal) e data (padrão hoje; datas passadas permitidas; datas futuras recusadas).
- **FR-002**: O sistema MUST manter no máximo uma pesagem por usuário por dia; registrar de novo no mesmo dia substitui a anterior, avisando o usuário.
- **FR-003**: O sistema MUST calcular o peso de tendência como a média das pesagens dos últimos 7 dias corridos até a data de referência, exigindo pelo menos 3 pesagens nesse intervalo; sem esse mínimo, não há tendência para aquela data.
- **FR-004**: O histórico MUST mostrar as pesagens, a linha de tendência e a variação da tendência nos últimos 7 dias (kg e % por semana).
- **FR-005**: O sistema MUST pedir confirmação ao salvar uma pesagem que difira mais de 3 kg do peso de tendência mais recente.
- **FR-006**: O usuário MUST poder editar e apagar pesagens.

**Medidas e % de gordura**

- **FR-007**: O usuário MUST poder registrar medidas com fita (pescoço, cintura, quadril, braço, coxa), com data, independentemente da pesagem. As cargas de agachamento, supino e terra e as observações continuam disponíveis nesse registro, como hoje.
- **FR-008**: Quando o perfil tem altura e sexo e o registro tem as medidas exigidas pelo método da Marinha (cintura e pescoço; mulheres também quadril), o sistema MUST calcular e salvar o % de gordura com origem "fita (Marinha)".
- **FR-009**: O sistema MUST rejeitar a estimativa (sem bloquear o salvamento das medidas) quando o resultado ficar fora de 3–60% ou as medidas forem incompatíveis com o cálculo, e explicar o motivo.
- **FR-010**: O usuário MUST poder informar, opcionalmente, um % de gordura medido por aparelho, escolhendo a origem entre bioimpedância, adipômetro, DEXA ou outro; esse valor fica ao lado da estimativa pela fita, não a substitui.
- **FR-011**: O campo de % de gordura digitado MUST ficar oculto por padrão, atrás da opção "Tenho uma medição de aparelho".
- **FR-012**: A evolução do % de gordura MUST mostrar uma série por origem e nunca calcular variação entre valores de origens diferentes.
- **FR-013**: O usuário MUST poder editar e apagar registros de medidas; ao editar, a estimativa pela fita é recalculada com o perfil atual.

**Guia de medição**

- **FR-014**: O formulário de medidas MUST mostrar o protocolo geral de medição e, para cada medida, onde passar a fita, com ilustração (conteúdo descrito na US4).
- **FR-015**: O registro de pesagem MUST mostrar o lembrete curto do protocolo de pesagem.

**Métricas derivadas e lembretes**

- **FR-016**: Para cada registro de medidas com % de gordura, o sistema MUST mostrar massa gorda e massa magra usando como peso de referência o peso de tendência da data do registro; sem tendência, a pesagem mais próxima em até 3 dias; sem nenhuma, não mostrar.
- **FR-017**: Com altura no perfil, o sistema MUST mostrar a relação cintura/altura de cada registro com cintura, com a referência "abaixo de 0,5".
- **FR-018**: O sistema MUST mostrar um lembrete de novas medidas na Home e no Check-in quando o último registro de medidas tiver mais de 28 dias (ou não existir).

**Dieta e outros consumidores**

- **FR-019**: A recalibração da fase de dieta MUST usar o peso de tendência no início do período (data da última calibração ou início da fase) e o peso de tendência atual para calcular a taxa semanal, mantendo o intervalo mínimo de 2 semanas, as faixas por objetivo, o degrau de calorias e o desempate pela cintura (usando o registro de medidas mais recente em cada extremo).
- **FR-020**: Sem tendência disponível em um dos extremos, a recalibração MUST manter as metas e explicar que faltam pesagens, pedindo pelo menos 3 por semana.
- **FR-021**: A recalibração MUST ser avaliada quando o usuário salva uma pesagem ou um registro de medidas, respeitando o intervalo mínimo.
- **FR-022**: O % de gordura usado pela dieta MUST ser o da origem com registro mais recente, preferindo "fita (Marinha)" quando houver empate na data.
- **FR-023**: O Perfil Integrado usado pelos agentes de IA, o cartão de check-in da Home e as métricas que hoje leem o check-in mensal MUST passar a usar o peso de tendência (ou a última pesagem, sem tendência) e o registro de medidas mais recente, indicando a origem do % de gordura.

**Migração**

- **FR-024**: Cada check-in mensal existente MUST ser convertido em uma pesagem (se tiver peso) e um registro de medidas (se tiver medidas, % ou cargas) na data em que foi registrado; % de gordura digitado antigo recebe a origem "outro (informado)".
- **FR-025**: Calibrações de dieta já registradas MUST permanecer válidas e visíveis após a migração.

### Key Entities

- **Pesagem**: um peso de um usuário num dia (no máximo uma por dia). Atributos: data, peso em kg.
- **Peso de tendência** (derivado, não digitado): média das pesagens dos 7 dias até uma data, quando há pelo menos 3.
- **Registro de medidas**: medidas com fita de um usuário numa data. Atributos: pescoço, cintura, quadril, braço, coxa, cargas de agachamento/supino/terra, observações.
- **Medida de % de gordura**: valor de % ligado a um registro de medidas, com origem (fita/Marinha, bioimpedância, adipômetro, DEXA, outro). Um registro pode ter uma estimativa pela fita e um valor de aparelho.
- **Calibração da dieta** (existente): passa a registrar os pesos de tendência usados nos extremos, em vez de dois check-ins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar uma pesagem leva menos de 15 segundos desde a abertura da tela até a confirmação.
- **SC-002**: Com pesagens diárias que oscilam até ±2 kg em torno de um peso estável por 3 semanas, a recalibração da dieta mantém as metas em 100% dos casos de teste (hoje um único par de pesagens pode disparar ±150 kcal).
- **SC-003**: Um usuário sem aparelho, com altura e sexo no perfil, passa a ter % de gordura, massa gorda e massa magra no histórico em 100% dos registros com cintura e pescoço válidos.
- **SC-004**: Nenhuma variação de % de gordura exibida compara valores de origens diferentes.
- **SC-005**: 100% dos check-ins mensais existentes continuam visíveis no histórico após a migração, com os mesmos valores.
- **SC-006**: O usuário consegue responder "meu peso está subindo, descendo ou estável nesta semana?" olhando uma única tela.

## Assumptions

- Média simples de 7 dias com mínimo de 3 pesagens é suficiente como tendência; métodos mais sofisticados (média exponencial) ficam como possível ajuste no plano, desde que respeitem o mesmo mínimo de dados.
- Braço e coxa são medidos sempre do lado direito; não há campo para escolher o lado.
- A estimativa pela fita usa a fórmula da Marinha já existente no app (spec 018) e a altura e o sexo do perfil no momento do registro.
- As cargas de agachamento/supino/terra continuam digitadas no registro de medidas; calculá-las a partir dos treinos está fora do escopo.
- O ambiente de testes com dados simulados (spec 021) recebe fixtures de pesagens e medidas equivalentes às de check-in mensal de hoje.
- O app continua web responsivo; não há notificação push. O lembrete de medidas é visual, dentro do app.
- **Fora do escopo** (registrar no backlog): importar peso/medidas do Apple Health pelo Atalho; carga máxima estimada calculada dos treinos; fotos de progresso.
