---
description: "Tarefas de implementação da 028: banco de exercícios coerente com demonstração para todos"
---

# Tasks: Banco de exercícios coerente com demonstração de execução para todos

**Input**: Documentos em `specs/028-banco-exercicios-demonstracao/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Obrigatórios. A constituição exige TDD estrito (Princípio II): escreva o teste, confirme que ele falha e só então implemente.

**Organização**: As fases seguem as 8 etapas de entrega do [plan.md](./plan.md), e não a prioridade das histórias. Motivo: nenhuma demonstração pode ser produzida antes do motor e do fluxo de revisão (US5), e o volume só começa depois do piloto aprovado. O rótulo de cada tarefa indica a história atendida, e o [mapa por história](#mapa-por-história) mostra como validar cada uma.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história de [spec.md](./spec.md)
- **⛔ Portão do dono**: a tarefa para e aguarda uma decisão do dono do produto. Não siga sem ela

## Regras para todas as tarefas

- **Git**: commit, push e PR só quando o dono pedir. `docs/backlog.md` fica fora dos commits desta feature.
- **Merge**: somente pelo dono.
- **Repositório público**: nenhum dado pessoal em commit, backup, fixture ou evidência.
- **Aprovação**: `demos:approve` só para os ids que o dono aprovou no PR.
- **Lista de pendências**: `pending.json` só diminui. Item novo nunca entra nela.
- **Nomes**: nenhum dos 122 nomes é alterado. `equipment` e `muscleGroup` mantêm valor e significado (R3, R4).
- **Interface**: todo componente segue o Design System v2 e passa no `design-system-guard`.

---

## Phase 1: Setup

**Purpose**: Criar o pacote e ligá-lo aos consumidores.

- [X] T001 Criar `@helux/exercises` nos moldes de `packages/workouts`: `packages/exercises/package.json` (dependência só de `@helux/types`), `packages/exercises/tsconfig.json`, `packages/exercises/vitest.config.ts` e `packages/exercises/src/index.ts` vazio
- [X] T002 Declarar a dependência `workspace:*` em `packages/ai/package.json`, `apps/web/package.json` e `apps/api/package.json`, acrescentar `@helux/exercises` a `transpilePackages` em `apps/web/next.config.mjs` e rodar `pnpm install` para atualizar `pnpm-lock.yaml`. Também copiar o pacote no `apps/api/Dockerfile`, que lista cada pacote do workspace
- [X] T003 [P] Criar `specs/028-banco-exercicios-demonstracao/bank-review.md` com a tabela `id | campo | antes | depois | justificativa` (FR-016)

---

## Phase 2: Etapa 1 - Fundação (bloqueia todas as histórias)

**Purpose**: Mover o banco para o pacote novo e ligar a trava, sem nenhuma mudança visível.

**Checkpoint**: Suíte atual verde e nenhuma diferença em `EXERCISE_BANK` para os consumidores.

- [X] T004 Gerar, a partir do banco atual, `packages/exercises/src/__tests__/fixtures/strength-snapshot.json` (os 122 itens com `id`, `name`, `muscleGroup`, `equipment`, `pattern` e `stress`) e escrever em `packages/exercises/src/__tests__/strength.test.ts` o teste que congela os nomes e compara esses campos (R3, R4). Confirmar que falha
- [X] T005 Criar `packages/exercises/src/types.ts` com `CatalogKind`, `CatalogItem`, `Gear`, `MuscleKey`, `Guidance`, `StrengthExercise`, `PreparationItem`, `CardioContent` e `ResolvedItem`, conforme `data-model.md` e `contracts/catalog.md`
- [X] T006 Mover `RAW_ENTRIES`, `deriveMuscles` e `STRESS_OVERRIDES` de `packages/ai/src/exercise-bank.ts` para `packages/exercises/src/strength.ts`, exportando `STRENGTH_EXERCISES`, com `cues` e `muscles` iguais aos atuais enquanto o item estiver pendente
- [X] T007 Trocar `packages/ai/src/exercise-bank.ts` por reexportações de `EXERCISE_BANK`, `MUSCLE_GROUP_LABEL`, `STRESS_OVERRIDES`, `findBankExercise` e dos tipos, e confirmar que `packages/ai/src/__tests__/exercise-bank.test.ts` continua verde sem alteração
- [X] T008 Escrever o teste de `gear` em `packages/exercises/src/__tests__/strength.test.ts` (todo item tem `gear`; `leg-press-45` e `peck-deck-maquina` são `maquina`; `crossover-cabo` e `rosca-cabo` são `cabo`; `kettlebell-swing` é `kettlebell`; `triceps-corda-cabo` é `corda`) e preencher `gear` nos 122 itens em `packages/exercises/src/strength.ts`, sem alterar `equipment` (FR-014)
- [X] T009 Escrever `packages/exercises/src/__tests__/review.test.ts`, criar `packages/exercises/src/review/pending.json` com os ids dos 122 exercícios e das 11 modalidades, `packages/exercises/src/review/approvals.json` vazio e `isDemoReady(id)` em `packages/exercises/src/resolve.ts` (FR-032)
- [X] T010 Escrever em `packages/exercises/src/__tests__/review.test.ts` os testes de hash (determinístico, independente da ordem das chaves, muda com alteração na base ou na orientação) e implementar `packages/exercises/src/review/hash.ts`, usado só por testes e scripts, fora de `packages/exercises/src/index.ts`, para `node:crypto` não entrar no bundle da web (FR-025, R12)
- [X] T011 Escrever `packages/exercises/src/__tests__/catalog.test.ts` com os invariantes 1 a 5 de `contracts/catalog.md`, a mensagem `"<id>: falta <item>"`, a legenda obrigatória quando dois itens têm a mesma demonstração resolvida (FR-003) e o log `aprovados/total` por catálogo, que substitui a medição por categoria (FR-022, FR-023). Para validar a mensagem, retirar temporariamente um id da lista de pendências, confirmar a falha e restaurar
- [X] T012 [P] Escrever o teste de compatibilidade e acrescentar `catalogId?` e `approachOf?` a `PlannedExercise` em `packages/types/src/workout.ts` (planos antigos continuam válidos)
- [X] T013 Rodar `pnpm typecheck && pnpm test` e registrar o resultado. Etapa concluída somente com tudo verde

---

## Phase 3: Etapa 2a - Motor de animação (bloqueia a produção de conteúdo)

**Purpose**: Tornar o movimento mais completo mantendo a mesma figura (FR-002, FR-002a, R5, R6).

**Checkpoint**: Testes de física verdes; os itens existentes continuam com a renderização atual.

- [X] T014 Escrever `packages/exercises/src/__tests__/engine.test.ts` com poses sintéticas: `at` crescente, ao menos 2 keyframes, variação do comprimento dos ossos abaixo de 3%, pontos de `fixed` deslocando no máximo 1 unidade e os modos `reps`, `hold`, `alternate` e `cycle`. Confirmar que falha
- [X] T015 Criar `packages/exercises/src/engine/types.ts` com `Point`, `Pose`, `MovementBase`, `DemoSpec`, `Scene` e `ResolvedDemo`
- [X] T016 Implementar a interpolação por ângulo a partir de `root` em `packages/exercises/src/engine/kinematics.ts` e `poseAt` em `packages/exercises/src/engine/pose-at.ts`, até `engine.test.ts` passar
- [X] T017 Escrever os testes e criar `packages/exercises/src/demos/index.ts`, com o registro de bases e demonstrações, e `loadDemo(id)` com importação dinâmica, exportando em `packages/exercises/src/index.ts` (R7). Incluir nos invariantes de `catalog.test.ts` a validação física de toda base registrada
- [X] T018 Ampliar `apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx`: `phase` fixa o quadro, `playing`, `nonce`, pose central em movimento reduzido, `hold` sem repetição, `alternate` com um lado por vez, `cycle` contínuo, `caption` como texto, `aria-label` e acento só no implemento. Manter os testes atuais. Confirmar que falha
- [X] T019 Implementar em `apps/web/src/components/workout/ExerciseDemo.tsx` o caminho com `demo: ResolvedDemo` de `contracts/ui.md`, mantendo o viewBox 220 × 250, os tokens e o caminho antigo intacto (FR-007, FR-008)
- [X] T020 Acrescentar as cenas (banco reto e inclinado, máquina, barra, parede, degrau, solo) e os implementos (kettlebell, cabo, máquina, Smith, corda, elástico, roda) em `apps/web/src/components/workout/ExerciseDemo.tsx`, com testes de que `gear` sem carga não desenha implemento. Se o arquivo ficar grande demais, separar em `apps/web/src/components/workout/demo-parts.tsx`
- [X] T021 Medir o tamanho do chunk das demonstrações com `pnpm --filter @helux/web build` e registrar o resultado na seção de riscos de `specs/028-banco-exercicios-demonstracao/plan.md`

---

## Phase 4: Etapa 2b - Trava e revisão por PR (US5)

**Goal**: Item novo não passa sem demonstração, orientação e aprovação, e o dono revisa no próprio PR.

**Independent Test**: Adicionar um item de teste sem demonstração e ver a verificação falhar apontando o que falta; completar e ver passar; abrir um PR de teste e receber o comentário com a evidência.

- [X] T022 [US5] Adicionar `playwright@1.64.1`, `gifenc@1.0.3`, `pngjs@7.0.0` e `tsx` a `devDependencies` em `apps/web/package.json`, e os scripts `demos:evidence`, `demos:approve` e `demos:check-pending` em `package.json` e `apps/web/package.json`
- [X] T023 [P] [US5] Escrever `apps/web/src/__tests__/app/dev-demos.test.tsx`: `notFound()` em produção, listagem de todos os catálogos com situação e orientações, filtros por catálogo e pendentes, e parâmetros `ids`, `phase` e `frame=1` (FR-024)
- [X] T024 [US5] Implementar `apps/web/src/app/dev/demos/page.tsx`, sem link em nenhum menu, e acrescentar a rota a `apps/web/src/__tests__/mocks/production-guard.test.ts`
- [X] T025 [P] [US5] Escrever `apps/web/src/__tests__/scripts/check-pending.test.ts`: id adicionado falha, id removido passa, lista igual passa, base sem o arquivo passa
- [X] T026 [US5] Implementar `apps/web/scripts/demos-check-pending.ts` conforme `contracts/review-flow.md`, com a comparação em função exportada e testável
- [X] T027 [P] [US5] Escrever `apps/web/src/__tests__/scripts/approve.test.ts`: grava o hash e tira o id de `pending.json`, falha para id inexistente ou sem demonstração, `--all-in-pr` só cobre itens alterados, itens não citados continuam pendentes
- [X] T028 [US5] Implementar `apps/web/scripts/demos-approve.ts`
- [X] T029 [P] [US5] Escrever `apps/web/src/__tests__/scripts/evidence.test.ts`: seleção dos itens alterados (hash difere e tem `demo`; pendente sem `demo` é ignorado), corpo do comentário com o marcador `<!-- demo-evidence -->`, links `blob/<sha>/...?raw=true`, aviso acima de 15 itens e mensagem quando não há alterações
- [X] T030 [US5] Implementar `apps/web/scripts/demo-evidence.ts` conforme `contracts/review-flow.md`: `start.png`, `mid.png`, `end.png`, `card.png` e `demo.gif` em 390 × 844, com `deviceScaleFactor` 2, `phase` fixa, 12 quadros por segundo e no máximo 2 MB, e falha em erro de captura
- [X] T031 [US5] Em `.github/workflows/ci.yml`, usar `fetch-depth: 0` no job `checks` e acrescentar o passo `pnpm demos:check-pending --base origin/${{ github.base_ref }}` só em `pull_request`
- [X] T032 [US5] Criar `.github/workflows/demo-evidence.yml` conforme `contracts/review-flow.md`: gatilhos e caminhos, sem PR de fork, permissões só neste workflow, branch órfã `demo-evidence/pr-<n>`, comentário único e remoção da branch em `closed`, com job próprio de limpeza
- [X] T033 [P] [US5] Escrever `packages/exercises/README.md` com o caminho único para adicionar item e a regra sobre `pending.json` (FR-021)
- [X] T034 [US5] Validar localmente a história: item de teste sem demonstração falha com `"<id>: falta demo"`; com demonstração e sem aprovação falha; depois de aprovado passa; alterado volta a falhar; adicionado a `pending.json` falha em `demos:check-pending`. Reverter o item de teste e confirmar que não sobrou nada no diff

**Checkpoint**: Trava ativa. A geração do comentário só é comprovada no PR do piloto (T041).

---

## Phase 5: Etapa 3 - Piloto (US1)

**Goal**: Validar o método nos 5 exercícios mais difíceis, antes de produzir o volume.

**Independent Test**: O dono identifica cada exercício pela evidência no PR e aprova o método.

- [X] T035 [US1] Em `packages/exercises/src/strength.ts`, escrever `guidance`, `muscles` explícitos e revisar `gear` de `pullover-halteres`, `russian-twist-halteres`, `cadeira-adutora`, `flexao-pike-corporal` e `mesa-flexora`, sem tirá-los de `pending.json`. Registrar as correções em `specs/028-banco-exercicios-demonstracao/bank-review.md`
- [X] T036 [P] [US1] Criar a base e a demonstração de `pullover-halteres` em `packages/exercises/src/demos/puxar-vertical.ts`, com teste de que difere da base de puxada
- [X] T037 [P] [US1] Criar a base e a demonstração de `russian-twist-halteres` em `packages/exercises/src/demos/core.ts`, com a pessoa sentada no solo, sem cabo
- [X] T038 [P] [US1] Criar as bases e demonstrações de `cadeira-adutora` e `mesa-flexora` em `packages/exercises/src/demos/isolamento-pernas.ts`, com teste de que a adução é o movimento oposto da abdução e de que a mesa é deitada
- [X] T039 [P] [US1] Criar a base e a demonstração de `flexao-pike-corporal` em `packages/exercises/src/demos/empurrar-vertical.ts`, com apoio de mãos e pés fixos
- [X] T040 [US1] Conferir os 5 itens em `/dev/demos` e rodar `pnpm demos:evidence --ids pullover-halteres,russian-twist-halteres,cadeira-adutora,flexao-pike-corporal,mesa-flexora --out <dir-no-scratchpad>`, revisando os quadros e o GIF antes de enviar ao dono
- [X] T041 [US1] ⛔ Portão do dono: pedir autorização para abrir o PR do piloto, confirmar que `.github/workflows/demo-evidence.yml` publicou o comentário e aguardar a aprovação por item. **Nada da Phase 7 em diante começa antes da aprovação.** Ajustes pedidos voltam para T036–T039 ou para o motor (T016, T019, T020)
- [X] T042 [US1] Rodar `pnpm demos:approve` só com os ids aprovados, o que atualiza `packages/exercises/src/review/approvals.json` e `packages/exercises/src/review/pending.json`
- [X] T043 [US1] Atualizar em `specs/028-banco-exercicios-demonstracao/plan.md` a estimativa de movimentos base e a divisão dos lotes da Phase 7 com o aprendido no piloto

---

## Phase 6: Etapa 4 - Telas (US1, US2, US3, US4)

**Goal**: A tela passa a ler do catálogo. O item aprovado mostra o conteúdo novo, e o pendente continua como hoje.

**Independent Test**: Em modo mock, abrir um item do piloto e um pendente, além de executar os passos 1 a 4, 7 e 8 do roteiro em `quickstart.md`.

### Resolução e tela de treino (US1)

- [X] T044 [US1] Escrever `packages/exercises/src/__tests__/resolve.test.ts` com a ordem de `data-model.md` (`approachOf`, variante ativa, `catalogId`, `cardio.modality`, nome exato, nome normalizado ou `knownNames`, sem correspondência), `demoState` `nova`, `legada` e `indisponivel`, e item pendente preservando o conteúdo atual. Confirmar que falha
- [X] T045 [US1] Implementar `resolvePlannedItem` em `packages/exercises/src/resolve.ts` e exportar em `packages/exercises/src/index.ts` (FR-004, FR-005, R7)
- [X] T046 [US1] Ampliar `apps/web/src/__tests__/lib/exerciseDisplay.test.ts` e fazer `apps/web/src/lib/exerciseDisplay.ts` ler de `resolvePlannedItem`, mantendo `notes` do plano (FR-020)
- [X] T047 [P] [US1] Escrever `apps/web/src/__tests__/components/workout/DemoUnavailable.test.tsx` e implementar `apps/web/src/components/workout/DemoUnavailable.tsx`, com o texto "Demonstração indisponível para este item", o nome e `notes` (FR-006)
- [X] T048 [US1] Ampliar `apps/web/src/__tests__/app/workout-page.test.tsx` (todo item com "Ver execução", inclusive aquecimento, volta à calma, mobilidade, cardio e sem variantes; subtítulo sem variantes quando N = 0; ícone neutro na miniatura sem demonstração; linhas de séries, carga e esforço inalteradas) e implementar em `apps/web/src/app/workout/page.tsx`
- [X] T049 [US1] Ampliar `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx` e implementar em `apps/web/src/components/workout/ExerciseSheet.tsx`: demonstração por `demoState`, `DemoUnavailable`, sem aba "Variantes" quando não há variantes, e cardio com passos, zona prescrita e sem mapa obrigatório

### Orientações (US4)

- [X] T050 [US4] Escrever em `packages/exercises/src/__tests__/catalog.test.ts` os invariantes de orientação para itens fora de pendentes: `setup` e `steps` com ao menos 1 item, `commonError` em força, frases com até 110 caracteres e passos sem "Boa opção", "Bom para", "Excelente", "Ótimo" e "Alternativa" (FR-018, FR-019, SC-004)
- [X] T051 [US4] Exibir em `apps/web/src/components/workout/ExerciseSheet.tsx`, com testes em `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`, `setup` + `steps`, `commonError` em âmbar, `context` separado e `notes` como complemento

### Mapa muscular (US3)

- [X] T052 [P] [US3] Ampliar `apps/web/src/__tests__/components/workout/MuscleMap.test.tsx` e implementar em `apps/web/src/components/workout/MuscleMap.tsx`: vista de costas para `dorsal`, `trapezio`, `lombar`, `gluteo`, `posterior`, `panturrilha` e `triceps`; rótulos das novas chaves; chave desconhecida como texto bruto; `mesa-flexora` destacando posterior de coxa (FR-015)

### Conhecer a variante antes de trocar (US2)

- [X] T053 [US2] Ampliar `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`: botão "Ver" com `aria-label`, abertura na mesma folha, "Voltar às variantes" e fechar a folha sem chamar `onApply`, "Trocar" chamando `onApply`, sem "Trocar" no modo só leitura e "Equivalente" com o mesmo conteúdo. Confirmar que falha (FR-010)
- [X] T054 [US2] Implementar a pré-visualização em `apps/web/src/components/workout/ExerciseSheet.tsx`
- [X] T055 [US2] Escrever os testes e implementar em `apps/web/src/components/workout/ExerciseSheet.tsx` a variante ativa com título, demonstração, passos, músculos, cadência e etiquetas da própria variante (FR-011), e a variante ativa fora da lista com a etiqueta "Atual" (FR-035)
- [X] T056 [US2] Conferir o fluxo em `apps/web/src/__tests__/app/workout-page.test.tsx` e `apps/web/src/__tests__/app/treinos-preview.test.tsx` (a pré-visualização não altera o treino; o preview da 026 continua só leitura)
- [X] T057 Rodar `pnpm typecheck && pnpm test`, incluindo `apps/web/src/__tests__/design-system-guard.test.ts`, e os passos 1 a 4, 7 e 8 do roteiro em `quickstart.md`

**Checkpoint**: Telas prontas; cada aprovação seguinte aparece sozinha.

---

## Phase 7: Etapa 5 - Exercícios de força em lotes (US1, US3, US4)

**Goal**: Cobrir os 117 exercícios restantes em lotes de até 15 itens, um PR por lote.

**Independent Test**: A cada lote, `aprovados/total` sobe, e os itens aprovados aparecem com demonstração, orientações, músculos e equipamento corretos.

**Depende de**: T041 aprovado.

**Procedimento de cada lote** (FR-033, FR-034):

1. Reaproveitar ou criar movimentos base em `packages/exercises/src/demos/<família>.ts` e registrar um `DemoSpec` por item, com legenda quando a diferença não for visível.
2. Em `packages/exercises/src/strength.ts`, escrever `guidance`, `muscles` explícitos e revisar `gear`, mantendo o item em `pending.json`. Mover "boa opção…" para `context`.
3. Registrar em `bank-review.md` toda correção de classificação, com justificativa. Mudança de `pattern`, `muscleGroup` ou `stress` também exige teste de regressão (FR-016, FR-017).
4. Rodar os testes do pacote, conferir na galeria e gerar a evidência.
5. ⛔ Portão do dono: PR autorizado, evidência no comentário, aprovação por item.
6. Rodar `demos:approve` só com os ids aprovados. O restante continua pendente e volta em um próximo PR.

Alterar uma base já aprovada exige nova aprovação dos itens que a usam, no mesmo PR.

- [X] T058 [US1] Lote 1, Agachar (15), em `packages/exercises/src/demos/agachar.ts`: `agachamento-livre-barra`, `agachamento-frontal-barra`, `agachamento-bulgaro-halteres`, `afundo-halteres`, `agachamento-goblet-halteres`, `leg-press-45`, `agachamento-sumo-halteres`, `agachamento-livre-corporal`, `afundo-reverso-corporal`, `agachamento-overhead-barra`, `step-up-halteres`, `agachamento-hack-maquina`, `pistol-squat-assistido`, `agachamento-smith-maquina`, `agachamento-box-barra`
- [X] T059 [US1] Lote 2, Dobrar o quadril (15), em `packages/exercises/src/demos/dobrar-quadril.ts`: `elevacao-pelvica-barra`, `elevacao-pelvica-corporal`, `elevacao-pelvica-unilateral`, `kettlebell-swing`, `pull-through-cabo`, `elevacao-pelvica-maquina`, `levantamento-terra-barra`, `levantamento-terra-romeno-barra`, `levantamento-terra-romeno-halteres`, `levantamento-terra-sumo-barra`, `stiff-barra`, `stiff-halteres`, `good-morning-barra`, `hiperextensao-lombar-banco`, `terra-halteres-unilateral`
- [X] T060 [US1] Lote 3, Empurrar na horizontal (11), em `packages/exercises/src/demos/empurrar-horizontal.ts`: `supino-reto-barra`, `supino-reto-halteres`, `supino-inclinado-barra`, `supino-inclinado-halteres`, `supino-declinado-barra`, `flexao-braco-corporal`, `flexao-declinada-corporal`, `supino-maquina`, `flexao-maos-elevadas-corporal`, `supino-pegada-neutra-halteres`, `flexao-diamante-corporal`
- [X] T061 [US1] Lote 4, Empurrar na vertical (8), em `packages/exercises/src/demos/empurrar-vertical.ts`: `desenvolvimento-militar-barra`, `desenvolvimento-halteres`, `desenvolvimento-arnold`, `desenvolvimento-maquina`, `handstand-pushup-assistido`, `desenvolvimento-landmine-barra`, `desenvolvimento-unilateral-halteres`, `desenvolvimento-smith-maquina`
- [X] T062 [US1] Lote 5, Puxar na vertical (9), em `packages/exercises/src/demos/puxar-vertical.ts`: `barra-fixa-corporal`, `barra-fixa-supinada-corporal`, `puxada-alta-cabo`, `puxada-alta-fechada-cabo`, `puxada-alta-neutra-cabo`, `pulldown-assistido-maquina`, `pullover-barra`, `barra-fixa-neutra-corporal`, `puxada-unilateral-cabo`
- [X] T063 [US1] Lote 6, Puxar na horizontal (11), em `packages/exercises/src/demos/puxar-horizontal.ts`: `remada-curvada-barra`, `remada-curvada-halteres`, `remada-unilateral-halteres`, `remada-cavalinho-barra`, `remada-baixa-cabo`, `remada-maquina`, `remada-invertida-corporal`, `remada-t-barra`, `remada-pendlay-barra`, `face-pull-cabo`, `remada-alta-barra`
- [X] T064 [US1] Lote 7, Core (15) (dividido em 7a e 7b com um PR cada, ver `plan.md`, T043), em `packages/exercises/src/demos/core.ts`: `prancha-abdominal-corporal`, `prancha-lateral-corporal`, `abdominal-supra-corporal`, `abdominal-infra-corporal`, `elevacao-pernas-barra`, `roda-abdominal`, `prancha-rotacao`, `abdominal-polia-cabo`, `rotacao-tronco-cabo`, `dead-bug-corporal`, `pallof-press-cabo`, `prancha-toque-ombro-corporal`, `hollow-hold-corporal`, `abdominal-bicicleta-corporal`, `rollout-barra`
- [X] T065 [US1] Lote 8, Bíceps e tríceps (14), em `packages/exercises/src/demos/isolamento-bracos.ts`: `rosca-direta-barra`, `rosca-direta-halteres`, `rosca-alternada-halteres`, `rosca-martelo-halteres`, `rosca-scott-barra`, `rosca-cabo`, `rosca-21-barra`, `rosca-concentrada-halteres`, `triceps-testa-barra`, `triceps-testa-halteres`, `triceps-corda-cabo`, `triceps-frances-halteres`, `mergulho-banco-corporal`, `paralelas-corporal`
- [X] T066 [US1] Lote 9, Ombro, trapézio e peito (11), em `packages/exercises/src/demos/isolamento-tronco.ts`: `elevacao-lateral-halteres`, `elevacao-frontal-halteres`, `elevacao-posterior-halteres`, `elevacao-lateral-cabo`, `crucifixo-invertido-maquina`, `encolhimento-ombros-halteres`, `encolhimento-barra`, `crucifixo-halteres`, `crucifixo-inclinado-halteres`, `crossover-cabo`, `peck-deck-maquina`
- [X] T067 [US1] Lote 10, Isolamento de pernas (8), em `packages/exercises/src/demos/isolamento-pernas.ts`: `cadeira-abdutora`, `cadeira-extensora`, `cadeira-flexora`, `elevacao-panturrilha-pe-maquina`, `elevacao-panturrilha-sentado-maquina`, `elevacao-panturrilha-corporal`, `elevacao-panturrilha-halteres`, `panturrilha-leg-press`
- [X] T068 [US4] Acrescentar ao teste de `packages/exercises/src/__tests__/strength.test.ts` a exigência de `guidance` nos 122 itens e confirmar SC-004 pelo log de cobertura
- [X] T069 [US3] Confirmar em `packages/exercises/src/__tests__/strength.test.ts` que os 122 itens têm `muscles` só com `MuscleKey` válidas, e que `packages/workouts/src/__tests__/` e `packages/ai/src/__tests__/agents/method-validation.test.ts` continuam verdes (FR-015, FR-017)

**Checkpoint**: Força completa (SC-001, SC-004), com ids aprovados em `approvals.json`.

---

## Phase 8: Etapa 6 - Variantes coerentes (US3)

**Goal**: Variantes do mesmo padrão e da mesma função muscular, inclusive em planos existentes.

**Independent Test**: Em Rosca Direta, a aba só traz bíceps. O invariante de coerência passa em todo o banco, e o script simula sem gravar.

**Depende de**: Phase 7, porque a regra usa `muscles` revisados.

- [X] T070 [US3] Escrever `packages/exercises/src/__tests__/variants-rule.test.ts`: mesmo `pattern` e músculo principal em comum; afinidade `gluteo` ↔ `posterior` só em `dobrar-quadril`; `rosca-direta-barra` recusa `cadeira-extensora`, `crucifixo-halteres` e `mergulho-banco-corporal`; invariante 7 de `contracts/catalog.md` em todo o banco (SC-003). Confirmar que falha
- [X] T071 [US3] Implementar `isCoherentVariant` em `packages/exercises/src/variants-rule.ts` e exportar em `packages/exercises/src/index.ts` (FR-012, R9)
- [X] T072 [US3] Ampliar `packages/ai/src/__tests__/variants.test.ts` (lista menor em vez de preencher com item incoerente; equivalentes da 013 mantidos com a etiqueta) e aplicar a regra em `packages/ai/src/variants.ts`, sem mudar a pontuação (FR-013)
- [X] T073 [US3] Escrever `apps/api/src/__tests__/plan-variants-refresh.test.ts`: recalcula só sessões não concluídas de planos ativos; variante ativa preservada; sessões concluídas e histórico intactos; perfil neutro sem genética; resumo sem dado pessoal. Confirmar que falha
- [X] T074 [US3] Implementar a transformação pura em `apps/api/src/services/plan-variants-refresh.service.ts`
- [X] T075 [US3] Criar `apps/api/scripts/refresh-plan-variants.ts`: simula por padrão; `--apply` exige `--backup <dir>` e recusa diretório dentro do repositório; a saída traz só contagens e nomes de exercícios (R8)
- [X] T076 [US3] ⛔ Portão do dono: depois do merge e do deploy da regra nova, pedir autorização para rodar a simulação em produção e apresentar o resultado. Rodar `pnpm --filter @helux/api exec tsx scripts/refresh-plan-variants.ts --apply --backup <dir-fora-do-repo>` só com a confirmação explícita do dono, e depois conferir a abertura de um plano e do histórico (SC-008)

---

## Phase 9: Etapa 7 - Preparação, mobilidade e cardio (US6)

**Goal**: Tudo o que aparece no treino tem demonstração e orientação, e a IA só escolhe do catálogo.

**Independent Test**: Com a IA simulada, gerar um plano novo e abrir cada item de aquecimento, volta à calma, mobilidade e cardio.

**Importante**: Os itens de preparação são novos, então nascem completos e nunca entram em `pending.json`. O CI do PR fica vermelho até a aprovação do lote (`data-model.md`), mas a evidência continua sendo gerada. As modalidades de cardio já estão na lista e seguem o procedimento da Phase 7.

### Catálogo

- [X] T077 [US6] Com consulta somente leitura, reunir os nomes distintos de aquecimento, volta à calma e mobilidade dos planos salvos, somá-los aos das avaliações e salvar em `packages/exercises/src/__tests__/fixtures/legacy-item-names.json` só os nomes, revisando antes do commit que nenhum revele dado pessoal
- [X] T078 [US6] Escrever `packages/exercises/src/__tests__/preparation.test.ts`: dados obrigatórios de `PreparationItem`, ao menos uma região e `needs` válido, e criar `packages/exercises/src/preparation.ts` com `PREPARATION_ITEMS` vazio
- [ ] T079 [US6] Lote P1, Aquecimento geral e ativação de membros superiores (11), em `packages/exercises/src/preparation.ts` e `packages/exercises/src/demos/preparacao-ativacao.ts`: Bike leve, Remo leve, Marcha no lugar, Polichinelo leve, Balanço de perna, Círculos de braço, Deslizamento na parede, Rotação externa com elástico, Rotação e passagem de ombro com elástico, Puxada de elástico para o rosto, Suspensão ativa na barra. ⛔ Portão do dono
- [ ] T080 [US6] Lote P2, Ativação inferior e mobilidade de quadril e tornozelo (11), em `packages/exercises/src/preparation.ts` e `packages/exercises/src/demos/preparacao-quadril.ts`: Ponte de glúteo, Flexão inclinada leve, Afundo sem carga, Agachamento no banco sem carga, Dobradiça de quadril com bastão, Quadril 90/90, Abertura de quadril (sapo), Agachamento profundo com pausa, Agachamento cossaco, Tornozelo com joelho à parede, Dorsiflexão do hálux. ⛔ Portão do dono
- [ ] T081 [US6] Lote P3, Mobilidade de coluna e joelho e relaxamento (10), em `packages/exercises/src/preparation.ts` e `packages/exercises/src/demos/preparacao-coluna.ts`: Rotação torácica em quatro apoios, Rotação torácica deitado de lado, Mobilidade torácica no rolo, Gato-camelo, Báscula pélvica, Balanço para trás em quatro apoios, Deslizamento de calcanhar, Extensão de joelho com toalha, Extensão terminal de joelho com elástico, Respiração diafragmática. ⛔ Portão do dono
- [ ] T082 [US6] Lote P4, Alongamentos de tronco e membros superiores (9), em `packages/exercises/src/preparation.ts` e `packages/exercises/src/demos/alongamentos-superiores.ts`: Peitoral na parede, Dorsal no banco, Dorsal no apoio, Posterior de ombro, Bíceps na parede, Tríceps acima da cabeça, Antebraço, Postura da criança, Joelhos ao peito. ⛔ Portão do dono
- [ ] T083 [US6] Lote P5, Alongamentos de membros inferiores (7), em `packages/exercises/src/preparation.ts` e `packages/exercises/src/demos/alongamentos-inferiores.ts`: Flexor de quadril semiajoelhado, Quadríceps deitado de lado, Quadríceps em pé, Posterior de coxa com faixa, Posterior de coxa em pé, Glúteo em figura 4, Panturrilha na parede. ⛔ Portão do dono
- [ ] T084 [US6] Em `packages/exercises/src/__tests__/catalog.test.ts`, ativar o invariante 6 (cada região de `REGIONS` com ao menos 2 itens, ao menos 1 sem equipamento) e o invariante 8 (`legacy-item-names.json` resolve ou é caso ambíguo documentado), preenchendo `knownNames` em `packages/exercises/src/preparation.ts` só com nomes exatos curados. Acrescentar itens se faltar cobertura (FR-028, FR-031, R10)
- [ ] T085 [US6] Lote C1, Cardio (as 11 modalidades de `CARDIO_BANK`), em `packages/exercises/src/cardio-guidance.ts` e `packages/exercises/src/demos/cardio.ts`, com modo `cycle`, orientação de postura e `zones` para `leve`, `moderada` e `intervalado-leve`; o circuito mostra a sequência dos movimentos (FR-029). Seguir o procedimento da Phase 7. ⛔ Portão do dono

### Geração de planos

- [ ] T086 [US6] Ampliar `packages/ai/src/__tests__/agents/mesocycle-schema.test.ts`: `name` por enum filtrado por fase em `aquecimento`, `volta-calma` e `mobilidade`; novo item `aproximacao` com `exercise`, `sets`, `reps`, `weight` e `notes`, que vira `phase: 'aquecimento'` e `approachOf`; cardio e principal sem mudança. Confirmar que falha (FR-027, FR-030)
- [ ] T087 [US6] Implementar em `packages/ai/src/agents/mesocycle-schema.ts` a mudança do esquema, `AllowedChoices.preparation` e a região vinda do catálogo
- [ ] T088 [US6] Ampliar `packages/ai/src/__tests__/agents/constraints.test.ts` e implementar em `packages/ai/src/agents/constraints.ts` a regra `item-fora-do-catalogo` e `repairPreparationItem`, com troca determinística pelo item da mesma fase e região, sem deixar o plano incompleto
- [ ] T089 [US6] Ampliar `packages/ai/src/__tests__/mesocycle-planner.test.ts` e `packages/ai/src/__tests__/mesocycle-prompts.test.ts`, e implementar `catalogId` e `approachOf` em `packages/ai/src/mesocycle-planner.ts`, com as instruções de preparação e aproximação em `packages/ai/src/mesocycle-prompts.ts`, preservando a prescrição de mobilidade para condições de saúde (FR-028)
- [ ] T090 [US6] Ampliar `packages/ai/src/__tests__/agents/generation-robustness.test.ts` e `apps/api/src/__tests__/plan-generation.service.test.ts` com a IA simulada: todo item do plano novo resolve com demonstração, sem nenhum nome livre (SC-010)
- [ ] T091 [US6] Na tela, com testes em `apps/web/src/__tests__/components/workout/ExerciseSheet.test.tsx`, implementar em `apps/web/src/components/workout/ExerciseSheet.tsx` o aviso "Série leve de preparação", `hold` e `por-lado` com a indicação da dose, e atualizar `apps/web/src/mocks/fixtures` com itens de catálogo e de aproximação
- [ ] T092 [US6] Rodar os passos 5 e 6 do roteiro em `quickstart.md` e confirmar nome antigo ambíguo com o aviso de indisponibilidade
- [ ] T093 [US6] ⛔ Portão do dono: pedir autorização para rodar `pnpm --filter @helux/ai eval:treino`, que usa a API paga. Comparar o resultado com a referência em `packages/ai/src/agents/__evals__/results`. Sem autorização, registrar em `specs/028-banco-exercicios-demonstracao/bank-review.md` que a avaliação real ficou pendente

---

## Phase 10: Etapa 8 - Encerramento

**Purpose**: Remover o caminho antigo e comprovar os critérios de sucesso.

**Pré-condição**: `packages/exercises/src/review/pending.json` com `ids` vazio.

- [ ] T094 Tornar `guidance` e `demo` obrigatórios no tipo em `packages/exercises/src/types.ts`, remover o estado `legada` de `packages/exercises/src/resolve.ts` e ajustar `packages/exercises/src/__tests__/resolve.test.ts`
- [ ] T095 Remover de `apps/web/src/components/workout/ExerciseDemo.tsx` o caminho antigo, `HELUX_MOTIONS` e o supino como último recurso, ajustando `apps/web/src/__tests__/components/workout/ExerciseDemo.test.tsx`
- [ ] T096 Remover `packages/ai/src/motions.ts` e `packages/ai/src/__tests__/motions.test.ts`, e ajustar `packages/ai/src/variants.ts` e `packages/ai/src/index.ts`, mantendo `Variant.motion` e `Variant.implement` no tipo em `packages/types/src/workout.ts` para os planos salvos
- [ ] T097 Remover de `packages/types/src/motion.ts` o que não tiver mais consumidor, confirmando com busca em `packages` e `apps`
- [ ] T098 [P] Confirmar que `packages/exercises/README.md` e `specs/028-banco-exercicios-demonstracao/quickstart.md` não citam o processo de transição, exceto o histórico
- [ ] T099 Medir SC-007 em modo mock, com a resolução de celular: até 2 toques e início em até 1 s, registrando o resultado em `specs/028-banco-exercicios-demonstracao/bank-review.md`
- [ ] T100 ⛔ Portão do dono: montar em `/dev/demos` o sorteio de 20 demonstrações sem o nome e registrar o resultado em `specs/028-banco-exercicios-demonstracao/bank-review.md` (SC-006, meta de 90%)
- [ ] T101 Rodar `pnpm typecheck && pnpm test`, executar todo o roteiro de `specs/028-banco-exercicios-demonstracao/quickstart.md` e conferir a tabela de critérios SC-001 a SC-010, relatando o que não puder ser verificado

---

## Mapa por história

| História | Tarefas | Como validar sozinha |
|:---|:---|:---|
| **US1** Ver qualquer exercício (P1) | T035–T049, T058–T067 | Evidência dos PRs; item aprovado com demonstração e item desconhecido com aviso |
| **US6** Tudo o que está no treino (P2) | T077–T093 | Plano novo com a IA simulada: todo item abre com demonstração |
| **US2** Variante antes de trocar (P2) | T053–T056 | Ver e voltar sem alterar o treino; trocar e conferir os dados |
| **US3** Alternativas e dados (P3) | T052, T069–T076 | Invariante de coerência e aba de Rosca Direta só com bíceps |
| **US4** Instruções objetivas (P4) | T050, T051, T068 | Invariantes de orientação e revisão por família |
| **US5** Itens novos completos (P5) | T022–T034 | Item de teste bloqueado até completar e ser aprovado |

## Dependencies & Execution Order

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4 (US5) → Phase 5 (piloto) ⛔
                                                  ├─→ Phase 6 (telas)
                                                  └─→ Phase 7 (força) → Phase 8 (variantes) ⛔
                               Phase 6 + Phase 7 ──→ Phase 9 (preparação e cardio) ⛔
                                  Tudo aprovado ───→ Phase 10 (encerramento)
```

