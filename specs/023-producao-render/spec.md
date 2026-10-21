# Feature Specification: Produção Pessoal no Render

**Feature Branch**: `023-producao-render`  
**Created**: 2026-10-20  
**Status**: Draft  
**Input**: User description: "Colocar o projeto em produção para uso pessoal, usando o Render para a API. Escopo enxuto: um único destino de deploy, variáveis de ambiente documentadas, CI mínimo, mitigação de cold start, backup do banco e monitoramento simples. Fora de escopo: auditoria de RLS, LGPD, rate limit por usuário, staging, publicação em lojas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API publicada e acessível de forma confiável (Priority: P1)

O dono do projeto publica a API no Render e o web na Vercel. O web (e o app mobile) conseguem falar com a API publicada usando apenas a configuração documentada, sem ajustes manuais não registrados.

**Why this priority**: sem isso não existe produção. Todo o restante depende de um deploy reproduzível.

**Independent Test**: seguir só a documentação num ambiente limpo, fazer o deploy e chamar o endpoint de saúde e uma rota autenticada a partir do web publicado.

**Acceptance Scenarios**:

1. **Given** as variáveis de ambiente documentadas preenchidas no Render, **When** o deploy é feito, **Then** o endpoint de saúde responde com sucesso e o serviço fica marcado como saudável.
2. **Given** o web publicado apontando para a URL da API, **When** o dono faz login e abre o app, **Then** as chamadas à API funcionam sem erro de origem (CORS).
3. **Given** uma variável obrigatória ausente, **When** a API inicia, **Then** ela falha logo na inicialização com uma mensagem que diz qual variável falta.

---

### User Story 2 - Um único destino de deploy, sem configuração conflitante (Priority: P1)

O repositório passa a ter somente a configuração do Render. A configuração do Fly.io é removida, e a documentação de variáveis lista todas as que a API exige.

**Why this priority**: duas configs de deploy geram confusão sobre qual é a fonte de verdade.

**Independent Test**: conferir que o repositório não contém configuração do Fly.io e que o exemplo de variáveis cobre todas as variáveis declaradas no Render.

**Acceptance Scenarios**:

1. **Given** o repositório, **When** alguém procura configuração de deploy da API, **Then** encontra apenas a do Render.
2. **Given** o arquivo de exemplo de variáveis, **When** comparado com as variáveis do Render, **Then** todas aparecem com descrição de uso.

---

### User Story 3 - Integração contínua mínima (Priority: P2)

A cada push e pull request, uma verificação automática roda checagem de tipos e testes. Falhas ficam visíveis antes do merge.

**Why this priority**: evita que um deploy quebrado chegue ao ar, com custo baixo de manutenção.

**Independent Test**: abrir um pull request com um teste falhando e confirmar que a verificação falha.

**Acceptance Scenarios**:

1. **Given** um push com código que passa em tipos e testes, **When** a verificação roda, **Then** ela termina com sucesso.
2. **Given** um push com erro de tipo ou teste falhando, **When** a verificação roda, **Then** ela falha e indica o problema.

---

### User Story 4 - Mitigação do cold start do plano gratuito (Priority: P2)

A API não fica hibernada no uso normal, e o app tolera o caso em que ela esteja acordando.

**Why this priority**: o sync de saúde e a geração de treino não podem falhar silenciosamente por causa da hibernação.

**Independent Test**: deixar a API sem tráfego real por mais tempo que o limite de hibernação e confirmar que o monitoramento a mantém acordada; simular a API acordando e confirmar que o sync de saúde conclui após nova tentativa.

**Acceptance Scenarios**:

1. **Given** um monitor externo consultando o endpoint de saúde em intervalo regular, **When** passa mais de 15 minutos sem uso real, **Then** a primeira requisição real responde sem atraso de inicialização.
2. **Given** a API demorando para responder, **When** o app mobile envia dados de saúde, **Then** ele repete a tentativa automaticamente e conclui o envio.
3. **Given** a geração de treino demorando mais que o normal, **When** o web aguarda a resposta, **Then** ele não encerra a espera antes do limite definido para essa operação.

---

### User Story 5 - Backup e controle de gasto (Priority: P3)

Os dados do banco têm uma rotina de backup documentada e testada, e o gasto com a API de IA tem um teto.

**Why this priority**: dados de saúde e treino são insubstituíveis, e um bug nas rotas de IA pode gerar custo inesperado.

