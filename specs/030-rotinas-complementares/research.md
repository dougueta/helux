# Research: Módulo de rotinas diárias e complementares (030)

Decisões técnicas tomadas a partir da spec (incluindo as 4 clarificações da sessão `2026-11-08`) e da arquitetura atual na branch `main`. Nenhum item ficou como `NEEDS CLARIFICATION`.

## R1 — Catálogo de Alongamento & Mobilidade e seleção de Core/Cardio

**Decision**:
- **Cardio**: reaproveita `CARDIO_BANK` (`@helux/types`), que já possui `id`, `name`, `impact`, `stress` (`joelho`, `ombro`, `lombar`), `setting` e `equipment`, adicionando orientações curtas de postura e manutenção da zona (`cues` e `zoneGuidance`).
- **Core / Abdominal**: reaproveita os exercícios de `muscleGroup === 'core'` do banco oficial (`EXERCISE_BANK`), priorizando movimentos de peso corporal/solo (`prancha-abdominal-corporal`, `prancha-lateral-corporal`, `prancha-toque-ombro-corporal`, `abdominal-supra-corporal`, `abdominal-infra-corporal`, `hollow-hold-corporal`, `abdominal-bicicleta-corporal`), enriquecidos com metadados de execução sem carga (`mode: 'tempo' | 'repeticoes'`, `defaultSeconds`, `defaultReps`, `unilateral`).
- **Alongamento & Mobilidade**: novo catálogo tipado `STRETCH_MOBILITY_BANK` em `@helux/types` (16 movimentos cobrindo `joelho`, `quadril`, `tornozelo`, `lombar`, `ombro`, `toracica`, `posterior`, `quadriceps`, `gluteo` e `peito`), cada um com `id`, `name`, `regions`, `stress` articular, `mode` (`tempo` ou `repeticoes`), `unilateral`, `defaultSeconds` / `defaultReps`, `cues` (posição inicial, execução, erro comum) e `motion` compatível com o `ExerciseDemo` atual.

**Rationale**: Cumpre FR-005 e FR-006 sem depender de texto livre da IA. Como `STRETCH_MOBILITY_BANK` vive em `@helux/types` e mapeia cada item para um `motion` já suportado por `ExerciseDemo`, todos os itens exibem demonstração animada e orientações estruturadas tanto na web quanto na API.

**Alternatives considered**: Pedir para a IA gerar nomes de alongamentos sob demanda (descartado no clarify Q3: tem latência, custo e gera nomes sem demonstração garantida).

## R2 — Prescrição determinística das 3 rotinas fixas (`@helux/workouts`)

**Decision**: Novo módulo puro `packages/workouts/src/complementary-routines.ts` com `prescribeComplementaryRoutines(input)`:
- Recebe: `goal`, `level`, `constraints` (`HardConstraints` das condições de saúde e preferências), `conditionRegions` (regiões das condições ativas, ex.: `['joelho']`), `flaredRegions` (regiões com crise de gota ou dor aguda ativa hoje), `mesocycleGroups` (grupos musculares das sessões de força do mesociclo) e `preferences` (`ComplementaryPreferences` por categoria).
- Devolve exatamente **3 objetos `ComplementaryRoutine`** fixos para o ciclo (clarify Q4, FR-001a):
  1. **`alongamento-mobilidade`**:
     - Frequência padrão: `5` dias/sem. (`7` quando há condição articular ativa), ajustável de 1 a 7.
     - Duração padrão: `10` min, ajustável em `5 | 10 | 15 | 20` min (seleciona 3, 5, 7 ou 9 itens).
     - Regra de seleção: remove itens que violem `maxJointStress` ou toquem `flaredRegions` com `stress > 0`; ordena priorizando (1) regiões das condições ativas e articulações adjacentes (ex.: condição em `joelho` prioriza mobilidade de `quadril`, `tornozelo` e alongamento de `posterior`/`quadriceps`), (2) regiões foco escolhidas pelo usuário, (3) grupos trabalhados no mesociclo.
  2. **`core-abdominal`**:
     - Frequência padrão: `3` dias/sem., ajustável de 1 a 7.
     - Duração padrão: `10` min, ajustável em `5 | 10 | 15 | 20` min (seleciona 2, 3, 4 ou 5 exercícios, 2 a 3 séries cada, descanso de 30–45 s).
     - Regra de seleção: filtra exercícios de core de peso corporal por `maxJointStress` (especialmente `lombar` e `ombro`), `exercisesToAvoid`, `blockedExercises` e `flaredRegions`; equilibra estabilidade anti-extensão (ex.: prancha/hollow hold), lateral/anti-rotação (ex.: prancha lateral/toque no ombro) e flexão controlada (ex.: infra/supra).
  3. **`cardio`**:
     - Frequência padrão: `cardioSessions` calculado pelo método (`2` a `3` dias/sem. conforme objetivo), ajustável de 1 a 7.
     - Duração padrão: `CARDIO_MINUTES[goal]` (`20`, `25` ou `30` min), ajustável de 10 a 60 min.
     - Regra de seleção: filtra `CARDIO_BANK` por `maxCardioImpact`, `maxJointStress`, `cardioAvoid` e `flaredRegions`; escolhe a modalidade preferida do usuário (`preferredModality` ou `cardioLikes`) ou a primeira de menor impacto articular, com a zona prescrita (`leve` ou `moderada`).

**Rationale**: 100% determinístico (< 5 ms), testável em unidade, zero custo de IA e recalcula na hora quando o usuário muda frequência, duração ou foco (FR-005, FR-008, SC-002).

