# Feature Specification: Módulo de Exames Médicos Integrados (Bio-Ecossistema: Treino, Nutrição e Genética)

**Feature Branch**: `019-exames-medicos-integrados`  
**Created**: 2026-10-12  
**Status**: Draft  
**Input**: User description: "Especificar funcionalidade de exames médicos de rotina cruzados com os módulos de Nutrição, Treino e Genética, em um ecossistema integrado onde cada módulo fornece informações ricas sobre o usuário para que o treino seja cada vez mais eficiente. Upload de laudo em PDF/imagem com extração inteligente via IA dos biomarcadores e valores de referência. Foco na validação da Genética vs. Realidade Atual (ex.: predisposição a baixa Vit D/B6 confirmada no sangue) e na Calibragem do Treino por Biomarcadores (CPK, ferritina, hemoglobina, PCR, hormônios ajustando volume e descanso). Interface com Painel Integrado de Biomarcadores e Agente Integrador de Saúde/Performance."

---

## 1. Contexto e Visão Geral

Atualmente, o Helux dispõe de:
1. Um motor avançado de treino e periodização de mesociclos (com adaptação por cansaço diário via Spec 011);
2. Um laudo genético individualizado em `data/genetics/genera.json` (módulos `Genera Nutri` e `Genera Fit`);
3. Uma especificação de nutrição esportiva de precisão (Spec 018) orientada ao treino e às predisposições biológicas.

Contudo, a **genética representa apenas a predisposição latente (o "código de fábrica")**, enquanto os **exames laboratoriais de sangue representam o estado fisiológico presente e dinâmico (o "momento atual")**.

Esta funcionalidade cria o **Módulo de Exames Médicos Integrados**, fechando o ciclo de inteligência biológica do Helux:
- **Extração Inteligente via IA**: Permite ao usuário fazer upload de seus laudos laboratoriais (PDF ou imagem escaneada/foto) e utiliza visão computacional e LLM para reconhecer automaticamente os biomarcadores, unidades, resultados e faixas de referência do laboratório emissor.
- **Cruzamento Genética vs. Realidade Sérica**: Compara o risco genético herdado com o exame real. Exemplo: se o gene `GC (rs7041 A,C)` indica predisposição à carência de Vitamina D, o módulo verifica se a Vitamina D 25-OH atual está deficiente (< 20 ng/mL) ou otimizada (> 30-40 ng/mL), recalibrando as prioridades preventivas da Nutrição (Spec 018).
- **Calibragem Fisiológica do Treino**: Biomarcadores de desgaste muscular e transporte de oxigênio afetam diretamente a prescrição do treino. Por exemplo:
  - *Hemoglobina/Ferritina baixas*: Capacidade de transporte de oxigênio reduzida $\rightarrow$ redução da densidade do treino, intervalos de descanso aumentados e contenção de fadiga cardiovascular;
  - *Creatina Quinase (CPK) ou PCR ultrassensível elevadas*: Sinal de dano muscular agudo persistente ou inflamação sistêmica $\rightarrow$ ativação de protocolo regenerativo ou postergação de sessões pesadas de força com o perfil `ACTN3 C,C`;
  - *Razão Testosterona/Cortisol*: Monitoramento do estado anabólico vs. catabólico para evitar overreaching/overtraining.
- **Painel Integrador e Agente Holístico de Performance**: Um espaço centralizado onde o usuário visualiza o status de seus biomarcadores por sistemas e conversa com um Agente Especialista capaz de correlacionar simultaneamente treino, nutrição, DNA e sangue.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload de Laudo de Exames e Extração Inteligente (Priority: P1)

O usuário acessa o módulo "Exames & Saúde", faz o upload de um arquivo PDF ou foto do laudo laboratorial de rotina emitido pelo laboratório. O sistema processa o documento usando extração visual/estruturada via IA, identifica os exames realizados (Hemograma, Ferritina, Glicemia, Lipidograma, Vitamina D, Vitamina B6, CPK, etc.), seus valores numéricos, unidades e faixas de referência, e apresenta uma tela de revisão amigável para o usuário confirmar ou ajustar os dados antes de salvar.

