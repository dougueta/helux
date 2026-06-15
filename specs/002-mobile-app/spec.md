# Feature Specification: App Mobile Helux

**Feature Branch**: `002-workouts-mobile`
**Created**: 2026-06-14
**Status**: Draft
**Input**: Phase 4 — App Mobile com Expo + React Native; 4 abas de navegação + Treino Ativo + Exercise Sheet + lógica de sessão em `packages/workouts`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executar Treino do Dia (Priority: P1)

O usuário abre o app, vê o treino recomendado para o dia com base no seu perfil genético, inicia o treino, registra séries (peso e reps) à medida que executa, usa o timer de descanso automático entre séries, e finaliza o treino vendo um resumo da sessão.

**Why this priority**: É o núcleo do app — sem executar e registrar treinos, nenhuma outra funcionalidade entrega valor independente.

**Independent Test**: Abrir o app → tocar "Iniciar treino" na tela Hoje → registrar séries para todos os exercícios → finalizar. Entrega o ciclo completo de valor do app.

**Acceptance Scenarios**:

1. **Given** o app está aberto na tela Hoje, **When** o usuário toca em "Iniciar treino", **Then** a tela Treino Ativo abre exibindo o primeiro exercício com suas séries sugeridas e valores da sessão anterior visíveis
2. **Given** o usuário está em uma série, **When** ajusta peso ou reps com os steppers e toca no check, **Then** a série é marcada como concluída (destaque visual) e o timer de descanso inicia automaticamente
3. **Given** o timer de descanso está ativo, **When** o usuário toca em "+15s", **Then** o tempo restante aumenta 15 segundos; quando toca em "Pular", **Then** o timer encerra imediatamente
4. **Given** o usuário concluiu o último exercício e toca em "Finalizar treino", **Then** a tela de conclusão exibe ring preenchido a 100%, total de séries completadas, duração total da sessão e recordes pessoais quebrados (se houver)
5. **Given** o usuário está no Treino Ativo, **When** o app é fechado e reaberto, **Then** o estado completo da sessão (exercício atual, séries registradas, timer) é restaurado

---

### User Story 2 - Ver Demonstração e Trocar Variante de Exercício (Priority: P2)

Durante o treino, o usuário pode abrir um painel deslizante para ver como executar corretamente o exercício atual, consultar os passos de execução com mapa muscular, e opcionalmente substituir a recomendação do plano por uma variante geneticamente compatível — mantendo as séries já registradas.

**Why this priority**: É a principal funcionalidade nova desta entrega (Exercise Sheet + variantes genéticas). Diferencia o Helux de outros apps de treino.

**Independent Test**: Tocar em "Ver execução" → navegar pelas abas → trocar variante → verificar que séries permanecem → reverter à recomendada.

**Acceptance Scenarios**:

1. **Given** o usuário está no Treino Ativo, **When** toca em "Ver execução", **Then** o painel sobe com animação (0.34s) exibindo o player de demonstração e a aba "Execução" ativa
2. **Given** o painel está aberto na aba "Execução", **When** o usuário rola, **Then** vê lista numerada de passos de execução, mapa muscular com primários em destaque de acento e secundários em acento suave, e nota genética (se houver)
3. **Given** o painel está aberto, **When** o usuário toca na aba "Variantes (n)", **Then** a lista de variantes é exibida ordenada por fit genético (maior primeiro), com flag "Recomendado" na variante do plano e "fit maior" nas alternativas superiores
4. **Given** o usuário seleciona uma variante diferente da recomendada e toca em "Usar esta variante", **Then** o Treino Ativo passa a exibir a variante selecionada mantendo todas as séries já registradas intactas
5. **Given** uma variante alternativa está ativa, **When** o usuário toca em "Voltar à recomendada", **Then** o exercício reverte à recomendação original sem perda de dados

---

### User Story 3 - Consultar Perfil Genético (Priority: P3)

O usuário acessa a aba DNA para entender seu índice Helux, ver os marcadores genéticos com barras de nível e explicações em linguagem acessível, e compreender como cada característica molda os parâmetros do seu treino.

**Why this priority**: Conteúdo informativo que reforça a proposta de valor ("DNA como herói"), mas não bloqueia o ciclo principal de treino.

