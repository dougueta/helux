# Research: Design System Unificado no App Web

## R1 — Inventário (2026-09-23, `main` em `677da7a`)

**Arquivos com `className`** (fora de testes), com o número de ocorrências:
- `app/history/[id]/page.tsx` 24
- `components/dna/TraitCard.tsx` 10
- `app/HomeClient.tsx` 10
- `app/dna/DnaClient.tsx` 8
- `app/history/page.tsx` 7
- `components/ErrorBoundary.tsx` 5
- `app/login/page.tsx` 5
- `app/recovery/page.tsx` 4
- `app/loading.tsx` 4
- `components/layout/NavBar.tsx` 3
- `app/layout.tsx` 3
- `app/dna/loading.tsx` 3
- `components/workout/TirednessSelector.tsx` 2
- `app/dna/page.tsx` 2
- `components/layout/Shell.tsx` 1
- `app/treinos/TreinosClient.tsx` 1
- `app/perfil/page.tsx` 1
- `app/checkin/page.tsx` 1
- `app/checkin/history/page.tsx` 1

**Classes que não fazem nada (B3):**
- `text-helux-muted` (11 usos) e `border-helux-border` (11 usos) não existem no `tailwind.config.ts`. O config tem `helux-dim` e `helux-faint`, mas não "muted"; e não tem nenhuma cor "border".
- `pb-safe` (`NavBar`) não é classe do Tailwind e não há plugin que a defina. Por isso a área segura inferior (iPhone) nunca foi respeitada pelo menu.

**Classes mais usadas** (candidatas a virar componente compartilhado ou padrão de layout):
- `flex`, `items-center`, `justify-between`, `gap-*`: layout;
- `max-w-lg mx-auto px-4`: contêiner de página, 11 usos;
- `bg-helux-surface border border-helux-border rounded-2xl`: cartão;
- `animate-pulse`: skeleton, 8 usos;
- `text-sm text-helux-muted`: texto secundário.

**Testes**: nenhum teste em `src/__tests__` usa `toHaveClass`, `className` ou `classList`. A migração não quebra testes por seletor de classe.

## R2 — Remover o Tailwind do app (não só parar de usar)

- **Decision**: remover `tailwindcss` e `autoprefixer` de `apps/web/package.json`, apagar `tailwind.config.ts`, tirar as diretivas `@tailwind` de `globals.css` e apagar `postcss.config.js` (o Next 14 funciona sem PostCSS custom; se o build reclamar, manter um `postcss.config.js` vazio `{ plugins: {} }`).
- **Rationale**: FR-002 e US3 ("um único jeito de estilizar"). Manter o Tailwind instalado sem uso deixa a porta aberta para o problema voltar e mantém um CSS gerado que ninguém usa. O teste de guarda (R5) impede reintrodução de classes; remover a dependência impede reintrodução do próprio Tailwind.
- **Ordem**: a remoção é a **última** tarefa de implementação — só depois que o teste de guarda estiver verde sem nenhuma exceção. Se feita antes, telas ainda não migradas perderiam o estilo silenciosamente.
- **Alternativa rejeitada**: manter o Tailwind só pelo reset (`@tailwind base`). Seria uma dependência inteira por ~30 regras de CSS, e ainda permitiria classes utilitárias.

## R3 — Reset CSS próprio no lugar do preflight

- **Decision**: substituir `@tailwind base` por um reset mínimo em `globals.css` que reproduz só o que as telas atuais dependem do preflight:
  - `margin: 0` em `body`, `h1`–`h6`, `p`, `figure`, `blockquote`, `dl`, `dd`;
  - `ul`/`ol` sem margem, padding nem marcador;
  - `button`, `input`, `select`, `textarea` herdando `font` e `color`;
  - `button` com fundo transparente e `cursor: pointer`;
  - `img` e `svg` com `display: block` e `max-width: 100%`;
  - `*, ::before, ::after` com `box-sizing: border-box` e `border: 0 solid`. Mantém a semântica do preflight, em que escrever só `borderWidth` basta para a borda aparecer.
