# Feature Specification: Treino adaptativo de verdade

**Feature Branch**: `024-treino-adaptativo`  
**Created**: 2026-10-24  
**Status**: Draft  
**Input**: User description: "Treino adaptativo de verdade: potencializar o Agente de Treino usando tudo que o Helux já sabe do usuário (objetivo, condições de saúde e histórico cirúrgico, check-ins, histórico real de treino, cansaço e genética) para gerar treinos mais efetivos e seguros, com regras explícitas e verificáveis, método baseado em evidência, uso proporcional da genética, explicações honestas e qualidade medida por um eval." Complemento do dono (2026-10-24): cardio e alongamento nos dias relevantes; prompt de geração muito robusto, custo maior aceitável em troca do máximo de resultado; histórico de cargas e sensações antes e depois de cada treino; análise do ciclo de 6 semanas inteiro (esforço, cargas, sensações e objetivo) para gerar o próximo; objetivo coletado num onboarding antes do primeiro treino.

## Contexto

Revisão de 2026-10-24 do Agente de Treino (spec 022) e do botão "Gerar novo plano" encontrou:

1. **Condições de saúde não existem como dado estruturado.** O perfil tem só "Objetivo" e "Lesão atual" em texto livre. O caso real do dono: 3 cirurgias de LCA, artrose no joelho esquerdo, lesão de ligamento colateral recuperada, gota, objetivo de "entrar em forma" e "voltar a correr 5 km sem dor no joelho". Nada disso vira restrição aplicada pelo sistema; depende de a IA interpretar o texto.
2. **Check-ins** (peso, % de gordura, cintura, cargas de referência) chegam ao agente como texto, sem regra de influência no treino.
3. **O objetivo não guia o método.** A divisão é fixa por dias/semana (4 dias → ABCD, cada músculo 1×/semana); não há deload, esforço-alvo por série, progressão entre semanas, nem dias dedicados a cardio ou mobilidade.
4. **Genética supervalorizada** (justificativas forçadas, faixas de repetição por "predisposição") e, ao mesmo tempo, **ausente em produção**: o laudo fica num arquivo do repositório (que é público) e não é enviado ao servidor.
5. **Histórico contaminado** por sessões de teste (84–167 s, sessões sem exercícios), usado pela progressão de carga e pela regra de variedade. Não há registro de como o usuário se sentiu antes e depois de cada treino.
6. **Dois geradores**: o botão "Gerar novo plano" usa um gerador legado que ignora o Perfil Integrado, usa valores fixos e salva só no navegador.
7. **Sem medição de qualidade** (não há eval do Agente de Treino) e falhas de robustez (resposta cortada não detectada, geração do próximo mesociclo sem nova tentativa, notas que expõem raciocínio interno).

## Clarifications

### Session 2026-10-24

- Q: Como as condições de saúde são registradas e viram regras? → A: Híbrido. Catálogo das condições comuns (ex.: reconstrução de LCA, artrose, lesão ligamentar, menisco, gota, lombalgia, hipertensão) com regras de treino pré-definidas e fixas; mais a opção "outra" em texto livre, para a qual a IA propõe regras que só valem após o aceite do usuário (mesmo fluxo das restrições compartilhadas da spec 022).
- Q: O mesociclo passa a ter várias semanas ou continua uma rotação única? → A: Mesociclo de 4 a 6 semanas, com semanas de progressão e uma semana de deload; ao fim, o ciclo inteiro é analisado e o próximo é gerado.
- Q: Custo da geração vs. qualidade? → A: Qualidade máxima é a prioridade; custo maior por geração é aceitável (o dono revisa o custo real e o teto mensal da spec 022 continua valendo).
- Q: Quando o objetivo é coletado? → A: Num onboarding obrigatório antes de o primeiro mesociclo ser gerado; usuários existentes passam pelo onboarding (pré-preenchido com o que já existe) antes do próximo mesociclo.
- Q: Cardio e alongamento? → A: Fazem parte do plano semanal, nos dias em que fazem sentido para o objetivo e as condições (sessões ou blocos dedicados), e não só como aquecimento e volta à calma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Onboarding antes do primeiro treino (Priority: P1)

