# Handoff: Helux — Design System v2

## Visão geral
Refinamento do sistema visual do Helux, app web responsivo (mobile-first, 320–430 px; desktop com coluna central de 512 px) de treino de musculação personalizado pela genética. Uso principal: na academia, celular na mão, entre séries, de relance. Só modo escuro. Toda a copy em pt-BR, sentence case.

A v2 **não troca a identidade** (escuro com tom verde, acento verde-limão, Space Grotesk). Ela impõe disciplina: uma assinatura visual ligada ao DNA, três níveis de superfície com função, uma escala tipográfica fechada e regras rígidas de onde o acento pode aparecer.

## Sobre os arquivos
Os arquivos deste pacote são **referências de design feitas em HTML/React+Babel**: protótipos que mostram aparência e comportamento, não código de produção para copiar. A tarefa é **recriar este sistema no codebase do Helux** usando os padrões, framework e bibliotecas que ele já usa. `v2/helux-v2.css` pode ser adotado quase direto como camada de tokens (variáveis CSS).

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, raios, estados e interações são finais. Recrie pixel a pixel.

---

## 1. Regras de implementação (checklist para o Claude Code)

Trate estas regras como lint. Todo PR de UI deve respeitar todas.

### Acento (verde-limão `--accent #C8FA4B`)
- PODE: botão primário (CTA), item ativo da NavBar (ícone + traço de 3 px no topo), ✓ de série concluída, traço de série feita na barra de progresso, dado de fit alto, ícone do timer de descanso.
- NÃO PODE: títulos, palavra destacada em título, ícones decorativos, barras de gráfico, recordes, seleção do seletor de cansaço, anel de foco, bordas decorativas.
- **No máximo um botão primário visível por tela.** Se a ação perdeu prioridade (ex.: "Próximo exercício" durante o descanso), ela vira `secondary`.
- `--accent-glow` está **aposentado**. Nenhum `box-shadow` com glow, nenhum gradiente decorativo, nenhum círculo/blob decorativo.

### Forma
- **Pílula (`--r-pill`) = tocável.** Botões e seletores segmentados.
- **Retângulo 6 px (`--r-xs`) = informação.** Etiquetas (Quadríceps, Barra), marcador genético, número de passo. Etiqueta nunca é tocável; se tocar faz algo, é botão.
- 12 px (`--r-sm`): stepper, campo, miniatura. 16 px (`--r-md`): card, banner, área de demonstração. 24 px (`--r-lg`): área de foco, bottom sheet, diálogo.

### Superfícies (hierarquia)
| Nível | Estilo | Uso |
|---|---|---|
| Plano | `--bg` + divisória `1px --hairline` | listas, histórico, dados de apoio |
| Card | `--surface-1` + `inset 0 0 0 1px --hairline`, raio 16 | grupo tocável ou comparável |
| Área de foco | `--surface-2` + `inset 0 0 0 1px --hairline-2`, raio 24 | a próxima ação. **Uma por tela** |
| Elevado | `--surface-1`, raio 24 no topo, sombra `0 -12px 40px -8px rgba(0,0,0,.6)` + scrim | bottom sheet, diálogo |

- Não envolva seções inteiras em card só para separar: use divisória.
- Sombra só em quem flutua sobre outra tela.

### Tipografia
- Sem rótulo em CAIXA ALTA espaçada. Cabeçalho de seção = `.t-section` (16/22, 600) em sentence case, e só quando o bloco não se explica pelo conteúdo.
- Sem metadados colados com ponto médio ("técnica · músculos · 4 variantes"). Escreva frase: "Técnica, músculos e 4 variantes".
- Todo número de treino (kg, reps, tempo, fit, genótipo, contadores) em JetBrains Mono com `font-variant-numeric: tabular-nums`. A unidade fica em Space Grotesk, 0,72 em, `--text-dim` (classe `.u`).
- Símbolo de gene em **itálico** mono (`COL1A1`, `ACTN3`), genótipo em pé ao lado (`C,C`).
- Números pt-BR: vírgula decimal (82,0 kg), ponto de milhar (9.840 kg).
- Numere só sequência real: séries e passos de execução.

