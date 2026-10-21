# Feature Specification: Ambiente de Testes com Alternância de Dados Reais e Mockados

**Feature Branch**: `021-ambiente-testes-mocks`  
**Created**: 2026-10-13  
**Status**: Ready for Planning  
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

## Clarifications

### Session 2026-10-13
- Q: Em qual camada a alternância Mock vs. Real deve atuar primariamente? → A: **Full-Stack Desacoplado**: O frontend pode rodar isolado com mocks locais para desenvolvimento ágil de telas e testes manuais sem depender da API ou Supabase, e a API Fastify também oferece modo mock para testes de endpoints e integração.
- Q: Como você prefere escolher se a aplicação está usando dados mockados ou reais? → A: **Híbrido (Default via `.env` + Override na UI)**: Inicia com o valor padrão do `.env`, mas disponibiliza uma barra/menu de desenvolvimento interativo no frontend para alternar instantaneamente em tempo de execução sem reiniciar o servidor.
- Q: O que deve acontecer quando você realizar ações que alteram dados no modo mock? → A: **Persistência Local com Botão de Reset**: As alterações durante os testes no modo mock persistem localmente no navegador (ex.: `localStorage`), permitindo transitar entre telas preservando o estado das ações simuladas, contando com um botão explícito de "Resetar Dados de Teste" para restaurar os dados originais das fixtures.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Alternância Transparente entre Dados Reais e Mockados (Priority: P1)

Como desenvolvedor ou testador do Helux, desejo alternar facilmente entre o modo de dados simulados (Mock) e o modo de dados reais (Real), para que eu possa inspecionar a interface e os fluxos de ponta a ponta sem depender de serviços externos ou para validar integrações reais quando necessário.

**Why this priority**: É o requisito fundamental solicitado pelo usuário. Sem a capacidade de alternância confiável e desacoplada, o ambiente de testes não cumpre seu objetivo primário.

**Independent Test**: Iniciar a aplicação no modo "Mock", navegar pelas telas principais (Home, Treino, Genética, Exames) e constatar que todos os dados são servidos a partir do conjunto simulado; em seguida, comutar para o modo "Real" e constatar que a aplicação passa a requisitar os dados dos serviços de backend/banco reais.

**Acceptance Scenarios**:
1. **Given** a aplicação configurada com a flag de dados no modo `mock`, **When** qualquer tela ou serviço requisitar informações (ex.: perfil do atleta, treino do dia, genoma), **Then** o sistema retorna os dados padronizados das fixtures locais sem emitir chamadas de rede externas ou exigir autenticação prévia no Supabase.
2. **Given** a aplicação configurada com a flag de dados no modo `real`, **When** as telas realizam consultas e mutações, **Then** as requisições são direcionadas aos serviços de produção/staging reais (Supabase, API Fastify) com autenticação padrão.
3. **Given** o sistema em execução, **When** o modo de dados é alterado pelo usuário através da Dev Bar ou do `.env`, **Then** o comportamento passa a refletir o modo selecionado imediatamente sem corromper o estado do outro modo.

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

### User Story 3 - Indicador Visual e Controle Interativo de Ambiente (Dev Bar) (Priority: P2)

Como testador ou desenvolvedor, desejo visualizar claramente se a sessão atual está rodando com dados mockados ou dados reais através de uma barra de controle interativa (Dev Bar), permitindo alternar de modo instantaneamente e inspecionar a persona ativa.

**Why this priority**: Garante total consciência do estado da aplicação e permite comutação ágil durante o trabalho sem reiniciar servidores.

**Independent Test**: Acessar o sistema nos dois modos e verificar a presença do componente interativo indicando `[Ambiente: Mock Data]` ou `[Ambiente: Real Data]`, acionando a alternância com um clique.

**Acceptance Scenarios**:
1. **Given** a aplicação rodando em ambiente de desenvolvimento, **When** o usuário interage com qualquer tela, **Then** a Dev Bar exibe o status atual do provedor de dados (`Mock` ou `Real`).
2. **Given** a Dev Bar aberta, **When** o usuário clica no botão de alternância de modo, **Then** a aplicação recarrega seu estado com a nova fonte de dados selecionada.
3. **Given** um build gerado para ambiente estrito de produção, **Then** a Dev Bar e os adaptadores de mock são estritamente desabilitados e excluídos do bundle.