Antes do primeiro mesociclo, o usuário passa por um onboarding curto: objetivo principal (e secundário opcional) com meta mensurável, nível e experiência, tempo parado, condições de saúde e cirurgias, dias e tempo disponíveis, local e equipamentos, preferências de cardio e modalidades que gosta ou não pode fazer. Só depois o plano é gerado. Usuários que já usam o app fazem o mesmo onboarding, pré-preenchido com o que o Helux já sabe, antes do próximo mesociclo.

**Why this priority**: todas as outras histórias dependem de objetivo e condições estruturados; sem eles o agente volta a interpretar texto livre.

**Independent Test**: criar um usuário novo, completar o onboarding e verificar que o primeiro mesociclo usa cada resposta; repetir com o usuário atual e ver os campos pré-preenchidos a partir do perfil existente.

**Acceptance Scenarios**:

1. **Given** um usuário sem onboarding concluído, **When** ele tenta gerar um plano, **Then** é levado ao onboarding e o plano só é gerado depois de concluí-lo.
2. **Given** o usuário atual (objetivo e "Lesão atual" em texto livre), **When** o onboarding abre, **Then** as respostas vêm pré-preenchidas e o texto livre é oferecido para conversão em condições do catálogo, sem perda de informação.
3. **Given** o onboarding concluído, **When** o usuário quiser mudar objetivo, condições ou disponibilidade, **Then** pode editar a qualquer momento, e a mudança vale no próximo plano gerado (ou na adaptação da sessão, se for de segurança).
4. **Given** um usuário que interrompe o onboarding, **When** ele volta, **Then** continua de onde parou.

---

### User Story 2 - Condições de saúde e histórico cirúrgico viram regras do treino (Priority: P1)

O usuário registra condições de saúde e cirurgias escolhendo do catálogo (ex.: 3 reconstruções de LCA, artrose no joelho esquerdo, gota) ou descrevendo uma condição fora dele. Cada condição do catálogo traz regras de treino fixas; para condições livres, a IA propõe regras que o usuário aceita. Todas as regras ativas são verificadas pelo sistema em todo plano. Quando a gota entra em crise, o usuário marca a crise e as sessões poupam a articulação afetada.

**Why this priority**: segurança é o maior risco do produto; hoje um usuário com 3 cirurgias no joelho recebe plano com base em interpretação de texto livre.

**Independent Test**: cadastrar o caso do dono (LCA ×3, artrose esquerda, gota) e gerar um plano; nenhum exercício viola as regras derivadas, e cada regra aparece explicada.

**Acceptance Scenarios**:

1. **Given** artrose no joelho e histórico de reconstrução de LCA, **When** um mesociclo é gerado, **Then** não há exercícios de alto impacto ou salto para membros inferiores, os limites de amplitude e carga dessas condições são respeitados, e a justificativa cita as condições.
2. **Given** um plano que viola uma regra ativa, **When** o sistema valida, **Then** o plano é rejeitado e regenerado com a violação apontada; se persistir, o treino vigente é mantido e o usuário é avisado.
3. **Given** uma condição "outra" descrita em texto livre, **When** o usuário a salva, **Then** recebe regras propostas com o motivo de cada uma, e só as aceitas passam a valer.
4. **Given** gota com crise ativa marcada numa articulação, **When** há sessões no período da crise, **Then** elas evitam carga e impacto nessa articulação, e o Helux orienta procurar o médico se a crise passar do prazo.
5. **Given** uma condição editada ou marcada como resolvida, **When** o próximo plano é gerado, **Then** as regras correspondentes deixam de valer e o usuário vê o que mudou.

---

### User Story 3 - Mesociclo de semanas com força, cardio e mobilidade nos dias certos (Priority: P1)

