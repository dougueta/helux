# Implementation Plan: Ambiente Local Integrado e Verificação de Ponta a Ponta

**Branch**: `017-ambiente-local-e2e` (desenvolvido em `claude/happy-shannon-7g1mqe`) | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-ambiente-local-e2e/spec.md`

## Summary

Versionar `supabase/config.toml`, para o Supabase local subir sem `init`, e criar scripts na raiz (`db:start`, `db:stop`, `db:status`, `test:e2e`) usando o Supabase CLI fixado via `pnpm dlx`. A verificação de ponta a ponta vira uma suíte Vitest separada dentro de `apps/api` (`apps/api/e2e/`, com config própria e fora do `pnpm test` padrão). Ela sobe a API real em processo (`buildApp()` numa porta efêmera), aponta a API para o Supabase local (auth real via signup, RLS ativa) e troca a Anthropic por um servidor HTTP local determinístico, via `ANTHROPIC_BASE_URL`, salvo com opção explícita `E2E_REAL_AI=1`. A suíte cobre os quatro cenários do quickstart da spec 006. Um workflow do GitHub Actions roda typecheck, testes e a suíte e2e em todo PR.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22 (CI) / >=20 (engines)
**Primary Dependencies**: Vitest 3 (já usado), Fastify 5 (`buildApp`), `@supabase/supabase-js` (já dependência da API), Supabase CLI 2.118.0 via `pnpm dlx` (sem nova dependência instalada), `node:http` para a IA simulada
**Storage**: Supabase local (Postgres + GoTrue), com as migrations existentes em `supabase/migrations/`
**Testing**: Vitest. Suíte padrão (`pnpm test`, com mocks) intocada e suíte `test:e2e` separada
**Target Platform**: máquina de desenvolvimento com Docker, sessões Claude Code na nuvem e runner `ubuntu-latest` do GitHub Actions
**Project Type**: ferramental de desenvolvimento/teste para o monorepo (API web-service)
**Performance Goals**: suíte e2e em até 5 min com imagens em cache (SC-002)
**Constraints**: nunca tocar o projeto Supabase remoto nem chamar a IA real sem opção explícita (FR-002, FR-007, SC-006). Não quebrar `pnpm install`, porque Vercel e Docker instalam na raiz, então o CLI não entra como devDependency (ver research). Não alterar o comportamento da API
**Scale/Scope**: 1 suíte, cerca de 8 casos sequenciais; 1 workflow de CI com 2 jobs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Monorepo-First | ✅ tudo neste repositório; a suíte e2e fica no workspace que ela testa (`apps/api`) |
| II. Test-First | ✅ a suíte e2e é escrita primeiro e falha (RED) sem o harness e a config. O harness (IA simulada, verificação de pré-requisitos) tem testes unitários próprios escritos antes |
| III. Independent Deployability | ✅ nenhuma mudança em runtime; a imagem da API não depende do e2e (a pasta `e2e/` só é copiada como arquivo morto, e o CMD continua `src/index.ts`) |
| IV. Shared Code via Packages | ✅ o harness só é usado por `apps/api`; não há segundo consumidor, então não se extrai pacote (YAGNI) |
| V. Simplicity | ✅ sem novo workspace; o CLI é chamado via `pnpm dlx` fixado em vez de um wrapper próprio; a API roda em processo em vez de um processo filho |

Re-check pós-design: ✅ sem violações; Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/017-ambiente-local-e2e/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── commands.md      # contrato dos comandos e variáveis de ambiente
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/
├── config.toml                  # NOVO — config local versionada (project_id "helux")
└── .gitignore                   # NOVO — ignora .branches/.temp/.env locais

package.json                     # + scripts db:start, db:stop, db:status, test:e2e

apps/api/
├── vitest.config.ts             # + exclude 'e2e/**' (suíte padrão continua só com mocks)
├── vitest.e2e.config.ts         # NOVO — include e2e/**/*.e2e.ts, globalSetup, timeouts longos
├── package.json                 # + scripts test:e2e, typecheck inclui e2e
└── e2e/
    ├── tsconfig.json            # NOVO — typecheck do e2e
    ├── fake-anthropic.ts        # NOVO — servidor HTTP determinístico (mesociclo fixo + contador)
    ├── fake-anthropic.test.ts   # NOVO — unit test da IA simulada (roda na suíte padrão)
    ├── prerequisites.ts         # NOVO — checa docker, genera.json; lê `supabase status -o env`
    ├── prerequisites.test.ts    # NOVO — unit test (roda na suíte padrão)
    ├── global-setup.ts          # NOVO — garante Supabase no ar (sobe e derruba se foi ele que subiu)
    └── mesocycle-flow.e2e.ts    # NOVO — os 4 cenários do quickstart 006

.github/workflows/ci.yml         # NOVO — jobs "checks" (typecheck+test) e "e2e"
docs/desenvolvimento-local.md    # NOVO — pré-requisitos, comandos, como ler falhas
specs/006-mesociclo-treino-backend/quickstart.md  # aponta para `pnpm test:e2e`
```

**Structure Decision**: a suíte fica em `apps/api/e2e/` porque ela exercita a API e reaproveita `buildApp()` e as dependências da API. Os unit tests do harness ficam ao lado dele e entram na suíte padrão (o `exclude` só tira `*.e2e.ts`).

## Complexity Tracking

Sem violações.
