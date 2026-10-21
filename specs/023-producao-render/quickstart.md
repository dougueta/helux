# Quickstart: validar a feature 023

O passo a passo completo de deploy fica em `docs/deploy.md` (criado na implementação). Este roteiro valida a feature.

## Validação local (antes do deploy)

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

Verificar a validação de ambiente:

```powershell
# Deve falhar listando as variáveis que faltam
$env:NODE_ENV = "production"; pnpm --filter @helux/api start
```

## Validação em produção

1. Render: criar o serviço pelo `render.yaml` e preencher os segredos listados em `.env.example`.
2. Vercel: definir `NEXT_PUBLIC_API_URL` com a URL do Render, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. `GET {URL_DA_API}/health` responde `200`.
4. Login no web publicado e abertura do app sem erro de CORS.
5. UptimeRobot: monitor HTTP em `/health` a cada 5 minutos.
6. Confirmar que as migrations de `supabase/migrations/` estão aplicadas no banco de produção.
7. Rodar o backup (`pg_dump`) e restaurar num banco vazio descartável.
8. Conferir o teto de gasto no console da Anthropic.
9. Varrer o repositório e o histórico por segredos (comando em `docs/deploy.md`).

## Critérios

Correspondem a SC-001 a SC-006 de [spec.md](./spec.md).