**Independent Test**: Navegar para a aba DNA e verificar que índice, marcadores e drivers são exibidos corretamente com dados mock.

**Acceptance Scenarios**:

1. **Given** o usuário está no app, **When** toca na aba DNA, **Then** um ring animado exibe o índice Helux (0–100) com resumo textual do perfil
2. **Given** a aba DNA está aberta, **When** o usuário rola, **Then** vê todos os marcadores genéticos com rótulo, valor, barra de nível proporcional, gene-fonte, tag e nota explicativa; marcadores com alerta (risco) exibem cor de atenção distinta
3. **Given** a aba DNA está aberta, **When** o usuário visualiza a seção "Como molda seu treino", **Then** vê grid 2×2 com os 4 drivers genéticos (carga, frequência, descanso, mobilidade)

---

### User Story 4 - Acompanhar Progresso (Priority: P4)

O usuário acessa a aba Progresso para visualizar estatísticas gerais, evolução do volume semanal em gráfico de barras, recordes pessoais e histórico de sessões anteriores.

**Why this priority**: Motivacional e relevante para acompanhamento, mas depende de histórico acumulado; com dados mock já entrega a tela funcional.

**Independent Test**: Navegar para a aba Progresso com dados mock e verificar que todos os componentes são exibidos.

**Acceptance Scenarios**:

1. **Given** o usuário está no app, **When** toca na aba Progresso, **Then** vê grid 2×2 de estatísticas (treinos totais, volume, adesão, PRs), gráfico de barras de volume semanal, lista de recordes pessoais e histórico de sessões
2. **Given** o gráfico de volume está visível, **When** o usuário observa as barras, **Then** a semana atual é destacada em cor de acento com brilho; semanas anteriores em cor neutra

---

### User Story 5 - Navegar pela Biblioteca de Treinos (Priority: P5)

O usuário acessa a aba Treinos para ver o programa atual e o split completo, iniciar qualquer treino da semana, e identificar facilmente o treino do dia.

**Why this priority**: Complementa a tela Hoje — permite iniciar qualquer treino, não só o do dia.

**Independent Test**: Navegar para a aba Treinos e verificar que o programa e o split são exibidos com o treino do dia destacado.

**Acceptance Scenarios**:

1. **Given** o usuário está na aba Treinos, **When** a tela carrega, **Then** vê card do programa com nome, fase, barra de progresso (semana X/Y) e índice de fit; abaixo vê a lista do split com cada treino mostrando foco, número de exercícios, duração, "última vez" e MatchBadge
2. **Given** a lista do split está exibida, **When** o usuário identifica o treino do dia, **Then** esse treino possui borda/realce de acento e chip "Hoje" visíveis claramente
3. **Given** o usuário toca no botão play de qualquer treino, **When** confirma, **Then** o Treino Ativo abre com os exercícios daquele treino

---

### Edge Cases