A partir do objetivo, nível, dias disponíveis e condições, o Helux monta um mesociclo de 4 a 6 semanas: divisão e frequência por grupo muscular baseadas em evidência, volume semanal por grupo, faixas de repetição, esforço-alvo por série, progressão semana a semana e uma semana de deload. O plano semanal posiciona sessões ou blocos de cardio e de alongamento/mobilidade nos dias em que fazem sentido (por exemplo, cardio de baixo impacto em dias sem perna pesada; mobilidade de quadril e joelho após treinos de membros inferiores), compatíveis com as condições.

**Why this priority**: é o que torna o treino efetivo; hoje a divisão é fixa, sem progressão semanal, sem deload e sem cardio ou mobilidade planejados.

**Independent Test**: gerar mesociclos para o mesmo usuário com objetivos diferentes e verificar que divisão, frequência, volume, cardio, mobilidade, progressão e deload mudam conforme o objetivo e seguem as regras de método.

**Acceptance Scenarios**:

1. **Given** objetivo hipertrofia e 4 dias por semana, **When** o mesociclo é gerado, **Then** cada grupo muscular principal é treinado pelo menos 2 vezes por semana, dentro da faixa de volume semanal do método.
2. **Given** objetivo "entrar em forma" após 8 meses parado, **When** o mesociclo é gerado, **Then** a primeira semana começa conservadora, o volume e a intensidade sobem de forma descrita nas semanas seguintes, há uma semana de deload, e o cardio aparece nos dias indicados com intensidade compatível com as condições.
3. **Given** objetivo "voltar a correr 5 km sem dor no joelho" com condições de joelho, **When** o mesociclo é gerado, **Then** há fortalecimento e condicionamento de baixo impacto que preparam a corrida, e a progressão para corrida só aparece quando as regras das condições permitirem, de forma gradual.
4. **Given** qualquer semana do mesociclo, **When** o usuário a visualiza, **Then** vê em que semana está (ex.: "semana 2 de 5"), o que muda em relação à anterior, e o tipo de cada dia (força, cardio, mobilidade, descanso).
5. **Given** um exercício principal, **When** o plano é exibido, **Then** cada série tem um esforço-alvo compreensível (ex.: "deixe 2 repetições na reserva").
6. **Given** um objetivo que conflita com uma condição de saúde, **When** o plano é gerado, **Then** a condição prevalece e o conflito é explicado com a alternativa mais próxima.

---

### User Story 4 - Sensações antes e depois de cada treino (Priority: P2)

Antes de começar o treino, o usuário responde um check-in rápido (energia, sono, dor ou desconforto e onde, motivação). Ao terminar, registra o esforço percebido da sessão, dor ou desconforto durante e depois, e como se sentiu. As cargas e repetições de cada série continuam registradas. O treino do dia pode ser ajustado pela sensação de antes (como o cansaço da spec 011), e tudo fica guardado para a análise do ciclo.

**Why this priority**: sem sensações registradas, a análise do ciclo só enxerga carga e repetição; com elas, o Helux sabe se a progressão está sustentável e se alguma articulação reage mal.

**Independent Test**: fazer um treino respondendo os dois check-ins e verificar que as respostas ficam associadas à sessão e aparecem no histórico; marcar dor no joelho antes do treino e verificar a adaptação da sessão do dia.

**Acceptance Scenarios**:

1. **Given** um treino prestes a começar, **When** o usuário abre a sessão, **Then** responde o check-in de antes em menos de 30 segundos (ou pula), e a resposta fica ligada à sessão.
2. **Given** dor relatada antes do treino numa articulação com condição registrada, **When** a sessão começa, **Then** os exercícios que carregam essa articulação são adaptados ou substituídos, com explicação.
3. **Given** um treino concluído, **When** o usuário finaliza, **Then** registra esforço percebido e sensações em menos de 30 segundos (ou pula).
4. **Given** sessões com sensações registradas, **When** o usuário vê o histórico, **Then** vê cargas, repetições, esforço e sensações de cada sessão.

