# Data Model: Produção Pessoal no Render

Esta feature não cria tabelas nem altera o banco. As entidades são de configuração.

## Configuração de ambiente (`AppEnv`)

Objeto validado por `loadEnv(env = process.env)` em `apps/api/src/config/env.ts`.

| Campo | Tipo | Regra |
|---|---|---|
| `NODE_ENV` | `'development' \| 'test' \| 'production'` | padrão `development` |
| `PORT` | número | padrão `3001` |
| `HOST` | texto | padrão `0.0.0.0` |
| `SUPABASE_URL` | URL | obrigatória em produção |
| `SUPABASE_ANON_KEY` | texto não vazio | obrigatória em produção |
| `ANTHROPIC_API_KEY` | texto não vazio | obrigatória em produção |
| `CORS_ORIGIN` | URL | obrigatória em produção; `*` é rejeitado; padrão `http://localhost:3000` fora de produção |
| `PERSONAL_API_KEY` | texto não vazio | opcional |
| `PERSONAL_USER_ID` | texto não vazio | obrigatória se `PERSONAL_API_KEY` presente |
| `SUPABASE_SERVICE_ROLE_KEY` | texto não vazio | obrigatória se `PERSONAL_API_KEY` presente |

**Validação**: em produção, `loadEnv` lança um erro cuja mensagem lista todas as variáveis ausentes ou inválidas (nome de cada uma), para corrigir tudo de uma vez. Fora de produção, os campos obrigatórios viram opcionais.

## Verificação de CI

Não é persistida pela aplicação. É uma execução do GitHub Actions por push ou pull request, com resultado `success` ou `failure`.

## Backup

Arquivo `.sql` gerado manualmente por `pg_dump`, nomeado com a data. Fica fora do repositório.