### Cor semântica
- Cor nunca é o único portador de informação. Fit tem número + comprimento; nível de traço tem palavra + altura; recovery tem palavra.
- `--text-faint` só para informação terciária e **só sobre `--bg`, `--surface-1` ou `--surface-2`** (nunca sobre `--surface-3`: reprova AA).
- `--text-disabled` só para estado desabilitado.
- Dado antigo/não confiável = `warn` (âmbar), não `danger`.

### Acessibilidade (não negociável)
- Alvos de toque ≥ 44 px: − / + do stepper 44×52, ✓ 44 (52 na série atual), pílulas de cansaço 44 de altura, itens da NavBar 50.
- Contraste AA (4,5:1) em todo texto; 3:1 só para display ≥ 24 px.
- Foco de teclado visível em tudo que é interativo: `box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text)` (anel Osso, **não** limão). Use `:focus-visible`.
- Sem rolagem horizontal em 320 px.
- Área segura inferior: `padding-bottom: env(safe-area-inset-bottom)` (34 px no protótipo, `--safe-b`) na NavBar e em CTAs fixos.
- `prefers-reduced-motion: reduce`: todas as transições/animações viram instantâneas; demonstração do exercício fica parada no meio do movimento; skeleton sem brilho.
- Ícone sozinho sempre com `aria-label`. Seletor segmentado com `aria-pressed` (ou `role=tab` + `aria-selected` nas abas). Timer com `role="timer"`. Banner de erro com `role="alert"`.

### Navegação e camadas
- NavBar some no treino ativo, na tela de treino concluído e no login.
- Bottom sheets e diálogos ficam acima da NavBar (z-index maior) com scrim `--scrim` próprio.
- Diálogo só para confirmar algo que perde dados. Toast para confirmação reversível (com "Desfazer").

### Estados obrigatórios em todo componente
padrão, pressionado, foco, desabilitado, carregando, vazio, erro.
- **Carregando**: skeleton com a mesma forma do conteúdo final (mesmas alturas de linha e raios). Dentro da área de foco o skeleton usa `--surface-3` (senão some).
- **Vazio**: convida para uma ação ("Nenhum recorde ainda" + botão "Ver treino de hoje").
- **Erro**: diz o que houve e como resolver, sem pedir desculpas ("Não foi possível salvar. Sem conexão. O treino está guardado neste aparelho." + "Tentar de novo").

---

## 2. Design tokens
Fonte da verdade: `v2/helux-v2.css` (bloco `:root`). Resumo:

### Cores
```
--bg #0A0C0A            --surface-1 #161916     --surface-2 #1E221D     --surface-3 #272C25
--hairline rgba(255,255,255,.07)  --hairline-2 rgba(255,255,255,.11)  --hairline-3 rgba(255,255,255,.20)
--text #F0F3EA          --text-dim #A4AB9C      --text-faint #858C7F (era #6A7164)   --text-disabled #5E6558
--accent #C8FA4B        --accent-press #B2E03A  --accent-ink #0C1003
--accent-soft rgba(200,250,75,.14)   --accent-line rgba(200,250,75,.34)
--warn #F5B73E  --warn-soft rgba(245,183,62,.12)  --warn-line rgba(245,183,62,.32)
--danger #FF6F5E --danger-soft rgba(255,111,94,.12) --danger-line rgba(255,111,94,.34)
--success #4ADE80 (só recovery bom)
--scrim rgba(4,5,4,.72)
```
Semânticos:
```
Fit:      --fit-hi #C8FA4B (≥75, "alto") · --fit-mid #B5CF72 (50–74, "médio") · --fit-lo #A4AB9C (<50, "baixo") · --rung-off #30362D
Traço:    --trait-on #F0F3EA · --trait-off #30362D   (neutro: nível alto não é bom nem ruim)
Recovery: --rec-good #4ADE80 · --rec-warn #F5B73E · --rec-bad #FF6F5E · --rec-stale #A4AB9C
Demo:     --stage #0D100C + grade 16 px de --stage-grid rgba(255,255,255,.035)
```

### Contraste (WCAG 2.x, calculado)
text/bg 17,1 · text/surface-3 13,4 · text-dim/surface-3 6,6 · text-faint/bg 5,5 · text-faint/surface-2 4,6 · accent/bg 16,1 · accent-ink/accent 15,9 · warn/surface-1 9,3 · danger/surface-1 6,4. A página HTML mostra a tabela completa, calculada ao vivo.