**Why this priority**: É a porta de entrada dos dados de exames. A extração automatizada elimina o atrito manual e garante a acurácia dos biomarcadores no sistema.

**Independent Test**: Fazer upload de um laudo em PDF contendo hemograma e dosagem de Vitamina D; verificar se os biomarcadores são extraídos com nome, valor e faixas de referência corretas na tabela de revisão e salvos no histórico com a data da coleta.

**Acceptance Scenarios**:
1. **Given** um laudo laboratorial em PDF ou imagem, **When** o usuário submete o arquivo no módulo de Exames, **Then** a IA processa o documento e exibe os biomarcadores extraídos agrupados por categorias (Série Vermelha, Metabólico, Vitaminas/Minerais, Dano Muscular/Inflamação, Hormônios).
2. **Given** a tabela de revisão de biomarcadores exibida, **When** o usuário confere os valores, **Then** pode editar manualmente qualquer campo antes de confirmar o salvamento definitivo.
3. **Given** um arquivo ilegível ou corrompido, **When** o upload falha, **Then** o sistema exibe mensagem de erro clara orientando o usuário a tentar uma foto mais nítida ou preencher manualmente.

---

### User Story 2 - Validação Genética vs. Realidade Sérica Atual (Priority: P1)

Ao acessar o Painel de Exames, o usuário visualiza a seção "Genética vs. Estado Atual". O sistema compara lado a lado os marcadores de predisposição genética de `data/genetics/genera.json` com os exames de sangue mais recentes. O usuário entende imediatamente onde sua genética está se manifestando e onde seus hábitos estão protegendo ou mitigando os riscos genéticos.

**Why this priority**: Resolve a dor fundamental do usuário de correlacionar seus testes genéticos com o seu sangue real, transformando relatórios isolados em inteligência acionável.

**Independent Test**: Com a predisposição à deficiência de Vitamina D registrada em `genera.json` (`GC rs7041 A,C`) e um exame de sangue com Vitamina D dosada em 18 ng/mL (insuficiente), verificar que o painel sinaliza alerta vermelho de "Risco Genético Confirmado no Sangue" e aciona recomendação de suporte no módulo de Nutrição (Spec 018).

**Acceptance Scenarios**:
1. **Given** uma predisposição genética para deficiência de micronutriente (ex.: Vitamina D `GC A,C` ou Vitamina B6 `ALPL A,G`), **When** o exame de sangue acusa valor abaixo da referência ideal, **Then** o sistema classifica o status como "Alerta Ativo: Predisposição Confirmada", alertando os módulos de Nutrição e Treino.
2. **Given** uma predisposição genética desfavorável, **When** o exame de sangue mostra valor ótimo (ex.: glicemia controlada apesar do risco metabólico `TCF7L2`), **Then** o sistema sinaliza status "Controlado por Hábitos", com feedback positivo ao usuário.
3. **Given** uma intolerância à lactose indicada geneticamente (`MCM6 G,G`), **When** o usuário analisa seus dados, **Then** o sistema cruza com marcadores inflamatórios ou glicêmicos para atestar se há reflexos gastrointestinais ou absorção preservada.

---

### User Story 3 - Calibragem do Treino por Biomarcadores Fisiológicos (Priority: P1)

O motor de treinos do Helux passa a considerar os biomarcadores laboratoriais vigentes no cálculo de intensidade, volume, densidade e descanso entre séries do mesociclo:
- Se houver biomarcadores de anemia funcional (Hemoglobina baixa, Ferritina depletada), o motor de treino aplica um limitador de volume e eleva o tempo de descanso entre séries em exercícios multiarticulares de alta demanda metabólica.
- Se houver elevação crítica de marcadores de sobrecarga muscular (CPK muito elevada após bloco de choque) ou inflamação sistêmica (PCR ultrassensível elevada), o sistema sugere dia regenerativo (deload pontual) antes de aplicar novas sessões de esforço máximo `ACTN3 C,C`.

**Why this priority**: Atende diretamente o objetivo do usuário de tornar os treinos cada vez mais eficientes e seguros, evitando lesões, overtraining ou perda de rendimento por limitações biológicas silenciosas.

