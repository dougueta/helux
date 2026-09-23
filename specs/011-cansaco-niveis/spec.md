# Feature Specification: Cansaço Percebido com Níveis e Confirmação de Ajuste

**Feature Branch**: `011-cansaco-niveis`
**Created**: 2026-09-22
**Status**: Draft
**Input**: User description: "Cansaço percebido com níveis + confirmação de ajuste: trocar toggle binário "Hoje estou muito cansado" (Home) por seletor com níveis ótimo/normal/cansado/exausto; perguntado antes do treino (ao iniciar) e visível/editável na Home; automático (relógio/HRV via recovery) prevalece quando disponível, manual só quando automático indisponível; quando discordarem, confirmação explícita antes de aplicar; ajuste do treino deixa de ser silencioso — usuário alertado do que muda (séries/carga) antes de aplicar/salvar; modelar "sinal de cansaço" reaproveitável para spec 015 (descanso personalizado) sem implementá-la."

**Relação com specs anteriores**: substitui o toggle binário e a regra "ajuste mais conservador entre HRV e manual" da spec 008 (FR-006 a FR-009 de `specs/008-mesociclo-perfil-usuario/spec.md`). O que não for citado aqui continua valendo (sinal vale só para o dia, pode ser desfeito/alterado no mesmo dia, não altera o mesociclo armazenado).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Informar o nível de cansaço na Home e ver o que muda antes de aplicar (Priority: P1)

Na Home, no card "Treino de hoje", o usuário vê como está registrado o seu cansaço do dia (ótimo / normal / cansado / exausto) e pode mudá-lo. Ao escolher um nível que altera o treino, o app mostra **antes de salvar** um resumo do que vai mudar (por exercício: séries e carga antes → depois) e só aplica se o usuário confirmar. Se ele cancelar, nada é salvo e o treino continua como estava.

**Why this priority**: É a troca central pedida (toggle binário → níveis) e resolve o problema do ajuste silencioso: hoje um toque no toggle muda o treino sem o usuário saber o quê.

**Independent Test**: Sem dado de relógio no dia, abrir a Home, escolher "exausto", ver o resumo das mudanças, confirmar e verificar que o treino do dia exibido tem séries/carga reduzidas; repetir escolhendo e cancelando e verificar que nada mudou.

**Acceptance Scenarios**:

1. **Given** um treino do dia pendente e nenhum dado automático de recuperação no dia, **When** o usuário escolhe "cansado" na Home, **Then** o app mostra um resumo listando cada exercício cujas séries mudam (ex.: "Supino Reto: 4 → 3 séries") e só salva o nível e atualiza o treino exibido após o usuário confirmar.
2. **Given** o mesmo cenário, **When** o usuário escolhe "exausto" e confirma, **Then** o treino do dia exibido passa a ter séries reduzidas e carga reduzida nos exercícios com carga numérica, com o motivo do ajuste visível.
3. **Given** o resumo de mudanças aberto, **When** o usuário cancela, **Then** o nível anterior continua registrado e o treino exibido não muda.
4. **Given** o usuário escolheu um nível que não altera o treino em relação ao que já está sendo exibido (ex.: de "ótimo" para "normal"), **When** ele escolhe, **Then** o nível é salvo direto, sem resumo de mudanças (não há o que alertar).
5. **Given** o usuário registrou um nível hoje, **When** ele reabre o app mais tarde no mesmo dia, **Then** a Home mostra o nível registrado (não volta para um estado padrão).
6. **Given** um nível registrado ontem, **When** o usuário abre o app hoje, **Then** o nível de hoje aparece como não informado e o treino não é ajustado pelo sinal de ontem.

---

### User Story 2 - Pergunta de cansaço ao iniciar o treino (Priority: P1)

Ao tocar em "Iniciar treino", antes de entrar na tela do treino, o app pergunta "Como você está hoje?" com os quatro níveis, já pré-selecionado com o nível vigente do dia (o registrado, ou o indicado pelo relógio, ou "normal" se não houver nada). O usuário confirma com um toque ou troca o nível; se a troca alterar o treino, vê o resumo de mudanças antes de começar. O treino iniciado reflete o nível confirmado.

**Why this priority**: Decisão de produto: o momento em que o cansaço mais importa é o início do treino; sem essa pergunta o usuário esquece de sinalizar na Home.

**Independent Test**: Tocar em "Iniciar treino", escolher "exausto" na pergunta, confirmar o resumo e verificar que a tela de treino ativo abre com as séries/cargas reduzidas; repetir aceitando o nível pré-selecionado e verificar que abre direto.