**Independent Test**: executar a rotina de backup e restaurar num banco descartável; conferir que o teto de gasto está configurado no provedor de IA.

**Acceptance Scenarios**:

1. **Given** a rotina de backup documentada, **When** executada, **Then** gera um arquivo restaurável com os dados atuais.
2. **Given** um backup gerado, **When** restaurado num banco vazio, **Then** os dados batem com a origem.
3. **Given** o teto de gasto configurado, **When** o consumo se aproxima do limite, **Then** o dono é avisado ou as chamadas são bloqueadas pelo provedor.

---

### Edge Cases

- A API acorda durante uma requisição de login do web: o usuário deve ver um estado de espera, não um erro definitivo.
- `CORS_ORIGIN` configurado com valor incorreto ou vazio: a API deve recusar iniciar em produção ou registrar um erro claro.
- Migrations do banco não aplicadas em produção: o deploy não deve ser considerado concluído até a checagem manual das migrations.
- O limite de 750 horas mensais do plano gratuito: o monitor mantém um único serviço ligado, o que cabe no limite.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O repositório MUST ter uma única configuração de deploy da API, a do Render.
- **FR-002**: O arquivo de exemplo de variáveis MUST listar todas as variáveis exigidas pela API em produção, cada uma com uma descrição curta.
- **FR-003**: A API MUST validar as variáveis obrigatórias na inicialização e falhar com mensagem clara se alguma faltar.
- **FR-004**: Em produção, a origem permitida (CORS) MUST ser restrita ao domínio do web, nunca aberta a qualquer origem.
- **FR-005**: O endpoint de saúde MUST responder rápido e sem exigir autenticação, para uso do Render e do monitor externo.
- **FR-006**: O repositório MUST ter uma verificação automática que rode checagem de tipos e testes em cada push e pull request.
- **FR-007**: O app mobile MUST repetir automaticamente, com espera crescente, o envio de dados de saúde que falhar por timeout ou indisponibilidade temporária.
- **FR-008**: O web MUST usar um tempo limite maior para a geração de treino do que para as demais chamadas.
- **FR-009**: A documentação MUST descrever o passo a passo do deploy: variáveis, URL da API no web, monitor de disponibilidade e verificação das migrations.
- **FR-010**: A documentação MUST descrever uma rotina de backup do banco e como restaurá-la.
- **FR-011**: A documentação MUST orientar a configuração de um teto de gasto no provedor de IA.
- **FR-012**: A chave de acesso pessoal e as demais credenciais MUST ficar apenas nos segredos da plataforma, nunca no repositório.

### Key Entities

- **Configuração de ambiente**: conjunto de variáveis exigidas pela API em produção, com nome, finalidade e se é obrigatória.
- **Verificação de CI**: execução automática de tipos e testes associada a um push ou pull request, com resultado de sucesso ou falha.
- **Backup**: arquivo restaurável do banco, com data de geração.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Seguindo só a documentação, o deploy completo (API e web) é concluído em até 30 minutos.
- **SC-002**: O endpoint de saúde responde com sucesso em 100% das consultas do monitor durante 7 dias seguidos.
- **SC-003**: Em uso normal, nenhuma requisição real sofre atraso de inicialização superior a 5 segundos.
- **SC-004**: 100% dos pushes com erro de tipo ou teste falhando são sinalizados pela verificação automática.
- **SC-005**: Um backup restaurado num banco vazio reproduz 100% das tabelas e linhas da origem.
- **SC-006**: Nenhum segredo aparece no repositório ou no histórico versionado da branch.

## Assumptions

- Uso exclusivamente pessoal: um único usuário, sem requisitos de LGPD, termos de uso ou exportação de conta.
- Fora de escopo nesta feature: auditoria de RLS, rate limit por usuário, autenticação centralizada, ambiente de staging, observabilidade avançada (Sentry) e publicação do mobile nas lojas.
- A API roda no plano gratuito do Render e o web na Vercel; o banco é o Supabase já existente.
- O monitor externo é um serviço gratuito de ping, e o limite de 750 horas mensais do Render cobre um único serviço sempre ligado.
- As migrations atuais são aplicadas manualmente no Supabase de produção, e a conferência delas faz parte do passo a passo de deploy.
- O trabalho em andamento da feature 022 (agentes de IA) não faz parte desta spec.
