# Feature Specification: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Feature Branch**: `008-mesociclo-perfil-usuario`
**Created**: 2026-08-27
**Status**: Draft
**Input**: User description: "Personalização do mesociclo de treino com base no estado físico e experiência do usuário (objetivo atual, nível de experiência, tempo treinando, tempo parado sem treinar, lesão/problema físico atual), substituindo os valores hoje fixos no código (objetivo, nível, dias/semana). Além do ajuste automático por HRV já existente, permitir que o usuário sinalize manualmente que está muito cansado num dia específico, ajustando o treino daquele dia mesmo sem dado de HRV sincronizado."

---

## Clarifications

### Session 2026-08-27

- Q: Objetivo de treino e nível de experiência devem ser escolhidos de uma lista fixa de opções, ou digitados livremente? → A: Híbrido — nível de experiência como lista fixa (Iniciante/Intermediário/Avançado); objetivo de treino como texto livre.
- Q: Depois de sinalizar cansaço num dia, o usuário pode desfazer a sinalização no mesmo dia? → A: Sim.
- Q: O perfil deve ter um fluxo de onboarding obrigatório na primeira vez, ou uma tela de configurações opcional editável quando o usuário quiser? → A: Tela de configurações opcional, sem fluxo forçado.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Declarar objetivo, experiência e lesão atual, e ver isso refletido no mesociclo (Priority: P1)

O usuário (Doug) quer informar ao sistema seu objetivo de treino atual, seu nível de experiência, há quanto tempo treina, se está retomando depois de um tempo parado, e se tem alguma lesão ou problema físico no momento — e quer que o próximo mesociclo gerado reflita essas informações de verdade, em vez dos valores fixos que o sistema usa hoje independentemente de quem está treinando.

**Why this priority**: É a mudança central pedida — hoje o mesociclo é gerado com objetivo, nível e dias/semana fixos no código, então a prescrição não muda mesmo que a realidade física do usuário mude. Sem isso, a personalização "genética" do produto convive com uma personalização "situacional" inexistente.

**Independent Test**: Pode ser testado preenchendo/atualizando o perfil com um objetivo, nível e lesão específicos, disparando a geração de um novo mesociclo, e verificando que a prescrição e a justificativa gerada refletem esses dados (ex.: um objetivo de "resistência" produz volume/repetições diferentes de um objetivo de "força"; uma lesão declarada evita ou adapta exercícios que a agravariam).

**Acceptance Scenarios**:

1. **Given** que o usuário preencheu objetivo, nível de experiência e tempo treinando, **When** um novo mesociclo é gerado, **Then** a prescrição (divisão, volume, intensidade) e a justificativa do plano refletem esses dados declarados, não os valores fixos anteriores.
2. **Given** que o usuário declarou uma lesão ou problema físico atual (ex.: dor no ombro), **When** um novo mesociclo é gerado, **Then** o plano evita ou adapta exercícios que agravariam essa condição, e a justificativa menciona a adaptação feita.
3. **Given** que o usuário indicou um longo período parado sem treinar, **When** um novo mesociclo é gerado, **Then** o volume/intensidade inicial é mais conservador do que seria para alguém com o mesmo nível de experiência mas sem essa pausa.
4. **Given** que o usuário nunca preencheu o perfil, **When** um mesociclo é gerado, **Then** o sistema usa valores padrão razoáveis (os mesmos hoje fixos no código) sem falhar ou bloquear a geração.

---

### User Story 2 — Sinalizar cansaço num dia específico e ver o treino daquele dia ajustado (Priority: P1)

O usuário quer, num dia em que está se sentindo muito cansado (mesmo sem ter sincronizado dados objetivos de recovery via HealthKit/Shortcuts), avisar o sistema disso e ver o treino daquele dia ajustado (volume/carga reduzidos) — do mesmo jeito que já acontece automaticamente quando o HRV sincronizado está baixo.

**Why this priority**: O ajuste por recovery hoje só funciona se houver dado biométrico sincronizado; nos dias em que isso não acontece (ou em que o cansaço percebido não aparece no HRV), o usuário não tem como evitar um treino que não corresponde ao seu estado real — mesmo problema central do FR de recovery já resolvido para o caso objetivo, mas não para o subjetivo.

