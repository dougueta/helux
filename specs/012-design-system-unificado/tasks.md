---

description: "Tarefas da spec 012 — design system unificado no app web"
---

# Tasks: Design System Unificado no App Web

**Input**: Design documents from `specs/012-design-system-unificado/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R7, R5.1), data-model.md, contracts/ui-components.md, quickstart.md

**Tests**: TDD é obrigatório (constituição, Princípio II).
- Código novo nasce com teste RED antes: parser de dicas, `ExecutionTips`, `Card`, `Skeleton` e o teste de guarda.
- A migração das telas é refactor visual. A rede de segurança é o **teste de guarda** (T004), que fica RED listando os arquivos pendentes e vai tirando cada um da lista a cada migração, mais os testes de comportamento existentes, que continuam verdes, e a verificação manual (quickstart).

**Organization**: por user story (spec.md). Todos os caminhos são relativos a `apps/web/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US2 ou US3

---

## Phase 1: Setup

- [ ] T001 Capturar, com o app local rodando e **antes de qualquer mudança**, screenshots de referência da tela de treino ativo, da Home e da folha "Ver execução" (aba Execução) em 375 px e 1280 px, e salvar em `specs/012-design-system-unificado/baseline/` (usados no passo 1 do `quickstart.md` para provar que o reset novo não muda telas já no padrão)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tokens, componentes compartilhados e teste de guarda de que todas as migrações dependem.

- [X] T002 Em `src/app/globals.css`, acrescentar no `:root` os tokens `--success: #4ade80`, `--demo-bg-1: #14180f`, `--demo-bg-2: #0a0d09` e `--demo-bg-3: #070906` (research R5.1; o `#0c0f0c` de `workout/page.tsx` passa a usar `--demo-bg-2`, tom praticamente igual). Acrescentar também `@keyframes helux-pulse` (opacidade 1 → 0.5 → 1, 1.6 s) para o `Skeleton`. **Não** remover `@tailwind` ainda (é a T024)
- [X] T003 [P] Criar `src/components/ui/layout.ts` exportando `pageContainer: CSSProperties = { maxWidth: 512, margin: '0 auto', padding: '0 16px' }` (equivale ao `max-w-lg mx-auto px-4` usado em 11 telas, research R4)
- [X] T004 RED: criar `src/__tests__/design-system-guard.test.ts` conforme `contracts/ui-components.md` → "Teste de guarda". Ele percorre `src/**/*.{ts,tsx}` (fora de `__tests__`) e falha, com arquivo e linha, em três casos:
  - `className` em qualquer arquivo, exceto o `<html>` de `src/app/layout.tsx` com as variáveis de `next/font`;
  - `var(--x)` não declarado no `:root` de `src/app/globals.css`, aceitando o prefixo `--font-`, que o `next/font` injeta;
  - cor hex literal fora de `globals.css`.

  Rodar e confirmar que falha listando os 19 arquivos de `research.md` R1 e as 11 cores de R5.1. Os `var(--success)` já passam depois da T002
- [X] T005 [P] RED→GREEN: `src/__tests__/components/ui/Card.test.tsx` (renderiza filhos; aplica `--surface-1`, borda `--hairline`, raio `--r-card`, padding padrão 16; mescla `style` por último; respeita `as`) e depois `src/components/ui/Card.tsx` conforme o contrato
- [X] T006 [P] RED→GREEN: `src/__tests__/components/ui/Skeleton.test.tsx` (aplica largura, altura e raio; tem `aria-hidden="true"`; usa a animação `helux-pulse`) e depois `src/components/ui/Skeleton.tsx` conforme o contrato

**Checkpoint**: tokens, `Card`, `Skeleton` e `pageContainer` prontos. O teste de guarda está RED listando o trabalho restante.

---

## Phase 3: User Story 1 — Telas com aparência consistente (Priority: P1) 🎯 MVP

**Goal**: as 11 telas e seus estados de carregamento, erro e vazio no padrão único, com o B3 resolvido.

**Independent Test**: `quickstart.md` passos 2, 3, 4, 6 e 7. O teste de guarda deixa de listar os arquivos migrados.

Regras para **toda** tarefa de migração abaixo (data-model → "Mapeamento das classes antigas"):
- Trocar cada `className` por estilo inline com os tokens: `text-helux-muted` vira `var(--text-dim)`, `border-helux-border` vira `var(--hairline)`, `bg-helux-surface` vira `var(--surface-1)`, `text-white` vira `var(--text)`, e o contêiner `max-w-lg mx-auto px-4` vira `pageContainer`.
- Usar `Card`, `Skeleton`, `Chip`, `Label` e `MatchBadge` onde houver elemento equivalente.
- Não mudar texto, dados nem comportamento (FR-006).
- Ao terminar, rodar os testes do arquivo, se houver, e o teste de guarda, e confirmar que o arquivo saiu da lista de falhas.

