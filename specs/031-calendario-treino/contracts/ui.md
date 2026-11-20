# Contracts — UI & UX Excellence (031)

## Rotas e Pontos de Entrada

| Rota / Local | Componente | Comportamento |
|:---|:---|:---|
| `/` (`HomeClient`) | `<WeeklyCalendarStrip />` | Tira visual compacta da semana corrente (segunda a domingo, `S T Q Q S S D`) posicionada na Home. Mostra cada um dos 7 dias com seu marcador visual (`--accent` para academia, `--success` para rotina complementar, anel para hoje), placar rápido da semana (ex.: `3/4 treinos · 13,5 t`) e ação de 1 toque que navega para `/history` (na aba `Calendário`). |
| `/history` (`HistoryPage`) | `Segmented` (`Calendário` \| `Lista`) + `<WorkoutCalendarView />` | Ganha no topo um `Segmented` com `Calendário` como visão padrão (e suporte a `?modo=lista` ou `?modo=calendario`). Na aba `Calendário`, exibe o cabeçalho do mês + grade visual interativa + detalhe do dia selecionado + cartão **Saldo da Semana** + seção **Curiosidades** (`Semana` \| `Mês`). Na aba `Lista`, mantém a lista cronológica de `HistoryRow` existente. |
| `/treinos` (`TreinosClient`) | Seção `"Treinos recentes"` | O link de cabeçalho `"Ver histórico"` passa a ser `"Ver calendário e histórico"` → `/history`, levando direto à visão de Calendário. |

---

## Arquitetura Visual e Excelência de Experiência (Design System v2)

### 1. Cabeçalho do Mês e Grade Visual (`CalendarMonthGrid`)
- **Navegação de mês**:
  - Botão anterior (`<IconButton icon="back" label="mês anterior" />`), título central em `.t-heading` (ex.: `Novembro 2026`) acompanhado de subtítulo em `.t-caption` com o resumo do mês (`12 dias ativos · 42,6 t`), e botão próximo (`disabled` quando `canGoNext === false`).
- **Cabeçalho dos dias da semana**:
  - 7 colunas (`SEG`, `TER`, `QUA`, `QUI`, `SEX`, `SÁB`, `DOM`) em `.t-caption` centralizado.
- **Linha semanal selecionável (`CalendarWeekRow`)**:
  - Cada linha de 7 dias tem contêiner com transição suave (`transition: background var(--dur-2) var(--ease-out)`).
  - A semana selecionada recebe superfície destacada (`background: var(--surface-2)`, `border-radius: var(--r-md)`, `box-shadow: inset 0 0 0 1px var(--hairline-2)`), criando conexão visual imediata com o cartão **Saldo da Semana** logo abaixo.
- **Célula do dia (`CalendarDayCell`, min `44×44 px`)**:
  - **Dia com treino de academia (`hasGymWorkout`)**: cápsula circular com fundo `var(--accent-soft)`, borda `1px solid var(--accent-line)`, número em `.n-sm` (`color: var(--accent)`) e ponto inferior sólido `var(--accent)` (`#C8FA4B`).
  - **Dia com rotina complementar (`hasComplementaryRoutine`)**: ponto inferior `var(--success)` (`#4ADE80`); quando o dia tem apenas rotina complementar, cápsula com borda `rgba(74,222,128,.35)` e fundo `rgba(74,222,128,.10)`.
  - **Dia com ambos (academia + rotina complementar)**: cápsula `--accent-soft` com **dois pontos lado a lado** na base (`--accent` + `--success`), permitindo leitura instantânea do "dia completo".
  - **Dia selecionado**: anel de foco nítido (`box-shadow: 0 0 0 2px var(--text)`) ou preenchimento `var(--accent)` com texto `var(--accent-ink)`.
  - **Dia fora do mês atual (`!inCurrentMonth`)**: opacidade `0.38`, mantendo clicabilidade para inspecionar a semana completa.
  - **Legenda compacta** no rodapé da grade: `● Academia` (`--accent`) · `● Rotinas` (`--success`) · `○ Hoje`.

### 2. Painel de Detalhe do Dia (`CalendarDayDetail`)
- Posicionado logo abaixo da grade, sem empurrar a tela com saltos bruscos:
  - Cabeçalho com a data por extenso (ex.: `Segunda, 16 de nov.`) e, se houver pesagem no dia, tag `.hx-tag` em `.n-sm` com o peso (`81,8 kg`).
  - Lista de sessões de academia do dia: cada sessão usa linha clicável (`.hx-row-btn` → `/history/[id]`) mostrando título/foco, séries, volume (`t`/`kg`), duração e esforço médio.
  - Lista de rotinas complementares do dia: ícone/tag da categoria (`Alongamento & Mobilidade`, `Core / Abdominal` ou `Cardio`), minutos realizados e modalidade/esforço.
  - Se o dia selecionado não tiver registros: linha discreta e elegante (`"Dia de descanso — nenhuma atividade registrada"`).

### 3. Cartão Saldo da Semana (`WeeklyBalanceCard`)
- Superfície `.hx-focus` (`padding: 20px`) com cabeçalho identificando a semana selecionada (ex.: `Saldo da semana · 16 a 22 de nov.`) e pílula de status da meta (`3 de 4 treinos`).
- Grade 2×2 de métricas com tipografia `.n-lg` / `.n-md` tabular e comparativo `vs. semana anterior`:
  1. **Assiduidade**:
     - Valor principal: `${gymDays}/${targetGymDays} academia` (barra de progresso fina em `--accent`) + `${complementaryCount} rotinas` (`--success`) e `${activeDays} dias ativos`.
  2. **Esforço da semana**:
     - Valor principal: rótulo qualitativo (*Leve*, *Moderado*, *Forte*, *Muito forte*) + nota `.n-md` (ex.: `7,8 / 10`).
     - Subtítulo: delta vs. semana anterior (ex.: `+0,3 vs. sem. ant.`) ou `"Sem registro"` quando não houver esforço.
  3. **Peso corporal**:
     - Valor principal: média da semana em `.n-md` (ex.: `81,6 kg`) ou `"Sem pesagem"`.
     - Subtítulo: delta em relação à semana anterior (ex.: `-0,4 kg vs. sem. ant.`) ou link rápido `"Registrar peso"` (`/checkin/peso`) quando na semana atual sem pesagens.
  4. **Carga & tempo ativo**:
     - Valor principal: volume total (`13,5 t` ou `850 kg`) e total de séries (`46 séries`).
     - Subtítulo: tempo total em movimento (`3h 15min ativos` / `195 min`) + delta de volume vs. semana anterior.

### 4. Curiosidades da Semana e do Mês (`PeriodCuriositiesSection`)
- Cabeçalho de seção com seletor `Segmented` compacto (`Semana` | `Mês`).
- Lista de cartões `.hx-card` (`padding: 16px`), cada um com:
  - Tag de categoria (`.hx-tag`: `Tonelagem`, `Força & PR`, `Hábito`, `Foco`, `Tempo`);
  - Número/destaque principal em `.n-lg` (`color: var(--accent)`) ao lado do título curto em `.t-body-m`;
  - Frase comparativa em `.t-secondary` (`color: var(--text)`).
- Quando o período selecionado ainda não possui atividade: cartão de estado vazio encorajador sem números zerados.