- **Rationale**: o estilo inline das telas atuais foi escrito em cima do preflight. Por exemplo, os `<h2>` definem `margin` explicitamente, mas os `<p>` e as listas contam com a margem zerada. Sem um reset equivalente, as telas já migradas também mudariam de aparência.
- **Verificação**: capturas de tela antes e depois das telas **já no padrão** (treino ativo, Home, `ExerciseSheet`) na mesma largura. Elas não podem mudar com a troca do reset (quickstart, passo 1).
- **Alternativa rejeitada**: copiar o preflight inteiro. Ele tem regras para elementos que o app não usa (`abbr`, `kbd`, `sub`, `progress`…); YAGNI.

## R4 — Quais componentes compartilhados criar

- **Decision**: criar só os que têm 2 ou mais usos concretos nas telas migradas:
  - `Card`: superfície `--surface-1`, borda `--hairline`, raio `--r-card` e padding padrão; usado em History, History detail, DNA/TraitCard, Recovery, Login e ErrorBoundary.
  - `Skeleton`: bloco com a animação de pulso do tema; substitui os 8 `animate-pulse` nos `loading.tsx` e nos estados de carregamento.
  - O contêiner de página (`max-w-lg mx-auto px-4`) **não vira componente**, porque o padrão já existente nas telas migradas é estilo inline direto. Vira uma constante de estilo `pageContainer` exportada de `components/ui/layout.ts`, para as 11 páginas não repetirem os mesmos números.
- **Reuso**: `Chip`, `Label`, `MatchBadge`, `Icon` e `Ring` já existem em `components/ui/` e passam a ser usados onde as telas antigas reimplementavam etiquetas e badges à mão.
- **Alternativa rejeitada**: criar uma biblioteca completa de componentes (Button, Stack, Text…). Seria redesign, e as telas no padrão atual não usam isso; YAGNI.

## R5 — Teste de guarda (FR-008)

- **Decision**: `apps/web/src/__tests__/design-system-guard.test.ts` percorre todos os `.tsx` e `.ts` de `src/` (fora de `__tests__`) e falha em três casos:
  1. um `className` com valor literal. Exceção: o `<html>` do `layout.tsx`, que recebe as variáveis de fonte do `next/font` (`className={\`${font.variable} ...\`}`) — essa exceção fica numa lista de arquivos e padrões permitidos, com justificativa no próprio teste;
  2. um `var(--nome)` cujo `--nome` não está declarado no `:root` de `globals.css`;
  3. uma cor hexadecimal literal (`#RRGGBB` ou `#RGB`) fora de `globals.css`.
- **Rationale**: é o que torna SC-002 verificável ("zero usos… zero cores inexistentes") e impede o B3 de voltar. Ele cobre também o caso sutil do B3, em que a classe existia na sintaxe mas não no tema.
- **RED**: escrito antes da migração, ele falha listando os 19 arquivos. Cada tarefa de migração tira arquivos da lista de falhas, e o teste fica verde quando a última tela é migrada.
- **Levantamento necessário na implementação**: medir quantas cores hex literais existem hoje fora de `globals.css` (por exemplo, em SVGs e gradientes). Se houver usos legítimos, como cores de marca em ícones, eles viram tokens novos no `:root`, e não exceções.

## R6 — Área segura inferior

- **Decision**: o `NavBar` passa a usar `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` (o que o `pb-safe` pretendia fazer). O `layout.tsx` já declara `viewport-fit=cover`, então `env()` funciona no iPhone.
- **Rationale**: é um defeito do B3 com efeito real no celular: no iPhone, o menu fica colado na barra de gestos. O `TirednessDialog` (spec 011) já usa o mesmo `env()`.

## R7 — Parser de dicas de execução (FR-009 opção A, FR-010)

- **Decision**: função pura `parseTipItems(text): TipItem[]` em `apps/web/src/lib/tipItems.ts`:
  1. Divide o texto em orientações nos separadores de frase: `. `, `; ` e o fim do texto. Não divide em ponto dentro de número ("2.5kg", "90.5") nem em siglas entre parênteses.
  2. Em cada orientação, extrai as referências genéticas: grupos entre parênteses que começam com um identificador de gene em maiúsculas/dígitos (regex `\(([A-Z][A-Z0-9]{1,}[^)]*)\)`, por exemplo "(WNT16)" e "(COL1A1 C,C)"). Elas saem do texto e vão para `markers[]`. Parênteses que não são gene, como "(usado em 2026-08-29)", continuam no texto.
  3. Descarta itens vazios e remove pontuação solta no fim.
  4. **Nunca perde texto**: se a divisão produzir 0 itens, devolve um item com o texto inteiro.
