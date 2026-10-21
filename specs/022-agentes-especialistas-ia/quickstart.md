# Quickstart: Time de Agentes Especialistas (022)

## Pré-requisitos

1. 018 integrada à `main` e esta branch rebaseada sobre ela (research R0). Sem a 018, o Agente de Nutrição responde só com genética + treino e a fonte `nutricao` aparece como vazia.
2. `pnpm install` na raiz (o SDK `@anthropic-ai/sdk` foi atualizado em `packages/ai`).
3. `apps/api/.env` com `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`; `data/genetics/genera.json` presente.
4. Migration aplicada: `supabase/migrations/*_specialist_agents.sql` (via MCP Supabase `apply_migration` no projeto `wgrlavmynbingemdbkjg`, ou `supabase db push`).

## Rodar

```powershell
pnpm --filter @helux/api dev
pnpm --filter @helux/web dev
```

Modo mock (021): `NEXT_PUBLIC_DATA_SOURCE=mock` — chats respondem com streams pré-gravados, sem IA e sem custo.

## Testes

```powershell
pnpm --filter @helux/types test
pnpm --filter @helux/ai test        # unidades com SDK mockado
pnpm --filter @helux/api test
pnpm --filter @helux/web test
```

Eval de segurança da Medicina Esportiva (chamadas reais — gasta crédito, rodar sob demanda):

```powershell
pnpm --filter @helux/ai eval:medicina
```

## Roteiro de validação manual

1. **Preferências (US1/SC-003)** — `/perfil/preferencias`: dias seg/qua/sex, 45 min, só halteres + peso corporal, evitar "Agachamento Livre (Barra)", prioridade glúteo. Cronometrar < 3 min.
2. **Adaptação no meio do mesociclo (FR-011)** — ao salvar o passo 1 com mesociclo ativo: aparece proposta antes → depois das sessões pendentes; aceitar e conferir `/treinos`. Mudar só "estilo" → aviso "vale a partir do próximo mesociclo".
3. **Mesociclo novo (US1/SC-001/SC-002)** — gerar: nenhuma sessão > 45 min estimados, sem barra/máquina, sem agachamento livre, volume extra de glúteo; justificativa por decisão citando fontes, e "exames: vazia".
4. **Edição manual (FR-009a)** — trocar um exercício pela lista de alternativas; alterar séries/carga; tentar um exercício bloqueado por restrição → aviso.
5. **Perfil Integrado (US2)** — `/perfil/integrado`: fontes com datas; desligar "genetica" e perguntar ao Agente de Treino → resposta sem marcadores genéticos e indicando a fonte desativada.
6. **Medicina Esportiva (US3/SC-005)** — "dor na frente do ombro direito no supino há 3 dias": triagem, aviso de não-diagnóstico, relato registrado, proposta de restrição; aceitar → próxima sessão sem empurrar-vertical/horizontal pesado. "Dor no peito no treino" → orientação de atendimento, sem "continue treinando".
7. **Nutrição (US4/SC-006)** — "o que comer no pré-treino e posso tomar café?": cita treino do dia, ADORA2A, MCM6; nenhuma sugestão com lactose.
8. **Equipe (US5/FR-023)** — `/equipe`: pergunta de nutrição → indicador "Nutrição respondendo"; relato de ombro conhecido pelo Agente de Nutrição; apagar o relato → nenhum agente o cita.
9. **Teto (FR-025/026)** — definir teto US$ 1: aviso aos 80%; aos 100% chats bloqueados com mensagem; treino de hoje e edição manual funcionam.
10. **Latência (SC-004a)** — conferir `firstTokenMs` nos logs da API: ≤ 3 s em 95% das mensagens.

## Estado da implementação (2026-10-20)

- **Branch empilhada** sobre 021 → 018 (R0 resolvido: a 018 já está nesta base; a US2 da 018 foi movida para cá).
- **Verificação final (T036)**: `pnpm test` — api 234, web 595, ai 187, workouts 100, nutrition 76, genetics 34, health 27, types 17, mobile 9, todos verdes; `pnpm typecheck` 9/9; `pnpm build` 2/2 (o `fetch failed` no log vem do prerender da `/dna` sem a API no ar, como antes). O build de produção não leva código de mock.
- **Migration não aplicada**: `20261014002645_nutrition.sql` (018) e `20261020120000_specialist_agents.sql` (022) precisam ir para o Supabase antes do deploy da API. Nesta sessão o MCP do Supabase dava timeout de conexão com o banco (o projeto estava `ACTIVE_HEALTHY`).
- **Não executados (custam dinheiro ou exigem login real)**: o eval `eval:medicina`, a medição de latência (SC-004a) e o roteiro manual acima.

### Decisões tomadas na implementação

- **Histórico em texto (R3)**: as respostas anteriores voltam ao modelo como texto, sem blocos de raciocínio nem de ferramenta. Com a janela de 20 mensagens andando, reenviar os blocos de raciocínio faria o histórico "editado" (a checagem de raciocínio preservado do Opus 5.5 rejeita isso). O `api_content` continua gravado para auditoria.
- **`GET /api/exercises`** (contrato atualizado): catálogo do banco para os seletores da web, que não depende de `@helux/ai`.
- **`shared_guidance.conflicts_with` e `duration_days`** (migration): guardam o conflito detectado no aceite (FR-021) e o prazo proposto, que vira `expires_at` no aceite.
- **CORS libera `PATCH`** (edição manual e relatos); **`apiFetch` aceita 204** e o `ApiError` traz `code` e o corpo.
- **Roteador**: recusa ou JSON inválido caem no Agente de Treino, que encaminha se precisar.