### Tipografia
Fontes: **Space Grotesk** 400/500/600/700 (texto) e **JetBrains Mono** 400/500/600 + 500 itálico (números e genes).

| Classe | Fonte | Tamanho/entrelinha | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| `.t-display` | Grotesk | 32/36 | 700 | −0.028em | título de tela, saudação |
| `.t-title` | Grotesk | 26/30 | 700 | −0.022em | nome do exercício no treino ativo |
| `.t-heading` | Grotesk | 20/26 (24/28 no card da Home) | 600 | −0.012em | nome em folha e área de foco |
| `.t-section` | Grotesk | 16/22 | 600 | −0.005em | cabeçalho de seção |
| `.t-body` | Grotesk | 15/22 | 400 | 0 | leitura, dicas, passos |
| `.t-body-m` | Grotesk | 15/22 | 500 | 0 | item de lista, rótulo forte |
| `.t-secondary` | Grotesk | 13/18 | 500 | 0 | metadado (cor `--text-dim`) |
| `.t-caption` | Grotesk | 12/16 | 500 | +0.01em | rótulo de valor, legenda |
| `.n-xl` | Mono tnum | 44/44 | 600 | −0.04em | número herói (volume) |
| `.n-lg` | Mono tnum | 28/32 | 600 | −0.03em | descanso, resumo |
| `.n-md` | Mono tnum | 17/22 | 600 | −0.02em | kg × reps, métricas (20 px no stepper) |
| `.n-sm` | Mono tnum | 13/16 | 500 | −0.01em | contadores, genótipo |

Títulos com `text-wrap: balance`; parágrafos com `text-wrap: pretty`.

### Espaçamento (base 4)
`4 8 12 16 20 24 32 40 56` → `--s-1 … --s-14`. Margem lateral mobile 16. Entre itens do mesmo grupo 8; entre seções 20–28. Padding interno: área de foco 20, card 16.

### Raios
`--r-xs 6` · `--r-sm 12` · `--r-md 16` · `--r-lg 24` · `--r-pill 999` (regras de uso na seção 1).

### Movimento
```
--dur-1 120ms  toque (scale .98, cor)
--dur-2 200ms  troca de estado, seleção
--dur-3 320ms  bottom sheet, descanso, ✓ da série
--dur-4 560ms  gráfico, conclusão
--ease-out cubic-bezier(.2,.8,.2,1)   entradas
--ease-in  cubic-bezier(.4,0,1,1)     saídas
--ease-pop cubic-bezier(.3,1.5,.5,1)  SÓ no ✓ da série
```

### Iconografia
Traço 1.9, `stroke-linecap/linejoin: round`, grade 24 px, `fill: none`, `stroke: currentColor`. Paths em `v2/v2-core.jsx` (objeto `IC`): close, timer, play, pause, repeat, check, plus, minus, chev, back, swap, flame, user, home, dumbbell, checkin, chart, dna, sync, alert, trophy, up, heart, moon, wave, bolt, cloud.

---

## 3. Assinatura: hélice projetada
Uma dupla hélice vista de lado vira uma fileira de traços verticais cujo comprimento segue `|cos|`, com uma volta a cada **10,5 pares de base** (valor real do DNA-B).

```
altura_i = h * (0.26 + 0.74 * |cos(2π·i / 10.5)|)   (mín. 2 px), centrado verticalmente
acesos   = round(n * fit / 100)
cor      = fitColor(fit) nos acesos, --rung-off nos apagados
```
Tamanhos do componente `Fit`: `sm` n=11 h=12 w=2 gap=2 (linhas, etiquetas) · `md` n=16 h=16 (área de foco) · `lg` n=32 h=28 w=2.5 gap=2.5 (tela DNA). Sempre acompanhado do número (mono, cor do nível) + "fit" (12 px, `--text-dim`). `aria-label="fit genético 68 de 100, médio"`.

Usos permitidos: fit, barra de progresso do treino (1 traço = 1 série), fita de marcadores na tela DNA, conclusão de treino. **Proibido**: loading, fundo, divisória, logotipo animado.

---

## 4. Componentes
Implementação de referência em `v2/v2-core.jsx` + CSS em `v2/helux-v2.css`.

