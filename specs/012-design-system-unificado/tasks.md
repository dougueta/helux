---

description: "Tarefas da spec 012 — Helux Design System v2 no app web"
---

# Tasks: Helux Design System v2 no App Web

**Input**: `specs/012-design-system-unificado/` (spec, plan, research Parte 2 V1–V11, data-model, contracts/ui-components.md, quickstart) + `design_handoff_helux_v2/`
**Caminhos**: relativos a `apps/web/`, salvo indicação.

**Tests**: TDD obrigatório (constituição, Princípio II).
- **Componentes e helpers novos** nascem com teste RED, segundo o contrato de `contracts/ui-components.md`.
- **Telas** são composição de componentes. A rede de segurança delas é:
  - os testes de comportamento existentes, que continuam verdes. Só se ajusta o que o desenho muda de propósito (texto, papel ARIA), e cada ajuste é documentado no commit;
  - o **guarda v2**;
  - a verificação manual (quickstart).

## Parte 1 (histórico): versão anterior da spec, concluída

Já estão no branch, da versão anterior (ver `git log` e research Parte 1): T001–T026. Eles removeram o Tailwind, criaram o reset próprio, os tokens em variáveis, `Card`, `Skeleton`, `pageContainer`, `parseTipItems` e `ExecutionTips`, o guarda da Parte 1 e a correção do `viewport-fit`. A T027 (verificação manual da versão anterior) foi **cancelada**: a v2 substitui aquele visual.

---

## Phase 1: Setup (Parte 2)

- [X] T030 Criar `src/app/helux-v2.css` a partir de `design_handoff_helux_v2/v2/helux-v2.css`, com as adaptações de research V1:
  - `--font` e `--mono` passam a usar as variáveis do next/font;
  - `--safe-b` vira `env(safe-area-inset-bottom, 0px)`;
  - removidas as classes que só existem no protótipo: `.hx-phone`, `.hx-status`, `.hx-status-r`, `.hx-scroll`, `.hx-home-ind`;
  - `.hx-scrim`, `.hx-sheet` e `.hx-dialog` passam a `position: fixed`;
  - `.hx-dock` vira contêiner fixo do rodapé, alinhado à coluna de 512 px no desktop;
  - escala de z-index `--z-dock`, `--z-nav`, `--z-scrim`, `--z-sheet`, `--z-dialog` e `--z-toast`, aplicada às classes.

  Importar no `src/app/layout.tsx` depois do `globals.css`.
- [X] T031 Em `src/app/layout.tsx`, carregar via `next/font` os pesos da v2: Space Grotesk 400/500/600/700 e JetBrains Mono 400/500/600 mais o itálico. Em `src/app/globals.css`, manter o reset e remover do `:root` os tokens que agora vêm de `helux-v2.css`. Os tokens antigos ainda usados (`--r-card`, `--accent-glow`, `--demo-bg-*`) ficam marcados com um comentário "legado: remover na T061".

---

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T032 [P] RED→GREEN: `src/__tests__/lib/format.test.ts` e `src/lib/format.ts`:
  - `formatNumber`: 82 → "82", 82 com 1 casa → "82,0", 9840 → "9.840", 17.4 → "17,4";
  - `formatDuration`.
- [X] T033 [P] RED→GREEN: `src/__tests__/lib/fit.test.ts` e `src/lib/fit.ts`, com `fitBand` nas bordas 49/50/74/75 e o token de cada faixa (research V6).
- [X] T034 [P] RED→GREEN: evoluir `src/__tests__/lib/tipItems.test.ts` e `src/lib/tipItems.ts` para o TipItem v2 (research V4):
  - `gene: {symbol, genotype}`;
  - gene sem parênteses ("COL1A1 C,C");
  - remoção do prefixo "ATENÇÃO:";
  - invariante "nada se perde".

  Atualizar os casos existentes, inclusive o texto real do Agachamento: espera-se o primeiro item com `gene {COL1A1, C,C}` e sem "ATENÇÃO".
