# Deploy em produção (uso pessoal)

API no **Render** (plano gratuito), web na **Vercel**, banco no **Supabase**.
Feature: [`specs/023-producao-render`](../specs/023-producao-render/spec.md).

## 1. Variáveis de ambiente da API

A lista completa, com a finalidade de cada uma, está em [`.env.example`](../.env.example).
Em produção a API **recusa iniciar** se faltar alguma obrigatória e informa o nome de cada uma:

```text
Variáveis de ambiente inválidas: SUPABASE_URL, CORS_ORIGIN
```

| Variável | Obrigatória | Observação |
|---|---|---|
| `SUPABASE_URL` | sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | sim | chave `anon` |
| `ANTHROPIC_API_KEY` | sim | chave da API da Anthropic |
| `CORS_ORIGIN` | sim | domínio do web na Vercel (ex.: `https://helux.vercel.app`). `*` é rejeitado |
| `PERSONAL_API_KEY` | não | habilita o sync de saúde por `X-API-Key` |
| `PERSONAL_USER_ID` | só com `PERSONAL_API_KEY` | id do usuário dono dos dados |
| `SUPABASE_SERVICE_ROLE_KEY` | só com `PERSONAL_API_KEY` | **nunca** vai para o web nem para o mobile |

Segredos ficam apenas no painel do Render (`sync: false` no `render.yaml`), nunca no repositório.

## 2. Deploy da API no Render

1. No Render, **New → Blueprint** e aponte para este repositório. O `render.yaml` cria o serviço `helux-api` (Docker, plano `free`).
2. Preencha os segredos listados acima quando o Render pedir.
3. Aguarde o deploy. O health check (`/health`) precisa ficar verde.
4. Confirme no navegador ou com `curl`:

   ```powershell
   curl https://<sua-api>.onrender.com/health
   # {"status":"ok","timestamp":"..."}
   ```

   A primeira chamada após hibernação pode levar 30–60 s (veja a seção de monitoramento).

## 3. Deploy do web na Vercel

Defina estas variáveis no projeto da Vercel:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL da API no Render (sem barra final) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` |

Depois do deploy, copie o domínio gerado para `CORS_ORIGIN` no Render e faça um novo deploy da API.
Faça login no web publicado e confirme que as telas carregam sem erro de CORS no console.

## 4. Migrations do banco

As migrations ficam em [`supabase/migrations/`](../supabase/migrations). Elas são aplicadas manualmente no
projeto Supabase de produção (SQL Editor ou `supabase db push`).

Antes de considerar o deploy concluído, confira que **todas** as migrations do diretório estão aplicadas
no banco de produção, principalmente se alguma feature nova depender de tabela nova.

## 5. Integração contínua

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda em todo pull request e em
todo push na `main`: instala com `pnpm install --frozen-lockfile`, depois `pnpm typecheck` e `pnpm test`.
Um segundo job roda o e2e com o Supabase local e a IA simulada.

Para impedir merge com o CI vermelho, ative a proteção da branch no GitHub:

1. **Settings → Branches → Add branch ruleset** (ou *Add rule*) para a branch `main`.
2. Marque **Require status checks to pass before merging**.
3. Adicione os checks **Typecheck e testes** e **E2E (Supabase local + API + IA simulada)**. Eles só
   aparecem na busca depois de terem rodado pelo menos uma vez.
4. Salve. A partir daí o botão de merge fica bloqueado enquanto algum desses checks falhar.