---

### User Story 5 - Análise do ciclo inteiro para gerar o próximo (Priority: P2)

Ao fim do mesociclo, o Helux analisa as 4 a 6 semanas inteiras: aderência (sessões feitas vs. planejadas), evolução de cargas e repetições por exercício, esforço percebido, sensações antes e depois, dores relatadas, cansaço, check-ins corporais e o objetivo. Mostra ao usuário um resumo do ciclo (o que evoluiu, o que estagnou, o que doeu) e gera o próximo mesociclo a partir dessa análise, explicando o que mudou e por quê.

**Why this priority**: é o "treinador que revisa o ciclo"; depende do mesociclo semanal (US3) e das sensações (US4).

**Independent Test**: simular um ciclo completo com dados conhecidos (ex.: estagnação no agachamento, dor recorrente no joelho, baixa aderência às sessões de cardio) e verificar que o resumo cita cada ponto e o próximo ciclo os trata.

**Acceptance Scenarios**:

1. **Given** um mesociclo concluído, **When** a análise roda, **Then** o usuário vê um resumo com aderência, evolução por exercício, esforço médio, dores relatadas e tendência dos check-ins.
2. **Given** um exercício com dor relatada em várias sessões, **When** o próximo ciclo é gerado, **Then** esse exercício é trocado ou adaptado e o motivo é mostrado.
3. **Given** cargas estagnadas com esforço alto, **When** o próximo ciclo é gerado, **Then** o estímulo muda (exercício, faixa ou volume) segundo as regras de método, com explicação.
4. **Given** baixa aderência a um tipo de sessão (ex.: cardio), **When** o próximo ciclo é gerado, **Then** o plano propõe um formato mais viável e pergunta ao usuário se faz sentido.
5. **Given** dois check-ins com tendência contrária ao objetivo, **When** o próximo ciclo é gerado, **Then** o ajuste previsto pela regra daquela tendência é aplicado e explicado com os números; sugestões de troca de objetivo exigem aceite.

---

### User Story 6 - Dados confiáveis e explicações honestas (Priority: P2)

O treino só usa dados confiáveis: sessões claramente inválidas (curtas demais, sem exercícios) não entram na progressão nem na análise do ciclo, e o usuário pode revisá-las. A genética passa a funcionar em produção, guardada por usuário e de forma protegida, e tem peso proporcional à evidência: ajuste fino, nunca a justificativa principal. As notas ao usuário são instruções de execução e motivos claros, sem raciocínio interno.

**Why this priority**: sem dados confiáveis, a análise do ciclo e as regras produzem decisões erradas; a genética exposta publicamente é um risco de privacidade.

**Independent Test**: com sessões de teste no histórico, verificar que a progressão e a análise as ignoram; com genética cadastrada, verificar que ela chega ao agente em produção e que nenhuma decisão de método é justificada só por genética.

**Acceptance Scenarios**:

1. **Given** sessões abaixo do mínimo de validade, **When** a progressão ou a análise do ciclo rodam, **Then** essas sessões são ignoradas e listadas para revisão.
2. **Given** uma sessão marcada como inválida, **When** o usuário a confirma como real ou a exclui, **Then** a decisão vale para os próximos cálculos.
3. **Given** um laudo genético do usuário, **When** um plano é gerado em produção, **Then** a genética é considerada, e o laudo não está acessível publicamente nem fora da conta do usuário.
4. **Given** um plano gerado, **When** as justificativas são lidas, **Then** nenhuma escolha de divisão, faixa de repetição ou exercício tem a genética como único motivo, e nenhuma nota menciona processos internos.

---

### User Story 7 - Um único gerador, robusto e com o máximo de qualidade (Priority: P2)

Todo plano (mesociclo automático e "Gerar novo plano") vem do mesmo Agente de Treino, com todo o Perfil Integrado e as regras desta spec, usando a configuração de maior qualidade disponível; o custo maior é aceito. O resultado é salvo na conta. Se a geração falhar ou vier incompleta, o Helux tenta de novo e, sem sucesso, mantém o treino vigente com aviso claro, sem ficar preso em "gerando".

