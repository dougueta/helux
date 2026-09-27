# Implementation Plan: Marcadores Genéticos na Tela DNA

**Branch**: `017-dna-traits` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-dna-traits/spec.md`

## Summary

`GET /genetic-profile` passa a devolver `GeneticProfileView` = `GeneticProfile` (inalterado) + `traits: GeneticTrait[]`. Os marcadores são extraídos do mesmo `genera.json` por uma função nova e pura do `@helux/genetics` (`parseGeneraTraits`), com as regras de escopo, nível, risco, deduplicação e ordem da spec. No web, a página `/dna` (componente de servidor) passa a devolver um estado discriminado (`ok` / `missing` / `error`) a partir do status HTTP, e o `DnaClient` renderiza marcadores tipados, os três estados sem dado e a fita com no máximo 4 genes. O hook órfão `useGeneticProfile` sai.

## Technical Context

**Language/Version**: TypeScript 5 (Node 20)
**Primary Dependencies**: Fastify (apps/api), Next.js 15 App Router + React 19 (apps/web), `@helux/genetics`, `@helux/types`
**Storage**: arquivo `apps/api/data/genetics/genera.json` (leitura; sem banco, sem migração)
**Testing**: Vitest (packages/genetics, apps/api com `app.inject`, apps/web com Testing Library + guarda do DS v2)
**Target Platform**: web responsiva (320 px+), API Node
**Project Type**: monorepo web-service + web app
**Performance Goals**: sem mudança perceptível; parse de ~35 KB por requisição, página com revalidate de 1 h
**Constraints**: só classes do `helux-v2.css` (guarda da 012); `GeneticProfile` não muda (prompts de IA e regras seguem iguais)
**Scale/Scope**: 1 usuário, 21 marcadores

## Constitution Check

| Princípio | Situação |
|---|---|
| I. Monorepo-First | OK — tudo em `packages/` e `apps/` existentes. |
| II. Test-First | OK — cada tarefa de código começa por teste vermelho (genetics → api → web). |
| III. Independent Deployability | OK — contrato novo é aditivo (`traits` extra); web antigo ignora, web novo trata ausência como "sem marcadores". |
| IV. Shared Code via Packages | OK — tipo `GeneticTrait`/`GeneticProfileView` em `packages/types`; extração em `packages/genetics`. |
| V. Simplicity | OK — uma função pura, um tipo, sem camadas novas; remove código morto. |

Sem violações. Reavaliado após o desenho: sem mudanças.

## Project Structure

### Documentation (this feature)

```text
specs/017-dna-traits/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/genetic-profile.md
└── tasks.md
```

### Source Code

```text
packages/types/src/genetic.ts                 # + GeneticTrait, GeneticProfileView
packages/genetics/src/traits.ts               # novo: parseGeneraTraits
packages/genetics/src/index.ts                # exporta parseGeneraTraits
packages/genetics/src/__tests__/traits.test.ts
apps/api/src/routes/genetic-profile.ts        # devolve { ...perfil, traits }
apps/api/src/__tests__/genetic-profile.test.ts
apps/web/src/app/dna/load-profile.ts          # novo: loadGeneticProfile() → DnaState
apps/web/src/app/dna/page.tsx                 # usa loadGeneticProfile
apps/web/src/app/dna/DnaClient.tsx            # estados + traits tipados + strandGenes
apps/web/src/__tests__/app/dna-load-profile.test.ts
apps/web/src/__tests__/app/dna-client.test.tsx
apps/web/src/hooks/useGeneticProfile.ts       # removido
```

**Structure Decision**: segue a estrutura existente; nenhuma pasta nova além de `load-profile.ts` junto da página.

## Complexity Tracking

Nenhuma.