- **Phase 2 a 4** bloqueiam todo o conteúdo.
- **T041** bloqueia as Phases 7 e 9. A Phase 6 usa os itens do piloto como referência, então também começa depois dele.
- **Phase 6** pode ser publicada antes de qualquer lote, porque item pendente continua como hoje.
- **Phase 8** depende dos `muscles` revisados na Phase 7.
- **T087 a T090** dependem de T079–T084: o enum da IA só muda com o catálogo completo e a cobertura por região validada.
- **Phase 10** depende de `pending.json` vazio.

### Dentro de cada tarefa com código

Teste primeiro e falhando, depois tipos, lógica pura e tela. Cada lote termina com `pnpm --filter @helux/exercises test`.

## Parallel Opportunities

```text
Phase 4:  T023, T025, T027, T029, T033 (testes e documentação em arquivos diferentes)
Phase 5:  T036, T037, T038, T039 (um arquivo de demonstração por família)
Phase 6:  T047, T052 (componentes independentes)
```

Os lotes T058–T067 e T079–T085 alteram `strength.ts` ou `preparation.ts`, `approvals.json` e `pending.json`, e cada um tem seu PR. Por isso são sequenciais.

## Implementation Strategy

### MVP

Phases 1 a 6: motor, trava, piloto aprovado e telas novas. Nesse ponto já há valor visível, porque os 5 itens do piloto estão corrigidos, toda variante pode ser visualizada antes da troca e item sem demonstração mostra o aviso.

### Entrega incremental

Cada lote é um PR publicável. A ordem das famílias pode mudar conforme o que o dono mais usa.

### Portões do dono

| Tarefa | Decisão |
|:---|:---|
| T041 | Aprovar o método no piloto, antes do volume |
| T058–T067 | Aprovar cada lote de força |
| T076 | Autorizar a simulação e depois a gravação das variantes em produção |
| T079–T083, T085 | Aprovar cada lote de preparação e cardio |
| T093 | Autorizar as avaliações com a API paga |
| T100 | Fazer o teste de reconhecimento às cegas |
