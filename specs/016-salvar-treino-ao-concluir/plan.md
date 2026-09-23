# Implementation Plan: Salvar o Treino ao Concluir

**Branch**: `016-salvar-treino-ao-concluir` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/016-salvar-treino-ao-concluir/spec.md`

## Summary

Hoje `apps/web/src/app/workout/page.tsx` só chama `finishWorkout()` (POST `/api/workouts/sessions`) no botão "Voltar ao início" da tela de conclusão, que já afirma "O Helux registrou suas cargas". A mudança move a gravação para o momento da finalização (`handleNext` sem pulados e `handleConfirmFinish`), com uma pequena máquina de estados `saving → saved | error` extraída para um hook testável (`useFinishWorkout`) e uma tela de conclusão extraída para um componente testável (`WorkoutDoneScreen`) com três estados. "Voltar ao início" passa a só navegar. Nenhuma mudança em API, payload, tipos compartilhados ou banco.

Um detalhe que torna a mudança não trivial: `finishWorkout` limpa a sessão em caso de sucesso (`setSession(null)`), e a página tem um efeito que redireciona para `/` quando `!isActive` e retorna `null` quando `!session`. Com a gravação acontecendo antes de o usuário sair, isso tiraria o usuário da tela de conclusão sozinho. Por isso a página guarda um resumo (séries, minutos) no início da finalização, renderiza a tela de conclusão a partir dele e suprime o redirecionamento automático enquanto a finalização estiver em andamento.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18, Next.js 14 App Router
**Primary Dependencies**: nenhuma nova
**Storage**: `localStorage['helux:active-workout']` (inalterado; limpo só após sucesso, como hoje); Supabase via API existente (inalterada)
**Testing**: Vitest + Testing Library (`apps/web/src/__tests__/`), TDD obrigatório
**Target Platform**: Web responsiva (`apps/web`)
**Project Type**: Web app no monorepo; toca apenas `apps/web`
**Performance Goals**: N/A (uma requisição, igual à atual, só antecipada)
**Constraints**: payload e rota `POST /api/workouts/sessions` inalterados; fluxo da spec 009 (confirmação de pulados) e regra de variante executada da spec 010 (dentro de `finishWorkout`) intactos
**Scale/Scope**: 1 hook novo, 1 componente novo, `page.tsx` modificado; 3 arquivos de teste

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Monorepo-First | ✅ PASS | Só `apps/web` |
| II. Test-First (TDD) | ✅ PASS | Testes do hook, do componente e da página (integração) escritos antes e confirmados em RED |
| III. Independent Deployability | ✅ PASS | Nenhum contrato entre workspaces muda |
| IV. Shared Code via Packages | ✅ PASS | Nada compartilhável novo; nenhum tipo em `packages/types` muda |
| V. Simplicity (YAGNI) | ✅ PASS | Hook pequeno (status + guarda por ref) e extração do JSX da tela de conclusão que já existe; sem fila offline, sem retry automático, sem idempotência no servidor |

Re-check pós-design: sem mudanças — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/016-salvar-treino-ao-concluir/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui.md            ← contrato do hook useFinishWorkout e do WorkoutDoneScreen
├── checklists/
│   └── requirements.md
└── tasks.md             ← /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/src/
├── hooks/
│   ├── useFinishWorkout.ts                ← NOVO: status idle|saving|saved|error,
│   │                                          submit() com guarda contra duplicidade
│   │                                          (ref), reset()
│   └── useActiveWorkout.ts                ← INALTERADO (finishWorkout já limpa
│                                              localStorage só após o await)
├── components/workout/
│   └── WorkoutDoneScreen.tsx              ← NOVO: tela de conclusão com estados
│                                              salvando / salvo / erro (JSX movido
│                                              de page.tsx)
├── app/workout/
│   └── page.tsx                           ← MODIFICADO: finalizar chama submit();
│                                              resumo congelado; redirecionamento
│                                              suprimido durante a finalização;
│                                              "Voltar ao início" só navega
└── __tests__/
    ├── hooks/useFinishWorkout.test.ts     ← NOVO
    ├── components/workout/WorkoutDoneScreen.test.tsx  ← NOVO
    └── app/workout-page.test.tsx          ← NOVO: integração da página com
                                               useActiveWorkout real, apiFetch e
                                               next/navigation mockados
```

**Structure Decision**: Seguir o padrão do repo — lógica em hook (`hooks/`) e UI em componente (`components/workout/`), cada um com teste unitário; um teste de integração da página cobre a fiação (gravação ao finalizar, não redirecionar, "Voltar ao início" sem nova gravação, "Voltar ao treino" após erro).

## Complexity Tracking

Nenhuma violação a justificar.
