# Research: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

**Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Decisão 1 — Formato de armazenamento de "tempo treinando" e "tempo parado"

**Decision**: Campos de texto livre curto (ex.: `"3 anos"`, `"6 meses parado"`), não numéricos/estruturados.

**Rationale**: Nenhum FR exige lógica determinística de código sobre esses valores (os edge cases do spec — ex. "tempo parado muito longo deve ser tratado com mais conservadorismo" — são resolvidos pela interpretação do próprio LLM no prompt, do mesmo jeito que os alertas genéticos já são hoje). Consistente com a decisão já tomada em `/speckit-clarify` de que "objetivo de treino" é texto livre. Evita construir validação/parsing de duração sem um caso de uso concreto que precise disso (Simplicity/YAGNI da constituição).

**Alternatives considered**:
- Campos numéricos estruturados (meses treinando, semanas parado): rejeitado — exigiria UI de input numérico + unidade, sem nenhum consumidor determinístico no código; a única "leitura" desses dados é o LLM.

## Decisão 2 — Lesão/problema físico como alerta situacional, não lista estruturada

**Decision**: Campo de texto livre (`currentInjury`), injetado no prompt do sistema como um bloco "Alertas Situacionais — OBRIGATÓRIO RESPEITAR", estrutural e visualmente paralelo ao bloco "Alertas Genéticos" já existente em `mesocycle-prompts.ts`.

**Rationale**: O padrão de alertas genéticos (`GeneticProfile.alertas: string[]`) já resolve exatamente esse problema — texto livre que o LLM é instruído a respeitar obrigatoriamente na seleção de exercícios. Reaproveitar o padrão evita introduzir um segundo mecanismo (lista estruturada de exercícios/grupos musculares proibidos) para o mesmo tipo de restrição.

**Alternatives considered**:
- Lista estruturada de exercícios/grupos musculares a evitar: mais preciso, mas exige uma segunda taxonomia (mapear "lesão no ombro" → grupos musculares/padrões de movimento afetados) sem precedente no código hoje; adiado até haver evidência de que o texto livre não é suficiente.

## Decisão 3 — Persistência do perfil: uma tabela nova, uma linha por usuário

**Decision**: Tabela `user_training_profile`, `user_id uuid unique references auth.users(id)`, upsert por `user_id` (não por período, ao contrário de `body_checkins` que é por mês).

**Rationale**: O perfil é situacional e editável a qualquer momento (User Story 3, FR-002, FR-010) — não tem cadência periódica como os check-ins mensais. Uma tabela separada mantém a distinção conceitual já documentada no spec (perfil genético = biológico/fixo; check-ins = medidas corporais periódicas; perfil de treino = situação atual). RLS segue o mesmo padrão (`auth.uid() = user_id`) de todas as outras tabelas do produto.

**Alternatives considered**:
- Estender `body_checkins` com essas colunas: rejeitado — misturaria uma entidade "situação atual, sempre editável" com uma entidade "snapshot mensal", quebrando a semântica de histórico mensal dos check-ins.

## Decisão 4 — Persistência da sinalização de cansaço: uma tabela nova, uma linha por dia

**Decision**: Tabela `daily_tiredness_signals`, `(user_id, date)` único, `POST` faz upsert, "desfazer" (FR-008a) faz `DELETE` da linha do dia — sem histórico de sinalizações desfeitas (app pessoal, sem necessidade de auditoria).

**Rationale**: Espelha o padrão `unique(user_id, month)` de `body_checkins`, trocando o grão de mês para dia. Delete físico é suficiente porque nada no produto precisa consultar sinalizações passadas ou desfeitas — a única leitura é "existe sinalização para hoje?" no momento de montar `today`.

**Alternatives considered**:
- Soft-delete (coluna `active boolean`): rejeitado — sem consumidor que precise da linha depois de desfeita; complexidade sem caso de uso (YAGNI).

## Decisão 5 — Como a sinalização manual se combina com o ajuste por HRV (FR-009)

