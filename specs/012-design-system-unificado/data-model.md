# Data Model: Design System Unificado no App Web

Nenhuma mudança de dados persistidos, tipos compartilhados (`@helux/types`) ou contrato da API. Os modelos abaixo são de **visualização**, internos ao `apps/web`.

## TipItem (`apps/web/src/lib/tipItems.ts`)

| Campo | Tipo | Regra |
|---|---|---|
| `text` | `string` | uma orientação prática, sem as referências genéticas e sem pontuação final solta; nunca vazio |
| `markers` | `string[]` | referências genéticas extraídas da orientação, sem parênteses (ex.: `"WNT16"`, `"COL1A1 C,C"`); pode ser vazio |

- **Entrada**: `parseTipItems(text: string | null | undefined): TipItem[]`.
- **Invariantes**:
  - texto vazio ou nulo devolve `[]`;
  - texto não vazio devolve pelo menos 1 item;
  - juntando todos os `text` e todos os `markers`, todo o conteúdo significativo da entrada está presente. Nenhuma palavra se perde; só a pontuação separadora e os parênteses dos marcadores somem.

## Tokens do tema (`:root` em `apps/web/src/app/globals.css`)

Fonte única de verdade (FR-001, FR-005):

| Grupo | Tokens |
|---|---|
| Fundos e superfícies | `--bg`, `--surface-1`, `--surface-2`, `--surface-3` |
| Bordas | `--hairline`, `--hairline-2` |
| Texto | `--text`, `--text-dim`, `--text-faint` |
| Destaque | `--accent`, `--accent-ink`, `--accent-soft`, `--accent-line`, `--accent-glow` |
| Estados | `--warn`, `--danger` |
| Raios | `--r-card`, `--r-sm`, `--r-pill` |

**Mapeamento das classes antigas para os tokens**, usado na migração:

| Classe antiga | Token |
|---|---|
| `bg-helux-dark` | `--bg` |
| `bg-helux-surface` | `--surface-1` |
| `text-helux-accent` | `--accent` |
| `bg-helux-accent` | `--accent` com texto `--accent-ink` |
| `text-white` | `--text` |
| `text-helux-muted` (inexistente) | `--text-dim` |
| `border-helux-border` (inexistente) | `--hairline` |

- `text-helux-muted` vira `--text-dim` porque é o texto secundário usado nas telas de referência. O `--text-faint` fica para rótulos e metadados, como já é hoje.
- **Tokens novos** (research R5.1): `--success` (já era usado sem ter sido declarado) e `--demo-bg-1`, `--demo-bg-2` e `--demo-bg-3`, os fundos da área de demonstração do exercício. `#e5484d` e `#f87171` passam a usar `--danger`.