- [X] T035 RED: reescrever `src/__tests__/design-system-guard.test.ts` para o guarda v2 (research V3), com classes validadas contra os seletores de `app/helux-v2.css`, `var()` checado contra os dois `:root`, cores literais (hex, `rgb`, `rgba`) e `--accent-glow`. Confirmar que ele falha e listar o trabalho restante. O guarda só fica verde na T061.
- [X] T036 [P] RED→GREEN: `ui/icons.tsx` com os paths do objeto `IC` de `v2-core.jsx` e `HelixMark` v2, mantendo os nomes de ícone usados hoje. Testes em `src/__tests__/components/ui/icons.test.tsx`.
- [X] T037 [P] RED→GREEN: `ui/Button.tsx` (`Button` e `IconButton`), conforme o contrato.
- [X] T038 [P] RED→GREEN: `ui/Tag.tsx` (`Tag` e `GeneTag`), conforme o contrato.
- [X] T039 [P] RED→GREEN: `ui/Helix.tsx` e `ui/Fit.tsx`, conforme o contrato e research V6. O modo `sequential` desliga em movimento reduzido, via `matchMedia`.
- [X] T040 [P] RED→GREEN: `ui/Segmented.tsx`, com os modos grupo e abas, conforme o contrato.
- [X] T041 [P] RED→GREEN: `ui/Stepper.tsx` e `ui/Field.tsx`, conforme o contrato.
- [X] T042 [P] RED→GREEN: `ui/Check.tsx`, `ui/SetRow.tsx` e `ui/CurrentSet.tsx`, conforme o contrato.
- [X] T043 [P] RED→GREEN: `ui/WorkoutProgress.tsx`, `ui/CycleProgress.tsx` e `ui/Ring.tsx` (v2), conforme o contrato.
- [X] T044 [P] RED→GREEN: `ui/Tips.tsx`, que substitui `workout/ExecutionTips`, e `ui/Steps.tsx`, conforme o contrato.
- [X] T045 [P] RED→GREEN: `ui/ScreenHeader.tsx` e `ui/SectionHeader.tsx`.
- [X] T046 [P] RED→GREEN: `ui/Sheet.tsx`, `ui/Dialog.tsx` e `ui/Toast.tsx`, com portal, foco, Esc e scrim, conforme o contrato.
- [X] T047 [P] RED→GREEN: `ui/Banner.tsx`, `ui/Bars.tsx`, `ui/HistoryRow.tsx`, `ui/PRRow.tsx` e `ui/Skeleton.tsx` (v2, `hx-sk`), conforme o contrato.
- [X] T048 RED→GREEN: `components/layout/NavBar.tsx` v2 (`.hx-nav`, `aria-current`, rotas ocultas, research V8), com testes em `src/__tests__/components/layout/NavBar.test.tsx`.

**Checkpoint**: folha v2, helpers e todos os componentes de `ui/` prontos e testados. O guarda está RED, listando o que falta migrar.

---

## Phase 3: US2 — Treino ativo e folha de execução (P1) 🎯 MVP

**Independent Test**: `quickstart.md` passo 1.

- [X] T049 [US2] Reescrever a apresentação de `src/app/workout/page.tsx` com os componentes v2 (FR-011, FR-012, FR-013 e research V5):
  - `ScreenHeader` com encerrar, nome, "N/total séries" e timer;
  - `WorkoutProgress`, cujo `onPick` chama `setExercise`;
  - `Tag` e `Fit`;
  - `.t-title`;
  - prescrição com números em mono;
  - `Tips` com `display.tip` (preserva a regra da spec 010);
  - card `.hx-card` com "Ver execução" e o atalho de variante com fit maior;
  - seção "Séries" com `SectionHeader`, `SetRow` e `CurrentSet` (`editingSetIndex`, `poppedSetIndex`);
  - "Adicionar série" (ghost);
  - rodapé `.hx-dock` / `.hx-cta-dock` com o bloco de descanso (`Ring`, tempo, "+15s", "Pular", `role="timer"`) e o botão "Próximo exercício"/"Finalizar treino", principal ou secundário conforme o descanso.

  Manter `useActiveWorkout`, `useFinishWorkout` e o `FinishWorkoutConfirmDialog` (spec 009, migrado para `ui/Dialog` na T052). Rodar `src/__tests__/app/workout-page.test.tsx`: ajustar só os seletores que o desenho mudou de propósito e registrar no commit.
- [X] T050 [US2] Reescrever `src/components/workout/ExerciseSheet.tsx` como conteúdo de `ui/Sheet` (FR-015, research V5):
  - palco `.hx-stage` com `ExerciseDemo`, cadência "2·0·1" quando houver `tempo`, pausar/reproduzir e "Repetir";
  - `.t-heading` e `Fit`;
  - etiquetas;
  - `Segmented tabs` com Execução e Variantes;
  - aba Execução: `Steps` a partir de `cues`, com o último item "Erro comum:" como `warn`, quando começar assim;
  - "Músculos trabalhados" com `MuscleMap` e a legenda v2;
  - aba Variantes: lista plana com `Fit`, etiquetas, "Atual" (outline) ou `Button` "Trocar" (secondary se o fit for maior que o atual, ghost se for menor), que aplica a variante;
  - rodapé "Fechar".

  Preservar a regra da spec 010. Atualizar `src/__tests__/components/workout/ExerciseSheet.test.tsx` onde o desenho mudou o texto ou o papel.
