# Feature Specification: Ambiente de Testes com Alternância de Dados Reais e Mockados

**Feature Branch**: `021-ambiente-testes-mocks`  
**Created**: 2026-10-13  
**Status**: Draft  
**Input**: User description: "gostaria de especificar um ambiete de testes no helux com dados mocados, eu podendo escolher se está mockado ou é dados reais, isso no processo de SDD"

---

## 1. Contexto e Visão Geral

O ecossistema **Helux** integra diversas frentes complexas de saúde, bem-estar e performance: treinos periodizados (mesociclos, sessões diárias, variantes e substituições de exercícios), aferição de cansaço e recuperação (HRV/Sono via HealthKit), mapeamento genético individual (`data/genetics/genera.json`), histórico de exames médicos laboratoriais e diretrizes nutricionais adaptativas.

Atualmente, tanto o desenvolvimento de novas funcionalidades quanto a execução de testes manuais e de usabilidade dependem diretamente de instâncias ativas do banco de dados (Supabase), autenticação real e APIs externas. Quando desenvolvedores ou testadores precisam validar telas, novos fluxos ou comportamentos extremos (ex.: usuário exausto, variantes genéticas raras, exames alterados), enfrentam barreiras como:
1. Necessidade de conexão ativa e credenciais válidas do Supabase/Auth.
2. Dificuldade de reproduzir dados determinísticos e repetíveis entre execuções.
3. Risco de poluir ou modificar dados reais de desenvolvimento.
4. Ausência de uma chave simples de controle para alternar de forma transparente entre o modo simulado (mocks) e o modo com dados de produção/desenvolvimento reais.

Esta funcionalidade estabelece o **Ambiente de Testes com Alternância de Dados (Mock vs. Real)** no Helux, fornecendo uma infraestrutura padronizada e unificada onde o desenvolvedor ou testador pode, de maneira rápida e segura, alternar entre o consumo de dados simulados (fixtures controladas e consistentes com o domínio do Helux) e o consumo de dados reais.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Alternância Transparente entre Dados Reais e Mockados (Priority: P1)

Como desenvolvedor ou testador do Helux, desejo alternar facilmente entre o modo de dados simulados (Mock) e o modo de dados reais (Real), para que eu possa inspecionar a interface e os fluxos de ponta a ponta sem depender de serviços externos ou para validar integrações reais quando necessário.

**Why this priority**: É o requisito fundamental solicitado pelo usuário. Sem a capacidade de alternância confiável e desacoplada, o ambiente de testes não cumpre seu objetivo primário.

**Independent Test**: Iniciar a aplicação no modo "Mock", navegar pelas telas principais (Home, Treino, Genética, Exames) e constatar que todos os dados são servidos a partir do conjunto simulado; em seguida, comutar para o modo "Real" e constatar que a aplicação passa a requisitar os dados dos serviços de backend/banco reais.

**Acceptance Scenarios**:
1. **Given** a aplicação configurada com a flag de dados no modo `mock`, **When** qualquer tela ou serviço requisitar informações (ex.: perfil do atleta, treino do dia, genoma), **Then** o sistema retorna os dados padronizados das fixtures locais sem emitir chamadas de rede externas ou exigir autenticação prévia no Supabase.
2. **Given** a aplicação configurada com a flag de dados no modo `real`, **When** as telas realizam consultas e mutações, **Then** as requisições são direcionadas aos serviços de produção/staging reais (Supabase, API Fastify) com autenticação padrão.
3. **Given** o sistema em execução, **When** o modo de dados é alterado pelo usuário (conforme definido na configuração do ambiente), **Then** o comportamento passa a refletir o modo selecionado sem corromper o estado do outro modo.

---

### User Story 2 - Conjunto de Dados Mockados Coerente e Completo do Domínio Helux (Priority: P1)

Como desenvolvedor ou testador, desejo que os dados mockados sejam ricos, realistas e interligados entre si (perfil atlético, dados genéticos, histórico de treinos, registros de cansaço e exames), para que todas as telas e cálculos funcionem exatamente como no fluxo real.

**Why this priority**: Mocks vazios ou incoerentes impedem o teste de telas que dependem de cruzamento de dados (ex.: nutrição esportiva cruzando dados genéticos de `genera.json` com o mesociclo de treino).