**Decision**: `applyRecoveryAdjustment` ganha um terceiro parâmetro opcional `manualTirednessToday?: boolean`. A função continua determinando a faixa a partir do HRV como hoje; se `manualTirednessToday` for `true`, o resultado nunca fica menos conservador que a faixa "alta" (mesma redução aplicada hoje para HRV < 40ms) — se o HRV já indicar faixa alta, o motivo permanece o do HRV; se o HRV indicar faixa menor (ou não houver HRV), o motivo passa a citar o cansaço sinalizado manualmente.

**Rationale**: Implementa literalmente FR-009 ("aplicar o ajuste mais conservador entre os dois") reaproveitando a escala de 3 níveis já validada em `006-mesociclo-treino-backend`, sem introduzir uma quarta faixa ou uma lógica de combinação nova. Função continua pura/síncrona, sem I/O — mesma garantia que already existe hoje (FR-005 de `006`).

**Alternatives considered**:
- Somar reduções (HRV baixo + cansaço manual = redução ainda maior que qualquer um dos dois isoladamente): rejeitado por não estar no spec ("o ajuste mais conservador **entre os dois**", não "a soma dos dois") e por risco de sobre-reduzir o treino sem base clara.

## Decisão 6 — Onde a sinalização de hoje é lida na rota de leitura do plano

**Decision**: `GET /workout/latest-plan` (`apps/api/src/routes/workout-latest-plan.ts`) passa a também consultar `daily_tiredness_signals` para `(user_id, hoje)` — mesma query simples por chave primária composta, sem impacto de performance perceptível — e repassa o resultado (booleano) para `applyRecoveryAdjustment`.

**Rationale**: É o único lugar hoje que já monta a leitura ajustada do dia (mesmo ponto que lê `health_samples`), então adicionar mais uma leitura pequena no mesmo handler é a menor mudança possível.

## Decisão 7 — Onde o perfil é lido na geração do mesociclo

**Decision**: `gatherPlanInput` (`apps/api/src/services/plan-context.service.ts`) passa a buscar a linha de `user_training_profile` do usuário e usar `goal`/`level`/`trainingTime`/`timeOff`/`currentInjury` reais em vez dos valores hoje fixos (`userGoals`, `userLevel`). Quando não existe linha (usuário nunca preencheu o perfil), mantém exatamente os valores padrão atuais (`'Hipertrofia e condicionamento geral'` / `'intermediario'`) — satisfaz FR-005 sem lógica condicional nova além de um `?? default`.

**Escopo explicitamente fora**: `availableDaysPerWeek` permanece fixo em `4` — não faz parte dos campos do perfil definidos em FR-001 (o usuário não pediu para capturar dias/semana disponíveis nesta funcionalidade). O fluxo legado de sessão única (`POST /workout/generate`, botão manual "Gerar Novo Plano") **não é alterado** — mesmo precedente de `006`/`007`, que deixaram esse botão como débito técnico separado; alterá-lo aqui expandiria o escopo sem pedido explícito.

## Decisão 8 — Onde a UI do perfil e da sinalização de cansaço vivem

**Decision**:
- Nova rota `apps/web/src/app/perfil/page.tsx` com um formulário simples (mesmo padrão de `apps/web/src/app/checkin/page.tsx` + `useCheckin.ts`). **Não** adicionada à `NavBar` (que já tem 4 abas — Hoje/Treinos/Check-in/Progresso); acessível por um ícone de configurações no cabeçalho da Home, ao lado do indicador de streak.
- A sinalização "Hoje estou muito cansado" é um toggle renderizado na própria Home, na mesma área do card "Treino de hoje" (perto de onde `RecoveryAdjustedBadge` aparece), permitindo marcar/desmarcar sem sair da tela — satisfaz FR-006/FR-008a com a menor navegação possível.

**Rationale**: Consistente com o padrão de telas de configuração pontual já usado no produto (check-in também não está na ação principal do fluxo de treino) e evita inflar a navegação principal para uma tela editada com pouca frequência. O toggle de cansaço, por outro lado, precisa estar no caminho principal (é usado todo dia em que se aplica), então fica na Home.

**Alternatives considered**:
- Adicionar aba "Perfil" na NavBar: rejeitado — tela editada raramente, não justifica ocupar uma das 5 posições de navegação principal num app mobile-first.
