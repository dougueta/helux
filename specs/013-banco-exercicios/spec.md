# Feature Specification: Banco de exercícios — variedade de animações + equivalência genética

**Feature Branch**: `013-banco-exercicios`
**Created**: 2026-09-27
**Status**: Draft
**Input**: Pedido do usuário (escopo decidido em 2026-08-29): "Banco de exercícios: variedade de animações + equivalência genética". Expandir os dois eixos — (a) mais animações de execução cobrindo os padrões de movimento que hoje caem na animação genérica de supino (agachar, dobrar quadril, puxar, core, isolamentos), reaproveitando as 3 animações prontas e nunca usadas (elevação lateral, supino inclinado, tríceps deitado); (b) mais exercícios/variantes por padrão; e (c) sugerir equivalências ENTRE padrões de movimento diferentes, sempre com lógica genética por trás. Meta mensurável: reduzir drasticamente o % de exercícios que caem na animação genérica, medido antes/depois.

## Contexto e linha de base

- O banco de exercícios tem hoje **102 exercícios** em 8 padrões de movimento (agachar 13, dobrar quadril 13, empurrar horizontal 9, empurrar vertical 6, puxar horizontal 10, puxar vertical 6, core 12, isolamento 33).
- A demonstração de execução escolhe a animação só pelo padrão: empurrar vertical → desenvolvimento; qualquer isolamento → tríceps na polia; **todo o resto → supino reto** (animação genérica).
- Resultado: **63 de 102 exercícios (61,8%) mostram a animação de supino reto**, embora só 9 deles sejam de fato supinos/flexões (empurrar horizontal). Outros **27 isolamentos (26,5%)** — roscas, panturrilha, cadeira extensora, crucifixo, elevações — mostram a animação de tríceps na polia. Ao todo, **81 de 102 (79,4%) exibem uma animação que não corresponde ao movimento**.
- Existem 3 animações prontas nunca usadas: elevação lateral, supino inclinado e tríceps deitado (testa).
- As variantes sugeridas para um exercício vêm só do **mesmo padrão de movimento**, uma por tipo de equipamento. O ajuste genético atual considera só o equipamento (predisposição, recuperação, "risco articular" genérico) e não sabe qual articulação o alerta genético aponta.

### Resultado (depois, medido em 2026-10-12 com `measureMotionCoverage` + `resolveMotion`)

- **122 exercícios** (era 102): agachar 15, dobrar quadril 15, empurrar horizontal 11, empurrar vertical 9, puxar horizontal 11, puxar vertical 10, core 16, isolamento 35; todo padrão com ≥ 8 exercícios e ≥ 3 equipamentos (SC-006).
- **Animação genérica/incorreta: 0 de 122 (0%)** (era 79,4%; meta ≤ 10%, SC-002).
- **Supino reto: 5 de 122 (4,1%)** (era 61,8%; meta ≤ 12%). Animação mais usada: `hinge` com 11 (9,0%; meta ≤ 20%). 30 animações distintas em uso.
- Cenário de referência (agachamento + alerta de joelho): o melhor encaixe passa a ser o equivalente **Pull-through no Cabo** (99), seguido da Leg Press 45° (96), como permite a FR-014.

## Clarifications

### Session 2026-09-27

- Q: Planos já salvos (com a chave de animação antiga nas variantes) devem ser reprocessados para ganhar as animações novas? → A: Não. Só planos gerados a partir desta versão recebem as novas animações; planos antigos continuam válidos com a animação que já têm (sem migração, sem recálculo no cliente). (assumido pelo agente — revisar)
- Q: Como o teste decide que um exercício está em "animação genérica ou incorreta" (SC-002)? → A: Cada animação declara quais padrões de movimento (e, para isolamentos, quais grupos musculares) representa; um exercício conta como genérico/incorreto se recebeu a animação de último recurso ou uma animação que não declara o seu padrão/grupo. Aplicada ao código atual, essa regra reproduz a linha de base de 81/102 (79,4%). (assumido pelo agente — revisar)
- Q: Quais fatores genéticos disparam equivalência entre padrões? → A: Apenas alertas articulares (joelho, ombro, lombar ou genérico). Predisposição, recuperação e risco cardiovascular continuam influenciando só a pontuação de compatibilidade, não a inclusão de equivalentes de outro padrão. (assumido pelo agente — revisar)
- Q: Quanto a carga articular pesa na compatibilidade? → A: 4 pontos por nível de diferença de carga (0–2) na articulação sinalizada, em relação ao exercício original (somado por articulação sinalizada), sempre dentro da faixa 50–99. (assumido pelo agente — revisar)
- Q: Um equivalente de outro padrão pode receber o destaque "melhor encaixe" (betterFit)? → A: Sim — o destaque vai para a variante de maior compatibilidade que não seja a recomendada, seja do mesmo ou de outro padrão. (assumido pelo agente — revisar)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a animação certa do exercício (Priority: P1)