**Botão** (`.hx-btn`): altura 44 (`--lg` 56, fonte 17), padding 0 20 (lg 24), pílula, 15/600.
- `primary`: fundo `--accent`, texto `--accent-ink`; hover `#D2FB66`; pressionado `--accent-press` + scale .98; desabilitado fundo `--surface-3` texto `--text-disabled`; carregando = texto transparente + spinner 18 px (`aria-busy`). Ícone play dentro de círculo 28 px `--accent-ink`.
- `secondary`: `--surface-2` + inset 1px `--hairline-2`, texto `--text`; pressionado `--surface-3`.
- `ghost`: transparente, `--text-dim`; hover `--surface-1`.
- `danger`: `--danger-soft` + inset `--danger-line`, texto `--danger` (encerrar treino).
- Ícone (`.hx-icbtn`): 44×44 círculo, `--surface-1` + hairline; variante `bare` sem fundo.

**Etiqueta** (`.hx-tag`): altura 24, padding 0 8, raio 6, `--surface-2`, 12/500 `--text-dim`. Variantes `outline`, `warn`.
**Marcador genético** (`.hx-gtag`): altura 22, raio 6, inset 1px `--hairline-2`, mono 11.5; gene em itálico `--text`, genótipo `--text-dim`. Variante `warn`: borda `--warn-line` + quadrado 5 px `--warn` à esquerda.

**Seletor segmentado** (`.hx-seg`): trilho `--bg` + hairline, padding 4, gap 4, pílula; botões ≥44 px, 14/500 `--text-dim`. Selecionado: fundo `--text`, texto `--bg`, 600. Variante abas (`--tabs`): trilho `--surface-1` raio 12, botões raio 8 altura 40, selecionado `--surface-3` + `--text`.

**Stepper** (`.hx-step`): grid `44px 1fr 44px`, altura 52, raio 12, `--surface-2` + hairline. Valor mono 20/600 + unidade 11 px abaixo. Passos: kg **2,5**, reps **1**, mínimo 0. Erro: borda `--danger-line`.

**Linha de série** — duas formas:
- *Compacta* (`.hx-set`, concluída/próxima): grid `28px 1fr auto 44px`, altura mín. 52, divisória no topo. nº (mono 15/600, `--accent` se concluída) · anterior (mono 13 `--text-faint`, "—" se não houver) · valor "80 kg × 8" (mono 17/600) · ✓ 44 px. Tocar na linha a torna atual (edição).
- *Atual* (`.hx-cur`, área de foco raio 24): topo "Série 2 de 4" + "Anterior 80 × 8"; linha `1fr 1fr 52px` com stepper kg, stepper reps e ✓ 52 px. Container query: com largura ≤ 300 px o ✓ desce para linha inteira (pílula 48 px).
- ✓ (`.hx-chk`): círculo com inset 1.5px `--hairline-3`; ativo = `--accent` + ícone `--accent-ink` traço 2.6; ao ativar anima `hx-pop` (scale .8→1, 320 ms, `--ease-pop`).

**Progresso do treino** (`.hx-prog`): grupos por exercício (flex proporcional ao nº de séries, gap 8), traços gap 2, altura 6, raio 2; feito = `--accent`, pendente = `--rung-off`; grupo atual com traços de 14 px (pendentes `#434A3F`). Cada grupo é botão (vai ao exercício). `role=progressbar`.

**Progresso do ciclo** (`.hx-cycle`): 4 colunas, barra 6 px; concluído `--text-dim`, atual `--accent`, rótulo "D, hoje".

**Anel** (`Ring`): só para tempo que corre (descanso). Trilho `--rung-off`, traço `--accent`, `linecap round`, transição do dashoffset 1s linear.

**Dicas de execução** (`.hx-tips`): uma orientação por linha, 15/22 `--text`, divisória entre itens. Marcador: traço 6×2 `--text-faint`; dica com gene usa quadrado 6×6 `--warn` e `GeneTag warn` abaixo do texto (margem 6). Nunca parágrafo, nunca texto verde, nunca "ATENÇÃO".

**Passos numerados** (`.hx-steps`): número mono 13/600 em quadrado 28 px raio 6 com borda `--hairline-3`; gap 14. "Erro comum:" como último passo, número e prefixo em `--warn`.

