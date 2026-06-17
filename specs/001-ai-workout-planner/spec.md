# Feature Specification: Geração de Plano de Treino por IA

**Feature Branch**: `001-ai-workout-planner`  
**Created**: 2026-06-13  
**Status**: Draft  
**Input**: User description: "Fase 3 — Módulo IA: wrapper do Claude API para geração de planos de treino adaptativos. Cria packages/ai com generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan> usando claude-sonnet-4-6 com prompt caching. System prompt cacheia GeneticProfile + WorkoutConstraints (dados que mudam raramente). User prompt envia WorkoutHistory + RecoveryData + userGoals. Endpoint POST /workout/generate na API e GET /workout/latest-plan lendo data/workouts/latest-plan.json."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar plano de treino personalizado (Priority: P1)

O usuário (Doug) quer receber um plano de treino para a próxima sessão, gerado com base no seu perfil genético, histórico de treinos e dados de recuperação do Apple Watch. Ele acessa o endpoint de geração e recebe um plano adaptado à sua condição atual.

**Why this priority**: É o núcleo do produto. Sem geração de plano, nenhuma outra funcionalidade tem valor. Tudo o que foi construído antes (módulo genético, tipos compartilhados) serve como insumo para este momento.

**Independent Test**: Pode ser testado chamando `POST /workout/generate` com um `PlanInput` válido e verificando que a resposta contém um `NextWorkoutPlan` com exercícios, séries/reps e uma explicação em linguagem natural.

**Acceptance Scenarios**:

1. **Given** um perfil genético parseado (`GeneticProfile`), `WorkoutConstraints` derivadas, histórico das últimas sessões e dados de recuperação recentes, **When** o usuário chama `POST /workout/generate`, **Then** a API retorna 200 com um `NextWorkoutPlan` contendo lista de exercícios com nome, séries, repetições, carga sugerida e uma justificativa em português.

2. **Given** o mesmo perfil genético (dados que mudam raramente), **When** o usuário gera dois planos em sequência com histórico diferente, **Then** o segundo plano reflete o histórico atualizado sem reprocessar o perfil genético completo (cache do sistema de IA reutilizado).

3. **Given** que `ANTHROPIC_API_KEY` não está configurada no ambiente, **When** o usuário tenta gerar um plano, **Then** a API retorna 500 com mensagem clara indicando que a chave da API não está configurada.

---

### User Story 2 — Consultar o último plano gerado (Priority: P2)

O usuário quer rever o plano de treino mais recente sem gerar um novo. Ele acessa um endpoint de leitura e vê o plano que foi gerado anteriormente, incluindo a data de geração.

**Why this priority**: Um plano gerado tem validade — o usuário pode querer consultá-lo várias vezes antes de executar o treino. Gerar um novo plano a cada consulta seria caro (tempo + custo de API) e desnecessário.

**Independent Test**: Pode ser testado chamando `GET /workout/latest-plan` após uma geração prévia e verificando que o conteúdo corresponde ao último plano salvo.

**Acceptance Scenarios**:

1. **Given** que um plano foi gerado anteriormente e salvo, **When** o usuário chama `GET /workout/latest-plan`, **Then** a API retorna 200 com o `NextWorkoutPlan` salvo incluindo `generatedAt` no formato ISO 8601.

2. **Given** que nenhum plano foi gerado ainda (arquivo inexistente), **When** o usuário chama `GET /workout/latest-plan`, **Then** a API retorna 404 com mensagem clara indicando que nenhum plano foi gerado.

---

### Edge Cases