**Why this priority**: hoje o caminho manual ignora tudo o que esta spec melhora, e uma falha deixa o usuário sem treino.

**Independent Test**: gerar um plano pelo botão e verificar que respeita condições e objetivo e aparece em outro dispositivo; simular falha da IA e verificar a nova tentativa e o aviso.

**Acceptance Scenarios**:

1. **Given** condições e objetivo registrados, **When** o usuário usa "Gerar novo plano", **Then** o plano respeita as mesmas regras e fica salvo na conta.
2. **Given** o mesociclo concluído e uma falha na geração do próximo, **When** o usuário abre o app depois, **Then** a geração é tentada de novo; enquanto isso, o usuário vê o estado e pode repetir a última semana do ciclo.
3. **Given** uma resposta da IA incompleta, **When** o sistema a recebe, **Then** ela é descartada sem erro genérico nem plano parcial.

---

### User Story 8 - Qualidade medida (Priority: P3)

Existe um conjunto de perfis de teste representativos (o caso gota + cirurgias de joelho + entrar em forma, um iniciante, um usuário com pouco tempo, um só com halteres em casa, um avançado, e um ciclo concluído com dados de sensações para testar a análise) e uma avaliação que gera planos e os pontua por critérios objetivos. Toda mudança no Agente de Treino é comparada com a pontuação anterior.

**Why this priority**: permite afirmar que o treino ficou melhor; pode ser feito em paralelo, mas só gera valor com as outras histórias.

**Independent Test**: rodar a avaliação antes e depois das mudanças e comparar as notas por critério.

**Acceptance Scenarios**:

1. **Given** os perfis de teste, **When** a avaliação roda, **Then** cada plano recebe nota por critério e um total, com o custo da rodada informado.
2. **Given** uma mudança no Agente de Treino, **When** a avaliação roda, **Then** a mudança só é aceita se nenhum critério de segurança piorar.

---

### Edge Cases

- Condições que se combinam (artrose + LCA no mesmo joelho; gota no joelho já operado): vale a regra mais restritiva de cada uma.
- Crise de gota sem prazo informado: assume um prazo padrão e pergunta ao usuário quando expirar.
- Restrições tão amplas que não sobra exercício para um grupo muscular: o plano omite o grupo e explica, em vez de violar a restrição.
- Sem cardio possível com o equipamento e as condições: o plano usa a opção de menor impacto disponível ou explica a ausência.
- Usuário que pula os check-ins de sensação: o ciclo é analisado com o que existe, e o resumo diz quais dados faltaram.
- Usuário que treina menos dias do que o planejado numa semana: a semana seguinte não acumula as sessões perdidas; a ordem continua e a aderência entra na análise.
- Ciclo interrompido no meio (pausa longa, lesão nova): ao voltar, o usuário escolhe retomar ou recomeçar com novo ciclo ajustado à pausa.
- Check-ins com valores implausíveis (ex.: 15 kg de variação em um mês): sinalizados, sem ajuste automático.
- Todas as sessões do histórico inválidas: o plano é gerado como para quem está começando, com cargas sugestivas.
- Pedido pelo chat que viola uma condição registrada: a regra de segurança prevalece (comportamento de conflito da spec 022).

## Requirements *(mandatory)*

### Functional Requirements

**Onboarding (US1)**

- **FR-001**: Antes do primeiro mesociclo, o usuário MUST concluir um onboarding com: objetivo principal, objetivo secundário opcional, meta mensurável opcional, nível, experiência, tempo parado, condições de saúde e cirurgias, dias e minutos disponíveis, local e equipamentos, preferências e limitações de cardio.
- **FR-002**: Usuários existentes MUST passar pelo onboarding antes do próximo mesociclo, com as respostas pré-preenchidas a partir do perfil e das preferências já registradas.
- **FR-003**: O texto livre atual de "Lesão atual" MUST ser preservado e oferecido para conversão em condições do catálogo, sem perda de informação.
- **FR-004**: As respostas do onboarding MUST ser editáveis a qualquer momento e o progresso de um onboarding interrompido MUST ser salvo.

