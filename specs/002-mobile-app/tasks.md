# Tasks: App Mobile Helux (Phase 4)

**Input**: Design documents from `/specs/002-mobile-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**TDD**: A constituição exige TDD obrigatório. Em `packages/workouts` testes DEVEM ser escritos e falhar antes de cada implementação. Para componentes UI de `apps/mobile`, verificação manual contra os screenshots do handoff.

**Design reference**: `c:\Users\Doug\Downloads\helux\design_handoff_helux\` — protótipo HTML navegável, screenshots/, helux-data.jsx, helux-screens.jsx, helux-active.jsx, helux-components.jsx, helux-demo.jsx, helux-sheet.jsx

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: A qual user story esta tarefa pertence (US1–US5)

---

## Phase 1: Setup (Infraestrutura dos Packages)

**Purpose**: Criar estrutura de `packages/workouts` e `apps/mobile` com todas as dependências.

- [ ] T001 Criar `packages/workouts/package.json` com nome `@helux/workouts`, dep `@helux/types`, devDep `vitest`
- [ ] T002 [P] Criar `packages/workouts/tsconfig.json` estendendo `../../tsconfig.base.json` com `rootDir: src, noEmit: true`
- [ ] T003 [P] Criar `packages/workouts/vitest.config.ts` com `globals: true`
- [ ] T004 Criar `apps/mobile/package.json` com nome `@helux/mobile`; deps: `expo@~52.0.0`, `expo-router`, `react-native`, `react-native-reanimated`, `@gorhom/bottom-sheet`, `@react-native-async-storage/async-storage`, `expo-font`, `@expo-google-fonts/space-grotesk`, `@expo-google-fonts/jetbrains-mono`; dep `@helux/workouts: workspace:*`
- [ ] T005 [P] Criar `apps/mobile/app.json` com `name: "Helux"`, `slug: "helux"`, `scheme: "helux"`, `plugins: ["expo-font"]`, `ios.bundleIdentifier: "com.helux.app"`, `android.package: "com.helux.app"`
- [ ] T006 [P] Criar `apps/mobile/tsconfig.json` estendendo `../../tsconfig.base.json` com `extends: "expo/tsconfig.base"` e paths para `@/*: ["./src/*"]`
- [ ] T007 Adicionar `@helux/workouts: workspace:*` às dependencies de `apps/mobile/package.json` (se não já adicionado em T004)
- [ ] T008 Executar `pnpm install` na raiz para resolver workspaces novos
- [ ] T009 Adicionar `@helux/mobile` e `@helux/workouts` ao pipeline do `turbo.json` (tasks `test`, `typecheck`, `start`)

**Checkpoint**: Packages criados, deps instaladas, Turborepo configurado.

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Tipos, tema, dados mock e componentes compartilhados — necessários por TODAS as user stories.

**⚠️ CRÍTICO**: Nenhuma user story pode começar sem esta fase.

- [ ] T010 Criar `packages/workouts/src/types.ts` com as interfaces: `Variant`, `MuscleMap`, `SuggestedSet`, `ActiveExercise`, `SetState`, `ActiveSession`, `WorkoutSummary`, `PersonalRecord`, `StorageAdapter` — exatamente como especificado em `specs/002-mobile-app/data-model.md`
- [ ] T011 [P] Criar `apps/mobile/src/constants/theme.ts` com todos os design tokens do handoff: objeto `colors` (bg, surface1/2/3, hairline, hairline2, text, textDim, textFaint, accent, accentInk, accentSoft, accentLine, accentGlow, warn, danger), objeto `radii` (card:20, sheet:26, sm:12, pill:999), objeto `fonts` (ui:'SpaceGrotesk', mono:'JetBrainsMono')
- [ ] T012 Criar `apps/mobile/src/data/mock.ts` traduzindo HELUX_USER, HELUX_GENETICS, HELUX_PROGRAM, HELUX_WORKOUTS, HELUX_SESSION, HELUX_PROGRESS de `c:\Users\Doug\Downloads\helux\design_handoff_helux\helux-data.jsx` para TypeScript; exportar como constantes tipadas
- [ ] T013 [P] Criar `apps/mobile/src/components/shared/Icon.tsx` com os ícones SVG inline: home, dumbbell, dna, chart, play, check, plus, minus, timer, swap, flame, trophy, target, clock, chevron, arrowUp, spark, bolt — baseado em `helux-components.jsx`; props: `name`, `size`, `stroke`, `fill`
- [ ] T014 [P] Criar `apps/mobile/src/components/shared/HelixMark.tsx` com o logo SVG (duas senoides cruzadas + travessões); props: `size`, `stroke` (default: `colors.accent`)
- [ ] T015 [P] Criar `apps/mobile/src/components/shared/Ring.tsx` — SVG circular com track `rgba(255,255,255,.08)`, stroke `colors.accent`, `strokeLinecap: round`; props: `value` (0–100), `size`, `sw` (strokeWidth), `children` (centro); animação `stroke-dashoffset` respeitando `prefers-reduced-motion`
- [ ] T016 [P] Criar `apps/mobile/src/components/shared/MatchBadge.tsx` — pill `accentSoft` + borda `accentLine`, ponto luminoso + número mono + "fit"; props: `value`, `size` ('md'|'sm')
- [ ] T017 [P] Criar `apps/mobile/src/components/shared/Chip.tsx` — pill com `surface2`+`hairline`; variante `accent` com fundo sólido; props: `children`, `accent?: boolean`
- [ ] T018 [P] Criar `apps/mobile/src/components/shared/Label.tsx` — texto uppercase 11px/600/+0.14em em `textFaint`; props: `children`
- [ ] T019 Criar `apps/mobile/app/_layout.tsx` — root Stack com `SplashScreen.preventAutoHideAsync()`, `useFonts({SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold, JetBrainsMono_600SemiBold})`, fundo `colors.bg`, depois `SplashScreen.hideAsync()`; configurar `<Stack screenOptions={{ headerShown: false }}>` com as rotas `(tabs)` e `treino-ativo`
- [ ] T020 Criar `apps/mobile/app/(tabs)/_layout.tsx` — `<Tabs>` com 4 abas (index=Hoje, treinos=Treinos, dna=DNA, progresso=Progresso); `tabBarStyle` com fundo translúcido + blur (`Platform.OS`); aba ativa em `colors.accent`; ícones usando `<Icon>` component; rótulos em SpaceGrotesk

**Checkpoint**: Tipos, tema, mock, componentes shared e shell de navegação prontos. Turborepo roda `typecheck` sem erros nestes arquivos.

---

## Phase 3: User Story 1 — Executar Treino do Dia (Priority: P1) 🎯 MVP

**Goal**: Ciclo completo: tela Hoje → iniciar treino → registrar séries → timer de descanso → finalizar com resumo. `packages/workouts` com lógica pura testada.

**Independent Test**:
```bash
# Iniciar app no simulador iOS:
npx expo start --ios
# 1. Tela Hoje: verificar HeroCard com treino do dia e CTA "Iniciar treino"
# 2. Tocar CTA → Treino Ativo abre com Push A (6 exercícios)
# 3. Ajustar peso/reps → tocar check → timer de descanso inicia
# 4. Tocar "+15s" e "Pular" no timer
# 5. Completar todas as séries → tocar "Finalizar treino" → tela de conclusão com ring 100%
```

### TDD — Testes para `packages/workouts` (escrever e confirmar FAIL antes de implementar)

- [ ] T021 Criar `packages/workouts/src/__tests__/session.test.ts`: testes para `startSession` — retorna `ActiveSession` com `sets` inicializados para cada exercício com `done:false` e valores de `SuggestedSet`; `variantById` vazio; `startedAt` próximo ao `Date.now()` — **confirmar FAIL**
- [ ] T022 [P] Criar testes em `packages/workouts/src/__tests__/session.test.ts`: `logSet` — atualiza `w` e `r` da série indicada sem mutar a sessão original; não marca como `done` — **confirmar FAIL**
- [ ] T023 [P] Criar testes em `packages/workouts/src/__tests__/session.test.ts`: `completeSet` — marca `done: true` na série indicada; não afeta outras séries; retorna nova sessão imutável — **confirmar FAIL**
- [ ] T024 [P] Criar testes em `packages/workouts/src/__tests__/session.test.ts`: `swapVariant` — atualiza `variantById[exId]` com o novo id; preserva todos os `sets` do exercício; reverter para id da rec remove a entrada do mapa — **confirmar FAIL**
- [ ] T025 [P] Criar testes em `packages/workouts/src/__tests__/session.test.ts`: `addSet` — adiciona série ao final clonando a última com `done:false` e `prev:""` — **confirmar FAIL**
- [ ] T026 [P] Criar testes em `packages/workouts/src/__tests__/session.test.ts`: `finishSession` — retorna `WorkoutSummary` com `durationMinutes` correto, `totalSets` = count de séries `done:true`, `totalVolumeKg` = soma de `w*r` das séries concluídas — **confirmar FAIL**
- [ ] T027 Rodar `pnpm test --filter @helux/workouts` — confirmar que todos os novos testes falham (RED)

### Implementação — `packages/workouts`

- [ ] T028 Criar `packages/workouts/src/session.ts` implementando todas as 6 funções puras: `startSession`, `logSet`, `completeSet`, `swapVariant`, `addSet`, `finishSession` — usando os tipos de `src/types.ts`; todas as funções retornam novo objeto sem mutar o argumento
- [ ] T029 Criar `packages/workouts/src/storage.ts` com `saveSession(session, adapter)`, `loadSession(adapter)`, `clearSession(adapter)` usando `JSON.stringify/parse` e as chaves `helux:active-session`
- [ ] T030 Criar `packages/workouts/src/index.ts` exportando todas as funções e tipos públicos
- [ ] T031 Rodar `pnpm test --filter @helux/workouts` — confirmar todos os testes passam (GREEN)

### Implementação — Tela Hoje

- [ ] T032 Criar `apps/mobile/src/components/home/HeroCard.tsx` — card hero com glow radial de acento, topbar com Label "Treino de hoje" + MatchBadge, nome do treino (h2 bold), foco muscular, meta (ícone dumbbell + nº exercícios, ícone clock + duração), CTA pill "Iniciar treino" com ícone play; props: `workout: WorkoutListItem`, `onStart: () => void`
- [ ] T033 [P] Criar `apps/mobile/src/components/home/RecoveryCard.tsx` — card com Ring (valor, size 62, sw 6), rótulo "Recuperação", status text; props: `value: number`
- [ ] T034 [P] Criar `apps/mobile/src/components/home/WeekDotsCard.tsx` — rótulo "Semana", número done/target em mono, dots (filled = acento, empty = surface3); props: `done: number`, `target: number`
- [ ] T035 [P] Criar `apps/mobile/src/components/home/GeneticInsightCard.tsx` — card com ícone dna (acento), Label "Insight do seu DNA", título e texto do driver, chevron; props: `driver: { title: string; text: string }`, `onPress: () => void`
- [ ] T036 Criar `apps/mobile/app/(tabs)/index.tsx` (tela Hoje) — ScrollView com fundo `colors.bg`; topbar (HelixMark + streak); saudação (dia da semana + data, "Bom treino, {firstName}" com nome em acento); HeroCard com `onStart={() => router.push('/treino-ativo')}`; grid 2 colunas (RecoveryCard | WeekDotsCard); GeneticInsightCard com `onPress={() => router.push('/(tabs)/dna')}`; dados de `mock.ts`

### Implementação — Treino Ativo

- [ ] T037 Criar `apps/mobile/src/components/active-workout/ExerciseProgressSegments.tsx` — barra de segmentos horizontais; cada segmento = fração da largura total; concluído = accent, atual = accent semi-transparente, pendente = surface3; clicável para navegar; props: `exercises: ActiveExercise[]`, `currentIdx: number`, `completionByIdx: boolean[]`, `onPress: (idx: number) => void`
- [ ] T038 [P] Criar `apps/mobile/src/components/active-workout/ExerciseHeader.tsx` — chip de músculo alvo, MatchBadge, nome do exercício (h2), scheme ("4 × 6-8"), tempo de descanso, nota genética (se houver), botão "Ver execução"; props: `exercise: ActiveExercise`, `activeVariantId: string | undefined`, `onOpenSheet: () => void`
- [ ] T039 Criar `apps/mobile/src/components/active-workout/SetRow.tsx` — linha de série: nº · valor anterior (mono, textFaint) · Stepper peso (step 2.5) · Stepper reps (step 1) · botão check; estado concluída: fundo accentSoft, nº e check em accent; props: `setNum: number`, `state: SetState`, `onUpdateW: (w:number)=>void`, `onUpdateR: (r:number)=>void`, `onComplete: ()=>void`
- [ ] T040 Criar `apps/mobile/src/components/active-workout/SetTable.tsx` — lista de SetRow + botão "Adicionar série" (texto textDim, ícone plus); props: `exerciseId: string`, `sets: SetState[]`, `onLogSet`, `onCompleteSet`, `onAddSet`
- [ ] T041 Criar `apps/mobile/src/components/active-workout/RestTimerBanner.tsx` — banner com barra de fundo accentSoft preenchendo conforme o tempo passa (Animated.View width%); tempo em mono; botão "+15s" e "Pular"; props: `rest: { active: boolean; left: number; total: number }`, `onExtend: ()=>void`, `onSkip: ()=>void`
- [ ] T042 Criar `apps/mobile/src/components/active-workout/WorkoutCompletionScreen.tsx` — overlay fullscreen: Ring 100% (size 140), título "Treino concluído!", métricas (séries, duração, volume), lista de PRs se houver, CTA "Voltar ao início"; props: `summary: WorkoutSummary`, `onDone: ()=>void`
- [ ] T043 Criar `apps/mobile/app/treino-ativo.tsx` — tela Treino Ativo completa: `useReducer` com o `ActiveSessionState`; inicializa com `startSession()` usando `HELUX_SESSION`; header fixo (botão fechar, título+contador, timer de sessão em mono); `ExerciseProgressSegments`; ScrollView com `ExerciseHeader` + `SetTable`; `RestTimerBanner` (absoluto sobre o rodapé); rodapé fixo (Anterior/Próximo/Finalizar); ao finalizar chama `finishSession()` e exibe `WorkoutCompletionScreen`; persiste estado em AsyncStorage em cada mudança com `saveSession`

**Checkpoint**: Ciclo completo de treino funcional. Testar no simulador iOS antes de avançar.

---

## Phase 4: User Story 2 — Demonstração e Troca de Variante (Priority: P2) ⭐

**Goal**: Exercise Sheet com player de demonstração, execução, mapa muscular e troca de variantes genéticas — mantendo séries registradas.

**Independent Test**:
```bash
# No Treino Ativo, tocar "Ver execução" no ExerciseHeader
# Verificar: bottom sheet sobe com animação; player SVG placeholder visível; cues numerados
# Tocar aba "Variantes (3)" → lista ordenada por match; rec tem badge "Recomendado"
# Selecionar variante alternativa → "Usar esta variante" → sheet fecha → ExerciseHeader mostra novo nome
# Verificar séries registradas preservadas → tocar "Voltar à recomendada"
```

### Implementação — Exercise Sheet

- [ ] T044 Criar `apps/mobile/src/components/active-workout/ExerciseDemo.tsx` — player placeholder 220px de altura: fundo `surface2` com grid sutil (linhas hairline), figura SVG animada simples (círculo + linhas representando o movimento indicado por `motion`), pílula "REC" pulsante (accent), badge de tempo/cadência se `tempo` definido, botões Pausar/Reproduzir + Repetir; props: `motion: string`, `implement: string`, `tempo?: string`; animação em loop respeitando `prefers-reduced-motion`
- [ ] T045 [P] Criar `apps/mobile/src/components/active-workout/MuscleMapSVG.tsx` — silhueta humana SVG (frontal); músculos primários preenchidos com `colors.accent` e secundários com `colors.accentSoft`; mapeamento `muscle name → SVG path id`; props: `muscles: MuscleMap`
- [ ] T046 [P] Criar `apps/mobile/src/components/active-workout/ExecutionTab.tsx` — conteúdo da aba Execução: `ExerciseDemo`, título + chips (músculo, equipamento), MatchBadge, lista numerada de cues (body text), `MuscleMapSVG`, nota genética (se `gene` definida); props: `exercise: ActiveExercise`, `activeVariantId: string | undefined`
- [ ] T047 Criar `apps/mobile/src/components/active-workout/VariantsTab.tsx` — conteúdo da aba Variantes: lista de `VariantRow` ordenada por `match` desc; cada linha: rádio (selecionada = accent), nome, flag "Recomendado" (chip accent) ou "fit maior" (chip warn), chips equipamento+nível, motivo (textDim), número fit (mono); rodapé sticky: CTA "Usar esta variante" (visível só quando seleção ≠ ativa) + "Voltar à recomendada" (visível só quando variante não-rec ativa); props: `variants: Variant[]`, `activeVariantId: string | undefined`, `onApply: (variantId: string)=>void`
- [ ] T048 Criar `apps/mobile/src/components/active-workout/ExerciseSheet.tsx` — `BottomSheet` de `@gorhom/bottom-sheet`; snapPoints `['94%']`; borderRadius 26px; fundo `surface1`; header com título + chips (músculo, equipamento, nível) + MatchBadge + botão fechar; `SegmentedControl` (Execução | Variantes n); renderiza `ExecutionTab` ou `VariantsTab` conforme aba ativa; backdrop com fade 0.2s; props: `exercise: ActiveExercise`, `activeVariantId: string | undefined`, `onSelectVariant: (id:string)=>void`, `onClose: ()=>void`, `ref` (BottomSheetRef)
- [ ] T049 Integrar `ExerciseSheet` em `apps/mobile/app/treino-ativo.tsx` — adicionar `useRef<BottomSheet>` e handler `onOpenSheet` que chama `bottomSheetRef.current.expand()`; conectar `onSelectVariant` ao dispatch de `swapVariant` no reducer; conectar `onClose` ao `bottomSheetRef.current.close()`

**Checkpoint**: Sheet abre/fecha com animação correta; variante troca e séries persistem; reverter funciona.

---

## Phase 5: User Story 3 — Perfil Genético / Aba DNA (Priority: P3)

**Goal**: Tela DNA com índice Helux animado, marcadores genéticos completos e drivers de treino.

**Independent Test**:
```bash
# Navegar para aba DNA
# Verificar: ring animado com score 86; resumo textual abaixo
# Rolar: 6 marcadores genéticos (fibra, recup, hiper, forca, resist, lesao)
# "lesao" exibe cor de atenção (warn) em valor e barra
# Grid 2×2 com 4 drivers (load, freq, rest, mob)
```

- [ ] T050 [P] Criar `apps/mobile/src/components/dna/DnaHero.tsx` — card com `HelixMark` (120px, stroke accent, posicionado atrás), Ring (value=score, size=108, sw=9) com score em mono + label "índice", parágrafo de resumo; props: `score: number`, `summary: string`
- [ ] T051 [P] Criar `apps/mobile/src/components/dna/GeneticTraitRow.tsx` — linha de marcador: linha superior (rótulo bold + valor à direita, warn=`colors.warn`); barra de nível (track surface3, fill accent ou warn); rodapé (ícone dna + gene-fonte textFaint + tag chip); nota textDim; props: `trait: GeneticTrait`
- [ ] T052 [P] Criar `apps/mobile/src/components/dna/DriverGrid.tsx` — grid 2×2 de cards; cada card: ícone (accent), título (bold), texto (textDim); props: `drivers: GeneticDriver[]`
- [ ] T053 Criar `apps/mobile/app/(tabs)/dna.tsx` — ScrollView; header (Label "Perfil Helux" + h1 "Seu DNA"); DnaHero; SectionHead "Marcadores genéticos"; lista de GeneticTraitRow; SectionHead "Como molda seu treino"; DriverGrid; dados de `mock.ts`

**Checkpoint**: Aba DNA exibe todos os dados mock corretamente. Validar contra screenshot `05-dna.png`.

---

## Phase 6: User Story 4 — Progresso (Priority: P4)

**Goal**: Tela Progresso com stats, volume semanal em barras, recordes pessoais e histórico de sessões.

**Independent Test**:
```bash
# Navegar para aba Progresso
# Grid 2×2: 64 treinos, 24.3t volume, 92% adesão, 11 PRs
# Gráfico: 6 barras S1–S6; S6 (atual) em accent com glow
# Recordes: Supino 62.5kg +2.5; Agachamento 110kg +5
# Histórico: Pull A, Legs A, Push B
```

- [ ] T054 [P] Criar `apps/mobile/src/components/progress/StatGrid.tsx` — grid 2×2; cada célula: valor em mono bold grande, rótulo, sub-rótulo textFaint; props: `stats: StatItem[]`
- [ ] T055 [P] Criar `apps/mobile/src/components/progress/BarChart.tsx` — colunas `surface3`; última coluna (atual) em `accent` com sombra `accentGlow`; labels sob cada barra em mono 11px; altura proporcional ao valor; props: `data: VolumePoint[]`, `height: number`
- [ ] T056 [P] Criar `apps/mobile/src/components/progress/PersonalRecordRow.tsx` — ícone trophy (accent se `up`, textFaint se não); lift; when (textFaint); valor mono; delta mono (accent) se `up && delta!='+0'`; props: `record: PersonalRecordItem`
- [ ] T057 [P] Criar `apps/mobile/src/components/progress/SessionHistoryRow.tsx` — data (textFaint); nome do treino; métricas (sets, dur); volume mono à direita; props: `session: SessionHistoryItem`
- [ ] T058 Criar `apps/mobile/app/(tabs)/progresso.tsx` — ScrollView; header (Label "Sua evolução" + h1 "Progresso"); StatGrid; card de volume semanal (Label + volume total + delta em accent + BarChart); SectionHead "Recordes pessoais"; lista de PersonalRecordRow; SectionHead "Histórico"; lista de SessionHistoryRow; dados de `mock.ts`

**Checkpoint**: Aba Progresso exibe todos os dados mock. Validar contra screenshot `06-progresso.png`.

---

## Phase 7: User Story 5 — Biblioteca de Treinos (Priority: P5)

**Goal**: Aba Treinos com card do programa e lista do split; treino de hoje destacado; iniciar qualquer treino.

**Independent Test**:
```bash
# Navegar para aba Treinos
# Card do programa: "Hipertrofia Genética", barra semana 6/8 (75%), match 92
# Lista: 5 treinos; "Push A" com borda accent + chip "Hoje"
# Tocar play em "Pull A" → Treino Ativo abre (com dados do Push A por enquanto — mock fixo)
```

- [ ] T059 [P] Criar `apps/mobile/src/components/workout-list/ProgramCard.tsx` — nome do programa, fase, barra de progresso (semana X/Y), split, MatchBadge; props: `program: Program`
- [ ] T060 [P] Criar `apps/mobile/src/components/workout-list/WorkoutRow.tsx` — barra lateral accent (se `today`); nome + chip "Hoje" (se `today`); foco; meta (nº exercícios, duração, last); MatchBadge; botão play; borda accent se `today`; props: `workout: WorkoutListItem`, `onStart: () => void`
- [ ] T061 Criar `apps/mobile/app/(tabs)/treinos.tsx` — ScrollView; header (Label "Seu programa" + h1 "Treinos"); ProgramCard; SectionHead "Seu split"; lista de WorkoutRow com `onStart={() => router.push('/treino-ativo')}`; dados de `mock.ts`

**Checkpoint**: Aba Treinos exibe programa e split. Validar contra screenshot `02-treinos.png`.

---

## Phase 8: Polish & Validação Final

**Purpose**: Garantir que toda a pipeline Turborepo está limpa e o app é fiel ao handoff.

- [ ] T062 [P] Rodar `pnpm typecheck` na raiz — confirmar 0 erros em todos os workspaces incluindo `@helux/workouts` e `@helux/mobile`
- [ ] T063 Rodar `pnpm test --filter @helux/workouts` — confirmar todos os testes passam (session.test.ts: startSession, logSet, completeSet, swapVariant, addSet, finishSession)
- [ ] T064 Iniciar o app com `npx expo start --ios` e validar cada tela contra os screenshots em `c:\Users\Doug\Downloads\helux\design_handoff_helux\screenshots\`: 01-hoje.png, 02-treinos.png, 03-treino-ativo.png, 04-sheet-execucao.png, 04b-sheet-variantes.png, 05-dna.png, 06-progresso.png
- [ ] T065 Verificar fidelidade de design: cores (bg #0A0C0A, accent #C8FA4B), fontes (Space Grotesk + JetBrains Mono), raios (card 20px, sheet 26px), tipografia (numerais em mono em todos os valores)
- [ ] T066 [P] Adicionar `SectionHead` (componente auxiliar) em `apps/mobile/src/components/shared/SectionHead.tsx` se não foi criado nas fases anteriores — title + action opcional (botão textDim)
- [ ] T067 Verificar que o estado da sessão persiste: iniciar treino → fechar app no simulador → reabrir → confirmar que `loadSession` restaura o estado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão da Phase 1
- **US1 (Phase 3)**: Depende da Phase 2 — **bloqueada até Foundational estar completa**
- **US2 (Phase 4)**: Depende da Phase 3 (precisa do `treino-ativo.tsx` para integrar o sheet)
- **US3 (Phase 5)**: Depende da Phase 2 — pode rodar em paralelo com US1 após Foundational
- **US4 (Phase 6)**: Depende da Phase 2 — pode rodar em paralelo com US1 após Foundational
- **US5 (Phase 7)**: Depende da Phase 2 — pode rodar em paralelo com US1 após Foundational
- **Polish (Phase 8)**: Depende de todas as user stories completas

### User Story Dependencies

- **US1 (P1)**: Independente — MVP crítico
- **US2 (P2)**: Depende de US1 (integra no `treino-ativo.tsx`)
- **US3 (P3)**: Independente de US1/US2 (tela separada, dados mock)
- **US4 (P4)**: Independente de US1/US2/US3 (tela separada, dados mock)
- **US5 (P5)**: Independente de US1 para a lista; navega para `treino-ativo` que é US1

### Dentro de Cada User Story (ordem obrigatória)

```
[US1] Testes RED (T021-T027) → Implementação packages/workouts GREEN (T028-T031)
→ Componentes de tela → Integração na rota → Checkpoint manual
```

### Parallel Opportunities

```bash
# Phase 1 — maioria em paralelo:
T001 (workouts/package.json) | T002 (workouts/tsconfig) | T003 (workouts/vitest.config) |
T004+T005 (mobile/package.json + app.json) | T006 (mobile/tsconfig)

# Phase 2 — componentes shared em paralelo (todos arquivos diferentes):
T011 (theme.ts) | T013 (Icon.tsx) | T014 (HelixMark.tsx) | T015 (Ring.tsx) |
T016 (MatchBadge.tsx) | T017 (Chip.tsx) | T018 (Label.tsx)

# Phase 3 — testes em paralelo (T022-T026 todos em session.test.ts mas seções independentes):
T021+T022+T023+T024+T025+T026 → T027 (rodar) → T028 (implementar)

# Phase 3 — componentes home em paralelo:
T032 (HeroCard) | T033 (RecoveryCard) | T034 (WeekDotsCard) | T035 (GeneticInsightCard)

# Phase 3 — componentes active-workout em paralelo onde possível:
T037 (Segments) | T038 (Header) → T039 (SetRow) → T040 (SetTable)

# US3/US4/US5 — todas as telas estáticas podem rodar em paralelo após Foundational:
Phase 5 | Phase 6 | Phase 7 (após US1 completa, podem rodar simultaneamente)
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Concluir Phase 1: Setup
2. Concluir Phase 2: Foundational
3. Concluir Phase 3: User Story 1 (TDD + ciclo completo de treino)
4. **PARAR e VALIDAR**: Iniciar no simulador; testar o fluxo completo de treino
5. MVP entregue — app funcional para registrar treinos

### Incremental Delivery

1. Setup + Foundational → Scaffolding pronto
2. US1 → Ciclo de treino completo ✅ (MVP)
3. US2 → Exercise Sheet + Variantes ✅
4. US3 + US4 + US5 (paralelas) → Todas as telas ✅
5. Polish → App production-ready ✅

---

## Notes

- **[P]** = arquivos diferentes, sem dependências pendentes — rodar em paralelo via SDD
- **[USN]** = rastreabilidade com a user story da spec.md
- TDD obrigatório (constituição II): RED antes de GREEN, sempre — aplicado em `packages/workouts`
- Para componentes UI: verificar fidelidade visual contra screenshots do handoff
- Referência de design: abrir `Helux Prototipo.html` no browser para comparar interações animadas
- Commit após cada fase ou grupo lógico de tarefas
- Handoff: `c:\Users\Doug\Downloads\helux\design_handoff_helux\` — fonte da verdade de design
