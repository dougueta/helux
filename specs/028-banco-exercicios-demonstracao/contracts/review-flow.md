# Contrato: revisão por PR

## Scripts

| Comando | O que faz | Falha quando |
|:---|:---|:---|
| `pnpm demos:evidence [--ids a,b] [--out dir]` | Gera os arquivos dos itens alterados, ou dos indicados | Item sem demonstração, erro de captura |
| `pnpm demos:approve <ids...>` / `--all-in-pr` | Grava o hash em `approvals.json` e tira o id de `pending.json` | Id inexistente ou sem demonstração |
| `pnpm demos:check-pending [--base origin/main]` | Compara `pending.json` com a base | Algum id foi adicionado |

Item alterado é aquele cujo hash atual difere do aprovado e que tem `demo`. Itens pendentes sem `demo` são ignorados.

## Evidência por item

| Arquivo | Conteúdo |
|:---|:---|
| `<id>/start.png`, `mid.png`, `end.png` | Quadros em 390 × 844 no tema padrão, com `deviceScaleFactor` 2 |
| `<id>/demo.gif` | Um ciclo completo, com 12 quadros por segundo e no máximo 2 MB |
| `<id>/card.png` | Nome, os 3 quadros e as orientações, para revisão rápida |

As fases são fixadas pelo parâmetro `phase`, para que a saída seja determinística.

## Workflow `demo-evidence.yml`

- **Dispara em**: `pull_request` (`opened`, `synchronize`, `reopened`) com mudança em `packages/exercises/**` ou `apps/web/src/components/workout/ExerciseDemo.tsx`.
- **Não roda em**: PR de fork.
- **Permissões**: `contents: write`, `pull-requests: write`, somente neste workflow.
- **Passos**: instala o Chromium, sobe a web em modo mock, roda `demos:evidence`, publica na branch órfã `demo-evidence/pr-<n>` e cria ou atualiza o comentário marcado com `<!-- demo-evidence -->`.
- **Sem itens alterados**: o comentário informa isso e nada é publicado.
- **Em `closed`**: apaga a branch `demo-evidence/pr-<n>`.
- **Falha da evidência**: o job falha de forma visível. O PR não deve ser aprovado sem evidência.

## Comentário no PR

```markdown
<!-- demo-evidence -->
## Demonstrações para revisão: 12 itens
Commit: abc1234. Lote: Puxar na vertical.

| Item | Demonstração | Quadros |
|:---|:---|:---|
| Pullover (Halteres) | GIF | cartão |

Para aprovar, responda com "aprovar tudo", ou "aprovar: id, id".
O que não for citado continua pendente.
```

Lotes acima de 15 itens recebem um aviso no comentário, para manter a revisão viável (FR-034), sem bloquear o CI. A alteração de um movimento base pode exigir mais itens de uma vez, porque todos os que o usam voltam a precisar de aprovação.

## Fluxo de aprovação

1. O PR traz o lote e recebe o comentário com a evidência.
2. O dono revisa pelo celular ou computador e responde quais itens aprova, ou pede ajustes.
3. Quem está implementando roda `demos:approve` só para os itens aprovados e faz commit.
4. O CI confere o hash. Se o item mudar depois da aprovação, ele falha até ser aprovado de novo.
5. Só o dono faz o merge. O item aprovado sai da lista de pendências e aparece no app após o deploy.

Itens não aprovados continuam em `pending.json`. O código da demonstração pode entrar no `main`, mas a tela segue usando o que existe hoje até a aprovação.

## CI (`ci.yml`)

```yaml
- run: pnpm demos:check-pending --base origin/${{ github.base_ref }}
  if: github.event_name == 'pull_request'
```

Requer `fetch-depth: 0`, ou o fetch da branch base. A verificação dos itens fora de `pending` faz parte de `pnpm test`.