**Cabeçalho de tela**: grid `44px 1fr 44px`; título 15/500 centrado com elipse; subtítulo mono 13 `--text-dim` ("1/23 séries").
**Cabeçalho de seção**: `.t-section` + complemento `.t-caption` à direita, `white-space: nowrap`.

**NavBar** (`.hx-nav`): 4 itens (Hoje, Treinos, Check-in, Progresso), fundo `rgba(14,16,14,.92)` + blur 16, borda superior hairline, itens ≥50 px, 11.5/500 `--text-dim`. Ativo: texto `--text` 600, ícone `--accent`, traço 20×3 `--accent` no topo. `aria-current="page"`.

**Bottom sheet**: `--surface-1`, raio 24 no topo, alça 36×4 `--hairline-3`, entrada `translateY(40px)→0` 320 ms `--ease-out`, scrim `--scrim` com fade. Rodapé fixo com botão secundário "Fechar" e safe-area. `role=dialog aria-modal`.
**Diálogo**: centrado, margens 16, raio 24, padding 24/20/16; ações empilhadas (destrutiva em cima, "Continuar treinando" ghost).
**Toast**: fundo `--text`, texto `--bg`, raio 16, altura 52, ação sublinhada ("Desfazer"). Erro: fundo `#2A1614` + borda `--danger-line`.

**Campo numérico** (`.hx-field`): label 13/500 `--text-dim`; caixa 52 px raio 12 `--surface-2`; input mono 20/600 tnum, `inputmode="decimal"`; unidade fixa à direita. Foco: inset 1.5px `--text`. Erro: inset 1.5px `--danger` + mensagem 12 px `--danger` ("Use um valor entre 3 e 50 %"). Desabilitado: fundo transparente, texto `--text-disabled`.

**Banner** (`.hx-banner`): grid `20px 1fr`, raio 16, padding 12/14, 14/20. `warn` (dados antigos) e `err` (falha), título 600 + texto `--text-dim` + ação opcional.

**Linha de histórico**: plana, divisória no topo, 64 px; nome 15/500 + data 13; à direita volume mono 17 + "19 séries, 52 min" mono 13; chevron.
**Recorde pessoal**: plano; exercício + "100 kg × 5" mono à direita; linha 2 com quando + delta ("+5 kg", `--accent` só se for recorde recém-batido).
**Gráfico de barras**: colunas máx. 28 px, raio 4 4 2 2, `--surface-3`; semana atual `--text`. Sem eixo Y, sem grade, sem verde. Número herói `.n-xl` acima + delta. `role=img` com `aria-label` descrevendo os valores.

**Skeleton** (`.hx-sk`): `--surface-2` (ou `--surface-3` dentro da área de foco), brilho de 1,4 s desligado em reduced-motion.

---

## 5. Telas (mobile 375 px)
Margem lateral 16. Status bar 48 px. Conteúdo rola; CTA fixo e NavBar docados embaixo com safe-area.

### 5.1 Hoje (Home)
1. Topo 56 px: marca (HelixMark 22 px + "helux" 18/700) · streak ghost ("🔥" ícone flame `--warn` + "1" mono + "sem") · botão ícone perfil (leva a DNA/perfil).
2. "Quarta-feira, 23 de set." `.t-secondary` · "Bom treino, Doug" `.t-display` (tudo em `--text`; **sem** nome em verde).
3. **Área de foco** (padding 20, margem-top 20): "Treino D — Ombro + Core" + "7 exercícios" à direita · "Agachamento Livre (Barra)" 24/28 600 · `Fit md 68` · grid "Depois" → "Leg Press 45°", "Agachamento Búlgaro (Halteres)", "e mais 4" · divisória de borda a borda · "Como você está hoje" + "Informado por você" · seletor segmentado (ótimo / normal / cansado / exausto; normal selecionado) · CTA primário lg "Iniciar treino ▶" (margem-top 16).
4. Plano: "Ciclo atual" + "2 de 4 treinos concluídos" · `hx-cycle` A ✓, B ✓, C, D (hoje).
5. Plano com divisória: "Último check-in" + "jul. 2026" · grid 2×2 Peso 82,0 kg · Gordura 18,0 % · Agachamento 100 kg · Supino 80 kg · botões "Novo check-in" (secondary) e "Gerar novo plano" (ghost).
6. NavBar, "Hoje" ativo.
- **Carregando**: área de foco com skeleton na forma final (linha 150/80, título 85%, fit 90, duas linhas, pílula 52, pílula 56).
- **Desktop**: mesma estrutura numa coluna de 512 px centrada; NavBar alinhada à coluna.

