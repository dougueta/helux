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