**Acceptance Scenarios**:

1. **Given** um treino pendente, **When** o usuário toca em "Iniciar treino", **Then** a pergunta de cansaço aparece antes de a tela de treino ativo abrir, com o nível vigente pré-selecionado.
2. **Given** a pergunta aberta, **When** o usuário mantém o nível pré-selecionado e continua, **Then** o treino começa sem passos extras além dos alertas exigidos pelas US3/US4.
3. **Given** a pergunta aberta, **When** o usuário escolhe um nível que altera o treino, **Then** vê o resumo de mudanças e, ao confirmar, o treino ativo começa já com o treino ajustado; ao cancelar o resumo, volta à pergunta sem iniciar o treino.
4. **Given** a pergunta aberta, **When** o usuário fecha/cancela a pergunta, **Then** o treino não é iniciado e nada é salvo.
5. **Given** o usuário escolheu um nível na pergunta, **When** volta depois à Home no mesmo dia, **Then** a Home mostra esse mesmo nível.

---

### User Story 3 - Relógio prevalece, com confirmação quando o usuário discorda (Priority: P2)

Quando há dado automático de recuperação no dia (HRV do relógio), ele define o nível vigente. Se o usuário informar um nível que leva a um ajuste diferente do que o relógio indica, o app pede confirmação explícita: "Seu relógio indica *cansado*, mas você marcou *ótimo* — quer mesmo ajustar o treino pelo que você marcou?". Se confirmar, a escolha manual passa a valer no dia; se não, vale o relógio.

**Why this priority**: Regra de precedência pedida pelo usuário; depende da US1/US2 (seletor) para existir.

**Independent Test**: Com HRV baixo sincronizado no dia, escolher "ótimo" e verificar que aparece a confirmação de discordância; recusar e verificar que o treino segue ajustado pelo relógio; repetir aceitando e verificar que o treino volta ao planejado (após o resumo de mudanças).

**Acceptance Scenarios**:

1. **Given** dado automático indicando "cansado" e nenhum nível manual hoje, **When** o usuário abre a Home, **Then** o nível vigente exibido é "cansado", identificado como vindo do relógio, e o treino está ajustado de acordo.
2. **Given** dado automático indicando "cansado", **When** o usuário escolhe "cansado" (concorda), **Then** não há confirmação de discordância.
3. **Given** dado automático indicando "normal", **When** o usuário escolhe "ótimo", **Then** não há confirmação de discordância (os dois levam ao mesmo treino).
4. **Given** dado automático indicando "exausto", **When** o usuário escolhe "normal", **Then** aparece a confirmação citando os dois níveis; ao recusar, nada muda e o relógio continua prevalecendo; ao aceitar, o usuário vê o resumo de mudanças e, confirmando, o nível manual passa a valer para o dia.
5. **Given** nenhum dado automático no dia, **When** o usuário escolhe qualquer nível, **Then** não há confirmação de discordância — o manual vale direto (com o resumo de mudanças, quando houver mudança).
6. **Given** o usuário aceitou sobrepor o relógio hoje, **When** reabre o app no mesmo dia, **Then** o nível manual continua prevalecendo e a Home indica que o valor foi escolhido por ele contra a indicação do relógio.

---

### User Story 4 - Ajuste automático também é avisado antes do treino (Priority: P2)

Quando o treino do dia está ajustado (pelo relógio ou pelo nível manual), o usuário é avisado do que mudou antes de começar: no fluxo "Iniciar treino", se o nível vigente ajusta o treino, o app mostra o resumo de mudanças em relação ao treino planejado e o usuário confirma para iniciar. Na Home, o card mostra o motivo e a opção de ver o que mudou.

**Why this priority**: Fecha o "ajuste silencioso" também para o caso automático, que hoje só aparece como um badge.

**Independent Test**: Com HRV baixo sincronizado e sem nível manual, tocar em "Iniciar treino", manter o nível pré-selecionado e verificar que o resumo de mudanças aparece antes da tela de treino ativo.

**Acceptance Scenarios**:

1. **Given** o treino do dia ajustado pelo relógio, **When** o usuário inicia o treino mantendo o nível, **Then** vê o resumo das mudanças em relação ao planejado antes de o treino começar.
2. **Given** o treino do dia sem ajuste (ótimo/normal), **When** o usuário inicia o treino mantendo o nível, **Then** o treino começa sem resumo de mudanças.

---

