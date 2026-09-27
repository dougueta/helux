# Tasks: Marcadores Genéticos na Tela DNA

**Input**: `specs/017-dna-traits/` (plan.md, spec.md, research.md, data-model.md, contracts/genetic-profile.md, quickstart.md)
**Tests**: obrigatórios (Constituição II — TDD). Cada teste é escrito e visto falhar antes da implementação.

## Phase 1: Setup

Nada a configurar: dependências instaladas, sem pacote novo.

## Phase 2: Foundational (bloqueia US1 e US2)

- [X] T001 Adicionar `GeneticTrait` e `GeneticProfileView` (data-model.md) em `packages/types/src/genetic.ts` e garantir o reexport em `packages/types/src/index.ts`

## Phase 3: User Story 1 — Ver meus marcadores genéticos reais (P1) — MVP

**Goal**: a API devolve `traits` e a tela DNA os mostra.
**Independent Test**: com o genera.json atual, `GET /genetic-profile` traz 21 traits (WNT16 primeiro) e a tela lista 21 cards com âmbar nos de risco e fita com 4 genes.

- [X] T002 [P] [US1] Teste vermelho de `parseGeneraTraits` em `packages/genetics/src/__tests__/traits.test.ts`: escopo só `fit` + `painel_saude_esportiva` (ignora `nutri`, `farma` etc.); campos key/gene/genotype/label/note; nível 0,9/0,2/0,5 pela regra FR-005; `warn` por seção/categoria (`lesao` inclusive); dedupe por SNP+traço mantendo COL1A1 ombro e ligamento; ordem risco primeiro, estável; genótipo vazio omitido; seções ausentes → []; e o arquivo real `apps/api/data/genetics/genera.json` gera 21 traits com WNT16 em primeiro
- [X] T003 [US1] Implementar `parseGeneraTraits` em `packages/genetics/src/traits.ts` e exportar em `packages/genetics/src/index.ts` (T002 verde)
- [X] T004 [P] [US1] Teste vermelho em `apps/api/src/__tests__/genetic-profile.test.ts`: o 200 inclui `traits` (array vindo de `parseGeneraTraits`, mockado) junto do resumo; 404 inalterado
- [X] T005 [US1] `apps/api/src/routes/genetic-profile.ts` devolve `{ ...parseGeneraJson(raw), traits: parseGeneraTraits(raw) }` tipado como `GeneticProfileView` (T004 verde)
- [X] T006 [P] [US1] Teste vermelho em `apps/web/src/__tests__/app/dna-client.test.tsx`: com `state = { status: 'ok', profile }` e traits, renderiza um `TraitCard` por trait (gene, genótipo, traço, nota), ponto âmbar só nos `warn`, "N de N lidos", resumo "N marcadores…"; `strandGenes` devolve no máximo 4 genes únicos na ordem
- [X] T007 [US1] Reescrever `apps/web/src/app/dna/DnaClient.tsx` para receber `state: DnaState`, usar `GeneticTrait` tipado (sem `splitGene`) e exportar `strandGenes`; fita recebe `strandGenes(traits)` (T006 verde)

**Checkpoint**: US1 entregue com dados reais (a página ainda passa o estado pelo loader da US2; até lá, T007 aceita o estado construído em `page.tsx`).

## Phase 4: User Story 2 — Estado vazio honesto (P2)

**Goal**: três mensagens distintas sem marcadores.
**Independent Test**: loader devolve `missing` para 404, `error` para 500/rede/JSON inválido; `DnaClient` mostra os três textos.

- [X] T008 [P] [US2] Teste vermelho em `apps/web/src/__tests__/app/dna-load-profile.test.ts` para `loadGeneticProfile()` (fetch mockado): 200 → `{status:'ok', profile}` (traits ausente vira `[]`); 404 → `missing`; 500 → `error`; fetch rejeitado → `error`; JSON inválido → `error`
- [X] T009 [US2] Implementar `apps/web/src/app/dna/load-profile.ts` (`loadGeneticProfile`, tipo `DnaState`; mesmo URL e `revalidate: 3600` de hoje) e usar em `apps/web/src/app/dna/page.tsx` (T008 verde)
- [X] T010 [US2] Estender `apps/web/src/__tests__/app/dna-client.test.tsx` com os três estados: `missing` → "Perfil genético não carregado"; `ok` sem traits → "Marcadores ainda não disponíveis"; `error` → "Não foi possível carregar seu DNA"; nenhum deles quando há traits. Ajustar `DnaClient.tsx` até verde

## Phase 5: User Story 3 — Código sem duplicidade (P3)

- [X] T011 [US3] Remover `apps/web/src/hooks/useGeneticProfile.ts` (confirmar com grep que não há import) e manter `apps/web/src/services/genetics.service.ts`

## Phase 6: Polish

- [X] T012 Registrar o achado 22 como resolvido pela 017 em `specs/012-design-system-unificado/research.md` (nota curta no item 22 e no item 28 sobre o hook)
- [ ] T013 Suítes completas + typecheck + build uma vez (`pnpm test`, `pnpm typecheck`, `pnpm build`), incluindo a guarda do DS v2 em `apps/web/src/__tests__/design-system-guard.test.ts`
- [ ] T014 Verificação manual do quickstart.md (depende de servidor; fica para o usuário se não houver RAM)

## Dependencies

- T001 → T002..T010. T002→T003→(T004→T005). T006→T007. T008→T009. T007+T009→T010. T011 independente. T013 no fim.
- US2 depende do `DnaClient` da US1 (mesmo arquivo). US3 independente.

## Parallel Examples

- Após T001: T002, T004, T006, T008 (arquivos de teste distintos) podem ser escritos em paralelo.
- T011 pode rodar a qualquer momento.

## Implementation Strategy

MVP = Phase 2 + US1 (API expõe e tela mostra). Depois US2 (estados), US3 (limpeza), Polish.
