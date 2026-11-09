# Contracts — UI (030)

## Rotas e Navegação da Web

| Rota | Conteúdo |
|:---|:---|
| `/` (`HomeClient`) | Abaixo do cartão do treino principal de academia, exibe a seção **Rotinas do Dia** (`<DailyRoutinesSection />`): 3 linhas/cartões compactos (**Alongamento & Mobilidade**, **Core / Abdominal**, **Cardio**) mostrando status hoje (`Feito hoje` ou tempo estimado), placar semanal (`3/5 sem.`) e botão rápido **Iniciar** (1 toque → `/treinos/rotina/[category]`). |
| `/treinos` (`TreinosClient`) | Ganha no topo um `Segmented` com duas opções: **Academia** (padrão) e **Rotinas** (também acessível via `/treinos?aba=rotinas`). |
| `/treinos?aba=rotinas` (`RoutinesTab`) | Exibe as 3 rotinas fixas do mesociclo (`Alongamento & Mobilidade`, `Core / Abdominal`, `Cardio`) com propósito (como potencializa o treino e protege articulações), duração, placar semanal (`concluídas / meta`), prévia dos exercícios/modalidade, botão **Iniciar**, botão **Ajustar** (abre `RoutinePreferencesSheet`) e o histórico recente de rotinas concluídas. |
| `/treinos/rotina/[category]` | Tela de execução guiada da rotina complementar (`alongamento-mobilidade`, `core-abdominal` ou `cardio`), usando o estado isolado `useActiveRoutine` (`localStorage` `'helux:active-routine'`). |

---

## Experiência de Execução por Categoria (`/treinos/rotina/[category]`)

### 1. Alongamento & Mobilidade (`alongamento-mobilidade`)
- Exibe um item por vez (com navegação entre itens):
  - Demonstração animada (`ExerciseDemo`) + orientações estruturadas (`cues`: posição, execução, ponto de atenção).
  - Indicador de lado quando `unilateral: true` (`Lado esquerdo` → `Lado direito`).
  - Para itens com `mode: 'tempo'`: cronômetro regressivo grande (ex.: `00:30`), botões **Iniciar / Pausar timer** e **Concluir movimento** (1 toque, sem campo de carga em kg — FR-009).
- Ao concluir todos os itens (ou tocar em **Finalizar rotina**), salva via `POST /api/routines/logs` e volta para `/treinos?aba=rotinas` (ou `/`).

### 2. Core / Abdominal (`core-abdominal`)
- Lista os exercícios da rotina com demonstração (`ExerciseDemo`) e instruções (`cues`).
- Cada série é marcada com 1 toque (exibindo as repetições-alvo ou o cronômetro de isometria para pranchas/hollow hold, sem exigir preenchimento de carga em kg — FR-010).
- Ao concluir uma série, inicia o cronômetro de descanso curto (30–45 s).
- Ao finalizar, permite informar esforço percebido opcional (4 níveis: Fácil, Moderado, Difícil, No limite) e salva em `POST /api/routines/logs`.

### 3. Cardio (`cardio`)
- Se a sessão de academia pendente hoje trabalha membros inferiores (`legDayWarning` presente), exibe no topo um `Banner` de atenção recomendando ritmo leve e sem impacto para preservar o treino de pernas da noite (FR-015).
- Exibe a modalidade recomendada com demonstração (`ExerciseDemo`), orientações de postura/execução, duração-alvo (ex.: `25 min`) e zona de intensidade (`leve` / `moderada`).
- Permite trocar a modalidade no momento da execução entre as opções compatíveis do `CARDIO_BANK` (`Segmented` ou seletor simples) e ajustar os minutos realizados e o esforço percebido (4 níveis) antes de tocar em **Concluir cardio** (< 15 s — FR-011, SC-003).

---

## Sinergia na Sessão de Academia (`TreinosClient`, `ProximoTreinoClient`, `/workout`)

- Quando `completedToday` inclui `'cardio'` ou `'alongamento-mobilidade'`, os itens correspondentes da fase `volta-calma` (ou bloco de cardio da sessão) exibem o selo **"Já cumprido hoje nas Rotinas"** (`FR-014`, `SC-004`), permitindo ao usuário pular aquela volta à calma sabendo que já cumpriu o estímulo no outro turno do dia.
