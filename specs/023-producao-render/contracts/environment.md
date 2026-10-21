# Contracts: Produção Pessoal no Render

## 1. Contrato de variáveis de ambiente da API

Fonte de verdade: `apps/api/src/config/env.ts`. Espelhadas em `.env.example` e `render.yaml`.

- Toda variável obrigatória em produção MUST aparecer em `.env.example` com um comentário de uso.
- Toda variável declarada em `render.yaml` MUST aparecer em `.env.example`.
- Variáveis secretas no `render.yaml` MUST usar `sync: false` (valor definido no painel, nunca no repositório).

**Falha na inicialização** (produção, variável ausente ou inválida):

```text
Variáveis de ambiente inválidas: SUPABASE_URL, CORS_ORIGIN
```

O processo encerra com código diferente de zero, e o Render marca o deploy como falho.

## 2. `GET /health`

Já existe em `apps/api/src/routes/health.ts`. Contrato mantido:

- Sem autenticação.
- Resposta `200` com corpo JSON de status.
- Usado pelo `healthCheckPath` do Render e pelo monitor externo.

## 3. CORS

- Em produção a origem permitida é exatamente `CORS_ORIGIN`.
- O cabeçalho `access-control-allow-origin` é sempre exatamente `CORS_ORIGIN`; nunca ecoa a origem de quem chamou. O navegador bloqueia qualquer outra origem porque o valor não coincide com a dela.
- Métodos liberados continuam `GET, HEAD, POST, PUT, DELETE`.

## 4. Retry do sync de saúde (mobile)

`POST {API_URL}/api/health/sync`:

| Situação | Comportamento |
|---|---|
| `2xx` | sucesso, sem retry |
| Erro de rede ou timeout (45 s) | retry |
| `502`, `503`, `504` | retry |
| Outros `4xx` e `5xx` | falha imediata, sem retry |
| 3 tentativas esgotadas | registra o erro; os dados já estão salvos localmente |

Espera entre tentativas: 2 s, 4 s, 8 s.

## 5. Workflow de CI

`.github/workflows/ci.yml`, disparado por `push` e `pull_request`, executa na ordem: instalar com lockfile congelado, `pnpm typecheck`, `pnpm test`. Qualquer etapa com falha marca a execução como falha.