- **Rationale**: o texto é gerado pela IA em linguagem natural, sem estrutura. Uma divisão conservadora, que na dúvida não divide, cumpre a opção A sem risco de cortar informação, conforme o Assumption da spec.
- **Exibição**: o `ExecutionTips` renderiza uma lista. Com 1 item, não mostra marcador de lista (edge case da spec). Os `markers` aparecem como `Chip` discreto ao lado do item. A justificativa genética de uma variante (spec 010, `display.tip` com `tipKind: 'variant-why'`) usa o mesmo componente (FR-011).
- **Alternativa rejeitada**: mudar o prompt da IA para gerar dicas estruturadas. Isso está fora do escopo (a spec diz que o texto continua sendo gerado como hoje) e não resolveria os planos já gerados.

## R5.1 — Levantamento de cores e variáveis (feito no planejamento, 2026-09-23)

**Variável usada mas não declarada: `--success`.** É o mesmo tipo de defeito do B3: onde aparece, a cor não se aplica. **Decisão**: declarar `--success` no `:root` com o verde que os componentes de check-in usam hoje de forma solta (`#4ade80`).

**Variáveis `--font-space-grotesk` e `--font-jetbrains-mono`:** o `next/font` as injeta em tempo de execução, pela `className` do `<html>`. O teste de guarda aceita explicitamente o prefixo `--font-`, com justificativa.

**Cores hexadecimais fora do tema** (11):

| Onde | Cor | Decisão |
|---|---|---|
| `TirednessSelector`, `TirednessDialog` | `#e5484d` | usar `var(--danger)` |
| `CheckinForm`, `CheckinCard`, `CheckinHistoryTable` | `#f87171` | usar `var(--danger)` |
| `CheckinCard`, `CheckinHistoryTable` | `#4ade80` | novo token `--success` |
| `ExerciseSheet` (3 tons), `workout/page.tsx` (1 tom) | `#14180f`, `#0a0d09`, `#070906`, `#0c0f0c` | fundos escuros da área de demonstração; viram os tokens `--demo-bg-1`, `--demo-bg-2` e `--demo-bg-3`, reutilizados nos dois arquivos (tons quase iguais são unificados) |

Trocar `#e5484d` e `#f87171` por `--danger` muda levemente o tom desses vermelhos para o vermelho do tema, o que é exatamente a unificação pedida (FR-004, FR-005: nenhuma cor nova, só as do tema).

## Achados da implementação (2026-09-23)

Coisas que o plano não previa, encontradas durante T002–T026, e como foram resolvidas (sempre tomando a tela de treino ativo como referência).

