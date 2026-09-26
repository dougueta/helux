# Contrato: Comandos e Variáveis de Ambiente

## Comandos (raiz do repositório)

| Comando | Efeito | Saída / status |
|---|---|---|
| `pnpm db:start` | sobe o Supabase local e aplica todas as migrations pendentes | imprime URL e chaves locais; exit 0 |
| `pnpm db:stop` | derruba o Supabase local (mantém volume) | exit 0 |
| `pnpm db:status` | mostra URL e chaves locais (`-o env`) | exit ≠ 0 se não estiver no ar |
| `pnpm test:e2e` | roda a verificação de ponta a ponta (`@helux/api` → `vitest --config vitest.e2e.config.ts`) | relatório por cenário; exit 0 se tudo passar, ≠ 0 caso contrário |
| `pnpm test` | suíte padrão (mocks); **não** roda e2e nem exige Docker | inalterado |

## Variáveis de ambiente da suíte e2e

| Variável | Default | Efeito |
|---|---|---|
| `E2E_REAL_AI` | não definida | `1` → não sobe a IA simulada e usa `ANTHROPIC_API_KEY` real (falha cedo se ausente) |
| `E2E_KEEP_DB` | não definida | `1` → não derruba o Supabase no fim, mesmo que a suíte o tenha subido |

## Mensagens de falha antecipada (FR-010)

| Condição | Mensagem (prefixo) |
|---|---|
| Docker indisponível | `[e2e] Docker não está rodando` |
| `genera.json` ausente | `[e2e] Perfil genético ausente em apps/api/data/genetics/genera.json` |
| Supabase não é local | `[e2e] SUPABASE_URL não é local` |
| `E2E_REAL_AI=1` sem chave | `[e2e] E2E_REAL_AI=1 exige ANTHROPIC_API_KEY` |

## Contrato da IA simulada

`POST /v1/messages` → `200` com `{ type: "message", role: "assistant", content: [{ type: "text", text: "```json\n<plano>\n```" }], stop_reason: "end_turn", usage }`. Qualquer outra rota → `404`.
