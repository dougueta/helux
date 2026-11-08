# @helux/exercises

Catálogo único de tudo o que aparece num treino: exercícios de força, itens de preparação e mobilidade, e modalidades de cardio. Cada item tem demonstração e orientação próprias. Web e API leem daqui (spec 028).

Pacote puro: sem React, sem SDK de IA e sem rede. Depende só de `@helux/types`.

## O que tem aqui

| Arquivo | Conteúdo |
|:---|:---|
| `src/strength.ts` | Os 122 exercícios de força. Os nomes são congelados por teste. |
| `src/preparation.ts` | Aquecimento, volta à calma e mobilidade. |
| `src/cardio-guidance.ts` | Orientação e demonstração das modalidades de `CARDIO_BANK`. |
| `src/demos/` | Movimentos base e a demonstração (`DemoSpec`) de cada item, por família. |
| `src/engine/` | Motor puro: interpolação por ângulo, apoios fixos, modos de repetição e medidas das cenas. |
| `src/review/pending.json` | Itens ainda não aprovados. **A lista só diminui.** |
| `src/review/approvals.json` | `id → hash` do conteúdo aprovado (demonstração resolvida + orientação). |
| `src/review/check.ts`, `hash.ts` | A trava, usada pelos testes e pelos scripts. Fica fora do bundle da web. |

A web importa só de `@helux/exercises` (o `index.ts`). A demonstração é carregada sob demanda por `loadDemo(id)`. `@helux/exercises/src/gallery` é exclusivo da galeria `/dev/demos` e dos scripts.

## Como adicionar um item (FR-021)

Existe um único caminho, e o CI falha se faltar alguma etapa.

1. **Dados**: acrescente o item no catálogo certo (`strength.ts`, `preparation.ts` ou `cardio-guidance.ts`) com `id` estável e `name` único em todos os catálogos. Em força, preencha também `gear` (implemento real), `muscles` explícitos e `guidance` com `setup`, `steps` e `commonError`. Frases com até 110 caracteres. "Boa opção quando…" vai em `context`, nunca nos passos.
2. **Demonstração**: na família em `src/demos/<família>.ts`, reaproveite um movimento base ou crie um novo, e registre um `DemoSpec` com o id do item. Se o item compartilha a base com outro e a diferença não aparece na figura, a `caption` é obrigatória e precisa ser diferente.
3. **Teste**: `pnpm --filter @helux/exercises test`. Sem aprovação, o teste falha com `"<id>: falta aprovação"`. Isso é o esperado até a revisão.
4. **Galeria**: confira o item em `http://localhost:3000/dev/demos?ids=<id>` (só fora de produção).
5. **PR**: o workflow `demo-evidence.yml` comenta no PR com o GIF e o cartão de cada item alterado.
6. **Aprovação**: depois que o dono aprovar no PR, rode `pnpm demos:approve <ids...>` só com os ids aprovados e faça o commit de `approvals.json`.

## Regras da lista de pendências

- `pending.json` só pode diminuir. Item novo **nunca** entra nela: nasce completo e aprovado. `pnpm demos:check-pending` barra isso no CI.
- Item pendente continua aparecendo como hoje (animação antiga ou aviso de indisponibilidade).
- Alterar um item aprovado, ou uma base usada por ele, muda o hash. O teste volta a falhar até uma nova aprovação no mesmo PR. O item não pode voltar para a lista de pendências.

## Comandos

```bash
pnpm --filter @helux/exercises test          # invariantes, motor e trava; loga aprovados/total por catálogo
pnpm demos:evidence [--ids a,b] [--out dir]  # quadros, cartão e GIF (exige a web em modo mock rodando)
pnpm demos:approve <ids...> | --all-in-pr    # grava o hash aprovado e tira da lista de pendências
pnpm demos:check-pending [--base origin/main]
```
