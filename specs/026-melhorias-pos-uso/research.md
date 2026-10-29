# Research: Melhorias pós primeiro uso (026)

## R1 — Onde a carga perde a segunda casa decimal

- **Decision**: Trocar o arredondamento do `Stepper` (`round1`, uma casa) por um arredondamento configurável por campo: duas casas para kg e inteiro para reps.
- **Rationale**: A investigação mostrou que só o `Stepper` arredonda:
  - API (`apps/api/src/routes/workout-sessions.ts`): `weight: z.number().nonnegative()`, sem limite de casas.
  - Tipo compartilhado (`packages/types/src/workout.ts`): `weight: number`.
  - Exibição (`formatNumber` em `apps/web/src/lib/format.ts`): já usa `maximumFractionDigits: 2` por padrão. 10,25 aparece como "10,25", e `SetRow`, histórico e preview já mostram certo.
  - O botão "+" hoje faz `round1(10.25 + 2.5)` = 12,8. Com duas casas fica 12,75.
- **Alternatives considered**: Guardar a carga em gramas inteiras (descartado: muda contrato e dados salvos sem necessidade). Manter `round1` e só aceitar digitação (descartado: contraria a clarificação de 10,25 / 10,50).

## R2 — Campo digitável dentro do Stepper

- **Decision**: O valor central do `Stepper` vira um `<input type="text" inputMode="decimal">` (kg) ou `inputMode="numeric"` (reps), com estado local de rascunho. O valor é confirmado no `blur` e no Enter; Escape descarta o rascunho. Os botões −/+ continuam e partem do valor confirmado.
- **Rationale**:
  - `type="number"` não aceita vírgula de forma consistente entre navegadores e locales pt-BR, e permite rolar o valor sem querer. Texto com `inputMode` abre o teclado numérico no celular (FR-005) e deixa o parse sob nosso controle (vírgula ou ponto, FR-003).
  - O rascunho local evita gravar valores intermediários ("1", "10", "10,") a cada tecla.
  - **Revisão do PR #20**: confirmar só no blur perdia a carga quando o ✓ era tocado sem o campo perder o foco (iOS). O valor válido passa a ser enviado a cada tecla; os intermediários só mudam o estado local da sessão, e a série grava o valor do momento em que é concluída.
  - Mostrado fora de edição, o valor continua passando por `formatNumber`, então o visual de hoje se mantém.
- **Parse/normalização** (função pura testável, em `apps/web/src/lib/`): troca `,` por `.`, faz `trim` e `Number()`. Vazio ou `NaN` → `null` (mantém o anterior). Depois vem o clamp `[min, max]` e o arredondamento por casas (kg: 2; reps: 0).
- **Alternatives considered**: Teclado numérico próprio na tela (descartado: YAGNI, o teclado do sistema basta). Abrir o valor num modal (descartado: mais toques que o SC-001).

## R3 — Limites

- **Decision**: kg em `[0, 500]` com duas casas; reps em `[0, 100]`, inteiro. O mínimo 0 dos dois é o mesmo de hoje.
- **Rationale**: Mantém o comportamento atual dos botões (mínimo 0). O limite superior é só do cliente; a API não muda. Reps 0 continua com o tratamento atual no salvamento (a API exige `reps > 0` nas séries enviadas; a 026 não muda essa regra).
- **Alternatives considered**: Validar o limite também na API (descartado: fora do escopo; não há relato de valores absurdos chegando).

## R4 — Rota e fonte de dados do preview

- **Decision**: Nova rota `apps/web/src/app/treinos/proximo/page.tsx` (server component, mesmo `getLatestPlan` da aba Treinos) + `ProximoTreinoClient.tsx`, que usa `useWorkoutPlan()` para ter o plano atualizado e mostra `plan.today`.
- **Rationale**: `plan.today` é a sessão pendente com os ajustes de cansaço e as edições manuais já aplicados, a mesma que a Home e a aba Treinos usam e a mesma que `startWorkout(today.exercises)` recebe. Isso garante SC-004 sem lógica nova. Ficar sob `/treinos` deixa a aba ativa no `NavBar` (`match: ['/treinos']`).
- **Alternatives considered**: Rota `/workout/preview` (descartado: `/workout` redireciona sem sessão ativa e esconde a navegação). Sheet sobre a Home (descartado: a clarificação Q2 pediu tela própria e acesso também pela aba Treinos).

## R5 — Preview não cria sessão nem check-in

- **Decision**: O preview nunca chama `startWorkout`, `saveSessionCheckin` nem as rotas de sessão. Ele só lê `isActive` de `useActiveWorkout()`. O botão "Iniciar treino" do preview usa o mesmo `useTirednessFlow` da Home (`openStart` → `startWorkout` → `/workout`), então o check-in pré-treino continua aparecendo só dentro de `/workout`.
- **Rationale**: A sessão ativa é um estado em `localStorage` (`useActiveWorkout`), criada só por `startWorkout`. O check-in pré-treino é um diálogo de `/workout`. Não montar nenhum dos dois já basta para FR-012, e isso é verificável em teste (`localStorage` intacto, nenhuma chamada a `apiFetch` além da leitura do plano).
- **Com sessão ativa** (FR-015): o botão vira "Continuar treino" → `router.push('/workout')`, sem chamar `startWorkout`. Hoje `startWorkout` sobrescreve a sessão em andamento sem avisar, e o preview não deve repetir isso.
- **Alternatives considered**: Duplicar o fluxo de início no preview (descartado: Constituição IV / duplicação).

## R6 — Detalhe do exercício em modo só leitura

- **Decision**: Tornar `onApply` opcional em `ExerciseSheet`. Sem `onApply`, a aba de variantes lista as variantes sem o botão de troca. O preview e a lista da aba Treinos abrem a folha sem `onApply`.
- **Rationale**: A folha já tem tudo o que FR-011 pede (demonstração, passos, músculos, cadência, variantes). Um prop opcional é a menor mudança e mantém um componente só.
- **Alternatives considered**: Componente `ExerciseSheetReadOnly` separado (descartado: duplica layout).

## R7 — Lista do preview

- **Decision**: Reaproveitar `PlanExerciseList` (já agrupa por fase, mostra séries × reps, carga, progressão, RIR e biset). Ela ganha um `onSelect?(index)` opcional que torna cada linha tocável, e passa a mostrar o descanso nas linhas principais.
- **Rationale**: É a lista que a aba Treinos já usa. Tornar as linhas tocáveis cobre o FR-016 na aba Treinos com o mesmo código. O descanso vem da mesma função que a sessão ativa usa (`restSecondsAfterSet` de `@helux/workouts`), chamada com `hasPendingSets` todo `true` (o estado antes da primeira série). Assim o preview mostra o mesmo valor da sessão: 90 s, ou "sem descanso antes do par" no 1º exercício de um biset.
- **Alternatives considered**: Lista nova só para o preview (descartado: duplicação).