## R3 — Migração de Cardio e Mobilidade da fila `A/B/C/D` para Rotinas Complementares

**Decision**:
- Em `packages/workouts/src/method.ts`:
  - `allocate(goal, days)` passa a destinar todos os dias disponíveis de academia (`strengthDays = Math.min(Math.max(1, days), 6)`) para sessões de força na fila `A/B/C/D`, enquanto `cardioSessions` e `mobilitySessions` continuam no `MethodPrescription` como metas semanais das Rotinas Complementares (e não como sessões que roubam letras da fila `A/B/C/D`).
- Em `packages/ai/src/agents/method-validation.ts` e `packages/ai/src/mesocycle-prompts.ts`:
  - `validateAgainstMethod` confere estrutura (`strength.length === method.strengthDays`), frequência e volume por grupo muscular nas sessões de força, e **deixa de exigir** sessões avulsas `kind === 'cardio'` ou `kind === 'mobilidade'` dentro de `weekTemplate`.
  - O prompt do Agente de Treino (`buildTrainingMethod` e `methodSection`) instrui a IA a gerar na `weekTemplate` apenas as sessões de academia (`kind: 'forca'`, mantendo `aquecimento`, `principal` e `volta-calma` curtos da spec 014), informando que o cardio e a mobilidade dedicados da semana já são cobertos pelo módulo de Rotinas Complementares.
- Compatibilidade: planos já salvos no banco com sessões `kind: 'cardio'` ou `'mobilidade'` continuam abrindo e funcionando sem migração destrutiva (Edge Case).

**Rationale**: Decidido no clarify Q2 (FR-002a, SC-005). Evita que uma sessão avulsa de cardio trave a fila da academia.

## R4 — Persistência no Supabase: `complementary_routine_logs` + coluna JSONB no perfil

**Decision**:
- Nova tabela `complementary_routine_logs` para registrar cada execução concluída (várias categorias permitidas no mesmo dia, FR-003, FR-013).
- Preferências do usuário (`ComplementaryPreferences`: frequência semanal, minutos-alvo, modalidade/foco por categoria) ficam numa coluna `complementary_preferences jsonb not null default '{}'::jsonb` na tabela existente `user_training_profile`.

**Rationale**: Princípio V (Simplicity). As preferências são um mapa pequeno (3 chaves fixas por usuário) lido junto do perfil; não justificam uma tabela relacional própria. Já os logs são séries temporais consultadas por janela de datas (hoje, semana atual, período do mesociclo) e merecem tabela indexada por `(user_id, performed_on desc)`.

**Alternatives considered**: (a) Salvar logs dentro de `workout_sessions`: misturaria rotinas sem carga com sessões de musculação e exigiria cuidado em todos os lugares que contam sessões ou avançam `current_session_index`. (b) Criar tabela `complementary_routine_preferences`: overhead desnecessário para 3 configurações por usuário.

## R5 — Isolamento total do treino ativo (`localStorage`) e da fila do mesociclo

**Decision**:
- Novo hook `useActiveRoutine` usando a chave `'helux:active-routine'` no `localStorage`, totalmente separada de `'helux:active-workout'` (`useActiveWorkout`).
- Concluir uma rotina chama `POST /api/routines/logs`, que insere apenas em `complementary_routine_logs` e **nunca** toca em `mesocycle_plans.sessions` nem em `workout_sessions`.

**Rationale**: Garante por construção que iniciar, pausar ou concluir uma rotina complementar jamais altera ou apaga um treino de academia em andamento (FR-002, SC-001).

## R6 — Sinergia no mesmo dia: aviso em dia de perna e dispensa de volta à calma duplicada

**Decision**: Duas funções puras em `packages/workouts/src/complementary-routines.ts`:
1. `checkCardioLegDayConflict(todayGymSession, cardioRoutine)`:
   - Se a sessão de academia pendente (`today`) tem exercícios principais de `quadriceps`, `posterior` ou `gluteo`, retorna um aviso amigável recomendando manter zona `leve` e modalidade sem impacto caso o cardio seja feito antes da academia (FR-015).
2. `completedComplementaryCategoriesToday(logs, todayDate)`:
   - Devolve o conjunto de categorias concluídas na data de hoje (`Set<ComplementaryCategory>`).
   - Na visualização da sessão de academia (`TreinosClient`, `ProximoTreinoClient` e tela de treino ativo `/workout`), itens de `volta-calma` ou `cardio` cuja categoria já esteja em `completedComplementaryCategoriesToday` ganham o selo `"Já cumprido hoje nas Rotinas"` (FR-014, SC-004).

**Rationale**: Faz os dois turnos do dia conversarem de forma determinística, sem precisar chamar a IA.

## R7 — Integração com Análise do Ciclo (spec 024) e Perfil Integrado (spec 022)

**Decision**:
- `analyzeCycle` (`@helux/workouts`) passa a aceitar `complementaryLogs?: Array<{ category: ComplementaryCategory; performed_on: string }>` e `complementaryTargets?: Record<ComplementaryCategory, number>` (meta semanal), calculando a aderência no ciclo:
  - Para `cardio` e `mobilidade`: soma as sessões da fila (planos antigos) + os logs complementares do período em relação à meta (`weeks × daysPerWeek`).
  - Adiciona o resumo de aderência complementar (`complementaryAdherence` com `alongamento-mobilidade`, `core-abdominal` e `cardio`) ao `CycleSummary` e ao `renderProfile` do Perfil Integrado.

**Rationale**: Atende FR-016 mantendo compatibilidade com ciclos antigos (que tinham cardio/mobilidade na fila) e ciclos novos (que registram tudo em `complementary_routine_logs`).