**Condições de saúde (US2)**

- **FR-005**: O usuário MUST poder registrar condições a partir de um catálogo (no mínimo: reconstrução de LCA, artrose, lesão ligamentar, lesão de menisco, gota, lombalgia, hipertensão), com região/articulação, lado, data aproximada, estado (ativa, controlada, resolvida) e observações.
- **FR-006**: Cada condição do catálogo MUST ter regras de treino pré-definidas e fixas (padrões proibidos ou limitados, impacto máximo, limites de amplitude ou carga, cuidados), visíveis ao usuário.
- **FR-007**: O usuário MUST poder registrar uma condição "outra" em texto livre; a IA MUST propor regras com motivo, e só as regras aceitas pelo usuário MUST valer.
- **FR-008**: Todo plano MUST ser validado pelo sistema contra as regras das condições ativas; planos que violam MUST ser rejeitados e regenerados uma vez com as violações informadas; se persistir, o treino vigente MUST ser mantido e o usuário avisado.
- **FR-009**: O usuário MUST poder marcar uma crise de gota (articulação e prazo); durante a crise, as sessões MUST evitar carga e impacto na articulação, e a orientação de procurar o médico MUST aparecer quando a crise passar do prazo.
- **FR-010**: Condições registradas MUST estar disponíveis aos demais agentes (Medicina, Nutrição) pelo Perfil Integrado, respeitando a fonte desativável da spec 022.

**Mesociclo, método, cardio e mobilidade (US3)**

- **FR-011**: O mesociclo MUST ter de 4 a 6 semanas, com progressão planejada semana a semana e uma semana de deload, e o usuário MUST ver em que semana está.
- **FR-012**: Divisão, frequência por grupo, volume semanal por grupo, faixas de repetição, esforço-alvo por série, progressão e deload MUST ser escolhidos por regras de método documentadas e baseadas em evidência, a partir de objetivo, nível, tempo parado, dias disponíveis e condições.
- **FR-013**: Para objetivos de hipertrofia ou condicionamento com 3 ou mais dias por semana, cada grupo muscular principal MUST ser treinado pelo menos 2 vezes por semana.
- **FR-014**: O plano semanal MUST incluir cardio e alongamento/mobilidade como sessões ou blocos dedicados nos dias definidos pelas regras de método, de acordo com o objetivo e as condições (ex.: cardio de baixo impacto para joelho operado), além do aquecimento e da volta à calma de cada sessão.
- **FR-015**: Cada exercício principal MUST ter esforço-alvo por série compreensível ao usuário.
- **FR-016**: Quem volta de pausa longa (≥ 3 meses) MUST começar com volume e intensidade reduzidos, com aumento descrito no plano.

**Sensações (US4)**

- **FR-017**: O usuário MUST poder registrar, antes de cada treino, energia, qualidade do sono, dor ou desconforto (com local) e motivação; e, ao final, esforço percebido da sessão, dor ou desconforto (com local) e como se sentiu. Ambos MUST poder ser pulados.
- **FR-018**: Dor relatada antes do treino numa região com condição registrada MUST adaptar os exercícios que carregam essa região na sessão do dia, com explicação.
- **FR-019**: Cargas, repetições, esforço e sensações MUST ficar associados a cada sessão e visíveis no histórico.

**Análise do ciclo (US5)**

