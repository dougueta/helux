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

Confira que as duas variáveis do Supabase são do projeto de produção (`wgrlavmynbingemdbkjg`). Variáveis
`NEXT_PUBLIC_*` entram no build, então qualquer troca exige **Redeploy** sem o cache de build.

Depois do deploy, copie o domínio gerado para `CORS_ORIGIN` no Render e faça um novo deploy da API.

No Supabase, em **Authentication → URL Configuration**, defina o **Site URL** como o domínio da Vercel e
adicione `https://<dominio>/**` e `http://localhost:3000/**` em **Redirect URLs**. Sem isso, o login com Google
volta para `localhost:3000` em vez do web publicado.
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

## 6. Cold start e monitoramento

O plano gratuito do Render **hiberna o serviço após 15 minutos sem tráfego**. A primeira requisição depois
disso leva de 30 a 60 s.

**Monitor externo (mantém a API acordada):**

1. Crie uma conta gratuita no [UptimeRobot](https://uptimerobot.com).
2. **Add New Monitor** → tipo **HTTP(s)**, URL `https://<sua-api>.onrender.com/health`, intervalo **5 minutos**.
3. Ative o alerta por e-mail para saber quando a API cair.

O plano gratuito do Render dá **750 horas por mês** por conta, o bastante para um serviço ligado o mês inteiro
(31 × 24 = 744 h). Um segundo serviço gratuito na mesma conta dividiria essa cota.

**O que já tolera a API acordando:**

- **Mobile**: o envio dos dados de saúde (`/api/health/sync`) tenta até 3 vezes, com espera de 2 s e depois
  4 s e timeout de 45 s por tentativa. Ele repete em erro de rede, timeout e `502`/`503`/`504`. Os dados ficam
  salvos no aparelho antes do envio.
- **Web**: o `api-client.ts` (navegador) e o `server-api.ts` (servidor) **não impõem timeout**, então a geração
  de treino espera pelo tempo que a API levar (verificado na feature 023, FR-008).

## 7. Backup do banco

O plano gratuito do Supabase não guarda backups. Faça um manual periodicamente, por exemplo antes de cada
migration nova.

Pegue a connection string em **Supabase → Project Settings → Database → Connection string → URI**
(use a do *Session pooler* se a rede não tiver IPv6). Guarde-a só na variável de ambiente da sessão:

```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres.<ref>:<senha>@<host>:5432/postgres"
$arquivo = "$HOME\backups\helux-$(Get-Date -Format yyyy-MM-dd).sql"
New-Item -ItemType Directory -Force "$HOME\backups" | Out-Null
pg_dump $env:SUPABASE_DB_URL --schema=public --no-owner --no-privileges --file $arquivo
```

O arquivo fica **fora do repositório** (`$HOME\backups`), porque contém dados pessoais e de saúde.
O `pg_dump` precisa ser da mesma versão principal do Postgres do Supabase ou mais nova.

**Restaurar** num banco vazio (um projeto Supabase novo ou um Postgres local descartável):

```powershell
$env:RESTORE_DB_URL = "postgresql://postgres:postgres@localhost:5432/postgres"
psql $env:RESTORE_DB_URL --set ON_ERROR_STOP=1 --file $arquivo
```

**Conferir** comparando a contagem de linhas por tabela na origem e na cópia:

```powershell
$sql = "select relname, n_live_tup from pg_stat_user_tables where schemaname = 'public' order by relname"
psql $env:SUPABASE_DB_URL -c "analyze" ; psql $env:SUPABASE_DB_URL -c $sql
psql $env:RESTORE_DB_URL  -c "analyze" ; psql $env:RESTORE_DB_URL  -c $sql
```

As duas listas precisam ser iguais.

## 8. Teto de gasto da IA

A API não limita o uso da IA por código. O controle é feito na Anthropic:

1. No [Console da Anthropic](https://console.anthropic.com), abra **Settings → Limits**.
2. Defina um **limite de gasto mensal** compatível com o uso pessoal. Ao atingir o limite, as chamadas
   falham até o mês virar, e a API responde com erro nas telas de IA.
3. Em **Settings → Notifications**, ative o alerta por e-mail ao chegar perto do limite.
4. Use uma chave de API só para a produção do Helux, para enxergar o gasto dela separado.

## 9. Segredos fora do repositório

Os `.env` locais estão no `.gitignore`. Antes de cada deploy, varra os arquivos versionados e o histórico:

```bash
git grep -nE "sk-ant-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}" -- . ':!pnpm-lock.yaml'
git grep -nE "SERVICE_ROLE_KEY\s*=\s*['\"]?[A-Za-z0-9_.-]{20,}"
git log -p --all | grep -cE "^\+.*(sk-ant-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,})"
```

**Resultado em 2026-10-21 (feature 023):** nenhuma chave da Anthropic nem JWT nos arquivos ou no histórico
(contagem `0`). A busca por `SERVICE_ROLE_KEY` só encontra o placeholder comentado do `.env.example` e um
valor fictício em `apps/api/src/__tests__/health-sync.test.ts`. Nenhum `.env` versionado.