**Independent Test**: Com o modo mock ativo, abrir a tela de treino, registrar uma série ou validar uma recomendação baseada em genética, constatando que os cálculos e badges informativos utilizam os dados do perfil de teste simulado com integridade referencial.

**Acceptance Scenarios**:
1. **Given** o modo mock ativo, **When** o módulo de genética ou exames for carregado, **Then** as entidades simuladas possuem estrutura de campos idêntica aos esquemas reais de produção.
2. **Given** o modo mock ativo, **When** o usuário consulta o plano de treino atual, **Then** existe um mesociclo ativo simulado com semanas, sessões diárias e exercícios mapeados para IDs válidos do banco de exercícios.
3. **Given** o modo mock ativo, **When** o usuário consulta o histórico de cansaço ou sono, **Then** há registros temporais coerentes simulando variações realistas dos últimos 7 a 30 dias.

---

### User Story 3 - Indicador Visual e Controle de Ambiente de Teste (Priority: P2)

Como testador ou usuário da versão de teste, desejo visualizar claramente se a sessão atual está rodando com dados mockados ou dados reais, para evitar enganos operacionais e garantir total consciência do estado da aplicação.

**Why this priority**: Evita que o usuário ou testador acredite estar visualizando ou salvando dados reais enquanto está em modo mock, ou vice-versa.

**Independent Test**: Acessar o sistema nos dois modos e verificar a presença de um identificador visual (badge/banner de ambiente) discreto e informativo indicando `[Ambiente: Mock Data]` ou `[Ambiente: Real Data]`.

**Acceptance Scenarios**:
1. **Given** a aplicação rodando com dados simulados, **When** o usuário interage com qualquer tela, **Then** um indicador visual discreto sinaliza que os dados exibidos são puramente simulados.
2. **Given** o indicador visual de ambiente, **When** o usuário clica ou interage com ele (em ambiente de desenvolvimento/teste), **Then** ele apresenta detalhes adicionais (ex.: persona simulada ativa, opção de reset ou alternância de fonte de dados).
3. **Given** um build gerado para ambiente estrito de produção, **Then** os mecanismos de injeção de mock e os controles visuais de teste são estritamente desabilitados.

---

### User Story 4 - Mutabilidade Simulada e Reset de Estado (Priority: P2)

Como testador, desejo que ações que alterem dados (ex.: concluir um treino, cadastrar um exame, alterar nível de cansaço) sejam refletidas localmente durante a sessão de teste e possam ser resetadas a qualquer momento para o estado inicial padrão.

**Why this priority**: Testes manuais e de interface exigem validar fluxos de escrita (mutações). Se o mock for estático (read-only), o testador não consegue validar telas de conclusão de treino ou formulários. Se for mutável sem reset, o estado se deteriora com o tempo.

**Independent Test**: Executar uma alteração (ex.: marcar treino como concluído), verificar que a tela exibe o treino como concluído e, em seguida, acionar a função de "Resetar Dados de Teste", confirmando que o estado retorna à fixture original.

**Acceptance Scenarios**:
1. **Given** dados mockados ativos, **When** o usuário submete uma ação de escrita (POST/PUT/DELETE simulado), **Then** o sistema atualiza o estado local e reflete a alteração na interface sem emitir erros.
2. **Given** dados modificados durante a sessão de teste, **When** o testador solicita a restauração (Reset), **Then** todos os dados simulados voltam imediatamente às suas definições originais de fábrica (fixtures).

---

### User Story 5 - Seleção de Cenários e Personas de Teste (Priority: P3)

Como testador, desejo escolher entre diferentes cenários pré-definidos (ex.: "Atleta em Dia de Descanso", "Atleta Exausto com Baixa Recuperação", "Novo Usuário sem Histórico", "Usuário com Exames Alterados"), para validar o comportamento da aplicação em diferentes casos de uso sem precisar reconstruir dados manualmente.

**Why this priority**: Facilita a auditoria de casos de borda e validação visual de layouts em estados incomuns (zero state, error state, overload state).

**Independent Test**: Alternar o cenário de teste para "Novo Usuário (Zero State)" e constatar que as telas exibem mensagens amigáveis de primeiro acesso, onboarding e ausência de treinos anteriores.

**Acceptance Scenarios**:
1. **Given** o menu de seleção de personas de teste, **When** o usuário escolhe uma persona específica, **Then** os dados de perfil, saúde e histórico são substituídos pelo pacote correspondente a essa persona.
2. **Given** o cenário de erro de comunicação selecionado, **When** qualquer consulta de dados for disparada, **Then** a interface apresenta corretamente os componentes de tratamento de erro e retentativa.