1. **As cores "hex soltas" eram fallbacks de `var()`.** `#e5484d`, `#f87171` e `#4ade80` apareciam como `var(--danger, #e5484d)` etc. Como `--danger` já existia, o fallback vermelho nunca era usado: trocar por `var(--danger)` **não muda nada na tela**. Já `--success` não existia, então o verde vinha do fallback `#4ade80`; o token novo tem o mesmo valor, e também não há mudança visual.
2. **O viewport nunca teve `viewport-fit=cover`.** O `layout.tsx` declarava o viewport em `metadata.viewport`, que o Next 14 ignora (o build avisava "Unsupported metadata viewport"). Sem isso, `env(safe-area-inset-bottom)` vale 0 no iPhone, e o R6 (e o `TirednessDialog` da spec 011) não teria efeito. Corrigido com `export const viewport` no `layout.tsx`; o HTML gerado agora sai com `viewport-fit=cover`.
3. **Pseudo-classes sem equivalente inline.** `active:scale-95` (Login e cartões do Histórico) não tem como ser expresso em estilo inline. A tela de treino ativo não tem esse efeito, então ele foi retirado.
4. **Cores do `TraitCard` fora do tema.** Os níveis usavam `blue-400`/`yellow-400` do Tailwind, que não pertencem ao tema. Agora: Baixo = neutro (`--text-dim`/`--surface-2`), Médio = `--warn`, Alto = `--accent`, os mesmos tons que o `DnaClient` já usava nas etiquetas.
5. **Bordas "invisíveis" eram, na verdade, cinza claro.** Com `border` + uma cor inexistente (`border-helux-border`), o Tailwind aplicava a cor de borda padrão do preflight (`#e5e7eb`). Agora todas usam `--hairline`.
6. **Reset maior que o R3.** Por conservadorismo, o reset próprio reproduz quase todo o preflight do Tailwind 3, incluindo o que o R3 não listava e as telas usam: `line-height: 1.5` no `html` (muitos textos não definem `lineHeight`), `h1`–`h6` herdando `font-size`/`font-weight`, `a` herdando cor e decoração, `table` com `border-collapse`, a cor de borda padrão, `placeholder`, `:disabled` e `[hidden]`.
7. **`postcss` também saiu.** O `next build` passa sem `postcss.config.js`, porque o Next usa o PostCSS embutido. Por isso o `postcss` saiu de `apps/web` junto com `tailwindcss` e `autoprefixer`.
8. **`Shell` aceitava `className`.** Ninguém passava esse valor, e a prop virou `style`.
9. **Espaçamento duplo em Perfil, Check-in e Histórico de check-ins (não corrigido).** Essas páginas usam `Shell` (`padding-top` de 48) **e** um `header` com mais 48 de `padding-top`, e ainda um contêiner interno de 512 px com `paddingBottom` de 96. A migração preservou o espaçamento atual, sem mudança visual. Fica anotado para uma revisão futura do espaçamento.
10. **`Chip` passa a repassar atributos HTML.** Isso era necessário para o `aria-label` dos marcadores do `ExecutionTips`, e não muda nada no visual.
11. **Caso real de dica, fora do R7** (Agachamento Livre (Barra), plano do usuário). O texto tem o marcador **sem parênteses e no meio da frase**: "alerta COL1A1 C,C indica…". **Decisão:** ele fica no texto e não vira etiqueta. Um gene sem parênteses não pode ser separado da frase sem quebrar a gramática, e reconhecer "GENE genótipo" solto no texto correria risco de falso positivo (por exemplo, com "RPE 8" ou siglas). O importante (nada se perde) está garantido. O texto também confirmou outras regras:
    - "(3s)" começa com dígito, não é gene e fica no texto;
    - "3s" e "5km" não quebram a orientação;
    - o ponto só divide quando vem seguido de espaço e **letra maiúscula**, o que também protege abreviações como "aprox. 3".

    Resultado: 6 orientações. O caso está coberto em `tipItems.test.ts`.
12. **Carregamentos com `aria-busy`.** Os contêineres de esqueleto ganharam `aria-busy="true"`, como pede o contrato do `Skeleton`, que é `aria-hidden`.
13. **`MatchBadge` no detalhe do treino.** "variante de X · N fit" virou "variante de X" seguido do `MatchBadge` (N fit). O conteúdo é o mesmo, só a forma do badge muda.


---

# Parte 2 — Design System v2 (replanejamento de 2026-09-23)

A Parte 1 (R1–R7 e achados) documenta a versão anterior da spec. Ela continua valendo como base (Tailwind removido, reset, viewport), exceto onde a Parte 2 a substitui.

## V1 — Folha de estilos do sistema a partir do handoff

- **Decisão**: criar `apps/web/src/app/helux-v2.css` a partir de `design_handoff_helux_v2/v2/helux-v2.css`, importado em `layout.tsx` depois do `globals.css`. Adaptações:
  1. `--font` e `--mono` passam a apontar para `var(--font-space-grotesk)` e `var(--font-jetbrains-mono)` (next/font), e `layout.tsx` carrega os pesos da v2: Grotesk 400/500/600/700; Mono 400/500/600 e 500 itálico, para os genes.
  2. `--safe-b` vira `env(safe-area-inset-bottom, 0px)`; o valor fixo de 34 px era só do protótipo.
  3. Saem as classes que só existem no protótipo: `.hx-phone`, `.hx-status`, `.hx-status-r`, `.hx-scroll`, `.hx-home-ind`.
  4. `.hx-scrim`, `.hx-sheet` e `.hx-dialog` passam de `position:absolute` (dentro do celular de mentira) para `position:fixed`, e `.hx-dock` vira o contêiner fixo do rodapé. Os z-index ficam em escala explícita no `:root` (`--z-dock`, `--z-nav`, `--z-scrim`, `--z-sheet`, `--z-dialog`, `--z-toast`), para que folha e diálogo fiquem acima do menu (FR-009).
  5. No desktop, `.hx-dock` e o menu se alinham à coluna de 512 px (seção 5.1).
