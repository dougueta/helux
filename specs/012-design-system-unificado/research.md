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
