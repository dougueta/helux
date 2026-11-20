# Research: Calendário visual de treino, saldo semanal e curiosidades do período (031)

Decisões técnicas e de experiência (UX) tomadas a partir da `spec.md` (incluindo as 3 clarificações da sessão `2026-11-20` e a diretriz de excelência de UX) e da arquitetura existente na branch. Nenhum item permanece como `NEEDS CLARIFICATION`.

## R1 — Arquitetura sem nova migração SQL: agregação determinística sobre tabelas existentes

**Decision**:
- Não é necessária nenhuma nova tabela no Supabase. O Calendário de Treino consome os registros já existentes e indexados por `(user_id, date/performed_on)`:
  1. `workout_sessions` + `session_checkins` (treinos de academia, séries, cargas, duração e RPE pós-treino);
  2. `complementary_routine_logs` (rotinas complementares concluídas: `alongamento-mobilidade`, `core-abdominal`, `cardio` — spec 030);
  3. `body_weights` (pesagens diárias — spec 029);
  4. `user_training_profile` (`days_per_week` / `complementary_preferences` para a meta semanal de assiduidade).
- Toda a inteligência de montagem da grade mensal, semanas (segunda a domingo), Saldo da Semana (`WeeklyBalance`) e Curiosidades (`PeriodCuriosity[]`) vive em um módulo puro e determinístico `packages/workouts/src/training-calendar.ts`, compartilhado entre `apps/api` e `apps/web`.

**Rationale**: Princípios IV (Shared Code via Packages) e V (Simplicity / YAGNI). Como os logs brutos de um usuário em uma janela de 3–6 meses cabem em poucos kilobytes, uma única rota `GET /api/workouts/calendar?month=YYYY-MM` (ou o cálculo em memória no modo mock da spec 021) devolve o mês solicitado, a semana anterior ao início do mês (para deltas da 1ª semana) e o histórico de recordes, executando em `< 5 ms` de CPU e `0` chamadas de IA.

**Alternatives considered**: Criar tabela materializada `weekly_summaries` no Postgres (descartado: adicionaria sincronização complexa ao editar/apagar pesagens ou treinos e violaria YAGNI).

## R2 — Geometria do calendário mensal e semanas que cruzam a virada do mês

**Decision**:
- A semana no Helux é sempre **segunda-feira (`dayIndex = 0`) a domingo (`dayIndex = 6`)**, alinhada com `workout-analytics.ts` e `complementary-routines.ts`.
- Para qualquer mês `YYYY-MM`:
  - A grade mensal (`CalendarMonthGrid`) começa na **segunda-feira da semana que contém o dia `YYYY-MM-01`** e termina no **domingo da semana que contém o último dia do mês** (gerando de 4 a 6 linhas semanais completas de 7 dias).
  - Dias que pertencem ao mês anterior ou seguinte recebem `inCurrentMonth: false` (estilizados com opacidade reduzida na grade), mas **participam integralmente** do Saldo da Semana quando aquela linha semanal é selecionada (Edge Case da spec).
- Para garantir que até a **primeira semana do mês** tenha comparativo (`vsPreviousWeek`) de volume, esforço e peso, a busca no banco para `YYYY-MM` inclui os registros desde `firstGridMonday - 7 dias` até `lastGridSunday`.
- **Semana selecionada padrão**:
  - Se `YYYY-MM` é o mês atual (`today` pertence ao mês), seleciona a semana que contém `today` e o dia `today`.
  - Se `YYYY-MM` é um mês passado, seleciona a última semana do mês que possui atividade (ou a última semana do mês, se vazio).

**Rationale**: Evita semanas "cortadas" de 2 ou 3 dias na virada do mês, que distorceriam o Saldo da Semana (volume, assiduidade e média de peso).

## R3 — Cálculo do Saldo da Semana: Esforço, Peso, Assiduidade e Carga de Trabalho

**Decision**:
1. **Esforço médio da semana (`1–10` + faixa qualitativa)**:
   - No Helux, as três fontes de esforço já usam a escala `1–10`:
     - Séries de musculação (`set.effort` em `ExerciseSet`: `facil=6`, `moderado=7`, `dificil=9`, `limite=10`, ou `8` padrão — spec 014/027);
     - Check-in pós-treino (`session_checkins.rpe` `1–10` — spec 024);
     - Rotinas complementares (`complementary_routine_logs.effort` `1–10` — spec 030).
   - Para cada sessão de academia: se houver `checkins.depois.rpe` (`1–10`), usa esse valor; caso contrário, usa a média de `set.effort` das séries concluídas (quando `effort > 0`).
   - O esforço médio da semana (`avgEffort`) é a média simples (arredondada a 1 casa decimal) das sessões/rotinas com esforço registrado na semana. Se nenhuma tiver esforço, `avgEffort = null` (`"Sem registro"`).
   - Classificação qualitativa (`EffortBandLabel`):
     - `< 6.5` → `'leve'` (`"Leve"`)
     - `6.5 – 7.9` → `'moderado'` (`"Moderado"`)
     - `8.0 – 8.9` → `'forte'` (`"Forte"`)
     - `>= 9.0` → `'muito-forte'` (`"Muito forte"`)
2. **Peso corporal na semana (`WeeklyWeightSummary`)**:
   - Calcula a média simples das pesagens (`body_weights.weight_kg`) registradas dentro dos 7 dias da semana (`avgWeightKg`, 1 casa decimal), além de informar a última pesagem da semana (`latestWeightKg`) e o número de pesagens (`count`).
   - Se a semana anterior também tiver pelo menos 1 pesagem, calcula `deltaKg = round1(curr.avgWeightKg - prev.avgWeightKg)`.