- **Rationale**: o README diz que a folha "pode ser adotada quase direto" e é a fonte da verdade. Reescrever em estilo inline duplicaria cerca de 240 linhas e perderia estados como `:hover`, `:active`, `:focus-visible`, `@container` e `@media (prefers-reduced-motion)`, que o estilo inline não expressa.
- **Consequência para a Parte 1**: a decisão "estilo inline + variáveis" (R2/R5) é **substituída**. As classes da folha do sistema são o caminho principal. Estilo inline fica só para ajuste de layout pontual (margem, grid local), sempre com tokens.

## V2 — Tokens antigos

- **Decisão**: o `:root` passa a ser o da v2. Mudanças que exigem atenção:
  - `--text-faint` passa a `#858C7F`, por contraste;
  - `--accent-glow` é **aposentado**, e o guarda proíbe o token;
  - `--r-card` (20) é substituído por `--r-md` (16) e `--r-lg` (24);
  - `--demo-bg-*` (Parte 1) é substituído por `--stage` e `--stage-grid`.

  Os tokens antigos ficam declarados só até a última tela que os usa ser migrada. Depois disso são removidos, e o guarda passa a acusar qualquer uso.

## V3 — Guarda v2 (FR-010)

- **Decisão**: `design-system-guard.test.ts` passa a falhar quando:
  1. um `className` usa uma classe que **não está definida** em `helux-v2.css`. O teste extrai os seletores `.x` da folha; as exceções são as variáveis de fonte do `next/font` no `<html>`;
  2. um `var(--x)` não está declarado no `:root` de `globals.css` nem no de `helux-v2.css`, exceto `--font-*`, que vem do next/font;
  3. aparece uma cor literal (hex, `rgb()` ou `rgba()`) em `.ts`/`.tsx` fora da camada de tokens. Ocorrências estruturais do SVG, como `fill="none"`, não contam;
  4. aparece `--accent-glow` em qualquer lugar, ou um `box-shadow` com o acento.
- **Rationale**: mantém a garantia do B3 (nunca uma classe ou token que não existe) e acrescenta as regras de "lint" do README que dá para verificar mecanicamente.

## V4 — Dicas v2 (`parseTipItems`)

- **Decisão**: `TipItem` passa a `{ text: string; gene?: { symbol: string; genotype?: string } }`. Nenhuma dica real do app traz mais de um marcador; se trouxer, o primeiro vira etiqueta e os demais ficam no texto. Regras novas:
  - o marcador entre parênteses "(COL1A1 C,C)" é dividido em `symbol` e `genotype` no primeiro espaço;
  - um **gene sem parênteses** seguido de genótipo em par de bases (`\b[A-Z][A-Z0-9]{2,}\s+[ACGT],[ACGT]\b`, por exemplo "COL1A1 C,C") também é extraído, porque o padrão do genótipo torna o falso positivo improvável. A frase fica sem o marcador e sem espaços duplicados;
  - um prefixo "ATENÇÃO:" ou "Atenção:" no começo de uma orientação é removido da exibição. O README proíbe "ATENÇÃO"; a urgência passa a ser comunicada pelo marcador âmbar da dica com gene.
  - O invariante "nada se perde" continua: todo o conteúdo, exceto o prefixo removido e a pontuação separadora, aparece em `text` ou em `gene`.

  Isso supera o achado da Parte 1 que mantinha "COL1A1 C,C" no texto.
- **Componente**: `ui/Tips` substitui `workout/ExecutionTips`. A dica com gene recebe a classe `.is-gene` (quadrado âmbar) e um `GeneTag warn` abaixo do texto.

## V5 — Treino ativo