- O que acontece quando o usuário fecha o app durante um treino ativo? A sessão deve ser restaurada ao reabrir.
- O que acontece quando o usuário toca em "Próximo" no último exercício? O botão muda para "Finalizar".
- O que acontece ao trocar variante quando há séries já registradas? As séries são mantidas, apenas nome/animação mudam.
- O que acontece quando o timer de descanso chega a zero sem interação? O timer encerra silenciosamente (sem notificação forçada).
- O que acontece quando o usuário adiciona uma série extra além das sugeridas? A nova série clona os valores da última, com "anterior" em branco.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O app DEVE exibir na tela Hoje o treino recomendado do dia com nome, foco muscular, número de exercícios, duração estimada e índice de fit genético
- **FR-002**: O usuário DEVE conseguir iniciar o treino do dia com um único toque a partir da tela Hoje ou da lista de Treinos
- **FR-003**: O Treino Ativo DEVE exibir segmentos de progresso por exercício no topo, clicáveis para navegação direta
- **FR-004**: O usuário DEVE conseguir ajustar carga (passo 2,5 kg) e reps (passo 1) para cada série usando steppers, com o valor da sessão anterior sempre visível
- **FR-005**: O sistema DEVE iniciar automaticamente o timer de descanso ao marcar uma série como concluída, usando o tempo definido para aquele exercício
- **FR-006**: O usuário DEVE conseguir estender o timer de descanso em +15 segundos ou pulá-lo a qualquer momento enquanto está ativo
- **FR-007**: O usuário DEVE conseguir adicionar séries extras, que clonam a última série com campo "anterior" em branco
- **FR-008**: O sistema DEVE persistir o estado da sessão (exercício atual, séries registradas, variante ativa por exercício) localmente, restaurando ao reabrir o app
- **FR-009**: O usuário DEVE conseguir abrir o painel de demonstração de qualquer exercício durante o treino
- **FR-010**: O painel DEVE ter duas abas: "Execução" (cues numerados + mapa muscular + nota genética) e "Variantes (n)" (lista ordenada por fit genético)
- **FR-011**: Cada variante DEVE exibir nome, equipamento, nível, fit genético numérico, flag "Recomendado" ou "fit maior", e motivo em uma linha
- **FR-012**: Trocar de variante DEVE preservar todas as séries já registradas para aquele exercício; reverter DEVE também preservá-las
- **FR-013**: Ao finalizar o treino, o sistema DEVE exibir resumo com ring de conclusão, total de séries, duração e recordes pessoais quebrados
- **FR-014**: A aba DNA DEVE exibir índice Helux em ring animado, lista completa de marcadores genéticos e grid de drivers de treino
- **FR-015**: A aba Progresso DEVE exibir grid de estatísticas, gráfico de volume semanal, recordes pessoais e histórico de sessões
- **FR-016**: O app DEVE usar dados mock locais em toda a Phase 4 (sem chamadas de rede)
- **FR-017**: A lógica de sessão de treino DEVE ser encapsulada em `packages/workouts` com funções puras e cobertura de testes

### Key Entities

- **WorkoutSession**: Sessão em andamento — exercício atual, mapa de estado das séries por exercício, variante ativa por exercício, timestamp de início
- **SetEntry**: Registro de uma série — peso (kg), reps, valor anterior de referência, flag concluída
- **WorkoutSummary**: Resultado de sessão finalizada — duração, séries totais, volume total, novos recordes
- **Exercise**: Exercício com nome, músculo-alvo, esquema (ex.: "4 × 6-8"), descanso (s), fit genético, cues de execução, mapa muscular (primários/secundários), nota genética, lista de variantes
- **Variant**: Variante de exercício — nome, equipamento, nível, fit genético (0–100), flags `rec` (recomendada do plano) e `betterFit` (fit maior), motivo em uma linha
- **GeneticProfile**: Índice Helux, resumo, lista de marcadores (rótulo, valor, nível, gene-fonte, nota, flag de alerta), drivers de treino

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue registrar uma série completa (ajuste de peso + reps + check) em menos de 10 segundos
- **SC-002**: O painel de demonstração (Exercise Sheet) abre em menos de 300ms após o toque
- **SC-003**: O estado da sessão é restaurado completamente ao reabrir o app após fechamento
- **SC-004**: Todas as 6 telas (Hoje, Treinos, Treino Ativo, Exercise Sheet, DNA, Progresso) exibem dados corretos com os dados mock
- **SC-005**: Trocar e reverter variante funciona corretamente em 100% dos casos sem perda de séries registradas
- **SC-006**: O timer de descanso inicia, conta regressivamente, aceita +15s, responde a "Pular" e encerra ao chegar a zero
- **SC-007**: A lógica de `packages/workouts` possui cobertura de testes para todas as funções principais (startSession, logSet, completeSet, swapVariant, finishSession)

## Assumptions

- O app é para uso pessoal de um único usuário; autenticação está fora de escopo na Phase 4
- Todos os dados usam mocks locais; integração real com `apps/api` e geração de plano por IA são Phase 5
- O player de demonstração usa animação SVG placeholder; em produção seria substituído por GIF/vídeo/Lottie
- HealthKit e dados reais de recuperação são fora de escopo desta fase
- O design tokens (cores, tipografia, espaçamentos) seguem fielmente o handoff em `c:\Users\Doug\Downloads\helux\design_handoff_helux\`
- A constituição do projeto exige TDD; a lógica de `packages/workouts` é desenvolvida com testes antes da implementação
- Animações que requerem movimento (sheet, ring) respeitam `prefers-reduced-motion`
