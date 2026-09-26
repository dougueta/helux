# Desenvolvimento local

Ambiente local integrado (spec 017): Supabase local com auth, RLS e todas as migrations, a API real e uma verificação de ponta a ponta com um comando.

## Pré-requisitos

- **Docker** rodando
- **Node ≥ 20** e **pnpm 9** (`corepack enable`)
- `pnpm install` na raiz

O Supabase CLI não precisa ser instalado: os scripts usam `pnpm dlx supabase@2.118.0`, com a versão fixada. A configuração local fica versionada em `supabase/config.toml` e contém só valores de desenvolvimento.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm db:start` | sobe o Supabase local e aplica as migrations de `supabase/migrations/` |
| `pnpm db:status` | mostra URL e chaves **locais** (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, ...) |
| `pnpm db:stop` | derruba o Supabase local (os dados ficam no volume) |
| `pnpm test` | testes unitários de todos os workspaces (mocks; não precisa de Docker) |
| `pnpm test:e2e` | verificação de ponta a ponta do fluxo de mesociclo (abaixo) |

Para rodar a API contra o banco local, copie `API_URL` e `ANON_KEY` de `pnpm db:status` para `apps/api/.env` como `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

Uma migration nova em `supabase/migrations/` entra com `pnpm dlx supabase@2.118.0 migration up`, sem recriar o ambiente.

## Verificação de ponta a ponta (`pnpm test:e2e`)

A suíte fica em `apps/api/e2e/` e:

1. checa os pré-requisitos (Docker, perfil genético em `apps/api/data/genetics/genera.json`);
2. reaproveita o Supabase local se ele já estiver no ar; se não estiver, sobe e **derruba no fim**;
3. sobe a API real (`buildApp()`) numa porta livre, apontando para o Supabase local;
4. troca a Anthropic por uma **IA simulada** determinística (mesociclo fixo de 4 sessões);
5. cria um usuário novo (cadastro real, RLS ativa) e percorre o roteiro do quickstart da spec 006:
   - **bootstrap**: o 1º acesso responde "gerando" e o seguinte traz a 1ª sessão;
   - **ajuste do dia** por HRV (75 → sem ajuste, 50 → "cansado", 30 → "exausto"), sem gravar mesociclo novo;
   - **dias pulados**: não avançam a fila;
   - **ciclo completo**: cada treino avança 1 sessão, e o último gera o próximo mesociclo.

Leva cerca de 35 s com as imagens em cache (a primeira execução baixa as imagens do Supabase).

### Variáveis

| Variável | Efeito |
|---|---|
| `E2E_REAL_AI=1` | usa a IA real (exige `ANTHROPIC_API_KEY`; tem custo). Por padrão a simulada é usada **mesmo se houver chave** |
| `E2E_KEEP_DB=1` | não derruba o Supabase no fim, mesmo que a suíte o tenha subido |
| `E2E_BACKGROUND_TIMEOUT_MS` | quanto esperar pelo trabalho em segundo plano da API (padrão 30000) |

### Lendo uma falha

- `[e2e] Docker não está rodando`, `[e2e] Perfil genético ausente ...`, `[e2e] E2E_REAL_AI=1 exige ANTHROPIC_API_KEY`: pré-requisito ausente; nada foi executado.
- `[e2e] SUPABASE_URL não é local`: proteção contra rodar em um projeto remoto.
- Falha num cenário: o nome do teste diz qual cenário quebrou. Para o trabalho em segundo plano, a mensagem traz `esperado:` e `obtido:`; por exemplo, `esperado: progresso 1/4` e `obtido: {"completed":0,"total":4}` significa que registrar o treino não marcou a sessão como concluída.

## CI

`.github/workflows/ci.yml` roda em todo PR (e em push na `main`):

- **checks**: `pnpm typecheck` e `pnpm test`;
- **e2e**: `pnpm test:e2e` (Docker do runner; sem secrets, sem IA real, sem tocar o projeto remoto).