**Independent Test**: Simular o registro de um exame com Ferritina abaixo de 20 ng/mL e CPK acima de 600 U/L; abrir o treino de pernas e verificar que as repetições de reserva (RIR) são ajustadas para mais conservadoras, com alertas explicativos nos cards de exercícios sobre o motivo do ajuste fisiológico.

**Acceptance Scenarios**:
1. **Given** biomarcadores de oxigenação reduzidos (Hemoglobina ou Ferritina baixas), **When** o treino do dia é montado, **Then** o tempo de descanso entre séries compostas é aumentado automaticamente em 30 a 60 segundos e o volume total de séries é ajustado para preservar a performance sem exaustão precoce.
2. **Given** exame recente indicando CPK expressivamente elevada sem histórico de trauma, **When** o usuário abre a Home de treino, **Then** um aviso alerta que a musculatura ainda apresenta microlesões intensas em regeneração, sugerindo sessão regenerativa ou redução de carga.
3. **Given** biomarcadores em níveis ótimos de anabolismo e oxigenação, **When** o usuário treina, **Then** o sistema libera a progressão plena de sobrecarga e intensidade prevista no mesociclo.

---

### User Story 4 - Agente Integrador de Performance (Visão Holística) (Priority: P2)

O usuário pode interagir com o **Agente de Saúde & Performance Holística**, uma IA com visão unificada que conecta os 4 pilares: Treino (mesociclo, histórico de cargas, sinal de cansaço), Nutrição (macros, timing peri-treino), Genética (potência muscular, sensibilidades, absorção) e Exames (níveis séricos e biomarcadores). O agente responde dúvidas complexas integrando todas essas fontes.

**Why this priority**: Fornece ao usuário uma consultoria esportiva e preventiva de alto nível, explicando em linguagem natural a interação complexa entre seus exames, seus genes e seus treinos diários.

**Independent Test**: Perguntar ao agente: "Por que meu rendimento caiu na última semana se meus treinos estavam consistentes?", e verificar que o agente analisa o exame recente (ex.: ferritina baixa), a intensidade do mesociclo e a dieta para formular uma resposta precisa e contextualizada.

**Acceptance Scenarios**:
1. **Given** o chat do Agente Integrador, **When** o usuário questiona a relação entre sua recuperação muscular e seus exames, **Then** o agente cruza o genótipo `ACTN3`, o nível sérico de Vitamina D/B6 e os índices de dano muscular do laudo, fornecendo orientações práticas e cientificamente fundamentadas.
2. **Given** qualquer orientação do agente, **When** o agente analisa os exames, **Then** ele inclui o aviso ético de que suas conclusões são esportivas/educativas e não substituem consulta médica formal.
3. **Given** um biomarcador crítico com valor de alerta clínico agudo (red flag), **When** detectado pela IA, **Then** o agente emite um alerta de destaque orientando a busca imediata por um médico especialista.

---

### User Story 5 - Retroalimentação com o Módulo de Nutrição (Spec 018) (Priority: P2)

Os resultados dos exames de rotina atualizam dinamicamente as prioridades do Módulo de Nutrição:
- Deficiência real de Vitamina D sérica faz o módulo de nutrição recomendar estratégias ativas de reposição alimentar/suplementação e exposição solar;
- Marcadores de glicemia de jejum ou HbA1c alterados ajustam a proporção de carboidratos nas refeições fora do peri-treino;
- Perfil lipídico ajusta a densidade de gorduras saturadas vs. mono/poli-insaturadas.

**Why this priority**: Garante que o ecossistema funcione de ponta a ponta, fechando o loop de feedback entre exames e nutrição para sustentar os treinos.

**Independent Test**: Registrar um exame com Vitamina D sérica de 15 ng/mL; abrir a tela de Nutrição (Spec 018) e verificar que as diretrizes do dia destacam o protocolo ativo de suporte à Vitamina D.

**Acceptance Scenarios**:
1. **Given** a confirmação de insuficiência de um biomarcador no exame de sangue, **When** o usuário visualiza o plano alimentar gerado na Spec 018, **Then** as recomendações nutricionais e o chat do agente de nutrição priorizam alimentos e estratégias de suplementação específicas para restabelecer os níveis normais.
2. **Given** exames laboratoriais normais, **When** as metas da dieta são calculadas, **Then** a nutrição foca primariamente na performance esportiva e no perfil genético padrão.