**Independent Test**: Pode ser testado sinalizando cansaço para o dia atual antes de iniciar o treino e verificando que a sessão pendente retornada vem com volume/carga reduzidos e um motivo de ajuste visível, sem precisar de nenhum dado de HRV sincronizado.

**Acceptance Scenarios**:

1. **Given** um mesociclo ativo com uma sessão pendente e nenhum dado de HRV sincronizado para hoje, **When** o usuário sinaliza que está muito cansado hoje, **Then** o treino do dia é retornado com volume e/ou carga reduzidos e um motivo de ajuste visível.
2. **Given** que o usuário sinalizou cansaço hoje, **When** ele reabre o app mais tarde no mesmo dia, **Then** o ajuste continua aplicado (a sinalização vale para o dia todo, não só para aquela sessão específica de app).
3. **Given** que o usuário sinalizou cansaço num dia, **When** o dia seguinte chega, **Then** o ajuste não se aplica mais automaticamente — a sinalização é válida só para o dia em que foi feita.
4. **Given** que o usuário sinalizou cansaço e também há um dado de HRV baixo sincronizado no mesmo dia, **When** o treino do dia é consultado, **Then** o ajuste aplicado é o mais conservador entre os dois (nunca menos redução do que qualquer um dos dois sinalizaria isoladamente).

---

### User Story 3 — Atualizar o perfil quando a situação mudar (Priority: P2)

O usuário quer poder atualizar objetivo, nível, ou lesão declarada a qualquer momento (não só uma vez), e quer que essa mudança valha a partir do próximo mesociclo gerado, sem bagunçar o ciclo que já está em andamento.

**Why this priority**: Objetivo, lesão e disponibilidade mudam ao longo do tempo (uma lesão se resolve, um objetivo muda de fase) — um perfil que só pode ser preenchido uma vez perderia valor rapidamente.

**Independent Test**: Pode ser testado atualizando o perfil no meio de um mesociclo ativo e verificando que o mesociclo em andamento não é alterado retroativamente, mas o próximo mesociclo gerado já reflete o perfil atualizado.

**Acceptance Scenarios**:

1. **Given** um mesociclo ativo em andamento, **When** o usuário atualiza seu perfil (ex.: remove uma lesão que já resolveu), **Then** o mesociclo ativo continua sendo exibido sem alteração até ser concluído.
2. **Given** que o perfil foi atualizado durante um mesociclo ativo, **When** esse mesociclo é concluído e o próximo é gerado automaticamente, **Then** o novo mesociclo reflete o perfil atualizado.

---

### Edge Cases

- O que acontece se o usuário nunca preencher o perfil (deve continuar funcionando com os padrões atuais, sem travar a geração)?
- O que acontece se a lesão declarada tornar praticamente inviável cumprir a frequência semanal configurada (ex.: uma condição que afeta a maioria dos grupos musculares)?
- O que acontece se o usuário sinalizar cansaço depois de já ter iniciado (não apenas consultado) o treino do dia?
- Se o usuário sinalizar cansaço por engano ou mudar de ideia, ele pode desfazer a sinalização no mesmo dia (ver FR-008a) — a próxima consulta ao treino do dia deixa de aplicar o ajuste.
- O que acontece quando "tempo parado sem treinar" é muito longo (ex.: mais de um ano) mesmo com nível de experiência declarado como avançado — o sistema deve tratar a retomada de forma mais conservadora?
- O que acontece se o objetivo, nível ou lesão declarados forem inconsistentes com o perfil genético (ex.: objetivo de alta intensidade combinado com um alerta genético de risco cardiovascular alto)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o usuário informe e atualize, a qualquer momento: objetivo de treino atual (texto livre), nível de experiência (uma de: Iniciante, Intermediário, Avançado), tempo treinando, tempo parado sem treinar (quando aplicável) e lesão/problema físico atual.
- **FR-002**: O sistema DEVE persistir essas informações associadas ao usuário, disponíveis para consulta e edição a qualquer momento, através de uma tela de configurações — sem exigir um fluxo de onboarding obrigatório antes de usar o restante do produto (fora de escopo desta funcionalidade).
- **FR-003**: A geração de um novo mesociclo DEVE usar os dados de perfil mais recentes do usuário (objetivo, nível, tempo treinando, tempo parado, lesão) em vez de valores fixos, influenciando de fato a divisão, volume, intensidade e seleção de exercícios prescritos.
- **FR-004**: Quando uma lesão ou problema físico atual está declarado, a geração do mesociclo DEVE evitar ou adaptar exercícios que agravariam essa condição, e a justificativa do plano gerado DEVE mencionar a adaptação feita.
- **FR-005**: Quando o perfil nunca foi preenchido pelo usuário, o sistema DEVE gerar o mesociclo normalmente usando valores padrão razoáveis, sem falhar ou bloquear a geração.
- **FR-006**: O usuário DEVE conseguir sinalizar, para o dia atual, que está muito cansado, antes ou no momento de consultar o treino do dia.
- **FR-007**: Quando a sinalização de cansaço estiver ativa para o dia, o sistema DEVE aplicar um ajuste de volume/carga à sessão pendente do dia, usando o mesmo mecanismo de ajuste (sem alterar permanentemente o mesociclo armazenado) já usado para o ajuste automático por recovery.
- **FR-008**: A sinalização de cansaço DEVE valer apenas para o dia em que foi feita, deixando de se aplicar automaticamente no dia seguinte.
- **FR-008a**: O usuário DEVE conseguir desfazer a sinalização de cansaço no mesmo dia em que foi feita, removendo o ajuste correspondente da próxima consulta ao treino do dia.
- **FR-009**: Quando houver simultaneamente dado objetivo de recovery (HRV) e sinalização manual de cansaço para o mesmo dia, o sistema DEVE aplicar o ajuste mais conservador entre os dois.
- **FR-010**: Atualizar o perfil do usuário NÃO DEVE alterar retroativamente um mesociclo já ativo — a mudança só se reflete a partir do próximo mesociclo gerado.
- **FR-011**: Os campos do perfil que não se aplicam ao momento atual do usuário (ex.: tempo parado sem treinar, lesão atual) DEVEM poder ficar vazios/não preenchidos.

