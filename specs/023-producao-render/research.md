# Research: Produção Pessoal no Render

Sem marcadores `NEEDS CLARIFICATION` no plano. As decisões abaixo registram as escolhas.

## R1 — Destino de deploy da API

- **Decision**: Render (plano gratuito), com o `render.yaml` existente. Remover o `fly.toml`.
- **Rationale**: decisão do dono. Custo zero para uso pessoal. O `render.yaml` já define `healthCheckPath: /health` e o Docker build.
- **Alternatives considered**: Fly.io (sem cold start com `min_machines_running = 1`, região `gru`, mas custa alguns dólares por mês). Pode ser migração futura.

## R2 — Mitigação do cold start

- **Decision**: monitor externo gratuito (UptimeRobot) consultando `/health` a cada 5 minutos, mais retry com backoff no sync mobile.
- **Rationale**: o plano gratuito hiberna após 15 min sem tráfego. Um ping a cada 5 min mantém o serviço acordado, e 750 h/mês cobre um serviço ligado o mês todo. O retry cobre o caso do primeiro acesso após reinício ou deploy.
- **Alternatives considered**: cron dentro da própria API (não funciona, pois o serviço hibernado não executa nada); plano pago do Render.

## R3 — Validação de variáveis de ambiente

- **Decision**: função `loadEnv(env)` em `apps/api/src/config/env.ts`, usando `zod` (já é dependência da API). Chamada em `index.ts` antes de `buildApp()`. Fora de produção é permissiva, para não quebrar testes e `pnpm dev`.
- **Rationale**: hoje as rotas usam `process.env.SUPABASE_URL!` e falham só na primeira requisição. Falhar na inicialização aponta a variável que falta. Em produção também recusa `CORS_ORIGIN` ausente ou igual a `*`.
- **Alternatives considered**: biblioteca de config (`envalid`, `dotenv-safe`), descartada por YAGNI. Refatorar todas as rotas para ler de um objeto central também foi descartado, por ser mudança grande sem ganho para uso pessoal.

## R4 — Variáveis exigidas em produção

Levantadas por `git grep process.env` em `apps/api/src`:

| Variável | Obrigatória em produção | Observação |
|---|---|---|
| `SUPABASE_URL` | sim | usada em quase todas as rotas |
| `SUPABASE_ANON_KEY` | sim | idem |
| `ANTHROPIC_API_KEY` | sim | lida pelo SDK de IA |
| `CORS_ORIGIN` | sim | hoje cai em `localhost:3000` se faltar |
| `PERSONAL_API_KEY` | não | caminho `X-API-Key` do sync de saúde |
| `PERSONAL_USER_ID` | só se `PERSONAL_API_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | só se `PERSONAL_API_KEY` | lida em `health-sync.ts`, **ausente do `render.yaml` hoje** |
| `PORT`, `HOST`, `NODE_ENV` | não | têm padrão |

- **Achado**: `SUPABASE_SERVICE_ROLE_KEY` é usada, mas não está declarada no `render.yaml`. Sem ela, o caminho `X-API-Key` falha em produção.

## R5 — CORS em produção

- **Decision**: manter `@fastify/cors` com `origin` vindo do ambiente validado. Em produção, `loadEnv` rejeita ausência e `*`.
- **Rationale**: o comportamento atual (padrão `localhost`) é seguro em dev, mas silenciosamente errado em produção.
- **Alternatives considered**: aceitar lista separada por vírgula, descartado por YAGNI (um único web).

## R6 — Retry do sync de saúde no mobile

- **Decision**: no `health-sync.service.ts`, trocar o `fetch` simples por uma função com até 3 tentativas, espera de 2 s, 4 s e 8 s, timeout de 45 s por tentativa (`AbortController`), e retry em erro de rede e em 502/503/504. Também passar a checar `res.ok`. O atraso entre tentativas é injetável para os testes não esperarem de verdade. Os dados continuam salvos localmente antes do POST, como hoje.
- **Rationale**: hoje o `fetch` ignora o status HTTP, então um 503 de cold start passa como sucesso. 45 s cobre a janela típica de 30–60 s do Render.
- **Alternatives considered**: biblioteca de retry (dependência nova sem necessidade); fila persistente de reenvio (fora do escopo).

## R7 — Timeout no web

- **Decision**: nenhuma mudança de código. Verificado em `api-client.ts` e `server-api.ts`: não há `AbortSignal` nem timeout, então a geração de treino já espera pelo tempo que a API levar.
- **Rationale**: FR-008 já é atendido. Adicionar timeout só introduziria risco.
- **Alternatives considered**: timeout explícito maior para `/api/workout/generate`, descartado por ser código novo para um problema inexistente.

## R8 — CI

- **Decision**: um workflow do GitHub Actions: checkout, `pnpm/action-setup` (v9), `setup-node` (24) com cache do pnpm, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`. Dispara em `push` e `pull_request`.
- **Rationale**: usa os scripts Turbo que já existem. Não roda `next build`, pois a spec pede só tipos e testes.
- **Alternatives considered**: incluir build do web e e2e, descartado para manter o CI rápido.

## R9 — Backup e teto de gasto

- **Decision**: documentar (em `docs/deploy.md`) um `pg_dump` da connection string do Supabase e como restaurar com `psql` num banco vazio. Documentar também o limite de gasto mensal no console da Anthropic.
- **Rationale**: o plano gratuito do Supabase não faz backup, e o gasto da IA não pode ser limitado por código sem o rate limit, que está fora de escopo.
- **Alternatives considered**: script agendado de backup (fora do escopo, porque o uso pessoal tolera backup manual periódico).

## R10 — Segredos

- **Decision**: varrer arquivos versionados e o histórico da branch por padrões de chave (`sk-ant-`, JWT `eyJ...`, `service_role`) antes do deploy. Os `.env` locais já estão fora do git.
- **Rationale**: SC-006 exige que nenhum segredo esteja no repositório.
- **Alternatives considered**: ferramenta dedicada (gitleaks), desnecessária para esta varredura pontual.
