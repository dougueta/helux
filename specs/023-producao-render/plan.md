# Implementation Plan: ProduÃ§Ã£o Pessoal no Render

**Branch**: `023-producao-render` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-producao-render/spec.md`

## Summary

Deixar o Helux publicÃ¡vel para uso pessoal: Render como Ãºnico destino da API (Vercel para o web), validaÃ§Ã£o das variÃ¡veis de ambiente na inicializaÃ§Ã£o, CORS restrito em produÃ§Ã£o, CI mÃ­nimo (typecheck + testes), retry do sync de saÃºde no mobile, e documentaÃ§Ã£o de deploy, backup e teto de gasto. Abordagem: mudanÃ§as pequenas e testÃ¡veis no cÃ³digo existente (sem novas dependÃªncias), mais um workflow de CI e um guia de deploy.

## Technical Context

**Language/Version**: TypeScript 5.4, Node 24 (igual ao `apps/api/Dockerfile`)  
**Primary Dependencies**: Fastify 5 + `@fastify/cors`, `zod` (jÃ¡ na API), Expo/React Native (mobile), Next.js (web). Nenhuma dependÃªncia nova.  
**Storage**: Supabase (Postgres) jÃ¡ existente; sem novas tabelas  
**Testing**: Vitest em `apps/api`, `apps/web`, `apps/mobile`  
**Target Platform**: Render (API em Docker, plano gratuito), Vercel (web), app mobile em build de desenvolvimento  
**Project Type**: monorepo pnpm + Turborepo (web-service + web + mobile)  
**Performance Goals**: sem atraso de inicializaÃ§Ã£o acima de 5 s em uso normal (SC-003), via ping externo  
**Constraints**: plano gratuito do Render hiberna apÃ³s 15 min parado; 750 h/mÃªs; sem staging  
**Scale/Scope**: um Ãºnico usuÃ¡rio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| PrincÃ­pio | AvaliaÃ§Ã£o |
|---|---|
| I. Monorepo-First | OK. Tudo no repositÃ³rio (`apps/`, `.github/`, `docs/`). |
| II. Test-First | OK. Cada mudanÃ§a de cÃ³digo tem teste escrito antes (ver `tasks.md`). Config de deploy Ã© verificada por testes de arquivo, como o `dockerfile.test.ts` existente. |
| III. Independent Deployability | OK. Declara explicitamente as variÃ¡veis de runtime da API; web e API continuam implantÃ¡veis separadamente. |
| IV. Shared Code via Packages | OK. NÃ£o hÃ¡ lÃ³gica duplicada entre workspaces; o retry vive sÃ³ no mobile. |
| V. Simplicity | OK. Sem biblioteca de config, de retry ou de rate limit. ValidaÃ§Ã£o com `zod` jÃ¡ presente. |

Nenhuma violaÃ§Ã£o, entÃ£o a tabela de Complexity Tracking fica vazia. Reavaliado apÃ³s o design da Phase 1: continua sem violaÃ§Ãµes.

## Project Structure

### Documentation (this feature)

```text
specs/023-producao-render/
â”œâ”€â”€ plan.md
â”œâ”€â”€ research.md
â”œâ”€â”€ data-model.md
â”œâ”€â”€ quickstart.md
â”œâ”€â”€ contracts/
â”‚   â””â”€â”€ environment.md
â””â”€â”€ tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
.github/workflows/ci.yml                      # novo: typecheck + test (US3)
.env.example                                  # completo (US2)
render.yaml                                   # + SUPABASE_SERVICE_ROLE_KEY (US1/US2)
fly.toml                                      # removido (US2)
docs/deploy.md                                # novo: passo a passo, ping, backup, teto de gasto (US1/US4/US5)

apps/api/src/
â”œâ”€â”€ config/env.ts                             # novo: loadEnv() validado com zod (US1)
â”œâ”€â”€ index.ts                                  # chama loadEnv() antes de buildApp()
â”œâ”€â”€ app.ts                                    # CORS recebe a origem validada
â””â”€â”€ __tests__/
    â”œâ”€â”€ env.test.ts                           # novo
    â”œâ”€â”€ cors.test.ts                          # + casos de produÃ§Ã£o
    â””â”€â”€ deploy-config.test.ts                 # novo: Render Ãºnico, .env.example, CI

apps/mobile/src/services/
â”œâ”€â”€ health-sync.service.ts                    # retry com backoff + checagem de res.ok (US4)
â””â”€â”€ ../__tests__/health-sync.service.test.ts  # existente: + casos de retry
```

**Structure Decision**: alteraÃ§Ãµes cirÃºrgicas nos workspaces existentes. A validaÃ§Ã£o de ambiente fica em `apps/api/src/config/env.ts`, e o retry fica no prÃ³prio serviÃ§o de sync do mobile, que Ã© o Ãºnico chamador. NÃ£o se cria pacote compartilhado, porque nÃ£o hÃ¡ segundo consumidor.

## Complexity Tracking

Sem violaÃ§Ãµes a justificar.
