# Contratos de UI: Design System v2

Os componentes ficam em `apps/web/src/components/ui/` e espelham `design_handoff_helux_v2/v2/v2-core.jsx`, usando as classes de `app/helux-v2.css`. Cada item abaixo diz a **API** e o **que o teste precisa verificar** (TDD).

## Botões

- **`Button`**: `{ kind?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'md'|'lg'; block?; icon?: IconName; iconRight?: IconName; loading?; disabled? } & ButtonHTMLAttributes`.

  O teste verifica:
  - as classes `hx-btn`, `hx-btn--{kind}`, `--lg` e `--block`;
  - com `loading`: `aria-busy="true"`, a classe `is-loading` e o botão sem efeito ao clicar;
  - com `disabled`: o atributo `disabled`;
  - no `primary`, o `iconRight="play"` fica num círculo (`hx-btn-ico`).
- **`IconButton`**: `{ icon: IconName; label: string; bare? }`.

  O teste verifica o `aria-label` obrigatório, 44×44 e a classe `hx-icbtn--bare` quando `bare`.

## Informação

- **`Tag`**: `{ kind?: 'outline'|'warn' }`.

  O teste verifica que é um `<span>` sem papel interativo e as classes `hx-tag` e `hx-tag--{kind}`.
- **`GeneTag`**: `{ symbol; genotype?; warn? }`.

  O teste verifica:
  - `<i>` para o símbolo, em itálico pela classe;
  - o genótipo como texto ao lado;
  - `hx-gtag--warn` quando `warn`;
  - o `aria-label` "marcador genético {symbol} {genotype}".
- **`Helix`**: `{ value; n; h; w?; gap?; sequential?; delayMs? }`.

  O teste verifica:
  - a quantidade de `<rect>` igual a `n`;
  - a quantidade de acesos igual a `round(n*value/100)`;
  - as alturas seguindo `|cos|`, com mínimo de 2;
  - com `sequential`, cada traço com um atraso crescente.
- **`Fit`**: `{ value; size?: 'sm'|'md'|'lg'; label? }`.

  O teste verifica o `aria-label` com número e faixa, o número na cor da faixa e o texto "fit".

## Seletores e entrada

- **`Segmented`**: `{ options: (string|{value,label})[]; value; onChange; tabs?; label; disabled? }`.

  O teste verifica:
  - `role="group"` com `aria-label`, e botões com `aria-pressed`;
  - com `tabs`: `role="tablist"`, `role="tab"` e `aria-selected`;
  - clique chama `onChange`.
- **`Stepper`**: `{ value; unit; step; min?=0; onChange; label; disabled?; error? }`.

  O teste verifica:
  - − e + com `aria-label` ("diminuir kg" e "aumentar kg");
  - o mínimo respeitado;
  - o valor com `aria-live="polite"`, formatado em pt-BR (82,5);
  - a classe `is-err` quando há erro.
- **`Field`**: `{ label; value; onChange; unit?; help?; error?; disabled? }`.

  O teste verifica:
  - label associado ao input;
  - `inputMode="decimal"`;
  - a unidade fixa ao lado;
  - com `error`: `aria-invalid` e a mensagem ligada por `aria-describedby`.

## Treino

- **`Check`**: `{ on; pop?; big?; onClick; label? }`.

  O teste verifica `aria-pressed={on}` e as classes `is-on` e `is-pop`. Tamanho de 44 px, ou 52 px com `big`.
- **`SetRow`**: `{ no; prev: string|null; weight; reps; done; pop?; onToggle; onEdit }`.

  O teste verifica:
  - "—" quando `prev` é `null`;
  - clicar na linha chama `onEdit`, clicar no ✓ chama `onToggle` (sem propagar);
  - a classe `is-done`.
- **`CurrentSet`**: `{ no; total; prev; weight; reps; onWeight; onReps; onDone }`.

  O teste verifica "Série {no} de {total}", os dois `Stepper` (kg com passo 2,5, reps com passo 1) e o `Check big`.