- **FR-020**: Ao fim de cada mesociclo, o sistema MUST analisar o ciclo inteiro (aderência por tipo de sessão, evolução de carga e repetição por exercício, esforço percebido, sensações, dores relatadas, cansaço, check-ins e objetivo) e mostrar um resumo ao usuário.
- **FR-021**: O próximo mesociclo MUST ser gerado a partir dessa análise, e o usuário MUST ver o que mudou em relação ao ciclo anterior e por quê.
- **FR-022**: Exercícios com dor relatada recorrente MUST ser trocados ou adaptados no ciclo seguinte; estagnação com esforço alto MUST mudar o estímulo segundo as regras de método.
- **FR-023**: Ajustes por tendência de check-in MUST seguir regras publicadas por objetivo; sugestões de troca de objetivo MUST exigir aceite; check-ins implausíveis MUST ser sinalizados sem ajuste automático.

**Dados e explicações (US6)**

- **FR-024**: Sessões abaixo de critérios mínimos de validade (duração, séries registradas) MUST ser ignoradas pela progressão e pela análise do ciclo, e listadas para revisão; o usuário MUST poder confirmar ou excluir cada uma.
- **FR-025**: O laudo genético MUST ser guardado por usuário, acessível só à conta dele, disponível ao Agente de Treino em produção, e MUST NOT ficar em local público.
- **FR-026**: A genética MUST ser só ajuste fino; nenhuma decisão de divisão, faixa de repetição ou escolha de exercício MUST ter a genética como único motivo.
- **FR-027**: Notas ao usuário MUST conter apenas instruções de execução e motivos voltados a ele; MUST NOT expor raciocínio interno, datas de uso anterior ou regras do sistema.

**Gerador único e robustez (US7)**

- **FR-028**: Todo plano (automático e "Gerar novo plano") MUST vir do mesmo Agente de Treino, com as mesmas regras, e MUST ser salvo na conta.
- **FR-029**: A geração MUST usar a configuração de maior qualidade de raciocínio disponível; custo maior por geração é aceitável, respeitando o teto mensal de IA da spec 022.
- **FR-030**: Respostas incompletas da IA MUST ser detectadas e descartadas, com nova tentativa.
- **FR-031**: Com o mesociclo concluído sem um próximo gerado, o sistema MUST tentar de novo ao próximo acesso; o usuário MUST ver o estado e poder repetir a última semana enquanto isso.
- **FR-035**: A IA MUST escolher exercícios e modalidades de cardio só entre os já permitidos pelas restrições do usuário (equipamento, bloqueios, carga articular, impacto); um plano com exercício proibido MUST ser impossível de gerar, não só recusado depois.
- **FR-036**: Antes de chamar a IA, o sistema MUST conferir se o pedido tem solução (exercícios permitidos em cada grupo principal, volume do método cabendo nos dias e no tempo, cardio permitido) e ajustar o método por código quando não tiver, registrando o motivo. Desvios de contagem (séries por grupo, duração da sessão) MUST ser corrigidos por código antes de recusar o plano, e a nova tentativa MUST corrigir o plano anterior em vez de refazê-lo.

**Qualidade (US8)**

- **FR-032**: MUST existir um conjunto versionado de perfis de teste representativos, incluindo o caso gota + LCA/artrose + entrar em forma e um ciclo concluído com sensações.
- **FR-033**: MUST existir uma avaliação repetível que pontua os planos e a análise do ciclo por critério (segurança, aderência ao objetivo, frequência e volume por grupo, presença adequada de cardio e mobilidade, coerência e honestidade das justificativas) e informa o custo da rodada.
- **FR-034**: Mudanças no Agente de Treino MUST NOT ser aceitas se piorarem qualquer critério de segurança na avaliação.

### Key Entities