---

## 3. Edge Cases

- **Laudos laboratoriais antigos**: Exames realizados há mais de 6 meses devem ser marcados com aviso visual de "Dados desatualizados — recomenda-se nova rotina laboratorial" para evitar que ajustes de treino sejam baseados em condições passadas já resolvidas.
- **Valores laboratoriais em unidades não padronizadas**: O extrator de IA deve normalizar as unidades de medida para o padrão internacional (ex.: converter $\mu g/dL$ para $ng/mL$ ou $mg/dL$ conforme a convenção do sistema).
- **Valores críticos de urgência médica (Red Flags)**: Se o exame acusar valores em níveis de perigo iminente (ex.: Plaquetas < 20.000/$\mu L$, Potássio sérico $> 6.0$ ou $< 2.8$ mEq/L, Leucocitose massiva), o sistema DEVE travar o início de treinos pesados de força e exibir um alerta de segurança recomendando avaliação médica urgente.
- **Exames parciais (ex.: apenas hemograma)**: O sistema não deve exigir um laudo completo de todos os biomarcadores; deve integrar e calcular cruzamentos para os parâmetros disponíveis, mantendo os demais como "Não informados".
- **Discrepância entre laudos repetidos**: Ao realizar novo upload, os novos dados prevalecem como "vigentes", e o laudo anterior é arquivado no histórico temporal para visualização de evolução gráfica.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar interface para upload de laudos laboratoriais nos formatos PDF, PNG e JPEG.
- **FR-002**: O sistema DEVE realizar extração automatizada de texto e dados via visão computacional / LLM, identificando: nome do exame, valor numérico, unidade de medida, faixa de referência inferior/superior e data da coleta.
- **FR-003**: O sistema DEVE exibir uma tela de conferência prévia dos biomarcadores extraídos permitindo ao usuário revisar, editar ou adicionar valores antes da gravação definitiva.
- **FR-004**: O sistema DEVE categorizar e normalizar os biomarcadores em sistemas fisiológicos:
  - *Série Vermelha & Oxigenação*: Hemácias, Hemoglobina, Hematócrito, VCM, RDW, Ferritina, Ferro sérico.
  - *Metabólico & Glicêmico*: Glicemia de jejum, Hemoglobina Glicada (HbA1c), Insulina de jejum.
  - *Lipidograma*: Colesterol Total, HDL, LDL, Triglicerídeos.
  - *Dano Muscular & Inflamação*: Creatina Quinase (CPK), PCR ultrassensível, TGO/AST.
  - *Vitaminas & Minerais*: Vitamina D (25-OH), Vitamina B6, Vitamina B12, Cálcio, Magnésio, Zinco.
  - *Hormônios*: Testosterona Total/Livre, Cortisol, TSH, T4 Livre.
- **FR-005**: O sistema DEVE cruzar os biomarcadores laboratoriais com os marcadores genéticos de `data/genetics/genera.json`:
  - Vitamina D sérica vs. `GC (rs7041 A,C)`;
  - Vitamina B6 sérica vs. `ALPL (rs1256335 A,G)`;
  - Cálcio/densidade vs. `WNT16 (rs2707466 C,T)`;
  - Glicemia/Lipídios vs. `FTO` e `TCF7L2`;
  - Resposta muscular e oxigenação vs. `ACTN3`, `PPARA` e `ADRB2`.
