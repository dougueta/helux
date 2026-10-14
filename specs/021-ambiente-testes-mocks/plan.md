# Implementation Plan: Ambiente de Testes com Alternância de Dados Reais e Mockados

**Branch**: `021-ambiente-testes-mocks` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/021-ambiente-testes-mocks/spec.md`

---

## Summary

Implementar a infraestrutura de **Ambiente de Testes Full-Stack Desacoplado** no Helux, permitindo alternar de forma transparente entre o consumo de dados simulados (fixtures ricas e tipadas) e dados reais (Supabase e API Fastify).

A solução é baseada em três pilares fundamentais:
1. **Mock Client Adapter no Frontend (`apps/web`)**: Interceptação desacoplada na camada de rede (`api-client.ts`) e no provedor de autenticação (`supabase-browser.ts`), permitindo navegar em 100% das telas sem dependência de internet ou banco.
2. **Controle Híbrido com Dev Bar**: Inicialização via variável de ambiente (`NEXT_PUBLIC_DATA_SOURCE`) com barra de desenvolvimento flutuante para alternância em tempo de execução, seleção de personas de teste e indicador visual de estado.
3. **Persistência Local e Reset Atômico**: Mutações em modo mock são gravadas no `localStorage`, permitindo testar fluxos completos (conclusão de treino, cansaço, etc.) com persistência entre recarregamentos e botão de reset para restaurar o estado padrão.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), React 18, Next.js 14 App Router, Fastify 5  
**Primary Dependencies**: `@helux/types` (para tipagem rigorosa das fixtures), sem novas dependências externas de terceiros  
**Storage**: `localStorage` no navegador para persistência do estado mockado e overrides; banco Supabase para modo real  
**Testing**: Vitest + Testing Library (`@testing-library/react`), TDD estrito com Red-Green-Refactor para adaptadores, store e componentes  
**Target Platform**: Web responsiva (desktop e mobile-first) em ambiente de desenvolvimento e testes  
**Project Type**: Web application & API no monorepo Helux  
**Performance Goals**: Tempo de alternância < 2s; tempo de reset de dados < 200ms; zero impacto em bundle de produção (tree-shaking e guardas de ambiente)  
**Constraints**: Isolamento 100% em produção (`process.env.NODE_ENV === 'production'`); tipagem estrita com `@helux/types`; sem quebra dos contratos públicos de serviços  
**Scale/Scope**: Módulo de fixtures cobrindo 8 domínios (Usuário, Treino, Plano, Cansaço, Checkin, Genética, Exames, Analytics), 4 personas canônicas, 1 Dev Bar e adaptadores para `apps/web` e `apps/api`  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | Todo o código reside no monorepo (`apps/web`, `apps/api` e `packages/types`). Nenhuma dependência externa de repositório. |
| **II. Test-First (TDD)** | ✅ PASS | Cada camada (store de mock, router de mock, adapters de serviço e DevBar) nasce com testes unitários em RED (falha inicial) antes da implementação GREEN. |
| **III. Independent Deployability** | ✅ PASS | A camada de mock não altera os contratos públicos da API nem exige deploy sincronizado. O frontend pode rodar de forma 100% autônoma. |
| **IV. Shared Code via Packages** | ✅ PASS | Todos os schemas e contratos de dados das fixtures utilizam e validam as definições canônicas de `packages/types`. |
| **V. Simplicity (YAGNI)** | ✅ PASS | Em vez de instalar bibliotecas pesadas de terceiros (como MSW com Service Workers intrusivos), adota-se um Mock Client Adapter nativo, direto e ultraleve. |

---

## Project Structure

### Documentation (this feature)

```text
specs/021-ambiente-testes-mocks/
├── plan.md              # Este plano de implementação
├── spec.md              # Especificação de requisitos funcionais e critérios de sucesso
├── research.md          # Decisões arquiteturais (Phase 0)
├── data-model.md        # Modelagem de dados, schemas e personas (Phase 1)
├── quickstart.md        # Guia de inicialização e uso do ambiente (Phase 1)
├── contracts/           # Contratos de interface e APIs dos adaptadores (Phase 1)
│   └── mock-environment-api.md
├── checklists/          # Checklist de qualidade de requisitos
│   └── requirements.md
└── tasks.md             # Tarefas atômicas de implementação (gerado por speckit-tasks)
```

### Source Code (`apps/web/src` & `apps/api/src`)

```text
apps/web/src/
├── lib/
│   ├── env.ts                       ← NOVO: leitor tipado de ambiente (mode, isDev, isProduction)
│   └── supabase-browser.ts          ← EVOLUI: suporta mock session transparente em modo mock
├── mocks/
│   ├── fixtures/                    ← NOVO: dados canônicos congelados e tipados
│   │   ├── profile.fixture.ts
│   │   ├── workouts.fixture.ts
│   │   ├── tiredness.fixture.ts
│   │   ├── genetics.fixture.ts
│   │   ├── exams.fixture.ts
│   │   └── personas.ts              ← NOVO: catálogo de personas (Padrão, Rest Day, Exausto, Zero-State)
│   ├── mock-store.ts                ← NOVO: gerenciador de estado local e reset via localStorage
│   ├── mock-router.ts               ← NOVO: despacho de rotas simuladas para apiFetch
│   └── mock-environment.ts          ← NOVO: switcher e controle de modo (mock vs real)
├── services/
│   └── api-client.ts                ← EVOLUI: integra com mock-router quando em modo mock
├── components/
│   └── dev/
│       ├── DevBar.tsx               ← NOVO: barra interativa com status, toggle, seletor de persona e reset
│       └── DevBar.module.css        ← NOVO: estilos compatíveis com helux-v2.css
└── __tests__/
    ├── mocks/
    │   ├── mock-store.test.ts       ← TESTE: persistência local, mutações e reset
    │   ├── mock-router.test.ts      ← TESTE: resolução e retorno de rotas simuladas
    │   └── mock-environment.test.ts ← TESTE: prioridade de override e detecção de modo
    └── components/
        └── DevBar.test.tsx          ← TESTE: renderização, clique de alternância e reset

apps/api/src/
├── mocks/
│   └── api-mock-provider.ts         ← NOVO: suporte a dados mockados na API para testes de rota
└── __tests__/                       ← TESTES existentes continuam 100% verdes
```

**Structure Decision**: A camada de mocks fica localizada em `apps/web/src/mocks/`, encapsulada e isolada, com ponto único de integração em `api-client.ts`. Os componentes de desenvolvimento ficam em `apps/web/src/components/dev/DevBar.tsx`, garantindo que não haja poluição de código nas páginas ou componentes de negócio.

---

## Complexity Tracking

*Sem violações da constituição a justificar. Toda a arquitetura respeita YAGNI, monorepo e TDD rigoroso.*
