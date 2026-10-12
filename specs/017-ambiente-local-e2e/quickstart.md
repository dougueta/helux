# Quickstart: Ambiente Local Integrado e Verificação de Ponta a Ponta

## Pré-requisitos

- Docker rodando
- Node ≥ 20 e pnpm 9 (`corepack enable`)

## Verificação de ponta a ponta (um comando)

```bash
pnpm install
pnpm test:e2e
```

Na primeira vez, a suíte baixa as imagens do Supabase (alguns minutos). Se o Supabase não estiver no ar, ela sobe e derruba ao final. Se já estiver, reaproveita.

## Ambiente local para desenvolvimento

```bash
pnpm db:start     # sobe e aplica migrations
pnpm db:status    # URL e chaves locais → copie para apps/api/.env
pnpm db:stop
```

## Validação desta feature

1. Clone limpo + `pnpm install` + `pnpm test:e2e`: tudo verde (SC-001, SC-002).
2. Rodar `pnpm test:e2e` 5 vezes seguidas: sempre verde (SC-003).
3. Regressão proposital: comentar a chamada `markSessionCompleted` em `apps/api/src/services/plan-generation.service.ts` → o cenário "ciclo completo" falha, com esperado e obtido (SC-004). Reverter depois.
4. Abrir o PR: os checks `checks` e `e2e` aparecem e passam (SC-005).