- **FR-006**: O sistema DEVE fornecer um motor de calibração de treino que modula parâmetros de prescrição do mesociclo com base no estado do sangue (volume de séries, intervalos de descanso, RPE/RIR alvo).
- **FR-007**: O sistema DEVE comunicar os dados laboratoriais com o Módulo de Nutrição (Spec 018), atualizando metas dietéticas e recomendações de alimentos e suplementação para correção de deficiências.
- **FR-008**: O sistema DEVE disponibilizar um Painel Integrado de Biomarcadores com status visual (Ótimo, Adequado, Ponto de Atenção, Crítico) e gráfico histórico temporal de evolução entre coletas.
- **FR-009**: O sistema DEVE disponibilizar o **Agente de Saúde & Performance**, uma interface conversacional alimentada por LLM com acesso ao contexto unificado: Exames + Treinos + Nutrição + Genética.
- **FR-010**: O Agente DEVE fundamentar suas análises correlacionando as 4 dimensões (ex.: "Sua ferritina está em 22 ng/mL; como o seu genótipo ACTN3 exige recuperação rápida para esforços de explosão e seu treino de hoje é intenso, seu transporte de oxigênio pode limitar as últimas repetições...").
- **FR-011**: O sistema DEVE incluir aviso de isenção de responsabilidade médica em todas as telas e respostas geradas por IA, deixando claro o propósito esportivo e educacional.
- **FR-012**: Em caso de valores laboratoriais classificados como de risco agudo (Red Flags), o sistema DEVE emitir alerta prioritário com orientação de procura a serviço médico.
- **FR-013**: Os dados dos exames DEVEM ser armazenados de forma estruturada e persistida no banco de dados (Supabase/PostgreSQL) vinculados ao perfil do usuário.
- **FR-014**: A interface do painel DEVE respeitar o design system unificado do Helux (Spec 012), com visual consistente em modo escuro tanto no Web quanto no Mobile.

### Key Entities

- **MedicalLabReport**: Registro do laudo laboratorial enviado (data do exame, laboratório emissor, arquivo original armazenado, status de validação).
- **LabBiomarker**: Biomarcador individual extraído (código/chave, nome canônico, categoria, valor numérico, unidade, faixa de referência mínima, faixa de referência máxima, status de conformidade).
- **BioEcosystemCrossValidation**: Registro da correlação entre um biomarcador sérico e um marcador genético (ex.: `biomarker: "vitamin_d_25_oh"`, `genetic_marker: "GC_rs7041"`, `risk_manifested: boolean`, `recommendation_level: "high"`).
- **WorkoutBiomarkerAdjustment**: Regra de adaptação aplicada ao treino baseada em biomarcadores (fator multiplicador de descanso, teto de RPE, ajuste de volume de séries).
- **IntegratedHealthAgentSession**: Sessão de chat com o Agente Integrador de Performance contendo histórico de mensagens e contexto unificado dos 4 módulos.

---

## 5. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A taxa de acerto na extração automatizada de biomarcadores e valores de referência a partir de laudos padrão em PDF deve ser de no mínimo 90% dos campos legíveis.
- **SC-002**: A tela de revisão do laudo deve carregar os resultados da extração para o usuário em menos de 5 segundos após o upload.
- **SC-003**: 100% dos biomarcadores com correlação direta mapeada em `data/genetics/genera.json` devem exibir o comparativo Genética vs. Sangue de forma visual e inequívoca no painel.
- **SC-004**: Ao detectar biomarcador de oxigenação ou inflamação desfavorável, o treino do dia deve recalibrar seus intervalos de descanso e recomendações de intensidade instantaneamente.
- **SC-005**: O Agente Integrador de Performance deve citar consistentemente a correlação multidimensional (Exames + Genética + Treino + Nutrição) em respostas do chat voltadas à avaliação de rendimento.

---

## 6. Assumptions & Scope Boundaries

- **Natureza do Módulo**: Trata-se de uma ferramenta de otimização atlética, biohacking responsável e suporte preventivo, sem pretensão diagnóstica invasiva ou prescrição de medicamentos alopáticos controlados.
- **Privacidade e LGPD**: Os dados de exames laboratoriais constituem dados sensíveis de saúde e devem ser armazenados com criptografia em repouso e controle estrito de acesso por usuário.
- **Laboratórios Suportados**: A extração inteligente via LLM é agnóstica a layout (abrangendo laudos de laboratórios como Fleury, Dasa, Lavoisier, Sabin, Hermes Pardini, etc.), desde que o documento apresente legibilidade adequada.
- **Reutilização**: A solução aproveita o modelo multimodal em `packages/ai`, a base de dados em `apps/api` e o ecossistema visual de `apps/web` e `apps/mobile`.
