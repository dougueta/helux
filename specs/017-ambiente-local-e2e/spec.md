# Feature Specification: Ambiente Local Integrado e Verificação de Ponta a Ponta

**Feature Branch**: `017-ambiente-local-e2e`
**Created**: 2026-09-26
**Status**: Draft
**Input**: User description: "Ambiente local integrado com Supabase: versionar a configuração do Supabase local (supabase/config.toml) e prover um fluxo de verificação de ponta a ponta o mais integrado possível — Supabase local (auth real, RLS, migrations), API real, e a IA (Anthropic) simulada quando não houver chave — executável por um único comando, reaproveitando o roteiro que validou manualmente o quickstart da spec 006 (bootstrap do mesociclo, ajuste por cansaço/HRV no mesmo dia sem novo insert, pular dias sem avançar a fila, completar o ciclo e regenerar automaticamente)."

## Contexto

Hoje o repositório tem as migrations do banco, mas não tem a configuração do banco local versionada. Por isso, cada máquina (ou sessão na nuvem) precisa reconstruir o ambiente à mão. A verificação de ponta a ponta da spec 006 (T047) só foi possível em 2026-09-26, com scripts improvisados fora do repositório. Isso deixa o fluxo central do produto (mesociclo → treino do dia ajustado → registro → próximo ciclo) sem uma checagem integrada repetível. Os testes automatizados atuais usam mocks e não pegam problemas de schema, de RLS ou de integração entre a API e o banco.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir o ambiente local completo com um comando (Priority: P1)

Como desenvolvedor do Helux (humano ou agente), quero subir o banco local com auth, RLS e todas as migrations aplicadas, a partir de uma configuração que já vem no repositório, sem precisar rodar `init` nem montar a configuração à mão.

**Why this priority**: é a base de tudo o que vem depois. Sem um banco local reproduzível, nem a verificação de ponta a ponta nem o desenvolvimento local da API funcionam de forma confiável.

**Independent Test**: num clone limpo, com os pré-requisitos instalados, o comando documentado sobe o banco e aplica todas as migrations. Uma consulta confirma que todas as tabelas do domínio existem, com RLS ativa.

**Acceptance Scenarios**:

1. **Given** um clone limpo do repositório, **When** o desenvolvedor roda o comando de subir o ambiente local, **Then** o banco sobe com todas as migrations aplicadas em ordem e sem nenhuma pendente.
2. **Given** o ambiente local no ar, **When** o desenvolvedor pede as credenciais locais, **Then** recebe URL e chaves locais prontas para a API apontar para elas, sem nenhuma credencial de produção envolvida.
3. **Given** uma migration nova adicionada ao repositório, **When** o ambiente é reiniciado ou atualizado, **Then** a migration nova é aplicada sem recriar o ambiente do zero.

---

### User Story 2 - Verificação de ponta a ponta do fluxo de mesociclo com um comando (Priority: P1)

Como desenvolvedor, quero rodar um único comando que sobe o ambiente (banco local e API real) e exercita o roteiro do quickstart da spec 006. O comando deve terminar com sucesso ou falha clara, sem precisar de chave da IA.

**Why this priority**: é o pedido central. Transforma a verificação manual da T047 numa checagem repetível que pega regressões de integração que os testes com mock não veem.

**Independent Test**: com o ambiente da US1 disponível, rodar o comando e observar um relatório passo a passo com sucesso. Depois, introduzir uma regressão proposital (por exemplo, não marcar a sessão como concluída) e observar o comando falhar apontando o passo quebrado.

**Acceptance Scenarios**:

1. **Given** um usuário novo sem mesociclo, **When** o roteiro pede o plano do dia pela primeira vez, **Then** recebe o estado "gerando", e um pedido seguinte devolve a primeira sessão do ciclo, com as demais como próximas e progresso 0/N, havendo exatamente um mesociclo gravado.
2. **Given** o mesociclo ativo, **When** o roteiro simula HRV bom, HRV médio e HRV baixo no mesmo dia, **Then** o treino do dia sai sem ajuste, com ajuste moderado e com ajuste forte, respectivamente, sem nenhum mesociclo novo gravado.
3. **Given** o mesociclo ativo sem treinos registrados, **When** vários dias se passam, **Then** o treino do dia continua sendo a mesma sessão pendente.
4. **Given** o mesociclo ativo, **When** o roteiro registra um treino por sessão até completar o ciclo, **Then** cada registro avança o progresso em 1 sem gerar mesociclo novo, e o registro final gera automaticamente um novo mesociclo, que passa a ser o devolvido como plano do dia.
5. **Given** que não há chave de IA configurada, **When** o comando roda, **Then** usa automaticamente uma IA simulada com resposta determinística e informa isso no relatório.
6. **Given** qualquer passo que não bata com o esperado, **When** o comando termina, **Then** sai com status de falha, mostra o passo, o esperado e o obtido, e não deixa processos órfãos rodando.

---

### User Story 3 - Verificação integrada automática em cada PR (Priority: P3)

Como mantenedor, quero que a verificação de ponta a ponta, junto com os testes e o typecheck existentes, rode automaticamente em cada pull request, para que regressões de integração apareçam antes do merge.

**Why this priority**: amplia o valor da US2, mas depende dela e da infraestrutura de CI, que o repositório ainda não tem. O fluxo local já entrega valor sozinho.

**Independent Test**: abrir um PR e observar a checagem rodar e reportar o resultado no próprio PR.