- **Decisão**: `workout/page.tsx` (744 linhas) é decomposto em componentes da `ui/` sem mudar o estado do treino:
  - `useActiveWorkout`, `useFinishWorkout` e as regras 010/011/016 ficam intactos;
  - estado de UI novo e local: `editingSetIndex` (série em edição) e `poppedSetIndex` (animação do ✓);
  - série atual = `editingSetIndex ?? primeira não concluída`;
  - a barra de progresso é derivada de `exerciseStates` (grupos por exercício, feitas por grupo);
  - o descanso reaproveita o `restLeft` e o `restTotal` existentes; o bloco de descanso e o botão principal ou secundário mudam só de apresentação.
- **Adicionar série**: continua usando o `addSet` do hook. O "anterior" mostra "—", porque o dado não existe (FR-024).
- **Folha de execução**: `ExerciseSheet` vira `ui/Sheet` com o conteúdo da v2. `ExerciseDemo` é mantido (as animações por padrão de movimento são da spec 013) e só ganha o palco `.hx-stage`, a cadência e os controles da v2. `MuscleMap` é mantido, com a legenda da v2.

## V6 — Fit e hélice

- **Decisão**:
  - `lib/fit.ts`: `fitBand(v)` devolve `'alto'` quando ≥ 75, `'médio'` de 50 a 74 e `'baixo'` abaixo de 50, junto com o token da faixa (`--fit-hi`, `--fit-mid`, `--fit-lo`).
  - `ui/Helix`: n traços com altura `h*(0.26+0.74*|cos(2πi/10.5)|)`, mínimo de 2 px, e `round(n*fit/100)` traços acesos.
  - `ui/Fit`: tamanhos `sm`, `md` e `lg` do README; `aria-label="fit genético N de 100, <faixa>"`.
  - O `MatchBadge` antigo é substituído por `Fit`.

## V7 — Números pt-BR

- **Decisão**: `lib/format.ts` com `formatNumber(n, {decimals})`, usando `Intl.NumberFormat('pt-BR')` para vírgula decimal e ponto de milhar, e `formatDuration`. Todo número de treino passa por eles, com as classes `.n-*` e `.u`.

## V8 — Menu e camadas

- **Decisão**: `NavBar` passa a usar `.hx-nav`, com `aria-current="page"` e itens de 50 px. Continua escondido em `/login`, `/auth` e `/workout`; a conclusão do treino está dentro de `/workout`. Na v2, os z-index do menu, do rodapé, da folha, do diálogo e do toast vêm da escala de V1. O `TirednessDialog` (spec 011) vira `ui/Sheet`/`ui/Dialog` e herda a camada certa, sem o z-index fixo 60.

## V9 — Progresso com Histórico

- **Decisão**: `app/recovery/page.tsx` (Progresso) ganha a seção "Histórico" com os 3 últimos treinos (`useWorkoutHistory`) em `ui/HistoryRow` e o link "Ver todos" para `/history`. `/history` e `/history/[id]` continuam existindo, com `HistoryRow` e o visual da v2. Os recordes usam `ui/PRRow` com os dados de analytics existentes. "fresh" (acento no delta) só com dado de data do recorde; sem esse dado, o delta fica neutro.

## V10 — Conclusão

- **Decisão**: `WorkoutDoneScreen` (spec 016) é reestilizado:
  - fita de traços pelo `ui/Helix` em modo sequencial (35 ms por traço, 200 ms cada), já acesa em movimento reduzido;
  - resumo com volume (Σ kg×reps das séries feitas), séries (feitas/total) e duração;
  - estados de salvando, salvo e erro com `Button loading` e `Banner err`.

  A lógica do `useFinishWorkout` (016) não muda. "Recordes" e "Novo recorde" ficam ocultos (FR-020).

## V11 — Verificação visual

- **Decisão**: comparar lado a lado as 6 telas desenhadas com `design_handoff_helux_v2/Helux Design System v2.html` aberto no navegador, que funciona offline com React e Babel. Largura de 375 px no app, pelo DevTools ou por iframe (Parte 1). Os screenshots da Parte 1 (`baseline/`) passam a ser só histórico: a v2 muda intencionalmente as telas.

## Achados da implementação (Parte 2)

Conflitos entre o handoff e o comportamento existente, e como foram resolvidos (o comportamento das specs 009/010/011/016 vence).