---

### User Story 4 - Mutabilidade Simulada Local e Reset de Estado (Priority: P2)

Como testador, desejo que ações que alterem dados (ex.: concluir um treino, cadastrar um exame, alterar nível de cansaço) sejam salvas localmente no navegador (`localStorage`) durante a sessão de mock e possam ser resetadas a qualquer momento para o estado original das fixtures.

**Why this priority**: Testes manuais e de interface exigem validar fluxos de escrita. A persistência local permite navegar entre telas preservando as alterações simuladas, enquanto o reset restaura o ambiente limpo sob demanda.

**Independent Test**: Executar uma alteração (ex.: marcar treino como concluído), recarregar a página e constatar que o treino permanece concluído; em seguida, clicar em "Resetar Dados de Teste" na Dev Bar e constatar que o estado retorna às fixtures padrão.

**Acceptance Scenarios**:
1. **Given** o modo mock ativo, **When** o usuário submete uma ação de escrita (POST/PUT/DELETE simulado), **Then** o sistema grava a alteração no armazenamento local (`localStorage`) e atualiza a interface imediatamente.
2. **Given** dados modificados durante testes anteriores, **When** o testador clica em "Resetar Dados de Teste", **Then** todo o armazenamento local de mock é limpo e restaurado para o conjunto de fixtures padrão de fábrica.

---

### User Story 5 - Seleção de Cenários e Personas de Teste (Priority: P3)

Como testador, desejo escolher entre diferentes personas pré-definidas (ex.: "Atleta Padrão", "Atleta em Dia de Descanso", "Novo Usuário (Zero-State)", "Atleta Fadiga Extrema"), para validar o comportamento da aplicação em diferentes casos de uso sem precisar reconstruir dados manualmente.

**Why this priority**: Facilita a auditoria de casos de borda e validação visual de layouts em estados incomuns.

**Independent Test**: Alternar o cenário de teste para "Novo Usuário (Zero State)" e constatar que as telas exibem mensagens amigáveis de primeiro acesso, onboarding e ausência de treinos anteriores.

**Acceptance Scenarios**:
1. **Given** o menu de seleção de personas de teste na Dev Bar, **When** o usuário escolhe uma persona específica, **Then** as fixtures ativas são substituídas pelo pacote correspondente a essa persona.
2. **Given** o cenário de erro de comunicação selecionado, **When** qualquer consulta de dados for disparada, **Then** a interface apresenta corretamente os componentes de tratamento de erro e retentativa.

---

### Edge Cases

- **Troca de Modo Durante Operação Ativa**: Ao alternar de `Real` para `Mock` (ou vice-versa) através da Dev Bar com formulários em preenchimento, o sistema solicita confirmação do usuário e revalida a sessão para evitar misturar identificadores reais com chaves mockadas.
- **Armazenamento Local Corrompido**: Se os dados salvos em `localStorage` divergirem do schema esperado (ex.: após atualização de tipos em nova versão), o repositório mock detecta o erro e realiza fallback automático para as fixtures canônicas, emitindo aviso na Dev Bar.
- **Isolamento Estrito em Produção**: Garantir via tree-shaking e checagem de variáveis de ambiente (`process.env.NODE_ENV === 'production'`) que fixtures e controles de teste nunca sejam expostos a usuários finais em produção.
- **Compatibilidade de Esquema (Schema Drift)**: Todas as fixtures são estritamente tipadas com base nos contratos de `@helux/types`, impedindo divergências entre os modelos reais e simulados.

---