- [X] T051 [P] [US2] `src/components/workout/ExerciseDemo.tsx`: ao desenhar, usar os tokens `--stage` e `--stage-grid` (sem `--demo-bg-*`), a cor `--accent` só no implemento, e parar no meio do movimento em movimento reduzido (FR-008). Manter as animações por padrão de movimento.
- [X] T052 [P] [US2] Migrar `src/components/workout/FinishWorkoutConfirmDialog.tsx` para `ui/Dialog`, com ações empilhadas (destrutiva em cima, "Continuar treinando" ghost), preservando o texto e o comportamento da spec 009 e os testes existentes.

**Checkpoint**: treino ativo e folha no v2; fluxos das specs 009, 010 e 016 intactos.

---

## Phase 4: US3 — Home (P1)

**Independent Test**: `quickstart.md` passo 3.

- [X] T053 [US3] Reescrever `src/app/HomeClient.tsx` (FR-017, FR-019):
  - topo com `HelixMark`, sequência (ghost com o ícone da chama em `--warn`) e `IconButton` de perfil;
  - `.t-secondary` com a data;
  - `.t-display` "Bom treino, {nome}", sem verde;
  - `.hx-focus` com o treino, "N exercícios", o nome 24/28, `Fit md`, "Depois" (2 próximos + "e mais N"), a divisória, "Como você está hoje" com `TirednessSelector` e `Button primary lg` "Iniciar treino" com o ícone de play;
  - ciclo com `SectionHeader` e `CycleProgress`;
  - último check-in em `.hx-plain`, com grade 2×2 em `.n-md`/`.u` e os botões "Novo check-in" (secondary) e "Gerar novo plano" (ghost);
  - skeleton na forma final dentro da área de foco.

  Estados vazios ("Nenhum plano gerado ainda") no padrão v2, convidando à ação.
- [X] T054 [US3] Migrar `src/components/workout/TirednessSelector.tsx` e `TirednessLevelPicker.tsx` para `Segmented` neutro, e `TirednessDialog.tsx` para `ui/Sheet`/`ui/Dialog`, com `AdjustmentChangesList` no visual v2 (FR-018). Preservar todo o comportamento da spec 011; os testes existentes continuam verdes, ajustando só os seletores.
- [X] T055 [P] [US3] Migrar `src/app/loading.tsx` para skeletons na forma da Home v2.

**Checkpoint**: Home e fluxo da spec 011 no v2.

---

## Phase 5: US4 — Treino concluído (P2)

- [X] T056 [US4] Reescrever `src/components/workout/WorkoutDoneScreen.tsx` (FR-020, research V10):
  - `Helix` sequencial com um traço por série do treino;
  - `.t-display` "Treino concluído";
  - linha com o nome do treino e a duração;
  - grade 2×2 com Volume, Séries e Duração (sem Recordes);
  - estados: salvando (`Button loading` + "Salvando treino…" com `role="status"`), salvo ("Voltar para Hoje") e erro (`Banner err` + "Tentar de novo" com o ícone de sincronizar + "Sair sem sincronizar" ghost).

  Preservar o `useFinishWorkout` e os testes da spec 016, ajustando só os textos que o desenho mudou ("Tentar novamente" → "Tentar de novo"; "Voltar ao início" → "Voltar para Hoje"), com registro no commit.

---

## Phase 6: US5 — Progresso com Histórico (P2)

- [X] T057 [US5] Reescrever `src/app/recovery/page.tsx` (FR-021, research V9):
  - `.t-display` "Sua evolução";
  - "Recovery de hoje", com `Banner warn` quando os dados estiverem antigos e 4 cards `.hx-card` com ícone e `.n-lg` (atenuados quando antigos);
  - "Volume semanal" em `.hx-plain`, com `.n-xl` e o delta, mais `Bars`;
  - "Recordes pessoais" com `PRRow`;
  - "Histórico" com os 3 últimos em `HistoryRow` e o link "Ver todos" para `/history`.

  Estados vazios que convidam a uma ação.
- [X] T058 [P] [US5] Migrar `src/app/history/page.tsx` (lista com `HistoryRow`) e `src/app/history/[id]/page.tsx` (detalhe com `ScreenHeader`, variante executada da spec 010 com `Fit`, séries em mono). Remover `components/progress/SessionHistoryRow.tsx`, `PersonalRecordRow.tsx`, `BarChart.tsx` e `StatGrid.tsx` se ficarem sem uso.

