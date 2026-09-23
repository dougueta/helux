# Contratos de UI: Design System Unificado

Contratos internos do `apps/web`. Não há API externa nova.

## `parseTipItems` — `apps/web/src/lib/tipItems.ts`

```ts
export interface TipItem { text: string; markers: string[] }
export function parseTipItems(text: string | null | undefined): TipItem[]
```

Casos que o teste precisa cobrir:

- **Texto de referência:**
  - Entrada: "Desça até paralelo ou abaixo — carga óssea controlada favorece densidade (WNT16). Joelhos alinhados com os dedos dos pés; evite valgismo para proteger o ligamento cruzado (COL1A1 C,C). Descanso 90-120s entre séries."
  - Resultado: 4 itens:
    - `{text: "Desça até paralelo ou abaixo — carga óssea controlada favorece densidade", markers: ["WNT16"]}`
    - `{text: "Joelhos alinhados com os dedos dos pés", markers: []}`
    - `{text: "evite valgismo para proteger o ligamento cruzado", markers: ["COL1A1 C,C"]}`
    - `{text: "Descanso 90-120s entre séries", markers: []}`
- **Números com ponto:** "Progressão: +2.5kg quando completar 10 reps" não é dividido no "2.5".
- **Parêntese que não é gene:** "(usado em 2026-08-29)" continua no texto.
- **Uma frase só:** vira 1 item.
- **Vazio, nulo ou só espaços:** `[]`.
- **Nada se perde:** todo o conteúdo significativo da entrada aparece em algum `text` ou `markers`.

## `ExecutionTips` — `apps/web/src/components/workout/ExecutionTips.tsx`

```ts
export function ExecutionTips(props: { text: string | null | undefined; variant?: 'inline' | 'panel' }): JSX.Element | null
```

- Com `text` vazio, retorna `null` (sem bloco vazio).
- Com 1 item, renderiza o texto sem marcador de lista.
- Com mais de 1 item, renderiza uma lista (`<ul>`, com semântica de lista acessível) com uma orientação por `<li>`.
- Cada marcador aparece como `Chip` junto ao item. O texto do marcador fica acessível, por exemplo com `aria-label="marcador genético WNT16"`.
- Os dois visuais:
  - `inline`: bloco compacto da tela de treino, no lugar do chip verde atual;
  - `panel`: aba Execução do `ExerciseSheet`.
- É usado tanto para `exercise.notes` quanto para a justificativa genética de uma variante (`display.tip`, spec 010).

## `Card` — `apps/web/src/components/ui/Card.tsx`

```ts
export function Card(props: { children: ReactNode; padding?: number | string; as?: 'div' | 'section' | 'article'; style?: CSSProperties } & HTMLAttributes<HTMLElement>): JSX.Element
```

- Visual: fundo `var(--surface-1)`, borda `1px solid var(--hairline)`, raio `var(--r-card)`, padding padrão de 16.
- O `style` passado é mesclado por último, para permitir ajustes pontuais.

## `Skeleton` — `apps/web/src/components/ui/Skeleton.tsx`

```ts
export function Skeleton(props: { width?: number | string; height: number | string; radius?: string; style?: CSSProperties }): JSX.Element
```

- Visual: fundo `var(--surface-1)` com a animação `helux-pulse`, definida em `globals.css`.
- Acessibilidade: tem `aria-hidden="true"`. A tela de carregamento que usa o componente mantém um texto ou `aria-busy` para leitores de tela.

## Teste de guarda — `apps/web/src/__tests__/design-system-guard.test.ts`

Falha, apontando arquivo e linha, quando encontra em `apps/web/src/**/*.{ts,tsx}` (fora de `__tests__`):
1. um `className` com qualquer valor. **Exceção**: o `<html>` de `app/layout.tsx`, com as variáveis do `next/font`;
2. um `var(--x)` cujo `--x` não está declarado no `:root` de `app/globals.css`;
3. uma cor hexadecimal literal fora de `app/globals.css`.