### 5.2 Treino ativo (sem NavBar)
1. Cabeçalho: fechar (ícone) · "Agachamento Livre" / "1/23 séries" · timer (ícone).
2. Barra de progresso por série (grupos 4,3,3,4,3,3,3 = 23), padding 4 16.
3. Etiqueta "Musculação" + `Fit sm 68` · título `.t-title` "Agachamento Livre (Barra)" · "**4 × 8–10** reps, descanso **90s**" (números mono `--text`, resto `--text-dim`).
4. Dicas (lista): "Mantenha joelhos alinhados com a ponta dos pés, sem colapso valgo" [COL1A1 C,C] · "Desça controlado (3s), suba explosivo" · "Profundidade até paralelo, não force além do conforto" · "Calcanhares no chão o tempo todo" · "Priorize qualidade técnica sobre carga: o objetivo é voltar a correr 5 km sem dor no joelho".
5. Card com duas linhas-botão: miniatura 52 px (stage) + "Ver execução" / "Técnica, músculos e 4 variantes" + chevron (abre bottom sheet) · ícone swap + "Variante com fit maior disponível" + `Fit 74` + chevron.
6. "Séries" + "kg × reps" · série 1 compacta concluída · série 2 atual (foco) · séries 3–4 compactas · "Adicionar série" (ghost, ícone +; clona a última, anterior "—").
7. Dock fixo: CTA primário lg "Próximo exercício ›".
- **Descanso rodando** (após ✓): acima do CTA sobe um bloco de foco (entrada 320 ms): anel 48 px + "Descanso" + tempo `.n-lg` "1:12" + "+15s" (secondary) + "Pular" (ghost). Enquanto o descanso corre, "Próximo exercício" vira **secondary**. Ao zerar, o bloco some e o CTA volta a primário.

### 5.3 Folha de execução (bottom sheet sobre o treino ativo; top 44 px)
1. Área de demonstração 216 px (`hx-stage`, raio 16): boneco de traço animado (agachamento vista lateral, anilha `--accent`, linha tracejada "paralelo"); canto superior direito "2·0·1" `.n-md` + "cadência"; canto inferior esquerdo pausar/reproduzir (ícone) + "Repetir" (secondary).
2. "Agachamento Livre (Barra)" `.t-heading` + `Fit 68` · etiquetas Quadríceps, Barra, Avançado.
3. Abas "Execução" / "Variantes (4)".
4. Execução: passos numerados (4, o último "Erro comum: deixar os joelhos colapsarem para dentro na subida") · "Músculos trabalhados" · mapa do corpo 84×150 (Quadríceps `--accent` primário; Core `--accent-soft` + borda `--accent-line` secundário) + legenda.
5. Variantes: lista plana — nome, `Fit`, etiquetas equipamento/nível, "Atual" (outline) ou botão "Trocar" (secondary se fit > atual, ghost se menor).
6. Rodapé fixo: "Fechar" (secondary lg).
- Animação: cadência 2·0·1 = 2 s descendo, 0 pausa, 1 s subindo, 0,6 s parado no topo; easing in-out; loop via rAF. Reduced-motion: parado em t = 0,5.

### 5.4 DNA
Cabeçalho "Perfil" com voltar · "Seu DNA" display · texto 15 `--text-dim` · **fita de marcadores** (44 traços, altura 64, loci acesos em `--accent`, nomes dos genes em itálico mono 11 embaixo) · "Marcadores genéticos" + "4 de 4 lidos" · cards (padding 16, gap 8): gene itálico 17 + genótipo mono 13 · nível (3 barras 3 px de 9/12/15 px + palavra baixo/médio/alto) · nome do traço 13 `--text` · impacto 13 `--text-dim` (quadrado `--warn` antes se for traço de risco) · "Como molda seu treino": linhas planas com regra + detalhe + `GeneTag`.