1. **Timer do cabeçalho do treino é decorativo.** O protótipo tem um `IconBtn` de cronômetro sem ação definida; antes ele também era só um ícone. Para não criar interação nova (FR-025), ele fica como ícone `aria-hidden` no lugar do botão.
2. **"Voltar à recomendada" continua no card.** Com uma variante alternativa ativa (spec 010), a segunda linha do card mostra "Variante ativa: {equipamento}" e o botão ghost "Voltar à recomendada", no lugar do atalho "Variante com fit maior". Sem variante alternativa, vale o atalho do handoff.
3. **Folha, aba Execução, mantém as dicas.** O handoff mostra só passos e músculos. Como a folha reflete a variante ativa (spec 010) e, com uma alternativa, os passos do plano somem, a justificativa da variante (ou as observações do plano) aparece em `Tips` abaixo dos passos. Sem isso, a aba ficaria só com os músculos.
4. **"Trocar" aplica e fecha.** O fluxo antigo (selecionar para pré-visualizar e depois "Usar esta variante") dá lugar ao botão "Trocar" do handoff, que aplica a variante e fecha a folha, como o "Usar esta variante" fazia. A etiqueta "Recomendado" continua na variante recomendada (dado real); "fit maior" e o texto "por quê" saem da lista, porque a versão do botão (secundária ou ghost) já comunica o fit.
5. **Sem botão "exercício anterior" no rodapé.** O handoff só tem o botão principal; voltar a um exercício é pelos grupos da barra de progresso, que são navegáveis (FR-025 permite).
6. **Diálogo de finalizar com pulados:** "Cancelar" virou "Continuar treinando" (ghost), abaixo de "Finalizar mesmo assim" (danger), conforme a T052. Os testes foram ajustados.
7. **Guarda aceita nomes de `@keyframes`.** A regra 1b (todo literal `hx-…` precisa existir na folha) acusava `animation: 'hx-up …'`. Os nomes de `@keyframes` da folha passam a valer nessa regra, não em `className`.
8. **Movimento reduzido na demonstração.** Com `prefers-reduced-motion`, o `ExerciseDemo` não inicia o laço de animação e fica na pose do meio (fase 0,5). A linha de amplitude passou de `--accent-line` para `--hairline-3`, deixando o acento só no implemento.
9. **Home sem os cards antigos.** Recuperação (anel), semana (x/4), insight do DNA, lista de próximos treinos e o selo "Ajustado pelo recovery" saem da Home, como no desenho (FR-017): recovery vive em Progresso, o DNA na tela DNA e o ajuste do dia aparece no "Como você está hoje" (motivo + "Ver o que mudou"). A `page.tsx` da Home deixou de buscar recovery e perfil genético.
10. **Letras do ciclo.** A API manda a letra da sessão de hoje e das próximas, mas não das anteriores. As anteriores seguem a sequência de letras do mesociclo (A, B, C…), calculadas a partir da letra de hoje; o contador "N de M treinos concluídos" usa o `progress` real.
11. **Sequência não é botão.** O protótipo usa um botão ghost sem ação para a sequência de semanas. No app ela é um `span` com `role="img"` e rótulo ("sequência de N semanas"), para não criar um alvo tocável sem função.
12. **Último check-in sem variação.** O `CheckinCard` virou a seção "Último check-in" da v2 (grade 2×2 em mono pt-BR, mês "jul. 2026"). As variações contra o mês anterior (verde/vermelho) saem, como no desenho; o histórico completo segue em `/checkin/history`. Sem check-in, a seção convida a fazer o primeiro.
13. **Estados vazios da Home.** Sem plano, a área de foco mostra "Nenhum plano gerado ainda" com o botão principal "Gerar meu plano"; gerando, "Preparando seu próximo ciclo" (`role="status"`). O erro de geração vira `Banner err`.
14. **Folha de cansaço.** O `TirednessDialog` usa `ui/Sheet`, com as ações empilhadas no rodapé (principal em cima, ghost embaixo). Enquanto salva, scrim e Esc não fecham. O teste de camada passou a verificar a classe `.hx-sheet`, o portal e `--z-sheet` > `--z-nav` na folha.

