# Implementation Plan: Helux Design System v2 no App Web

**Branch**: `012-design-system-unificado` | **Date**: 2026-09-23 (replanejado para o DS v2) | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/012-design-system-unificado/spec.md` + handoff `design_handoff_helux_v2/`

## Summary

Implementar o **Helux Design System v2** no `apps/web`. A aparência sai de uma folha de estilos do sistema, `src/app/helux-v2.css`, adaptada de `design_handoff_helux_v2/v2/helux-v2.css`, e de uma biblioteca de componentes React em `src/components/ui/` que espelha `v2/v2-core.jsx`: botões, etiquetas, fit em hélice, seletor, stepper, linhas de série, progresso, anel, dicas, passos, menu, folha, diálogo, toast, campo, aviso, barras e skeleton.

As telas desenhadas vêm primeiro, em ordem de prioridade: Treino ativo e folha, Home, Conclusão, Progresso (que absorve a lista de histórico) e DNA. Depois, as demais telas por analogia.

O branch já tem uma base reaproveitável da versão anterior da spec:
- Tailwind removido e reset próprio;
- tokens em variáveis CSS;
- teste de guarda;
- `parseTipItems`;
- correção do `viewport-fit`.

O teste de guarda muda de regra. Em vez de "nenhuma classe", passa a ser "**só classes definidas na folha do sistema**": é a lição do B3 aplicada à v2.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18, Next.js 14 App Router
**Primary Dependencies**: nenhuma nova. Fontes seguem via `next/font` (Space Grotesk 400–700, JetBrains Mono 400–600 + 500 itálico, research V1)
**Storage**: N/A (sem mudança de dados, API ou tipos compartilhados)
**Testing**: Vitest + Testing Library. TDD para componentes, helpers e guarda; testes de comportamento existentes continuam verdes; verificação visual manual contra o handoff
**Target Platform**: web responsiva: 320–430 px (mobile-first) e desktop com coluna de 512 px
**Project Type**: web application no monorepo, só `apps/web`
**Performance Goals**: animações baseadas em `transform`/`opacity` e `requestAnimationFrame` só na demonstração; nenhuma dependência nova
**Constraints**: comportamento das specs 009/010/011/016 preservado (FR-016, FR-025); AA em todo texto; 44 px de alvo mínimo; sem rolagem horizontal em 320 px; `prefers-reduced-motion`; sem dado inventado (FR-024)
**Scale/Scope**: cerca de 25 componentes de UI, 6 telas desenhadas e 8 telas ou estados por analogia

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Só `apps/web` |
| II. Test-First (TDD) | ✅ PASS | Cada componente de `ui/` nasce com teste RED de estados, papéis e ARIA (contrato em `contracts/ui-components.md`). Helpers (`formatNumber`, `fitBand`, `parseTipItems` v2) e o guarda v2 com RED. As telas são composição: rede = testes de comportamento existentes (ajustados só onde o texto ou papel ARIA mudou por exigência do desenho) + guarda + verificação manual |
| III. Independent Deployability | ✅ PASS | Nenhum contrato de API muda |
| IV. Shared Code via Packages | ✅ PASS | Componentes em `apps/web/src/components/ui/` (só a web consome) |
| V. Simplicity (YAGNI) | ✅ PASS | A folha do handoff é adotada quase direto, em vez de reescrever CSS. Nenhuma lib de UI nova. Componentes antigos substituídos são **removidos**, não mantidos em paralelo |

## Project Structure

### Documentation

```text
specs/012-design-system-unificado/
├── plan.md, spec.md, research.md (Parte 1: R1–R7 + achados; Parte 2: V1–V11)
├── data-model.md (v2: Fit, TipItem v2, linha de série, formatação)
├── contracts/ui-components.md (v2: API e estados de cada componente)
├── quickstart.md (v2: comparação com o handoff + fluxos)
├── baseline/ (screenshots da versão anterior; referência histórica)
└── tasks.md
design_handoff_helux_v2/ (referência de design, versionada)
```

### Source Code (`apps/web/src`)

```text
app/
├── helux-v2.css        ← NOVO: tokens + classes dos componentes (adaptado do handoff, V1)
├── globals.css         ← reset (existente) + importa helux-v2.css; remove tokens antigos (V2)
├── layout.tsx          ← fontes com pesos/itálico da v2 (V1); dock/menu (V8)
├── page.tsx + HomeClient.tsx                ← US3
├── workout/page.tsx                         ← US2 (decomposto em componentes, V5)
├── recovery/page.tsx (Progresso)            ← US5 (+ seção Histórico, V9)
├── history/page.tsx, history/[id]/page.tsx  ← US5 (linha de histórico v2)
├── dna/*                                    ← US6
└── treinos, checkin, checkin/history, perfil, login, loading.tsx ← US7
lib/
├── format.ts           ← NOVO: formatNumber pt-BR, formatDuration (V7)
├── fit.ts              ← NOVO: fitBand(value) → 'alto'|'médio'|'baixo' + token de cor (V6)
└── tipItems.ts         ← EVOLUI: gene/genótipo separados, gene sem parênteses, sem "ATENÇÃO" (V4)
components/ui/          ← v2 (contracts): Button, IconButton, Tag, GeneTag, Helix, Fit, Segmented,
                          Stepper, Check, SetRow, CurrentSet, WorkoutProgress, CycleProgress, Ring,
                          Tips, Steps, ScreenHeader, SectionHeader, Sheet, Dialog, Toast, Field,
                          Banner, Bars, Skeleton, HistoryRow, PRRow, HelixMark, icons (IC v2)
components/layout/NavBar.tsx ← v2 (V8)
components/workout/*    ← ExerciseSheet, ExerciseDemo (palco v2), MuscleMap (legenda v2),
                          TirednessSelector/Dialog (Segmented + Sheet/Dialog), WorkoutDoneScreen (V10)
REMOVIDOS ao fim: ui/Card, ui/Chip, ui/Label, ui/MatchBadge, ui/MiniStep, ui/layout.ts,
                  workout/ExecutionTips (vira ui/Tips) e os que ficarem sem uso (guarda + tsc confirmam)
__tests__/ ← testes novos por componente/helper; guarda v2
```

**Structure Decision**: fundação primeiro (folha, tokens, helpers, componentes com teste e guarda v2). Depois uma tela por história, na ordem de prioridade. Cada tela migrada remove o uso dos componentes antigos. A remoção final dos antigos fecha a US7.

## Complexity Tracking

*Sem violações da constituição a justificar.*