- **Onboarding**: respostas do usuário (objetivo, nível, experiência, pausa, condições, disponibilidade, local, equipamentos, preferências de cardio), estado (em andamento, concluído) e data.
- **Objetivo**: principal, secundário opcional, meta mensurável opcional; guia o método.
- **Condição de saúde**: item do catálogo ou "outra", região/articulação, lado, data aproximada, estado, observações; origina regras.
- **Regra de treino derivada**: padrões ou exercícios proibidos ou limitados, impacto máximo, limites de amplitude/carga e cuidados; fixa (catálogo) ou proposta e aceita ("outra"); validada em todo plano.
- **Crise**: episódio temporário de uma condição (ex.: gota) com articulação, início e prazo.
- **Mesociclo semanal**: 4 a 6 semanas; cada semana com dias tipados (força, cardio, mobilidade, descanso), progressão e indicação de deload.
- **Regras de método**: tabela documentada que mapeia objetivo, nível, dias e condições para divisão, frequência, volume, faixas, esforço-alvo, cardio, mobilidade, progressão e deload.
- **Sensação da sessão**: antes (energia, sono, dor e local, motivação) e depois (esforço percebido, dor e local, como se sentiu), ligada à sessão.
- **Análise do ciclo**: resumo de aderência, evolução por exercício, esforço, sensações, dores, cansaço e check-ins; base do próximo mesociclo.
- **Validade de sessão**: válida, suspeita ou excluída, com decisão do usuário.
- **Perfil de teste e avaliação**: perfis representativos, critérios, notas por rodada e custo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nos perfis de teste, 100% dos planos respeitam todas as regras das condições de saúde (zero violações de segurança).
- **SC-002**: Nos perfis com objetivo de hipertrofia ou condicionamento e 3+ dias, 100% dos grupos musculares principais são treinados ao menos 2×/semana.
- **SC-003**: Em 100% dos perfis cujo objetivo pede condicionamento, o plano semanal tem cardio em dias compatíveis com as condições; em 100% dos perfis, há mobilidade/alongamento planejado na semana.
- **SC-004**: A nota total média da avaliação melhora em relação à linha de base medida antes das mudanças, sem piora em nenhum critério de segurança.
- **SC-005**: No perfil de ciclo concluído, o resumo cita 100% dos pontos conhecidos (estagnação, dor recorrente, baixa aderência) e o próximo ciclo trata cada um.
- **SC-006**: O usuário conclui o onboarding em menos de 5 minutos, e cada check-in de sensação em menos de 30 segundos.
- **SC-007**: Em revisão manual de 10 planos, nenhuma decisão de método ou exercício tem a genética como único motivo e nenhuma nota expõe raciocínio interno.
- **SC-008**: Após o último treino de um ciclo, o próximo plano fica disponível em até 3 minutos em 95% dos casos, e o usuário nunca fica sem opção de treino.
- **SC-009**: O laudo genético não está acessível em nenhum local público e está disponível ao agente em produção.

## Assumptions

- O Helux não substitui orientação médica: as regras do catálogo são conservadoras, e o app recomenda avaliação profissional quando houver dor persistente, crise prolongada ou condição nova.
- Regras de método seguem consenso atual de treinamento (frequência ≥ 2×/semana por grupo para hipertrofia, faixas de volume semanal por grupo, esforço-alvo por repetições na reserva, deload periódico, cardio de baixo impacto para articulações comprometidas).
- Qualidade acima de custo: a geração usa a configuração de maior qualidade; como o mesociclo passa a ser gerado a cada 4–6 semanas, o número de gerações cai e o custo total por mês tende a ficar próximo do atual.
- A integração da gota com a nutrição (dieta, hidratação) fica para a Nutrição (spec 018) via Perfil Integrado; esta spec cobre o lado do treino.
- Os exames (spec 019), quando existirem, entram pelo Perfil Integrado como hoje; esta spec não cria regras por biomarcador.
- A adaptação diária por cansaço (specs 011/022) continua valendo e passa a considerar também o check-in de antes do treino.
- A avaliação de qualidade usa IA para gerar e pontuar e tem custo por rodada; cada rodada é aprovada pelo dono antes de rodar.
- Uso pessoal (um usuário principal); os perfis de teste são fictícios, exceto o caso inspirado no dono, com dados anonimizados.
- O mesociclo vigente (formato antigo) continua válido até ser concluído; o novo formato vale a partir do próximo ciclo, após o onboarding.
