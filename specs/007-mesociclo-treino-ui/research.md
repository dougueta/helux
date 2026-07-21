# Phase 0 Research: Visibilidade do Mesociclo na Home

Nenhum `NEEDS CLARIFICATION` restou no Technical Context — as decisões abaixo já foram resolvidas durante o brainstorming que precedeu esta spec.

## Decisão 1 — Padrão visual: carrossel/lista vs. calendário vs. tela dedicada

**Decision**: Lista/carrossel horizontal na própria home, sem calendário e sem tela dedicada nova.

**Rationale**: Confirmado explicitamente no brainstorming. A progressão do mesociclo é por conclusão de sessão, não por data (ver `006-mesociclo-treino-backend`) — um calendário com dias fixos comunicaria uma garantia que o produto não oferece (que o treino B necessariamente acontece numa data X). Uma tela dedicada ("Meu Plano") foi cogitada mas rejeitada por exigir navegação própria sem necessidade demonstrada nesta fase.

**Alternatives considered**: Calendário semanal/mensal com datas atribuídas; tela "Meu Plano" separada com navegação própria.

## Decisão 2 — Onde os componentes novos vivem no código

**Decision**: `apps/web/src/components/workout/` — mesmo diretório dos componentes de treino já existentes (`WorkoutCard.tsx`, `ExerciseList.tsx`, `ActiveExercise.tsx`), não em `components/ui/`.

**Rationale**: `components/ui/` é reservado a primitivos presentacionais genéricos e sem lógica de domínio (regra explícita do plano `design-system-foundation`: "no data fetching, no hooks beyond local UI state"). `UpcomingSessionsList`, `RecoveryAdjustedBadge` e `MesocycleProgress` são específicos do domínio de treino (consomem `UpcomingSessionSummary`/`AdjustedWorkoutPlanView`), então pertencem a `components/workout/`, ainda que internamente componham primitivos de `components/ui/` (`Chip`, `Icon`).

**Alternatives considered**: Colocar tudo em `components/ui/` — rejeitado por misturar primitivos genéricos com componentes de domínio, o que o plano anterior já identificou como um problema a evitar (motivo original da extração de `design-system-foundation`).

## Decisão 3 — Reaproveitar primitivos existentes em vez de criar um novo sistema

**Decision**: `RecoveryAdjustedBadge` compõe `Chip` (já existe, estilo accent) + `Icon` (ícone de raio/relâmpago, se disponível no catálogo de `icons.tsx`, senão adicionar um). `MesocycleProgress` replica o padrão de "dots" já usado inline no card "Semana" de `HomeClient.tsx` (linhas do `WEEKLY_TARGET`), extraído para um componente reutilizável.

**Rationale**: Constraint explícita do design system (`design-system-foundation`): "All colors/spacing MUST use the existing CSS custom properties... never hardcode hex values". Reaproveitar `Chip`/`Icon` e o padrão de dots já validado visualmente evita introduzir um segundo vocabulário visual para o mesmo conceito (progresso) dentro da mesma tela.

**Alternatives considered**: Biblioteca de gráficos/progress bar externa — rejeitada, YAGNI para um indicador simples de N/M.

## Decisão 4 — Tratamento do estado "sem mesociclo ativo"

**Decision**: `HomeClient.tsx` verifica `today === null` na resposta de `AdjustedWorkoutPlanView` e exibe uma mensagem de estado (reaproveitando o mesmo padrão visual já usado hoje para "Nenhum plano gerado ainda", linha ~151 de `HomeClient.tsx`), diferenciando os dois casos via o campo `status` (`"generating"` vs. ausente/`"none"`) definido no contrato de `006-mesociclo-treino-backend`.

**Rationale**: FR-006 do spec exige que esse estado nunca pareça quebrado. O padrão de card vazio já existe no código atual para o caso "nenhum plano gerado" — só precisa de uma variação de texto para o caso "aguardando o próximo mesociclo".

**Alternatives considered**: Spinner de carregamento indefinido — rejeitado, pode levar minutos (geração em background) e um spinner nesse tempo pareceria travado; uma mensagem de texto ("Preparando seu próximo ciclo…") é mais honesta sobre o tempo de espera.
