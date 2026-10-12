# Quickstart: Marcadores Genéticos na Tela DNA

## Testes direcionados

```bash
pnpm --filter @helux/genetics exec vitest run src/__tests__/traits.test.ts
pnpm --filter @helux/api exec vitest run src/__tests__/genetic-profile.test.ts
pnpm --filter @helux/web exec vitest run src/__tests__/app/dna-load-profile.test.ts src/__tests__/app/dna-client.test.tsx src/__tests__/design-system-guard.test.ts
```

## Verificação manual

1. `pnpm --filter @helux/api dev` e `curl localhost:3001/genetic-profile` → `traits` com 21 itens, WNT16 primeiro.
2. `pnpm --filter @helux/web dev`, Perfil → "Seu DNA": resumo "21 marcadores…", fita com 4 genes (WNT16, FTO, PPARD, CHRM2), 21 cards, âmbar nos de risco.
3. Renomear `apps/api/data/genetics/genera.json` → "Perfil genético não carregado". Parar a API → "Não foi possível carregar seu DNA".
4. Em 320 px: sem rolagem horizontal, rótulos da fita sem sobreposição.