Durante o treino, ao abrir "Ver execução", o usuário vê uma demonstração animada que corresponde ao movimento que vai fazer: um agachamento mostra alguém agachando, uma remada mostra uma puxada em direção ao tronco, uma prancha mostra a posição de prancha, uma rosca mostra a flexão do cotovelo — e não a animação de supino para quase tudo.

**Why this priority**: É o problema mais visível (6 em cada 10 exercícios mostram supino) e o que mais mina a confiança no app durante o treino.

**Independent Test**: Gerar um plano/variantes para exercícios de cada padrão (agachamento, terra, remada, barra fixa, prancha, rosca, panturrilha) e verificar que cada um recebe uma animação específica do seu movimento; rodar a medição do banco e confirmar a queda do percentual de animação genérica.

**Acceptance Scenarios**:

1. **Given** um exercício de agachamento no plano, **When** o usuário abre a execução, **Then** a demonstração mostra o movimento de agachar (quadril e joelhos flexionando), não um supino.
2. **Given** um exercício de dobrar quadril (terra, stiff, good morning), **When** o usuário abre a execução, **Then** a demonstração mostra a flexão do quadril com tronco inclinando.
3. **Given** uma remada ou puxada, **When** o usuário abre a execução, **Then** a demonstração mostra a puxada na direção correspondente (horizontal ou vertical).
4. **Given** um exercício de core (prancha, abdominal, elevação de pernas), **When** o usuário abre a execução, **Then** a demonstração mostra o movimento de core correspondente.
5. **Given** Supino Inclinado, Elevação Lateral ou Tríceps Testa, **When** o usuário abre a execução, **Then** vê as animações específicas de supino inclinado, elevação lateral e tríceps deitado.
6. **Given** um usuário com preferência de movimento reduzido, **When** abre qualquer nova animação, **Then** a demonstração fica parada no meio do movimento (mesma regra das animações existentes).

---

### User Story 2 - Trocar por um equivalente de outro padrão quando a genética pede (Priority: P2)

Um usuário cujo perfil genético sinaliza risco no joelho abre as variantes de um agachamento e, além das variações de agachamento, vê equivalentes de outro padrão de movimento que trabalham musculatura semelhante com menos carga no joelho (ex.: elevação pélvica, levantamento terra romeno), com a explicação do porquê. Da mesma forma, um alerta de ombro sugere remadas no lugar de puxadas verticais e supinos no lugar de desenvolvimentos; um alerta lombar sugere opções com menos carga na coluna no lugar do levantamento terra.

**Why this priority**: É o diferencial do produto (treino guiado por genética), mas depende de haver um banco e critérios de carga articular — vem depois da correção visual.

**Independent Test**: Chamar a geração de variantes para um agachamento com e sem alerta de joelho e verificar que só com o alerta aparecem equivalentes de outro padrão, todos com menor carga no joelho que o original e com justificativa genética.

**Acceptance Scenarios**:

1. **Given** perfil com alerta genético de joelho, **When** o sistema gera variantes de um agachamento, **Then** a lista inclui pelo menos 1 equivalente de outro padrão (dobrar quadril) com carga no joelho menor que a do original, marcado como equivalente de outro padrão e com justificativa citando o alerta.
2. **Given** perfil sem nenhum alerta articular, **When** o sistema gera variantes, **Then** nenhum equivalente de outro padrão é sugerido (comportamento atual preservado).
3. **Given** perfil com alerta de ombro, **When** o sistema gera variantes de uma puxada vertical ou de um desenvolvimento, **Then** aparecem equivalentes do padrão horizontal correspondente com menor carga no ombro.
4. **Given** perfil com alerta lombar, **When** o sistema gera variantes do levantamento terra, **Then** aparecem equivalentes de outro padrão com menor carga lombar.
5. **Given** qualquer perfil, **When** equivalentes de outro padrão são sugeridos, **Then** cada um tem compatibilidade (0–100 dentro da faixa 50–99) calculada pelas mesmas regras genéticas, e a lista continua ordenada por compatibilidade.
6. **Given** a folha de execução com variantes, **When** há um equivalente de outro padrão, **Then** ele é identificado visualmente como "Equivalente" e pode ser aplicado como qualquer outra variante.