- [X] T007 [P] [US1] Migrar `src/app/layout.tsx`. Tirar as classes do `<body>` (o `globals.css` já define fundo e cor) e do `<main>` (vira `style={{ paddingBottom: 80 }}`). Manter no `<html>` só as variáveis do `next/font`, que é a exceção do teste de guarda
- [X] T008 [P] [US1] Migrar `src/components/layout/NavBar.tsx` e `src/components/layout/Shell.tsx`. No NavBar, `fixed bottom-0 left-0 right-0 z-50` vira inline, mantendo o `zIndex: 50` porque o diálogo de cansaço (spec 011) depende dele. O `pb-safe` sem efeito vira `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` (research R6)
- [X] T009 [P] [US1] Migrar `src/app/loading.tsx` e `src/app/dna/loading.tsx` para `Skeleton` e `pageContainer`, com a mesma estrutura de blocos de hoje
- [X] T010 [P] [US1] Migrar `src/components/ErrorBoundary.tsx` (tela de erro) para `Card` e tokens
- [ ] T011 [P] [US1] Migrar `src/app/login/page.tsx`. Precisa funcionar sem usuário logado e só com o tema
- [ ] T012 [P] [US1] Migrar `src/app/history/page.tsx`, incluindo o estado vazio
- [ ] T013 [P] [US1] Migrar `src/app/history/[id]/page.tsx`, o arquivo com mais classes (24). O cabeçalho da variante executada (spec 010, "variante de … · N fit") passa a usar `MatchBadge` e `Chip`, se equivalentes
- [ ] T014 [P] [US1] Migrar `src/components/dna/TraitCard.tsx` (bug B3 original), `src/app/dna/DnaClient.tsx` e `src/app/dna/page.tsx`
- [ ] T015 [P] [US1] Migrar `src/app/HomeClient.tsx` (10 classes), sem alterar o card de treino de hoje nem o `TirednessSelector` além das classes
- [ ] T016 [P] [US1] Migrar `src/components/workout/TirednessSelector.tsx`. Trocar também o `#e5484d` por `var(--danger)` nele e em `src/components/workout/TirednessDialog.tsx` (R5.1)
- [ ] T017 [P] [US1] Migrar `src/app/recovery/page.tsx` (Progresso), `src/app/treinos/TreinosClient.tsx` e `src/app/perfil/page.tsx`
- [ ] T018 [P] [US1] Migrar `src/app/checkin/page.tsx` e `src/app/checkin/history/page.tsx`. Trocar `#f87171` por `var(--danger)` e `#4ade80` por `var(--success)` em `src/components/checkin/CheckinForm.tsx`, `CheckinCard.tsx` e `CheckinHistoryTable.tsx` (R5.1)
- [ ] T019 [P] [US1] Trocar as cores hex da área de demonstração por `var(--demo-bg-1/2/3)` em `src/components/workout/ExerciseSheet.tsx` e em `src/app/workout/page.tsx` (`#0c0f0c` vira `var(--demo-bg-2)`), sem outra mudança visual

**Checkpoint**: teste de guarda **verde** (nenhum `className` fora da exceção, nenhuma var não declarada, nenhuma cor hex solta). Todos os testes existentes continuam verdes.

---

## Phase 4: User Story 2 — Dicas de execução legíveis (Priority: P1)

**Goal**: dicas com uma orientação por linha e marcadores genéticos como etiqueta (FR-009 opção A, FR-010, FR-011).

**Independent Test**: `quickstart.md` passo 5.

- [ ] T020 [P] [US2] RED: `src/__tests__/lib/tipItems.test.ts` com todos os casos de `contracts/ui-components.md` → `parseTipItems`:
  - o texto de referência de 3 frases vira 4 itens, com os marcadores WNT16 e "COL1A1 C,C";
  - "+2.5kg" não é dividido;
  - "(usado em 2026-08-29)" continua no texto;
  - uma frase só vira 1 item;
  - vazio, nulo ou espaços viram `[]`;
  - propriedade "nada se perde": toda palavra da entrada aparece em algum `text` ou `markers`.

  Confirmar que falha
- [ ] T021 [US2] GREEN: `src/lib/tipItems.ts` com `parseTipItems` e `TipItem`, conforme research R7 (divisão conservadora; regex de gene `\(([A-Z][A-Z0-9]{1,}[^)]*)\)`; nunca perde texto). Fazer T020 passar
- [ ] T022 [US2] RED→GREEN: `src/__tests__/components/workout/ExecutionTips.test.tsx` e `src/components/workout/ExecutionTips.tsx`, conforme o contrato:
  - texto vazio retorna `null`;
  - 1 item aparece sem marcador de lista;
  - 2 ou mais itens aparecem como `<ul>` com um `<li>` por orientação;
  - cada marcador aparece como `Chip` com `aria-label="marcador genético X"`;
  - há os visuais `inline` e `panel`.