---

## Phase 7: US6 — DNA (P2)

- [X] T059 [US6] Reescrever `src/app/dna/DnaClient.tsx` e `src/components/dna/TraitCard.tsx` (FR-022):
  - `ScreenHeader` com voltar e "Perfil";
  - `.t-display` "Seu DNA" com o texto introdutório;
  - fita de marcadores (`Helix` estática com os loci dos genes do perfil acesos e os nomes em `.gene` embaixo);
  - "Marcadores genéticos" + "N de N lidos";
  - cards `.hx-card` com o gene em itálico, o genótipo quando houver, o nível em palavra e 3 barras neutras (`level` 0–1 mapeado para baixo/médio/alto: < 0,34, < 0,67, ≥ 0,67), o nome do traço, o impacto (`note`) e o quadrado âmbar quando `warn`.

  Sem a seção "Como molda seu treino". Migrar também `src/app/dna/loading.tsx` e `src/app/dna/page.tsx`.

---

## Phase 8: US7 — Demais telas e fechamento do sistema (P3)

- [X] T060 [P] [US7] Migrar para os componentes v2 (FR-023):
  - `src/app/treinos/TreinosClient.tsx`, `src/app/checkin/page.tsx` e `src/components/checkin/CheckinForm.tsx`, com `Field` para os campos numéricos;
  - `CheckinCard.tsx`, `CheckinHistoryTable.tsx` e `src/app/checkin/history/page.tsx`;
  - `src/app/perfil/page.tsx` (e `ProfileForm` se existir), `src/app/login/page.tsx` e `src/components/ErrorBoundary.tsx` (`Banner err` + "Tentar de novo");
  - `src/components/layout/Shell.tsx`.

  Corrigir o espaço superior duplicado (48 + 48) anotado nos achados da Parte 1, usando o ritmo de espaçamento da v2.
- [X] T061 Remover os componentes antigos sem uso (`ui/Card`, `ui/Chip`, `ui/Label`, `ui/MatchBadge`, `ui/MiniStep`, `ui/layout.ts`, `workout/ExecutionTips` e os que o `tsc` apontar sem import) e os tokens legados de `globals.css` (`--r-card`, `--accent-glow`, `--demo-bg-*`), junto com os testes dos componentes removidos. O guarda v2 (T035) precisa ficar **verde**.

---

## Phase 9: Polish

- [X] T062 Rodar `pnpm --filter @helux/web test`, `pnpm typecheck` e `pnpm --filter @helux/web build`: todos verdes.
- [X] T063 Verificação manual de `quickstart.md` (passos 1–8), lado a lado com `design_handoff_helux_v2/Helux Design System v2.html`.

---

## Dependencies & Execution Order

- **Setup (T030–T031)** vem antes de tudo.
- **Foundational (T032–T048)**: a T035 (guarda RED) depende da T030. As tarefas de componente [P] podem andar em paralelo entre si. A T048 depende da T036 (ícones).
- **US2 (T049–T052)** depende da Foundational. A T049 e a T050 mexem em arquivos diferentes, mas a T049 usa a `Sheet` com o conteúdo da T050: fazer a T050 antes ou junto. T051 e T052 são [P].
- **US3 (T053–T055)** depende da Foundational e independe da US2, exceto pela T054, que usa `Sheet`/`Dialog`.
- **US4 (T056), US5 (T057–T058) e US6 (T059)** dependem da Foundational e são independentes entre si.
- **US7 (T060–T061)**: a T061 depende de **todas** as migrações, porque remove o legado e deixa o guarda verde.
- **Polish (T062–T063)** vem por último.

## Implementation Strategy

1. Folha v2 e fundação testada, com o guarda RED como mapa do trabalho.
2. **MVP = US2** (treino ativo e folha): é a tela de uso principal e a que o desenho mais muda.
3. US3 (Home), depois US4, US5 e US6 em paralelo, se houver capacidade.
4. US7 e a remoção do legado, com o guarda verde.
5. Polish: suíte completa e verificação lado a lado com o handoff.

## Notes

- Nunca inventar dado (FR-024): "Anterior" aparece como "—"; recordes da conclusão e "Como molda seu treino" ficam ocultos.
- Se o handoff e o comportamento existente conflitarem, o comportamento das specs 009/010/011/016 vence e o conflito é registrado em "Achados da implementação (Parte 2)" no `research.md`.