---

### Edge Cases

- **Troca de Modo Durante Operação Ativa**: O que acontece se a alternância de Real para Mock ocorrer no meio de um formulário preenchido ou treino em andamento? O sistema deve solicitar confirmação ou limpar a sessão atual para evitar inconsistências entre chaves de dados reais e mockados.
- **Falha de Carregamento de Fixtures**: Se um arquivo de dados mockados estiver corrompido ou incompleto, o sistema deve registrar o erro detalhado e carregar um fallback seguro mínimo em vez de travar a aplicação em tela branca.
- **Isolamento de Segurança em Produção**: Garantir que sob nenhuma circunstância código ou fixtures de teste possam expor dados sensíveis ou sobrescrever dados reais em banco de produção.
- **Compatibilidade de Esquema (Schema Drift)**: Quando o esquema do Supabase ou das rotas da API evoluir em novas specs, como garantir que as fixtures de teste continuem compatíveis? Deve haver validação de tipos compartilhados (`@helux/types`).

---

## 3. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer um mecanismo unificado de alternância entre o modo de dados simulados (`mock`) e dados reais (`real`).
- **FR-002**: O sistema DEVE disponibilizar um repositório de fixtures completas abrangendo todas as entidades essenciais do Helux: Usuário, Perfil Físico, Mapeamento Genético, Mesociclos, Exercícios, Histórico de Sessões, Cansaço Diário e Exames Médicos.
- **FR-003**: No modo `mock`, todas as operações de leitura DEVEM retornar dados válidos, estruturados e em conformidade estrita com as tipagens de `@helux/types` sem requerer chamadas a serviços de terceiros ou credenciais reais.
- **FR-004**: No modo `mock`, operações de escrita (criação, edição e exclusão) DEVEM ser aceitas com sucesso, atualizando o estado simulado em tempo de execução para permitir feedback imediato nas telas.
- **FR-005**: O sistema DEVE oferecer um comando ou controle para restaurar (resetar) todos os dados simulados ao seu estado inicial limpo.
- **FR-006**: O sistema DEVE exibir um indicador visual de ambiente quando estiver operando com dados simulados, distinguindo com clareza o estado de teste do estado real.
- **FR-007**: O sistema DEVE permitir a configuração da fonte de dados via variável de ambiente para execuções automatizadas (CI/CD, testes de integração e unitários).
- **FR-008**: O sistema DEVE garantir que em compilações finais de produção (Production Release) o modo mock esteja inativo por padrão ou inacessível sem privilégios explícitos.
- **FR-009**: [NEEDS CLARIFICATION: Definir o escopo da alternância — se ela ocorre primariamente na camada web/frontend, no backend API, ou em ambos com sincronização mútua]
- **FR-010**: [NEEDS CLARIFICATION: Definir o mecanismo de persistência dos dados alterados durante a sessão de mock — se devem persistir em armazenamento local do cliente (ex: localStorage) ou apenas na memória volátil da sessão]
- **FR-011**: [NEEDS CLARIFICATION: Definir se a alternância de modo (Mock vs. Real) deve ser realizada via controle interativo em tempo de execução (menu/switcher na UI) além das variáveis de ambiente]

### Key Entities

- **EnvironmentConfig**: Define o estado operacional ativo da aplicação (`dataSource: 'mock' | 'real'`), credenciais ativas, identificador da persona/cenário carregado e opções de depuração.
- **MockDataset / Fixtures**: Conjunto de registros canônicos estáticos representando entidades de domínio do Helux (Perfil, Genética, Mesociclo, Exercícios, Sessões, Cansaço, Exames) tipados e validados.
- **MockStateStore**: Armazenamento em memória ou local que gerencia o ciclo de vida dos dados mockados durante a sessão, registrando alterações e permitindo operações de rollback / reset.
- **TestScenarioPersona**: Definição de perfis contextuais de teste (ex.: "Atleta Padrão", "Atleta Iniciante Zero-State", "Atleta Fadiga Extrema", "Atleta com Marcadores de Exame Críticos").

