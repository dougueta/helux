# Implementation Plan: Design System Unificado no App Web

**Branch**: `012-design-system-unificado` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/012-design-system-unificado/spec.md`

## Summary

Levar as 11 telas do `apps/web` para um único padrão de estilo: **estilo inline + variáveis CSS** do `:root` de `globals.css`, que é o padrão já usado pela tela de treino, pela Home e pelo `ExerciseSheet`. Em seguida, **remover o Tailwind do app** (dependências, `tailwind.config.ts`, diretivas `@tailwind`) e trocar o reset CSS que ele injetava (preflight) por um reset mínimo próprio em `globals.css`.

Isso resolve o B3, que é maior do que o roadmap dizia:
- 22 usos de `text-helux-muted` e `border-helux-border`, cores que não existem na configuração;
- o `pb-safe` do `NavBar`, que também não existe, então a área segura inferior do iPhone nunca foi respeitada.

Também entram:
- dois componentes compartilhados novos, `Card` e `Skeleton`;
- um teste de guarda (FR-008) que falha se voltar a aparecer uma classe utilitária ou uma variável CSS que não exista no tema;
- o **ExecutionTips**, componente de dicas com uma orientação por linha e a referência genética como etiqueta (FR-009, opção A). Ele é alimentado por um parser puro com testes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18, Next.js 14 App Router — mesma stack das specs anteriores
**Primary Dependencies**: nenhuma nova; **remove** `tailwindcss` e `autoprefixer` de `apps/web` (o `postcss` fica só se o Next exigir — ver research R2)
**Storage**: N/A
**Testing**: Vitest + Testing Library em `apps/web` — TDD obrigatório (constituição)
**Target Platform**: web responsiva (celular 320–430 px e desktop)
**Project Type**: web application no monorepo — toca só `apps/web`
**Performance Goals**: CSS final menor (sem utilitários do Tailwind); sem impacto de runtime
**Constraints**: comportamento e conteúdo das telas não mudam (FR-006); identidade visual preservada (FR-005); sem rolagem horizontal em 320 px (FR-012)
**Scale/Scope**: 19 arquivos com `className` a migrar (inventário em research R1), 11 telas, ~2 componentes compartilhados novos + 1 componente de dicas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Só `apps/web`; nenhum workspace novo |
| II. Test-First (TDD) | ✅ PASS | Parser de dicas, `ExecutionTips`, `Card`, `Skeleton` e o teste de guarda (FR-008) nascem com teste RED antes da implementação. A migração de telas é refactor visual; a rede de segurança são os testes de comportamento existentes (todos continuam verdes) + o teste de guarda + verificação manual tela a tela (quickstart) |
| III. Independent Deployability | ✅ PASS | Nenhuma mudança de contrato com a API |
| IV. Shared Code via Packages | ✅ PASS | Componentes compartilhados em `apps/web/src/components/ui/` (só a web consome; subir para `packages/` seria prematuro) |
| V. Simplicity (YAGNI) | ✅ PASS | Remove uma dependência inteira em vez de adicionar; só cria componentes compartilhados que têm ≥2 usos concretos nas telas migradas (research R4) |

## Project Structure

### Documentation (this feature)

```text
specs/012-design-system-unificado/
├── plan.md              ← este arquivo
├── spec.md
├── research.md          ← Phase 0 (R1–R7)
├── data-model.md        ← Phase 1 (modelo de TipItem e tokens)
├── contracts/
│   └── ui-components.md ← contratos de parseTipItems, ExecutionTips, Card, Skeleton, teste de guarda
├── quickstart.md        ← verificação manual tela a tela
├── checklists/requirements.md
└── tasks.md             ← Phase 2 (/speckit-tasks)
```

### Source Code

```text
apps/web/
├── package.json                         ← MODIFICADO: remove tailwindcss, autoprefixer (R2)
├── tailwind.config.ts                   ← REMOVIDO
├── postcss.config.js                    ← REMOVIDO ou esvaziado (R2)
└── src/
    ├── app/
    │   ├── globals.css                  ← MODIFICADO: sai @tailwind; entra reset mínimo (R3),
    │   │                                   @keyframes do skeleton, token --safe-bottom (R6)
    │   ├── layout.tsx                   ← MIGRADO (body/main sem classes)
    │   ├── loading.tsx, dna/loading.tsx ← MIGRADOS para <Skeleton>
    │   ├── HomeClient.tsx, dna/*, history/*, history/[id]/*, login/*, recovery/*,
    │   │   treinos/*, perfil/*, checkin/*, checkin/history/*   ← MIGRADOS
    │   └── workout/page.tsx             ← chip de dica passa a usar <ExecutionTips>
    ├── lib/
    │   └── tipItems.ts                  ← NOVO: parseTipItems(text) → TipItem[] (puro)
    ├── components/
    │   ├── ui/Card.tsx                  ← NOVO
    │   ├── ui/Skeleton.tsx              ← NOVO
    │   ├── workout/ExecutionTips.tsx    ← NOVO (FR-009/010/011)
    │   ├── workout/ExerciseSheet.tsx    ← aba Execução usa <ExecutionTips> para notes/why
    │   ├── workout/TirednessSelector.tsx, dna/TraitCard.tsx, ErrorBoundary.tsx,
    │   │   layout/NavBar.tsx, layout/Shell.tsx                  ← MIGRADOS
    └── __tests__/
        ├── lib/tipItems.test.ts                     ← NOVO
        ├── components/workout/ExecutionTips.test.tsx← NOVO
        ├── components/ui/Card.test.tsx, Skeleton.test.tsx ← NOVOS
        └── design-system-guard.test.ts              ← NOVO (FR-008)
```

**Structure Decision**: tudo em `apps/web`. A migração é feita **por tela**, uma tarefa por tela/grupo pequeno, para que cada passo seja verificável isoladamente; a remoção do Tailwind vem **por último**, quando o teste de guarda já prova que nenhuma classe utilitária sobrou (senão a remoção quebraria telas silenciosamente).

## Complexity Tracking

*Sem violações da constituição a justificar.*