- **`WorkoutProgress`**: `{ groups: number[]; done: number[]; current: number; onPick(i) }`.

  O teste verifica:
  - `role="progressbar"` com `aria-valuenow` e `aria-valuemax`;
  - um botão por grupo com `aria-label` ("Exercício 2, 1 de 3 séries");
  - a classe `is-cur` no grupo atual.
- **`CycleProgress`**: `{ sessions: {label, state: 'done'|'todo'|'current'}[] }`.

  O teste verifica o rótulo ", hoje" no atual.
- **`Ring`**: `{ size; stroke; value 0–1; children }`. Hoje ele é usado só no descanso.
- **`Tips`**: `{ text: string|null }`.

  O teste verifica:
  - usa `parseTipItems` (v2);
  - `<ul class="hx-tips">` com um `<li>` por item;
  - `li.is-gene` e um `GeneTag warn` quando o item tem gene;
  - nada renderizado quando o texto é vazio;
  - 1 item continua sendo lista (a v2 usa divisória, não marcador de lista).
- **`Steps`**: `{ items: {text; warn?}[] }`.

  O teste verifica `<ol class="hx-steps">` e que um item "Erro comum" recebe a classe `is-warn`, com o prefixo "Erro comum:" em âmbar.

## Estrutura e camadas

- **`ScreenHeader`**: `{ title; sub?; left?; right? }`, em grade de 44/1fr/44, com título em elipse.
- **`SectionHeader`**: `{ title; aside?; action? }`.
- **`Sheet`**: `{ open; onClose; label; children; footer? }`.

  O teste verifica:
  - `role="dialog"`, `aria-modal="true"` e `aria-label`;
  - o scrim fecha ao clicar;
  - Esc fecha;
  - o foco vai para a folha ao abrir e volta ao gatilho ao fechar;
  - renderização via portal em `document.body`.
- **`Dialog`**: `{ open; onClose; title; actions; children }`. O teste verifica os mesmos papéis da `Sheet` e as ações empilhadas.
- **`Toast`**: `{ message; actionLabel?; onAction?; kind?: 'default'|'err' }`. O teste verifica `role="status"`, ou `role="alert"` quando o `kind` é `err`.
- **`Banner`**: `{ kind: 'warn'|'err'; title; children; action? }`. O teste verifica `role="alert"` quando o `kind` é `err`, e o ícone.
- **`NavBar`**: v2, com o teste verificando:
  - `aria-current="page"` no item da rota;
  - ausência em `/login`, `/auth*` e `/workout`;
  - 4 links: Hoje, Treinos, Check-in, Progresso.

## Dados e carregamento

- **`Bars`**: `{ data: {label, value}[]; currentIndex }`. O teste verifica `role="img"` com `aria-label` descrevendo os valores, e a semana atual com a classe `cur`.
- **`HistoryRow`**: `{ href; name; date; sets; durationMin; volumeT }`. O teste verifica que é um link, com o volume em mono pt-BR.
- **`PRRow`**: `{ lift; kg; reps; when?; delta?; fresh? }`. O teste verifica que o acento aparece só com `fresh`.
- **`Skeleton`**: `{ w?; h; r?; style? }`. O teste verifica `aria-hidden="true"` e a classe `hx-sk`.
- **`HelixMark`**: 7 traços, os 4 primeiros em acento, `aria-hidden`.

## Guarda v2 (`__tests__/design-system-guard.test.ts`)

Falha, com arquivo e linha, quando:
1. um `className` contém uma classe não definida em `app/helux-v2.css`. A exceção são as variáveis do `next/font` no `<html>`;
2. um `var(--x)` não está declarado em nenhum `:root`, exceto `--font-*`;
3. aparece uma cor literal (hex, `rgb()`, `rgba()`) em `.ts`/`.tsx`;
4. aparece `--accent-glow`.
