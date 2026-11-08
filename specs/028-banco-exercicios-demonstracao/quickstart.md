# Quickstart: Banco de exercícios e demonstrações

## Rodar os testes

```bash
pnpm install
pnpm --filter @helux/exercises test     # catálogo, motor, variantes, resolvedor
pnpm --filter @helux/ai test            # esquema, variantes, planejador
pnpm --filter @helux/web test           # telas
pnpm typecheck && pnpm test             # o mesmo que o CI
```

## Abrir a galeria

```bash
# apps/web/.env.local: NEXT_PUBLIC_DATA_SOURCE=mock
pnpm --filter @helux/web dev
# http://localhost:3000/dev/demos
```

A galeria não existe em produção.

## Adicionar um exercício ou item

1. Crie a entrada em `strength.ts` ou `preparation.ts`, com `id`, dados e `guidance`.
2. Reaproveite ou crie um movimento base em `demos/` e adicione o `DemoSpec`.
3. Confira na galeria. Rode `pnpm --filter @helux/exercises test`, que aponta o que falta.
4. Abra o PR. A evidência é publicada no comentário.
5. Depois da aprovação do dono, rode `pnpm demos:approve <id>` e faça commit.

**Não adicione o item a `pending.json`.** Essa lista só existe para a transição e o CI recusa adições.

Exercícios de força também passam a aparecer como variantes, e os de preparação no esquema da IA, sem outra alteração.

## Produzir um lote

1. Escolha a família, com no máximo 15 itens.
2. Escreva os movimentos e as orientações, sem apagar o id de `pending.json`.
3. Abra o PR e aguarde a revisão.
4. Rode `demos:approve` só com os ids aprovados.
5. Registre as correções de dados em `bank-review.md`.

## Atualizar as variantes dos planos ativos

Rodar uma única vez, depois do deploy da regra nova:

```bash
pnpm --filter @helux/api exec tsx scripts/refresh-plan-variants.ts            # simulação
pnpm --filter @helux/api exec tsx scripts/refresh-plan-variants.ts --apply --backup <dir-fora-do-repo>
```

**`--apply` só com a confirmação do dono do produto.** O backup contém dados pessoais e nunca pode entrar no repositório, que é público.

## Roteiro manual

Em modo mock, com a resolução de celular:

1. **Força**: abra um treino e "Ver execução". Confira demonstração, passos, erro comum e músculos.
2. **Comparação**: Cadeira Abdutora e Adutora mostram movimentos opostos; Pullover é diferente de Puxada Alta.
3. **Variante**: em Rosca Direta, a aba só traz bíceps. Use "Ver" e "Voltar às variantes": o treino não muda. Depois use "Trocar": tudo reflete a variante.
4. **Mapa muscular**: Mesa Flexora destaca o posterior de coxa.
5. **Preparação**: abra um alongamento e uma série de aproximação.
6. **Cardio**: abra a bike e confira o movimento contínuo e a zona.
7. **Plano antigo**: um item de nome desconhecido mostra o aviso, nunca outra animação.
8. **Movimento reduzido**: com a preferência ativa, a demonstração fica parada em uma pose representativa.

## Conferir os critérios de sucesso

| Critério | Como verificar |
|:---|:---|
| SC-001, SC-009 | `pending.json` vazio e testes de invariantes verdes |
| SC-002 | Testes da `ExerciseSheet` e roteiro 3 |
| SC-003 | Invariante de variantes |
| SC-004 | Invariante de orientação |
| SC-005 | Item sem demonstração, sem orientação ou sem aprovação faz o teste falhar |
| SC-006 | Sorteio de 20 itens na galeria sem o nome, avaliado pelo dono |
| SC-007 | Roteiro 1, com medição no navegador |
| SC-008 | Abrir plano e histórico antigos em homologação; suíte de progressão verde |
| SC-010 | Teste de geração com a IA simulada; avaliação real com autorização do dono |