- O que acontece quando `workoutHistory` está vazio (primeiro uso do sistema)?
- O que acontece quando `recoveryData` está vazio (Apple Watch não sincronizado)?
- O que acontece se o modelo da IA retornar JSON malformado ou inesperado?
- O que acontece se o arquivo `genera.json` não estiver presente ao gerar o plano?
- O que acontece com timeout ou erro de rede na chamada ao serviço de IA?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE aceitar como entrada um `PlanInput` completo (perfil genético, restrições, histórico de treinos, dados de recuperação, objetivos e nível do usuário) e retornar um `NextWorkoutPlan` estruturado.
- **FR-002**: O sistema DEVE usar o serviço de IA com prompt caching: o contexto do perfil genético e das restrições de treino DEVE ser enviado como contexto de sistema (cacheável), enquanto o histórico e dados de recuperação DEVEM ser enviados como contexto de usuário (variável por chamada).
- **FR-003**: O plano gerado DEVE conter: lista de exercícios com nome, número de séries, faixa de repetições, carga sugerida e notas opcionais; e uma justificativa em linguagem natural explicando as escolhas com base no perfil do usuário.
- **FR-004**: O sistema DEVE persistir o último plano gerado em armazenamento local, sobrescrevendo o anterior, para que possa ser consultado sem nova geração.
- **FR-005**: O endpoint `GET /workout/latest-plan` DEVE retornar o último plano salvo ou 404 caso nenhum plano tenha sido gerado.
- **FR-006**: O endpoint `POST /workout/generate` DEVE retornar erro 500 com mensagem descritiva quando a chave de acesso ao serviço de IA não estiver configurada.
- **FR-007**: O sistema DEVE respeitar os `WorkoutConstraints` derivados do perfil genético: frequência máxima semanal, volume preferido, tipos de exercícios proibidos e limite de intensidade cardio.
- **FR-008**: O plano gerado DEVE incluir o `generatedAt` no formato ISO 8601 indicando quando foi criado.

### Key Entities

- **PlanInput**: Agregação de todos os dados necessários para gerar um plano — perfil genético, restrições, histórico de treinos (últimas N sessões), dados de recuperação (últimos N dias), objetivos do usuário em linguagem livre, nível de experiência e dias disponíveis por semana.
- **NextWorkoutPlan**: Plano gerado pela IA — lista de exercícios planejados com prescrição completa (séries, repetições, carga), justificativa em linguagem natural e timestamp de geração.
- **PlannedExercise**: Exercício individual dentro do plano — nome, séries, faixa de repetições (ex.: "8-12"), carga sugerida (ex.: "70kg" ou "+2.5kg vs última sessão") e notas opcionais.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário recebe um plano de treino completo (mínimo 3 exercícios, com séries, repetições e justificativa) em resposta a uma solicitação válida.
- **SC-002**: O plano gerado respeita todos os `WorkoutConstraints` do perfil genético do usuário (exercícios proibidos ausentes, intensidade cardio dentro do limite, volume dentro do preferido).
- **SC-003**: O segundo plano gerado na mesma sessão é entregue mais rapidamente que o primeiro, devido ao reuso do contexto cacheado do perfil genético.
- **SC-004**: O plano mais recente está disponível para consulta imediatamente após a geração, sem necessidade de chamar novamente o serviço de IA.
- **SC-005**: Quando dados opcionais estão ausentes (histórico vazio, recuperação vazia), o sistema gera um plano funcional com mensagem de contexto adequada na justificativa.

---

## Assumptions

- O usuário tem uma chave de acesso válida ao serviço de IA configurada como variável de ambiente (`ANTHROPIC_API_KEY`).
- O modelo utilizado é `claude-sonnet-4-6`, disponível via API Anthropic com suporte a prompt caching.
- O armazenamento é local em arquivo JSON (`data/workouts/latest-plan.json`) — solução adequada para uso pessoal de um único usuário sem necessidade de banco de dados.
- O perfil genético (`genera.json`) já foi carregado e parseado pelo módulo genético (Fase 2) antes de chamar a geração de plano.
- O histórico de treinos passado na requisição é responsabilidade do chamador limitar ao número adequado de sessões (ex.: últimas 5).
- A justificativa do plano será gerada em português brasileiro.
- Não há necessidade de internacionalização ou suporte a múltiplos idiomas nesta fase.
- O sistema não implementa retry automático em falhas de API — erros são propagados ao chamador.
