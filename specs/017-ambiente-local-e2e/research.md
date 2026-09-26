# Research: Ambiente Local Integrado e Verificação de Ponta a Ponta

## R1 — Como disponibilizar o Supabase CLI

- **Decision**: `pnpm dlx supabase@2.118.0 <cmd>` nos scripts da raiz, com a versão fixada.
- **Rationale**: o pacote npm `supabase` baixa um binário no `postinstall`. Como devDependency da raiz, isso rodaria em todo `pnpm install` (build da Vercel, `Dockerfile` da API com `--frozen-lockfile`), adicionando download e um ponto de falha a builds que não precisam dele. O `dlx` baixa sob demanda e fica em cache. Fixar a versão garante reprodutibilidade (a mesma 2.118.0 que validou T008/T047).
- **Alternatives considered**: devDependency na raiz (rejeitada pelo impacto em builds); exigir instalação global (rejeitada porque viola o SC-001, "clone limpo e um comando"); `npx supabase` sem versão (rejeitada por não ser reprodutível).

## R2 — API em processo vs. processo filho

- **Decision**: subir a API real em processo, com `buildApp()` e `listen({ port: 0 })`, depois de definir `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_BASE_URL` e `ANTHROPIC_API_KEY` em `process.env`, antes de importar `app.ts`, porque as rotas leem env ao registrar.
- **Rationale**: é o mesmo `buildApp` que `src/index.ts` usa em produção, com todas as rotas, CORS e a geração fire-and-forget. A porta efêmera elimina conflito de porta da API, e um processo filho exigiria orquestração, espera de health e limpeza de órfãos (FR-004 / edge case "processos órfãos").
- **Alternatives considered**: `tsx src/index.ts` como processo filho (usado na verificação manual; mais peças móveis); `app.inject()` do Fastify (sem rede real, o que se afasta de "o mais integrado possível").

## R3 — Simulação da IA

- **Decision**: servidor `node:http` local em porta efêmera que implementa só `POST /v1/messages` e devolve um bloco de texto com JSON de mesociclo fixo (4 sessões, Upper/Lower, exercícios do `EXERCISE_BANK`), com contador de chamadas exposto em memória. A API aponta para ele via `ANTHROPIC_BASE_URL`, que o SDK oficial respeita. Com `E2E_REAL_AI=1`, a simulação não sobe e a chave real do ambiente é usada.
- **Rationale**: exercita o caminho real do SDK (HTTP, parse, `enrichExercise`) sem custo e com determinismo (SC-003). Ignorar uma chave real presente por padrão evita custo acidental (edge case da spec).
- **Alternatives considered**: `vi.mock('@helux/ai')` (pularia o SDK e o parse; menos integrado); gravar e reproduzir respostas reais (fixture frágil sem ganho).

## R4 — Controle de cenário (HRV, dias pulados) e asserts no banco

- **Decision**: usar um cliente `supabase-js` com a `SERVICE_ROLE_KEY` local só para preparar o cenário (inserir e apagar `health_samples`, retroagir `created_at`/`generated_at` do mesociclo) e para os asserts de contagem em `mesocycle_plans`. Todas as chamadas à API usam o token real do usuário (signup no GoTrue local), então RLS vale para a API.
- **Rationale**: é o equivalente ao `psql` da verificação manual, sem depender de `psql` instalado. "Pular dias" sem manipular relógio: a fila não depende de tempo; retroagir as datas prova que tempo passado não avança nada.
- **Alternatives considered**: `/api/health/sync` para inserir HRV (exige `PERSONAL_API_KEY`/payloads específicos, fora do escopo do cenário); fake timers (não afetam o banco).

## R5 — Asserts de ajuste independentes da IA

- **Decision**: os asserts de ajuste comparam com o plano base do próprio ciclo: `cansado` → `adjusted: true`, `sets` = max(2, base−1), peso igual; `exausto` → `sets` reduzido e peso ≤ base; HRV ≥ 60 → sem ajuste. Os valores absolutos não são fixados.
- **Rationale**: vale tanto para a IA simulada quanto para `E2E_REAL_AI=1`. Os limites de HRV seguem `hrvToTirednessLevel` (spec 011): ≥60 normal, 40–59 cansado, <40 exausto.

## R6 — Ciclo de vida do Supabase na suíte

- **Decision**: `globalSetup` roda `supabase status -o env`. Se estiver no ar, reaproveita e não derruba no fim. Se não estiver, roda `supabase start` com os serviços não usados excluídos (studio, storage, realtime, imgproxy, edge-runtime, logflare, vector, supavisor, mailpit, postgres-meta) e roda `supabase stop` no teardown. Antes, checa `docker info` e `apps/api/data/genetics/genera.json`, e falha cedo com mensagem clara.
- **Rationale**: atende o edge case "ambiente já no ar" e o FR-010. Excluir serviços reduz tempo e memória (SC-002).

## R7 — CI

- **Decision**: `.github/workflows/ci.yml` em `pull_request` e `push` na `main`, com Node 22 e pnpm 9. O job `checks` roda `pnpm install --frozen-lockfile`, `pnpm typecheck` e `pnpm test`. O job `e2e` roda `pnpm test:e2e`, cujo `globalSetup` sobe o Supabase no Docker do runner. Não usa nenhum secret.
- **Rationale**: o runner `ubuntu-latest` já tem Docker. Sem secrets, PRs de fork também rodam e não há como tocar produção (US3, SC-006).
- **Alternatives considered**: `supabase/setup-cli` action (desnecessário com `pnpm dlx`); um job só (o e2e é mais lento e falha por motivos diferentes, e jobs separados deixam o resultado mais legível no PR).