---

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O desenvolvedor ou testador consegue iniciar e navegar em 100% das telas da aplicação no modo `mock` sem necessidade de configurar chaves do Supabase ou conexão de internet.
- **SC-002**: A alternância entre o modo mock e real pode ser executada em menos de 5 segundos (seja por chave de configuração ou seletor de ambiente).
- **SC-003**: 100% dos tipos das fixtures simuladas são validados automaticamente contra as definições canônicas de `@helux/types` durante os testes automatizados.
- **SC-004**: O tempo de reset dos dados mockados para o estado original é instantâneo (inferior a 500ms).
- **SC-005**: Zero vazamento de dados de teste ou mocks em ambientes com flag de produção estrita.

---

## 5. Assumptions

- **Compatibilidade Monorepo**: A estrutura de mocks deve se integrar harmoniosamente à arquitetura existente do Helux (`apps/web`, `apps/api`, `packages/types`, `packages/workouts`, etc.).
- **Independência de Rede no Modo Mock**: No modo mock, a aplicação não deve falhar nem exibir spinners perpétuos se desconectada da internet.
- **Aderência aos Contratos Existentes**: As interfaces de serviços já existentes (ex: `api-client.ts`, hooks de treino, serviços de genética) manterão seus contratos e assinaturas públicas inalterados, mudando apenas a resolução interna da fonte de dados conforme a configuração.

---

## 6. Clarificações Pendentes para o Usuário

As seguintes 3 questões foram levantadas para delimitar o escopo e a experiência de uso antes de avançar para a fase de plano (`/speckit-plan`):

### Question 1: Escopo e Camada do Mock
**Contexto**: O Helux é composto por uma aplicação web (`apps/web`), uma API Fastify (`apps/api`), um app mobile (`apps/mobile`) e pacotes compartilhados.  
**O que precisamos definir**: Em qual camada a alternância Mock vs. Real deve atuar primariamente?

| Opção | Resposta | Implicações |
|:------|:---------|:------------|
| **A** | **Frontend (Web/Mobile) First** | O frontend possui uma camada adaptadora que intercepta chamadas e retorna dados mockados diretamente no cliente, permitindo rodar o frontend sem nem subir a API ou Supabase. |
| **B** | **Backend API First** | A própria API (`apps/api`) possui a flag de Mock/Real e alterna entre retornar fixtures ou consultar o Supabase; o frontend continua consumindo a API normalmente. |
| **C** | **Full-Stack Desacoplado (Recomendado)** | Tanto o Frontend pode rodar isolado com mock local para testes de tela ultrarrápidos, quanto a API pode rodar com mocks para testes de rotas/integração. |

---

### Question 2: Mecanismo de Alternância (Switching)
**Contexto**: O usuário deseja poder escolher se os dados estão mockados ou são reais.  
**O que precisamos definir**: Como você prefere realizar essa escolha durante o uso?

| Opção | Resposta | Implicações |
|:------|:---------|:------------|
| **A** | **Apenas Variáveis de Ambiente (.env)** | Controlado via `.env` (ex.: `NEXT_PUBLIC_DATA_SOURCE=mock` ou `real`), exigindo reiniciar o servidor de desenvolvimento para alternar. |
| **B** | **Menu Interativo na Interface (Dev Bar / Switcher)** | Um botão/menu visível em desenvolvimento no canto da tela permite alternar entre Mock e Real em tempo de execução com um clique. |
| **C** | **Híbrido (Padrão via .env + Override na UI) (Recomendado)** | O `.env` define o padrão ao iniciar, mas uma barra de ferramentas de desenvolvedor permite comutar instantaneamente no navegador para testar ambos os modos. |

---

### Question 3: Persistência de Dados Durante os Testes Mockados
**Contexto**: Durante o teste de fluxos (ex.: concluir uma sessão de treino, salvar um check-in de cansaço), dados são enviados.  
**O que precisamos definir**: O que deve acontecer com essas alterações no modo mock?

| Opção | Resposta | Implicações |
|:------|:---------|:------------|
| **A** | **Volátil em Memória** | As alterações ficam na memória da aplicação; dar F5 (recarregar a página) descarta as alterações e volta ao estado inicial das fixtures. |
| **B** | **Persistência Local com Botão de Reset (Recomendado)** | As alterações são salvas no navegador (ex.: `localStorage`), permitindo navegar entre páginas preservando o treino feito, com um botão "Resetar Dados" para restaurar o original quando quiser. |
| **C** | **Somente Leitura (Read-Only)** | Mutações retornam sucesso falso, mas não alteram nenhum estado na interface. |