**Acceptance Scenarios**:

1. **Given** um PR aberto ou atualizado, **When** a checagem automática roda, **Then** executa typecheck, testes e a verificação de ponta a ponta, e reporta sucesso ou falha no PR.
2. **Given** a checagem automática, **When** roda, **Then** nunca usa credenciais de produção nem chama a IA real.

---

### Edge Cases

- Portas locais já ocupadas (banco, API ou IA simulada): o comando falha cedo com uma mensagem clara sobre qual porta está em conflito.
- Pré-requisito ausente (por exemplo, o runtime de contêineres não está rodando): o comando para antes de começar e diz o que falta.
- Ambiente local já no ar por outra execução: o comando reaproveita o ambiente em vez de recriar e não derruba o que não subiu.
- Geração em segundo plano demorando: o roteiro espera até um limite definido antes de considerar falha.
- Chave de IA real presente no ambiente: por padrão o roteiro continua usando a IA simulada, para ser determinístico e não gerar custo. O uso da IA real só acontece mediante opção explícita.
- Dados de execuções anteriores: cada execução usa um usuário novo e isolado, de modo que execuções repetidas não interferem entre si.
- Arquivo de perfil genético ausente: o roteiro detecta isso e falha com uma mensagem clara, porque sem ele a geração do mesociclo não acontece.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O repositório MUST conter a configuração do banco local versionada, suficiente para subir o ambiente sem nenhum passo de inicialização manual.
- **FR-002**: A configuração local MUST conter apenas valores de desenvolvimento, sem segredos ou credenciais de produção.
- **FR-003**: O repositório MUST oferecer um comando único e documentado para subir o ambiente local e outro para derrubá-lo.
- **FR-004**: O repositório MUST oferecer um comando único que executa a verificação de ponta a ponta: sobe o que faltar, roda o roteiro e encerra o que ele mesmo subiu.
- **FR-005**: A verificação MUST exercitar a API real contra o banco local real, com autenticação real (cadastro e login de um usuário de teste) e RLS ativa.
- **FR-006**: A verificação MUST cobrir os quatro cenários do quickstart da spec 006: bootstrap, ajuste no mesmo dia sem novo mesociclo, dias pulados sem avançar a fila, e ciclo completo com regeneração automática.
- **FR-007**: A verificação MUST, por padrão, substituir a IA por uma simulação determinística e só usar a IA real mediante opção explícita.
- **FR-008**: A verificação MUST terminar com status de sucesso ou falha legível por máquina e com um relatório legível por humanos, indicando cada passo e, em caso de falha, o esperado e o obtido.
- **FR-009**: A verificação MUST usar um usuário novo por execução, para ser repetível sem limpeza manual.
- **FR-010**: A verificação MUST checar os pré-requisitos (runtime de contêineres, portas livres, perfil genético) antes de começar e falhar cedo com mensagem clara.
- **FR-011**: O repositório MUST ter uma checagem automática em pull requests que rode typecheck, testes e a verificação de ponta a ponta, sem credenciais de produção.
- **FR-012**: A documentação de desenvolvimento local MUST explicar os pré-requisitos, os comandos e como interpretar uma falha.
- **FR-013**: O quickstart da spec 006 MUST passar a apontar para o comando de verificação, em vez de só descrever passos manuais.

### Key Entities

- **Ambiente local**: banco com auth e migrations, mais a API apontando para ele. Tem estado "no ar" ou "fora", e credenciais apenas locais.
- **IA simulada**: substituto determinístico da IA de geração de treino, que devolve um mesociclo fixo e conta quantas vezes foi chamada.
- **Execução de verificação**: uma rodada do roteiro, com usuário de teste próprio, lista de passos (nome, esperado, obtido, resultado) e resultado final.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de um clone limpo com os pré-requisitos instalados, um desenvolvedor sobe o ambiente local com um único comando, sem editar nenhum arquivo.
- **SC-002**: A verificação de ponta a ponta roda com um único comando e termina em até 5 minutos com as imagens já baixadas, ou em até 15 minutos na primeira execução.
- **SC-003**: Cinco execuções seguidas da verificação, sem mudanças no código, dão o mesmo resultado (sucesso) em todas.
- **SC-004**: Uma regressão proposital em qualquer um dos quatro cenários do quickstart faz a verificação falhar, apontando o cenário quebrado.
- **SC-005**: Todo pull request mostra o resultado da checagem integrada sem ação manual do autor.
- **SC-006**: Nenhuma execução (local ou automática) chama a IA real ou usa credenciais de produção sem opção explícita.

## Assumptions

- Os pré-requisitos locais são: runtime de contêineres (Docker) rodando, Node e pnpm nas versões do projeto. A CLI do banco pode ser obtida sob demanda pelo gerenciador de pacotes, sem instalação global.
- O perfil genético usado pela geração (`apps/api/data/genetics/genera.json`) já está versionado e é aceitável usá-lo na verificação.
- O roteiro cobre a API. A verificação pela interface web, com navegador, fica fora do escopo desta spec e pode virar uma spec própria.
- A regra de ajuste do treino do dia verificada é a vigente (níveis de cansaço da spec 011, derivados do HRV). Os limites de HRV do roteiro seguem essa regra.
- A checagem automática em PRs roda no provedor de CI do próprio GitHub, onde o repositório está hospedado. A falta de CI hoje não bloqueia as US1 e US2.
- O projeto remoto de produção do banco não é tocado por nenhuma parte desta feature.