## 3. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer um mecanismo unificado de alternância entre o modo de dados simulados (`mock`) e dados reais (`real`).
- **FR-002**: O sistema DEVE disponibilizar um repositório central de fixtures completas abrangendo todas as entidades essenciais do Helux: Usuário, Perfil Físico, Mapeamento Genético, Mesociclos, Exercícios, Histórico de Sessões, Cansaço Diário e Exames Médicos.
- **FR-003**: No modo `mock`, todas as operações de leitura DEVEM retornar dados válidos, estruturados e em conformidade estrita com as tipagens de `@helux/types` sem requerer chamadas a serviços de terceiros ou credenciais reais do Supabase.
- **FR-004**: No modo `mock`, operações de escrita (criação, edição e exclusão) DEVEM atualizar o repositório local de dados simulados e fornecer feedback imediato de sucesso nas telas.
- **FR-005**: O sistema DEVE fornecer um comando e botão visual de "Resetar Dados de Teste" para restaurar instantaneamente todo o estado local para as fixtures originais de fábrica.
- **FR-006**: O sistema DEVE exibir um indicador visual interativo de ambiente (Dev Bar / Switcher) em modo de desenvolvimento, permitindo alternar entre Mock e Real com um clique e verificar o status da sessão.
- **FR-007**: O sistema DEVE suportar configuração da fonte de dados padrão via variável de ambiente (`NEXT_PUBLIC_DATA_SOURCE=mock|real` no frontend e `DATA_SOURCE=mock|real` na API) para uso em scripts, CI/CD e testes automatizados.
- **FR-008**: O sistema DEVE garantir que em compilações finais de produção (Production Release) o modo mock e a Dev Bar estejam estritamente desabilitados.
- **FR-009**: O sistema DEVE adotar uma arquitetura Full-Stack Desacoplada, onde o frontend (`apps/web` e `apps/mobile`) possui adaptadores locais de dados simulados (permitindo execução independente sem backend ou banco), e a API (`apps/api`) também suporta alternância de provedor de dados para simular respostas em testes de integração.
- **FR-010**: O sistema DEVE persistir o estado das mutações ocorridas durante a sessão de mock em armazenamento local do cliente (`localStorage`), garantindo que a navegação entre rotas preserve as alterações de teste até que o usuário acione o reset.
- **FR-011**: O sistema DEVE permitir a seleção de personas/cenários pré-configurados de teste (ex.: Atleta Padrão, Zero-State, Fadiga Extrema) através da Dev Bar.

### Key Entities

- **EnvironmentConfig**: Define o estado operacional ativo da aplicação (`dataSource: 'mock' | 'real'`), credenciais ativas, identificador da persona/cenário carregado e opções de depuração.
- **MockDataset / Fixtures**: Conjunto de registros canônicos estáticos representando entidades de domínio do Helux (Perfil, Genética, Mesociclo, Exercícios, Sessões, Cansaço, Exames) tipados e validados contra `@helux/types`.
- **MockLocalStorageStore**: Gerenciador de estado local do cliente que armazena cópias mutáveis das fixtures em `localStorage`, aplica mutações (inserções, atualizações, deleções) e provê a funcionalidade de reset para o estado inicial.
- **TestScenarioPersona**: Definição de perfis contextuais de teste (ex.: "Atleta Padrão", "Atleta Iniciante Zero-State", "Atleta Fadiga Extrema", "Atleta com Marcadores de Exame Críticos").

---

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O desenvolvedor ou testador consegue iniciar e navegar em 100% das telas da aplicação no modo `mock` sem necessidade de configurar chaves do Supabase ou conexão de internet.
- **SC-002**: A alternância entre o modo mock e real via Dev Bar é executada em menos de 2 segundos sem necessidade de reiniciar o servidor de desenvolvimento.
- **SC-003**: 100% dos tipos das fixtures simuladas são validados automaticamente contra as definições canônicas de `@helux/types` durante a compilação e suíte de testes.
- **SC-004**: O tempo de reset dos dados mockados para o estado original é instantâneo (inferior a 200ms).
- **SC-005**: Mutações realizadas no modo mock persistem após recarregamento da página (F5) em 100% dos fluxos testados até que o reset seja acionado.
- **SC-006**: Zero vazamento de dados de teste ou mocks em ambientes com flag de produção estrita.

---

## 5. Assumptions

- **Compatibilidade Monorepo**: A estrutura de mocks integrará o monorepo Helux (`apps/web`, `apps/api`, `packages/types`, `packages/workouts`, etc.).
- **Independência de Rede no Modo Mock**: No modo mock, a aplicação é 100% funcional offline.
- **Aderência aos Contratos Existentes**: As interfaces de serviços já existentes (ex: `api-client.ts`, hooks de treino, serviços de genética) manterão seus contratos e assinaturas públicas inalterados, com resolução polimórfica interna conforme o modo selecionado.