---

### User Story 3 - Mais opções por padrão de movimento (Priority: P3)

O usuário encontra mais variações para cada padrão (especialmente nos padrões com poucas opções: empurrar vertical, puxar vertical), aumentando a chance de ter uma alternativa adequada ao seu equipamento e à sua genética.

**Why this priority**: Aumenta a variedade, mas o valor depende das histórias 1 e 2.

**Independent Test**: Verificar que o banco cresceu, que cada padrão principal tem ao menos 8 exercícios e ao menos 3 tipos de equipamento, e que todos os novos exercícios têm orientações e animação específica.

**Acceptance Scenarios**:

1. **Given** o banco ampliado, **When** contamos por padrão, **Then** todo padrão de movimento principal tem ≥ 8 exercícios e ≥ 3 tipos de equipamento.
2. **Given** um novo exercício, **When** ele é sugerido, **Then** tem nome único, 3–5 orientações de execução, músculos, cadência e animação específica.

---

### Edge Cases

- Exercício que o plano cita mas não existe no banco: continua sem variantes (comportamento atual) e a demonstração usa a animação genérica.
- Chave de animação desconhecida (ex.: plano antigo salvo com chave obsoleta): a demonstração cai na animação genérica, sem erro.
- Planos já gerados antes desta feature guardam a animação antiga nas variantes: continuam funcionando e passam a ter as animações novas quando um novo plano for gerado (sem migração de dados).
- Alerta genético genérico ("risco articular generalizado", tendão/ligamento sem articulação): tratado como alerta para todas as articulações monitoradas.
- Alertas em várias articulações ao mesmo tempo: um equivalente só é sugerido se não aumentar a carga em nenhuma articulação sinalizada.
- Nenhum candidato de outro padrão atende aos critérios: nenhum equivalente é adicionado (não se força sugestão).
- Isolamentos e core: não recebem equivalentes de outro padrão nesta versão (o equivalente genético se aplica aos padrões compostos).

## Requirements *(mandatory)*

### Functional Requirements

**Animações**

- **FR-001**: O sistema DEVE oferecer animações de execução específicas para, no mínimo: agachamento, avanço/afundo, leg press, dobrar quadril (terra/stiff), elevação pélvica, remada (puxar horizontal), puxada/barra fixa (puxar vertical), rosca (bíceps), crucifixo, panturrilha, cadeira extensora, cadeira/mesa flexora, prancha, abdominal e elevação de pernas — além das existentes.
- **FR-002**: As 3 animações existentes e nunca usadas (elevação lateral, supino inclinado, tríceps deitado) DEVEM passar a ser usadas pelos exercícios correspondentes.
- **FR-003**: A animação de cada exercício DEVE ser escolhida por critério do próprio exercício (padrão de movimento, grupo muscular, e características do nome quando o padrão é amplo, como nos isolamentos), com uma animação genérica apenas como último recurso.
- **FR-004**: A animação de supino reto DEVE ficar restrita a exercícios de empurrar horizontal; a de tríceps na polia, a exercícios de tríceps.
- **FR-005**: Deve existir uma medição automatizada (teste) que calcula o percentual de exercícios do banco que caem na animação genérica/incorreta, e que falha se o percentual ultrapassar a meta (SC-001/SC-002).
- **FR-006**: As novas animações DEVEM seguir o Design System v2 (cores por tokens, acento só no implemento, amplitude em tom neutro) e respeitar movimento reduzido (parada no meio do movimento).
- **FR-007**: Uma chave de animação desconhecida DEVE cair na animação genérica sem erro.

**Banco de exercícios**

- **FR-008**: O banco DEVE crescer para ≥ 115 exercícios, com todo padrão principal tendo ≥ 8 exercícios e ≥ 3 tipos de equipamento.
- **FR-009**: Todo exercício DEVE ter carga articular estimada (joelho, ombro, lombar) numa escala de 0 (baixa) a 2 (alta), derivada do padrão de movimento e ajustada por exercício quando o movimento difere do padrão (ex.: leg press e hack com menos carga lombar que o agachamento livre).
- **FR-010**: Todo exercício novo DEVE manter as regras do banco atual: id e nome únicos, 3–5 orientações, equipamento válido, músculos e cadência derivados.

**Equivalência genética entre padrões**