### Edge Cases

- **Treino já em andamento**: mudar o nível na Home não altera um treino ativo já iniciado; vale para o próximo início (e para a exibição na Home).
- **Exercício já no mínimo de séries**: um exercício com 2 séries não é reduzido abaixo de 2; se nenhum exercício mudar, não há resumo a mostrar.
- **Carga não numérica** ("peso corporal", "+2.5kg", "moderada"): a carga não é alterada; só as séries podem mudar.
- **Falha ao salvar o nível**: o app mostra erro, mantém o nível anterior exibido e não inicia o treino (no fluxo de início).
- **Sem treino pendente** (mesociclo sendo gerado): o seletor não é exibido na Home, e não há treino a iniciar.
- **Dado automático chega depois do nível manual no mesmo dia**: se o usuário não tinha sobreposto explicitamente o relógio, o relógio passa a prevalecer; o app sinaliza a discordância (se houver) na Home para o usuário confirmar ou não a sobreposição na próxima escolha.
- **Sinal legado da spec 008** ("muito cansado" registrado antes desta feature): é tratado como "exausto".
- **Gravar o nível a partir do navegador** (achado na verificação manual, 2026-09-22): o app web chama a API a partir de outra origem; a gravação do nível precisa ser aceita pelo navegador tanto na Home quanto no fluxo "Iniciar treino" — se a gravação for bloqueada, o usuário não consegue nem iniciar o treino (FR-016).
- **Diálogo sobre o menu inferior** (achado na verificação manual): a pergunta, a confirmação de discordância e o resumo de mudanças aparecem na parte de baixo da tela, onde fica o menu de navegação da Home; os botões de ação do diálogo NÃO podem ficar cobertos pelo menu (FR-017).
- **Plano guardado pela versão anterior no mesmo dia** (achado na verificação manual): um plano salvo localmente antes desta feature não traz a avaliação de cansaço nem o treino planejado; ele deve ser descartado e buscado de novo, sem esperar a virada do dia (FR-018).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE representar o cansaço percebido do dia em quatro níveis ordenados: ótimo, normal, cansado, exausto.
- **FR-002**: A Home DEVE substituir o toggle "Hoje estou muito cansado" por um seletor desses quatro níveis, sempre mostrando o nível vigente do dia e sua origem (informado pelo usuário, indicado pelo relógio, ou não informado).
- **FR-003**: Ao tocar em "Iniciar treino", o sistema DEVE perguntar o nível de cansaço antes de abrir o treino ativo, com o nível vigente pré-selecionado; cancelar a pergunta NÃO DEVE iniciar o treino nem salvar nada.
- **FR-004**: O nível informado DEVE valer somente para o dia em que foi informado e DEVE poder ser alterado quantas vezes o usuário quiser no mesmo dia.
- **FR-005**: O ajuste do treino por nível DEVE seguir: ótimo e normal → sem ajuste; cansado → 1 série a menos por exercício (mínimo 2 séries); exausto → 1 série a menos (mínimo 2) e carga reduzida em 10% nos exercícios com carga numérica em kg (arredondada para 0,5 kg). O ajuste não altera o mesociclo armazenado.
- **FR-006**: O dado automático de recuperação do dia, quando disponível, DEVE ser convertido para a mesma escala: HRV ≥ 60 ms → normal; 40–59 ms → cansado; < 40 ms → exausto.
- **FR-007**: Quando houver dado automático, ele DEVE definir o nível vigente, exceto quando o usuário tiver confirmado explicitamente a sobreposição manual no dia (FR-009). Sem dado automático, vale o nível manual; sem nenhum dos dois, o treino não é ajustado.
- **FR-008**: Há discordância quando o nível manual escolhido leva a um ajuste de treino diferente do que o nível automático leva (ex.: ótimo × normal NÃO é discordância; normal × cansado é).
- **FR-009**: Ao escolher um nível discordante do automático, o sistema DEVE exibir uma confirmação explícita citando os dois níveis antes de aplicar; recusar DEVE manter o automático prevalecendo e não alterar o treino; aceitar DEVE registrar que o usuário sobrepôs o relógio no dia.
- **FR-010**: Antes de salvar um nível que altere o treino exibido, o sistema DEVE mostrar um resumo do que muda — para cada exercício afetado, séries e carga antes → depois — e só salvar/aplicar após confirmação; cancelar NÃO DEVE salvar nada.
- **FR-011**: No fluxo de início de treino, se o nível confirmado resultar em treino ajustado em relação ao planejado (inclusive por ajuste automático), o sistema DEVE mostrar o resumo de mudanças em relação ao planejado antes de abrir o treino ativo.
- **FR-012**: Depois de qualquer mudança salva de nível, a Home e o treino a ser iniciado DEVEM refletir o treino ajustado atualizado (sem exibir versão desatualizada em cache).
- **FR-013**: O treino ajustado DEVE continuar exibindo o motivo do ajuste (ex.: "Você marcou exausto hoje", "Relógio indica cansaço (HRV 45 ms)").
- **FR-014**: O "sinal de cansaço do dia" (níveis manual, automático, vigente e origem) DEVE ser exposto como um conceito único e consultável, reutilizável por outras funcionalidades (ex.: descanso personalizado, spec 015), sem que esta feature implemente esses outros usos.
- **FR-015**: Sinais registrados antes desta feature (binários, "muito cansado") DEVEM ser interpretados como "exausto".
- **FR-016**: A gravação do nível de cansaço DEVE funcionar a partir do app web no navegador (inclusive a verificação prévia de permissão que o navegador faz para chamadas entre origens).
- **FR-017**: O diálogo de cansaço (pergunta, discordância, resumo) DEVE ficar acima de qualquer elemento fixo da tela, em especial o menu inferior, com todos os botões visíveis e clicáveis.
- **FR-018**: Um plano guardado localmente que não traga a avaliação de cansaço do dia DEVE ser descartado e buscado de novo.

