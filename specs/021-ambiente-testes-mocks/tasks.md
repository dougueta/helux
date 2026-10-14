# Tasks: Ambiente de Testes com Alternância de Dados Reais e Mockados

**Input**: Design documents from `specs/021-ambiente-testes-mocks/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/mock-environment-api.md](./contracts/mock-environment-api.md)

**Tests**: Testes TDD obrigatórios conforme Princípio II da Constituição do Helux (Red-Green-Refactor).

---

## Phase 1: Setup (Estrutura de Mocking no Monorepo)

**Purpose**: Criação da estrutura de diretórios e contratos básicos compartilhados.

- [ ] T001 [P] Criar diretórios `apps/web/src/mocks/fixtures`, `apps/web/src/components/dev` e `apps/web/src/__tests__/mocks`
- [ ] T002 [P] Criar leitor tipado de ambiente `apps/web/src/lib/env.ts` para detecção segura de `DATA_SOURCE`, `NODE_ENV` e overrides

---

## Phase 2: Foundational (Infraestrutura de Armazenamento e Roteamento de Mocks)

**Purpose**: Componentes fundamentais que suportam a execução das User Stories.

**⚠️ CRITICAL**: Pré-requisito para as stories de alternância e interface.

- [ ] T003 [P] **TDD RED**: Criar teste unitário em `apps/web/src/__tests__/mocks/mock-store.test.ts` cobrindo carregamento, leitura, escrita em `localStorage` e reset atômico
- [ ] T004 **TDD GREEN**: Implementar `apps/web/src/mocks/mock-store.ts` com gerenciamento de estado local sob chave `helux_mock_state_v1`
- [ ] T005 [P] **TDD RED**: Criar teste unitário em `apps/web/src/__tests__/mocks/mock-environment.test.ts` validando precedência (produção > localStorage override > env var)
- [ ] T006 **TDD GREEN**: Implementar `apps/web/src/mocks/mock-environment.ts` com os métodos `getDataSource()`, `setDataSource()` e listeners de eventos
- [ ] T007 [P] **TDD RED**: Criar teste unitário em `apps/web/src/__tests__/mocks/mock-router.test.ts` validando resolução e despacho de rotas mockadas
- [ ] T008 **TDD GREEN**: Implementar `apps/web/src/mocks/mock-router.ts` mapeando endpoints canônicos (`/workout/latest-plan`, `/api/tiredness-today`, `/api/profile`, etc.)

**Checkpoint**: Fundação pronta — os serviços e a UI podem agora consumir o roteador e o store de mocks.

---

## Phase 3: User Story 1 - Alternância Transparente entre Dados Reais e Mockados (Priority: P1) 🎯 MVP

**Goal**: Permitir que a aplicação comute entre o consumo de dados simulados locais e serviços reais sem quebrar requisições.

**Independent Test**: Comutar flag para `mock` e verificar que `apiFetch` resolve dados localmente sem emitir HTTP real; comutar para `real` e verificar chamada de rede padrão.

### Tests for User Story 1 (TDD)
- [ ] T009 [P] [US1] **TDD RED**: Criar teste em `apps/web/src/__tests__/services/api-client-mock-toggle.test.ts` validando despacho polimórfico de `apiFetch` (Mock vs Real)
- [ ] T010 [P] [US1] **TDD RED**: Criar teste em `apps/web/src/__tests__/lib/supabase-browser-mock.test.ts` validando retorno de sessão fake quando em modo mock

### Implementation for User Story 1
- [ ] T011 [US1] Integrar `mock-router` em `apps/web/src/services/api-client.ts`, despachando para mock se `isMockActive() === true`
- [ ] T012 [US1] Atualizar `apps/web/src/lib/supabase-browser.ts` para prover sessão e usuário mockados quando em modo mock, eliminando tela de login obrigatória

**Checkpoint**: User Story 1 funcional — requisições de frontend rodam 100% offline em modo mock.

---

## Phase 4: User Story 2 - Conjunto de Dados Mockados Coerente do Domínio Helux (Priority: P1)

**Goal**: Disponibilizar fixtures ricas, realistas e validadas contra `@helux/types` para todas as telas do Helux.

**Independent Test**: Carregar fixtures e verificar integridade referencial entre plano de treino, catálogo de exercícios e dados genéticos.

### Tests for User Story 2 (TDD)
- [ ] T013 [P] [US2] **TDD RED**: Criar teste de validação de schemas em `apps/web/src/__tests__/mocks/fixtures-schema.test.ts` garantindo aderência estrita aos tipos de `@helux/types`

### Implementation for User Story 2
- [ ] T014 [P] [US2] Criar fixture de perfil do atleta em `apps/web/src/mocks/fixtures/profile.fixture.ts`
- [ ] T015 [P] [US2] Criar fixture de plano de treino atual e histórico em `apps/web/src/mocks/fixtures/workouts.fixture.ts`
- [ ] T016 [P] [US2] Criar fixture de cansaço e HRV diário em `apps/web/src/mocks/fixtures/tiredness.fixture.ts`
- [ ] T017 [P] [US2] Criar fixture genômica completa em `apps/web/src/mocks/fixtures/genetics.fixture.ts` espelhando `genera.json`
- [ ] T018 [P] [US2] Criar fixture de exames laboratoriais em `apps/web/src/mocks/fixtures/exams.fixture.ts`

**Checkpoint**: User Story 2 funcional — dados simulados cobrem 100% das telas existentes sem dados vazios ou corrompidos.

---

## Phase 5: User Story 3 - Indicador Visual e Controle Interativo (Dev Bar) (Priority: P2)

**Goal**: Exibir uma barra de ferramentas não-intrusiva no rodapé em ambiente de dev para alternância instantânea.

**Independent Test**: Visualizar status `[MOCK DATA]`, clicar para alternar para `[REAL DATA]` e constatar atualização visual e evento de recarga.

### Tests for User Story 3 (TDD)
- [ ] T019 [P] [US3] **TDD RED**: Criar teste de componente em `apps/web/src/__tests__/components/DevBar.test.tsx` cobrindo renderização, badges de estado e clique de alternância

### Implementation for User Story 3
- [ ] T020 [US3] Implementar componente `apps/web/src/components/dev/DevBar.tsx` estilizado com o Design System v2 (`helux-v2.css`)
- [ ] T021 [US3] Integrar `DevBar` no `apps/web/src/app/layout.tsx` condicional a `process.env.NODE_ENV !== 'production'`

**Checkpoint**: User Story 3 funcional — desenvolvedor controla a fonte de dados com um clique direto na interface.

---

## Phase 6: User Story 4 - Mutabilidade Simulada Local e Reset de Estado (Priority: P2)

**Goal**: Permitir que ações de escrita salvem alterações no `localStorage` durante testes e possam ser revertidas via botão Reset.

**Independent Test**: Concluir um treino, verificar que permanece salvo após F5, clicar em "Resetar Dados" na Dev Bar e constatar restauração às fixtures originais.

### Tests for User Story 4 (TDD)
- [ ] T022 [P] [US4] **TDD RED**: Criar teste de integração de mutação e reset em `apps/web/src/__tests__/mocks/mock-mutations.test.ts`

### Implementation for User Story 4
- [ ] T023 [US4] Implementar handlers de mutação (POST/PUT/DELETE) no `apps/web/src/mocks/mock-router.ts` persistindo alterações no `mockStore`
- [ ] T024 [US4] Integrar botão de ação "Resetar Dados" na `DevBar` acionando `mockStore.reset()` e revalidando a interface

**Checkpoint**: User Story 4 funcional — mutações de teste preservadas localmente e resetáveis sob demanda.

---

## Phase 7: User Story 5 - Seleção de Cenários e Personas de Teste (Priority: P3)

**Goal**: Fornecer personas pré-configuradas (Padrão, Rest Day, Exausto, Zero-State).

**Independent Test**: Selecionar "Novo Usuário (Zero-State)" na Dev Bar e constatar renderização de telas limpas/onboarding.

### Tests for User Story 5 (TDD)
- [ ] T025 [P] [US5] **TDD RED**: Criar teste unitário em `apps/web/src/__tests__/mocks/personas.test.ts` cobrindo troca de personas e restauração de dados

### Implementation for User Story 5
- [ ] T026 [P] [US5] Implementar catálogo de personas em `apps/web/src/mocks/fixtures/personas.ts`
- [ ] T027 [US5] Adicionar seletor dropdown de Personas na `DevBar` acionando `mockStore.loadPersona(id)`

**Checkpoint**: User Story 5 funcional — transição instantânea entre perfis de teste variados.

---

## Phase 8: Final Integration & Guard Verification

**Purpose**: Verificação de segurança, ausência de vazamento para produção e regressão.

- [ ] T028 [P] Criar teste de guarda em `apps/web/src/__tests__/mocks/production-guard.test.ts` garantindo que nenhuma fixture ou DevBar seja exposta quando `NODE_ENV === 'production'`
- [ ] T029 Executar suíte completa de testes no monorepo (`pnpm test` e `pnpm typecheck`) garantindo zero regressões
