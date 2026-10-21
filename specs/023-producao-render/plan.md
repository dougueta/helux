# Implementation Plan: Produção Pessoal no Render

**Branch**: `023-producao-render` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-producao-render/spec.md`

## Summary

Deixar o Helux publicável para uso pessoal: Render como único destino da API (Vercel para o web), validação das variáveis de ambiente na inicialização, CORS restrito em produção, CI mínimo (typecheck + testes), retry do sync de saúde no mobile, e documentação de deploy, backup e teto de gasto. Abordagem: mudanças pequenas e testáveis no código existente (sem novas dependências), mais um workflow de CI e um guia de deploy.

## Technical Context

**Language/Version**: TypeScript 5.4, Node 24 (igual ao `apps/api/Dockerfile`)  
**Primary Dependencies**: Fastify 5 + `@fastify/cors`, `zod` (já na API), Expo/React Native (mobile), Next.js (web). Nenhuma dependência nova.  
**Storage**: Supabase (Postgres) já existente; sem novas tabelas  
**Testing**: Vitest em `apps/api`, `apps/web`, `apps/mobile`  
**Target Platform**: Render (API em Docker, plano gratuito), Vercel (web), app mobile em build de desenvolvimento  
**Project Type**: monorepo pnpm + Turborepo (web-service + web + mobile)  
**Performance Goals**: sem atraso de inicialização acima de 5 s em uso normal (SC-003), via ping externo  
**Constraints**: plano gratuito do Render hiberna após 15 min parado; 750 h/mês; sem staging  
**Scale/Scope**: um único usuário

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Monorepo-First | OK. Tudo no repositório (`apps/`, `.github/`, `docs/`). |
| II. Test-First | OK. Cada mudança de código tem teste escrito antes (ver `tasks.md`). Config de deploy é verificada por testes de arquivo, como o `dockerfile.test.ts` existente. |
| III. Independent Deployability | OK. Declara explicitamente as variáveis de runtime da API; web e API continuam implantáveis separadamente. |
| IV. Shared Code via Packages | OK. Não há lógica duplicada entre workspaces; o retry vive só no mobile. |
| V. Simplicity | OK. Sem biblioteca de config, de retry ou de rate limit. Validação com `zod` já presente. |

Nenhuma violação, então a tabela de Complexity Tracking fica vazia. Reavaliado após o design da Phase 1: continua sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/023-producao-render/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── environment.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
.github/workflows/ci.yml                      # novo: typecheck + test (US3)
.env.example                                  # completo (US2)
render.yaml                                   # + SUPABASE_SERVICE_ROLE_KEY (US1/US2)
fly.toml                                      # removido (US2)
docs/deploy.md                                # novo: passo a passo, ping, backup, teto de gasto (US1/US4/US5)

apps/api/src/
├── config/env.ts                             # novo: loadEnv() validado com zod (US1)
├── index.ts                                  # chama loadEnv() antes de buildApp()
├── app.ts                                    # CORS recebe a origem validada
└── __tests__/
    ├── env.test.ts                           # novo
    ├── cors.test.ts                          # + casos de produção
    └── deploy-config.test.ts                 # novo: Render único, .env.example, CI

apps/mobile/src/
├── services/health-sync.service.ts           # retry com backoff + checagem de res.ok (US4)
└── __tests__/health-sync.service.test.ts     # existente: + casos de retry
```

**Structure Decision**: alterações cirúrgicas nos workspaces existentes. A validação de ambiente fica em `apps/api/src/config/env.ts`, e o retry fica no próprio serviço de sync do mobile, que é o único chamador. Não se cria pacote compartilhado, porque não há segundo consumidor.

## Complexity Tracking

Sem violações a justificar.
