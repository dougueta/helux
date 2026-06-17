# Research: Geração de Plano de Treino por IA

**Phase 0 — Decisões de design resolvidas antes da implementação**

---

## Decisão 1: Modelo Claude

**Decision**: `claude-sonnet-4-6`  
**Rationale**: Especificado pelo usuário. Boa relação custo/qualidade para geração de texto estruturado em português. Suporta adaptive thinking e prompt caching com mínimo de 2048 tokens.  
**Alternatives considered**: `claude-opus-4-8` seria mais capaz mas ~5× mais caro por token. Para geração de planos de treino pessoais (não críticos), Sonnet 4.6 é suficiente.

---

## Decisão 2: Estratégia de Prompt Caching

**Decision**: Cache manual no system prompt com `cache_control: {type: "ephemeral", ttl: "1h"}` no último bloco do system.  
**Rationale**:
- O system prompt contém GeneticProfile (muda a cada meses) + WorkoutConstraints + instruções de formato (nunca mudam). É o candidato ideal para cache.
- TTL de 1h (em vez do padrão de 5min) porque entre gerações do Doug pode passar várias horas. Com 1h, uma sessão de treino matinal e outra noturna ainda podem compartilhar o cache.
- Render order da API: `tools → system → messages`. O `cache_control` no último bloco do system cacheia system inteiro.
- **Requisito mínimo**: 2048 tokens para `sonnet-4-6`. O system prompt com perfil genético serializado + instruções detalhadas + exemplos de formato deverá atingir esse mínimo. Verificar com `usage.cache_creation_input_tokens > 0` na primeira chamada.
- O user prompt (histórico + recuperação + objetivos) é sempre variável — sem cache.

**Economics**: Com TTL 1h, write cost = 2× base; read cost = 0.1× base. Break-even em 3+ leituras da mesma entrada. Para uso diário, vale.  
**Alternatives considered**: Auto-caching top-level (`cache_control` no `messages.create`) — mais simples, mas coloca o breakpoint no último user message (variável), o que cancela o benefício. Cache no messages history — irrelevante pois não há multi-turn neste caso de uso.

---

## Decisão 3: Estrutura do Prompt

**Decision**: System prompt em dois blocos; user message simples.

```
SYSTEM BLOCK 1 (no cache): [instruções de papel do coach]
SYSTEM BLOCK 2 (cache_control aqui): [perfil genético + restrições + formato de output]
USER MESSAGE: [histórico + recuperação + objetivos + nível + dias disponíveis]
```

**Rationale**: Separar instruções de papel (que poderiam mudar em iterações de produto) do perfil genético (que muda raramente) permite ajustar instruções sem invalidar o cache do perfil. Na prática para MVP, um único bloco de system com cache_control no final é suficiente.

**Output Format**: Instrução no system prompt para responder com JSON válido que parse direto como `NextWorkoutPlan`. Sem thinking tokens — resposta direta e estruturada.

---

## Decisão 4: Parsing do Output da IA

**Decision**: Extrair JSON do texto retornado pela API via regex/parse simples.  
**Rationale**: A IA pode incluir texto antes/depois do JSON mesmo com instruções. Padrão robusto: extrair o bloco entre ```json e ``` ou parsear o primeiro objeto JSON encontrado. Se falhar, lançar erro descritivo.  
**Alternatives considered**: Structured outputs (`output_config.format`) — disponível mas adiciona complexidade desnecessária para MVP de um usuário. Tool use com schema — overkill para este caso.

---

## Decisão 5: Persistência do Último Plano

**Decision**: `writeFileSync` para `data/workouts/latest-plan.json` após geração bem-sucedida.  
**Rationale**: MVP pessoal de um usuário — não há concorrência. `writeFileSync` é simples e elimina race conditions. O arquivo é sobrescrito a cada geração (não há histórico de planos no MVP).  
**Alternatives considered**: Arquivo com timestamp para histórico — fora do escopo do MVP; `appendFileSync` para log — desnecessário.

---

## Decisão 6: Tratamento de Erros

**Decision**: Propagar erros da API sem retry automático. Erros de autenticação (`Anthropic.AuthenticationError`) → 500 com mensagem clara. Erros de API genéricos → 500 com mensagem da SDK.  
**Rationale**: Especificado na spec (FR-006, Assumptions). Retry automático adicionaria complexidade sem benefício claro para uso pessoal intermitente.

---

## Decisão 7: Mock da SDK Anthropic em Testes

**Decision**: `vi.mock('@anthropic-ai/sdk')` para simular resposta do modelo.  
**Rationale**: Testes unitários não devem fazer chamadas reais à API (custo, latência, non-determinismo). O mock retorna um JSON de `NextWorkoutPlan` simulado. Testamos que: (a) o system prompt contém os dados do perfil, (b) o user prompt contém o histórico, (c) a resposta é parseada corretamente, (d) o arquivo é escrito.