- **FR-011**: A geração de variantes DEVE identificar a(s) articulação(ões) sinalizada(s) pelos alertas genéticos do perfil (joelho, ombro, lombar; alerta genérico de tendão/ligamento/articulação = todas).
- **FR-012**: Para exercícios compostos, quando há articulação sinalizada, o sistema DEVE sugerir até 2 equivalentes de outro padrão da mesma família funcional (membros inferiores: agachar ↔ dobrar quadril; empurrar: horizontal ↔ vertical; puxar: horizontal ↔ vertical), escolhidos por critério: carga estritamente menor na articulação sinalizada que o original e não maior em nenhuma outra articulação sinalizada.
- **FR-013**: Entre os candidatos que atendem ao critério, o sistema DEVE escolher os de maior compatibilidade genética, sem repetir equipamento.
- **FR-014**: A compatibilidade genética DEVE passar a considerar a articulação: variantes (do mesmo ou de outro padrão) com menos carga na articulação sinalizada que o exercício original ganham 4 pontos por nível de redução (por articulação sinalizada); com mais carga, perdem 4 por nível. O exercício original não muda de pontuação por esse critério. O destaque "melhor encaixe" pode ir para um equivalente de outro padrão.
- **FR-018**: Apenas alertas articulares disparam equivalência entre padrões; os demais fatores genéticos (predisposição, recuperação, risco cardiovascular) afetam só a pontuação.
- **FR-019**: Para a medição (FR-005), cada animação DEVE declarar os padrões de movimento (e, nos isolamentos, os grupos musculares) que representa; um exercício é "genérico/incorreto" se recebeu a animação de último recurso ou uma que não declara seu padrão/grupo.
- **FR-015**: Cada equivalente de outro padrão DEVE ser marcado como tal e ter justificativa que cite a articulação do alerta genético e o padrão de origem.
- **FR-016**: Sem articulação sinalizada, nenhuma equivalência entre padrões é sugerida e as variantes do mesmo padrão mantêm o comportamento atual.
- **FR-017**: A folha de execução DEVE identificar visualmente um equivalente de outro padrão (etiqueta "Equivalente") e permitir aplicá-lo como qualquer variante.

### Key Entities

- **Exercício do banco**: nome, grupo muscular, equipamento, padrão de movimento, orientações, músculos, cadência, animação e carga articular (joelho/ombro/lombar, 0–2).
- **Animação de execução**: identificador, vista (frontal/lateral), poses de início e fim, cenário (banco, chão, máquina, barra fixa, polia).
- **Variante**: exercício alternativo sugerido com compatibilidade genética, justificativa, animação, implemento e, quando aplicável, a marca de equivalente de outro padrão.
- **Articulação sinalizada**: articulação (joelho, ombro, lombar) extraída dos alertas genéticos do perfil.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O percentual de exercícios do banco que mostram a animação de supino reto cai de **61,8%** para **≤ 12%** (só os exercícios de empurrar horizontal a usam).
- **SC-002**: O percentual de exercícios com animação genérica ou que não corresponde ao seu movimento cai de **79,4%** para **≤ 10%**, medido pelo mesmo teste antes/depois.
- **SC-003**: Nenhuma animação isolada é usada por mais de 20% dos exercícios do banco.
- **SC-004**: 100% dos equivalentes de outro padrão sugeridos têm carga menor na articulação sinalizada que o exercício original e justificativa genética; 0 equivalentes são sugeridos para perfis sem alerta articular.
- **SC-005**: Para os 3 cenários de referência (agachamento + alerta de joelho, puxada vertical + alerta de ombro, levantamento terra + alerta lombar) o usuário vê ao menos 1 equivalente de outro padrão.
- **SC-006**: O banco passa de 102 para ≥ 115 exercícios, com todo padrão principal tendo ≥ 8 exercícios.

## Assumptions

- As animações seguem o estilo atual (figura esquemática em traço, SVG vetorial animado), não vídeos nem imagens externas.
- A carga articular é uma estimativa biomecânica simplificada (0–2) para ranquear alternativas, não uma prescrição clínica.
- Os alertas genéticos continuam chegando como texto livre (pontos de atenção do laudo); a articulação é inferida por palavras-chave (joelho/patelar/ligamento cruzado; ombro/manguito; lombar/coluna/hérnia/disco; tendão/ligamento/articular genérico).
- Planos já salvos não são reprocessados; os benefícios valem para planos gerados a partir desta versão.
- Mudanças limitadas ao banco de exercícios, à geração de variantes, à demonstração animada e à folha de execução; a geração de plano (spec 014, em paralelo) e a tela de treino ativo não mudam além do necessário.
- Não há mudança de banco de dados.