- [ ] T023 [US2] Integrar `ExecutionTips`:
  - em `src/app/workout/page.tsx`, trocar o chip verde que renderiza `display.tip` por `<ExecutionTips text={display.tip} variant="inline" />`. Isso cobre também a justificativa da variante, FR-011;
  - em `src/components/workout/ExerciseSheet.tsx`, aba Execução, trocar o bloco `display.tip` por `<ExecutionTips text={display.tip} variant="panel" />`, mantendo a lista de `cues` e o mapa muscular como estão.

  Ajustar os testes existentes do `ExerciseSheet` que procuram o texto inteiro da dica, se algum passar a encontrá-lo dividido. O conteúdo não muda, só a quebra. Documentar no commit

**Checkpoint**: dicas legíveis nos dois lugares, inclusive para variante alternativa.

---

## Phase 5: User Story 3 — Um único jeito de estilizar (Priority: P2)

**Goal**: Tailwind removido do app, com reset próprio (FR-002, FR-008; research R2, R3).

**Independent Test**: `quickstart.md` passos 1 e 8. O teste de guarda continua verde.

- [ ] T024 [US3] Com o teste de guarda verde (pré-requisito):
  - em `src/app/globals.css`, trocar as três diretivas `@tailwind` pelo reset mínimo de research R3: `*, ::before, ::after { box-sizing: border-box; border: 0 solid }`; margens zeradas nos elementos listados; listas sem marcador; controles herdando fonte e cor; `button` com fundo transparente e `cursor: pointer`; `img` e `svg` com `display: block` e `max-width: 100%`;
  - apagar `tailwind.config.ts` e `postcss.config.js`;
  - remover `tailwindcss` e `autoprefixer` de `package.json`;
  - rodar `pnpm install` na raiz;
  - se o `next build` exigir PostCSS, recriar `postcss.config.js` com `module.exports = { plugins: {} }` e registrar isso no commit
- [ ] T025 [US3] Rodar `pnpm --filter @helux/web build` e confirmar que o build passa sem Tailwind

**Checkpoint**: nenhuma dependência nem configuração do Tailwind no app. O guarda impede a volta de classes e de cores soltas.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T026 [P] Rodar `pnpm --filter @helux/web test` e `pnpm typecheck` na raiz. Tudo verde, incluindo o teste de guarda e os testes existentes de comportamento
- [ ] T027 Executar a verificação manual de `quickstart.md` (passos 1–8) contra o app rodando localmente, comparando o passo 1 com os screenshots da T001

---

## Dependencies & Execution Order

- **Setup (T001)**: antes de qualquer mudança (os screenshots são a referência).
- **Foundational (T002–T006)**: bloqueia US1 e US2. T003, T005 e T006 são paralelas entre si. A T004 depende da T002 (vars novas).
- **US1 (T007–T019)**: todas [P], porque cada uma mexe em arquivos diferentes. Dependem só da Foundational.
- **US2 (T020–T023)**: independe da US1. T020 → T021 → T022 → T023. A T023 mexe em `workout/page.tsx` e `ExerciseSheet.tsx`, os mesmos arquivos da T019, então fazer depois da T019 ou na mesma sessão.
- **US3 (T024–T025)**: depende da US1 **completa**, com o teste de guarda verde. Remover o Tailwind antes quebraria telas não migradas.
- **Polish (T026–T027)**: depende de tudo.

## Parallel Example: User Story 1

```text
Task: "T011 Migrar src/app/login/page.tsx"
Task: "T012 Migrar src/app/history/page.tsx"
Task: "T014 Migrar TraitCard + DnaClient + dna/page"
Task: "T018 Migrar checkin/* + cores do check-in"
```

## Implementation Strategy

1. Setup e Foundational, com o guarda RED como mapa do trabalho.
2. **US1 (MVP)**: migrar tela por tela até o guarda ficar verde; o B3 some no caminho.
3. **US2**: dicas em itens, independente da US1.
4. **US3**: remover o Tailwind por último, com a regressão visual coberta pelos screenshots da T001.
5. Polish: suíte completa e verificação manual.

## Notes

- A US1 é a mais longa (13 tarefas), mas mecânica. Cada tarefa é um commit pequeno e verificável.
- Se durante uma migração aparecer um elemento sem equivalente claro no padrão, usar a aparência da tela de treino ativo como referência e registrar a decisão no commit. Não criar componente novo sem 2 usos (YAGNI, research R4).