### 5.5 Progresso
"Sua evolução" · "Recovery de hoje" + "Apple Watch" · banner warn "Dados antigos — sincronize novamente" / "Última leitura ontem, 07:12. O treino de hoje usa só o que você informou." + "Sincronizar" · grid 2×2 de cards HRV 48 ms, FC de repouso 58 bpm, Sono 6h52, Calorias 2.340 kcal (valores em `--text-dim` enquanto os dados estiverem antigos) · "Volume semanal": 17,4 t `.n-xl` + "+7%" + "vs. semana anterior" + barras de 8 semanas · "Recordes pessoais" · "Histórico". NavBar com "Progresso" ativo.

### 5.6 Treino concluído (sem NavBar)
Fita de 23 traços (helix, altura 12–40) que **acendem em sequência** (35 ms de atraso por traço, 200 ms cada) — o único momento orquestrado do app · "Treino concluído" display · "Treino D — Ombro + Core, 58 min" · grid 2×2 Volume 9.840 kg, Séries 23/23, Duração 58 min, Recordes 1 · área de foco "Novo recorde" (ícone troféu `--warn` em quadrado `--surface-3`) Agachamento Livre (Barra) 85 kg × 8 · CTA "Voltar para Hoje".
- **Salvando**: CTA em loading + "Salvando treino…" (`role=status`).
- **Erro**: banner err "Não foi possível salvar" / "Sem conexão com o servidor. O treino está guardado neste aparelho e não será perdido." + CTA "Tentar de novo" (ícone sync) + ghost "Sair sem sincronizar".

---

## 6. Interações e estado
- **Concluir série** (momento orquestrado): `done=true` → ✓ anima pop → linha colapsa para compacta → traço correspondente acende na barra do topo → contador do cabeçalho atualiza → descanso começa com o `rest` do exercício (90 s).
- **Descanso**: decrementa 1/s; `+15s` soma; `Pular` zera. Ao zerar, esconde o bloco. (Produção: notificação/vibração ao terminar.)
- **Série atual** = índice em edição, ou a primeira não concluída. Tocar numa linha compacta a torna atual. Tocar no ✓ de uma concluída desfaz.
- **Stepper**: kg ± 2,5, reps ± 1, mínimo 0; `aria-live=polite` no valor.
- **Adicionar série**: clona a última, `prev = null` (mostra "—"), `done=false`.
- **Seletor de cansaço**: escolha única; persiste e alimenta o ajuste do treino.
- **Grupo da barra de progresso**: navega ao exercício.
- **Ver execução**: abre sheet; tocar no scrim ou "Fechar" fecha.

Estado mínimo da sessão:
```ts
type SetEntry = { prev: string | null; w: number; r: number; done: boolean };
type ActiveState = { exerciseIndex: number; sets: SetEntry[][]; editing: number | null; restLeft: number; sheetOpen: boolean };
type Feel = 'ótimo' | 'normal' | 'cansado' | 'exausto';
type SaveState = 'idle' | 'saving' | 'error' | 'saved';
```
Persista a sessão em storage local a cada mudança e restaure ao reabrir. Fit: `≥75 alto`, `50–74 médio`, `<50 baixo`.

## 7. Assets
Sem imagens. Ícones, marca (HelixMark: 7 traços com altura por |cos|, 4 primeiros `--accent`, demais `--text-dim`), boneco da demonstração e mapa do corpo são SVG inline em `v2/v2-core.jsx`. Fontes via Google Fonts.

## 8. Arquivos
| Arquivo | Conteúdo |
|---|---|
| `Helux Design System v2.html` | Documento visual completo: plano, fundamentos, contraste, componentes com estados, telas interativas, regras, antes → depois |
| `v2/helux-v2.css` | **Tokens e CSS de todos os componentes** (fonte da verdade) |
| `v2/v2-core.jsx` | Ícones, Helix/Fit, botões, seletor, stepper, linhas de série, progresso, anel, dicas, passos, NavBar, campo, banner, gráfico, skeleton, demonstração, mapa do corpo |
| `v2/v2-screens.jsx` | Telas Hoje (mobile/desktop/carregando), Treino ativo (+descanso), Folha de execução, DNA, Progresso, Treino concluído (+salvando/erro) |
| `v2/v2-doc-a.jsx`, `v2/v2-doc-b.jsx` | Páginas de documentação |

Dados de exemplo (genótipos de ACTN3, WNT16, PPARGC1A; variantes; histórico; recordes) são ilustrativos — substituir pelos dados reais da API. Apenas "COL1A1 C,C" veio do perfil do usuário.