### Key Entities

- **UserTrainingProfile**: O perfil situacional do usuário — objetivo de treino atual (texto livre), nível de experiência (Iniciante/Intermediário/Avançado), tempo treinando, tempo parado sem treinar (opcional), lesão/problema físico atual (opcional, texto livre), e quando foi atualizado pela última vez. Distinto do perfil genético (que é fixo/biológico) e dos check-ins mensais (que são medidas corporais).
- **DailyTirednessSignal**: A sinalização manual de que o usuário está muito cansado num dia específico — vale só para aquele dia, usada apenas no momento da consulta do treino do dia, não altera o mesociclo armazenado.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois que o usuário preenche ou atualiza objetivo, nível ou lesão, o próximo mesociclo gerado reflete essas informações de forma auditável na justificativa do plano — verificável lendo o texto gerado sem precisar inspecionar código.
- **SC-002**: 100% dos mesociclos gerados depois que uma lesão é declarada evitam ou adaptam explicitamente os exercícios que a agravariam.
- **SC-003**: O usuário consegue sinalizar cansaço e ver o treino do dia ajustado em poucos segundos, sem qualquer espera por geração de IA.
- **SC-004**: O sistema nunca deixa de gerar um mesociclo por falta de perfil preenchido — funciona com os padrões atuais quando o perfil está vazio.
- **SC-005**: Atualizar o perfil no meio de um mesociclo ativo nunca altera a prescrição das sessões já em andamento daquele ciclo.

---

## Assumptions

- O perfil de treino (objetivo, nível, tempo treinando, tempo parado, lesão) é uma entidade situacional separada do perfil genético (biológico/fixo) e dos check-ins mensais (medidas corporais periódicas) — pode ser editado a qualquer momento, sem cadência fixa.
- A lesão/problema físico declarado é tratado como um "alerta situacional" análogo aos alertas genéticos já existentes (ex.: risco COL1A1) — informa e restringe a seleção de exercícios da mesma forma que esses alertas já fazem hoje, sem exigir uma lista estruturada separada de exercícios proibidos.
- A sinalização manual de cansaço reaproveita a mesma escala de ajuste (leve/moderado/alto) já usada pelo ajuste automático por HRV, aplicando o nível "alto" quando sinalizada manualmente — não introduz uma escala de intensidade própria.
- O produto continua de uso pessoal (usuário único), sem necessidade de suportar múltiplos perfis simultâneos.
- Assim como o restante do produto, esta funcionalidade é web-responsiva (`apps/web`), sem componente nativo mobile dedicado.