### Key Entities

- **Nível de cansaço (TirednessLevel)**: um de ótimo, normal, cansado, exausto.
- **Sinal de cansaço do dia (DailyTirednessSignal)**: por usuário e por dia — nível informado manualmente (opcional) e se o usuário confirmou sobrepor o relógio.
- **Avaliação de cansaço do dia (TirednessAssessment)**: resultado consolidado para o dia — nível manual, nível automático (com o HRV de origem), nível vigente, origem do vigente (manual / automático / nenhum) e se há discordância. É o conceito reaproveitável pela spec 015.
- **Mudança de exercício (ExerciseAdjustmentChange)**: para um exercício afetado, séries antes/depois e carga antes/depois — base do resumo de mudanças.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos casos em que a escolha de nível altera o treino, o usuário vê o resumo de mudanças antes de o treino ser alterado/iniciado (zero ajustes silenciosos).
- **SC-002**: Em 100% dos casos de discordância entre relógio e nível manual, a confirmação explícita aparece antes de o nível manual passar a valer.
- **SC-003**: Iniciar o treino mantendo o nível pré-selecionado sem ajuste custa no máximo 1 toque extra em relação ao fluxo atual.
- **SC-004**: O nível escolhido aparece igual na Home e no treino iniciado em 100% das verificações no mesmo dia, inclusive após reabrir o app.
- **SC-005**: Escolher um nível e ver o treino atualizado leva poucos segundos, sem nenhuma espera por geração de IA.

## Assumptions

- **Escala de ajuste**: ótimo não aumenta o treino (fica igual a normal) — progressão é escopo da spec 014. "Cansado" reproduz o ajuste moderado já existente para HRV 40–59; "exausto" acrescenta a redução de carga de 10%, que passa a valer também para HRV < 40 (antes só reduzia séries).
- **Mapeamento automático**: o relógio nunca indica "ótimo" (o HRV atual não distingue ótimo de normal); por isso ótimo × normal não gera discordância (FR-008).
- **Discordância pela consequência, não pelo rótulo**: confirmar só quando o treino resultante seria diferente, para não criar atrito sem efeito.
- **Sobreposição**: aceitar a confirmação de discordância faz o manual valer pelo resto do dia (até o usuário escolher de novo); recusar mantém o relógio. Isso concilia "automático prevalece" com "confirmação quando discordam".
- **Pergunta ao iniciar sempre aparece**, pré-preenchida, mesmo que o usuário já tenha informado na Home — é um toque de confirmação; o custo é aceito pela decisão de produto.
- **Base do resumo**: o resumo compara com o treino atualmente exibido quando o usuário muda o nível (FR-010) e com o treino planejado no fluxo de início quando o ajuste já estava vigente (FR-011).
- **Fonte automática**: a mesma já usada hoje pelo ajuste por recovery (amostras de saúde das últimas 48 h); esta feature não muda a coleta de dados do relógio.
- **Fora de escopo**: descanso personalizado (spec 015), histórico de níveis por dia além do dia atual, app mobile nativo.