3. **Assiduidade e Carga de Trabalho**:
   - `activeDays`: número de dias distintos (`0–7`) na semana com pelo menos 1 treino de academia ou rotina complementar.
   - `gymDays` / `gymSessions` vs. `targetGymDays` (`user_training_profile.days_per_week`, padrão `4`).
   - `complementaryCount`: total de rotinas complementares concluídas na semana.
   - `tonnageKg`: soma de `reps × weight` de todas as séries de academia da semana (exibido em `t` quando `>= 1000 kg`, ex.: `14,2 t`, ou em `kg` abaixo disso).
   - `totalSets`: soma de séries concluídas na academia.
   - `activeMinutes`: soma de `Math.round(duration_s / 60)` das sessões de academia + `duration_minutes` das rotinas complementares.

**Rationale**: Une treino e resposta corporal com regras transparentes e resistentes a dados parciais.

## R4 — Motor determinístico de Curiosidades (`Semana` e `Mês`)

**Decision**:
- Função pura `computePeriodCuriosities(input, scope: 'semana' | 'mes')` em `packages/workouts/src/training-calendar.ts` avalia um catálogo ordenado de geradores determinísticos e retorna de **3 a 5 cartões `PeriodCuriosity`** (apenas os que tiverem dados reais positivos no período — FR-008, SC-004):
  1. **`tonelagem-equivalente`** (*Equivalência de peso*):
     - Converte `tonnageKg` na referência concreta mais expressiva:
       - `>= 12_000 kg`: carros populares (`1.200 kg` cada, ex.: *"18,4 t movidas — equivale a ~15 carros populares"*);
       - `3_000 – 11_999 kg`: utilitários / hipopótamos (`1.500 kg`) ou carros populares (`1.200 kg`);
       - `800 – 2_999 kg`: pianos de cauda (`400 kg` cada);
       - `100 – 799 kg`: malas de viagem despachadas (`23 kg` cada).
  2. **`recorde-periodo`** (*Recorde ou maior carga*):
     - Destaca qualquer recorde pessoal histórico (PR de carga máxima) batido dentro do período; se não houver PR inédito, destaca a **série mais pesada** do período (`exerciseName`, `weight kg × reps`).
  3. **`habito-dia-fiel` / `sequencia-ativa`** (*Consistência*):
     - No escopo `'mes'`: identifica o dia da semana mais frequente (ex.: *"Terça-feira é o seu dia mais fiel: 4 treinos no mês"*) ou a maior sequência de dias ativos.
     - No escopo `'semana'`: destaca o treino mais denso/longo da semana ou o cumprimento de 100% da meta semanal (`gymDays >= targetGymDays`).
  4. **`exercicio-dominante`** (*Foco de trabalho*):
     - O exercício com maior número de séries ou maior volume acumulado no período (ex.: *"Supino reto com barra liderou com 16 séries e 3,8 t"*).
  5. **`tempo-investido`** (*Tempo em movimento*):
     - Soma total de minutos/horas somando academia + cardio + alongamento/core (ex.: *"4h 25min dedicados ao corpo neste mês — sendo 1h 15min em cardio e mobilidade"*).

**Rationale**: 100% determinístico, zero latência, nunca inventa curiosidades com zero e gera variedade real entre a visão da Semana e a do Mês.

## R5 — Excelência de Experiência (UX) no Design System v2

**Decision**:
- **Codificação visual de alta leitura na célula do dia (`CalendarDayCell`, min `44×44 px`)**:
  - **Dia com Treino de Academia**: pílula preenchida com fundo `--accent-soft` e borda `--accent-line` (ou ponto sólido `--accent` `#C8FA4B` + número do dia em `--text` forte); quando selecionado, preenchimento `--accent` com texto `--accent-ink`.
  - **Dia com Rotina Complementar**: anel/ponto em `--success` (`#4ADE80`) ou barra dupla inferior, permitindo distinguir imediatamente *"só academia"*, *"só rotina"* e *"combo academia + rotina"* (dois pontos lado a lado abaixo do número: um `--accent` e um `--success`).
  - **Dia de hoje**: contorno sutil em `--hairline-3` e rótulo/indicador dedicado mesmo quando ainda não há treino concluído.
  - **Linha da semana selecionada**: destaque contínuo de ponta a ponta (`background: var(--surface-2)`, `border-radius: var(--r-md)`, `box-shadow: inset 0 0 0 1px var(--hairline-2)`), deixando óbvio qual semana está alimentando o cartão **Saldo da Semana** logo abaixo.
- **Zero Layout Shift e interação imediata**:
  - Tocar em qualquer dia da grade seleciona simultaneamente o dia (abrindo/atualizando o painel **Resumo do Dia** logo abaixo da grade) e a semana a que aquele dia pertence (atualizando o **Saldo da Semana**).
  - Todos os meses já carregados ficam em cache em memória no hook `useWorkoutCalendar` para que voltar/avançar mês ou trocar de semana seja instantâneo.
- **Tira Semanal na Home (`WeeklyCalendarStrip`)**:
  - Componente compacto na Home mostrando os 7 dias da semana corrente (`S T Q Q S S D`), marcadores `--accent` / `--success` nos dias cumpridos, resumo curto (ex.: `3/4 treinos · 11,4 t na semana`) e toque único levando a `/history` (já aberto na visão `Calendário`).
