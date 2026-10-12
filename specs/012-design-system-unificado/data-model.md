# Data Model: Helux Design System v2 no App Web

Nenhuma mudança de dados persistidos, API ou tipos compartilhados (`@helux/types`). Os modelos abaixo são de **visualização**, internos ao `apps/web`.

## Fit (`lib/fit.ts`)

| Campo | Tipo | Regra |
|---|---|---|
| `value` | number 0–100 | vem do plano (`match` da variante ativa ou do exercício, spec 010) |
| `band` | `'alto' \| 'médio' \| 'baixo'` | ≥ 75, 50–74, < 50 |
| `color` | token | `--fit-hi`, `--fit-mid`, `--fit-lo` |
| `lit` | number | `round(n * value / 100)` traços acesos na hélice de n traços |

O Fit sempre aparece com o número (mono, na cor da faixa) e "fit" (12 px, `--text-dim`), e com `aria-label="fit genético {value} de 100, {band}"`.

## TipItem v2 (`lib/tipItems.ts`, research V4)

| Campo | Tipo | Regra |
|---|---|---|
| `text` | string | a orientação, sem o marcador extraído, sem o prefixo "ATENÇÃO:" e sem a pontuação final solta; nunca vazio |
| `gene` | `{ symbol: string; genotype?: string }` opcional | primeiro marcador da orientação: "(COL1A1 C,C)" ou "COL1A1 C,C" sem parênteses → `{symbol:'COL1A1', genotype:'C,C'}`; "(WNT16)" → `{symbol:'WNT16'}` |

Invariante: a concatenação de `text`, `symbol` e `genotype` contém todo o conteúdo significativo da entrada, exceto o prefixo "ATENÇÃO:" e os separadores.

## Linha de série (treino ativo, research V5)

| Campo | Origem | Regra |
|---|---|---|
| `no` | índice + 1 | numeração só de séries (sequência real) |
| `prev` | não existe hoje | sempre `null`, exibido como "—" (FR-024) |
| `weight`, `reps` | `exerciseStates[ei][si]` | steppers: kg ± 2,5, reps ± 1, mínimo 0 |
| `done` | `exerciseStates[ei][si].done` | ✓ alterna; desfazer permitido |
| série atual | UI local | `editingSetIndex ?? primeira com done=false`; nenhuma se todas estiverem feitas |

## Progresso do treino (barra por série)

- **Grupos**: um por exercício do plano, com tamanho igual ao número de séries daquele exercício.
- **Traços feitos**: por grupo, as séries com `done`.
- **Grupo atual**: `currentExerciseIndex`, com traços mais altos (14 px).
- **Valor ARIA** (`progressbar`): total de séries feitas sobre o total de séries.

## Resumo da conclusão (research V10)

| Métrica | Cálculo |
|---|---|
| Volume | Σ (kg × reps) das séries feitas, em kg, com `formatNumber` (ex.: "9.840") |
| Séries | feitas / total |
| Duração | minutos desde `startedAt` |
| Recordes | **oculto** (sem dado, FR-020) |

## Formatação numérica (`lib/format.ts`)

- `formatNumber(n, {decimals?})` usa `Intl.NumberFormat('pt-BR')`: vírgula decimal e ponto de milhar.
- Números inteiros saem sem casas decimais; peso e gordura do check-in saem com 1 casa ("82,0").

## Tokens

Fonte única: `:root` de `app/helux-v2.css` (research V1/V2), com os valores do handoff mais a escala de z-index e o `--safe-b` real. O `:root` de `globals.css` deixa de declarar cores; ali ficam o reset e, até a migração terminar, apenas os tokens antigos que ainda estão em uso.
