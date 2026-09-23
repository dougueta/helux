// v2-doc-a.jsx — plan + foundations
function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function parseCol(c, under) {
  if (c.startsWith('#')) return hex2rgb(c);
  const m = c.match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number); const a = m[3] ?? 1; const u = under ? parseCol(under) : [0, 0, 0];
  return [0, 1, 2].map(i => Math.round(m[i] * a + u[i] * (1 - a)));
}
function lum(rgb) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; const [r, g, b] = rgb.map(f); return .2126 * r + .7152 * g + .0722 * b; }
function ratio(fg, bg, base) { const B = parseCol(bg, base); const F = parseCol(fg, bg.startsWith('#') ? bg : base); const a = lum(F), b = lum(B); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }

function Sec({ id, n, title, lead, children }) {
  return <section id={id} className="d-sec"><div className="d-sec-n n-sm">{n}</div><h2 className="d-h2">{title}</h2>{lead && <p className="d-lead">{lead}</p>}{children}</section>;
}
function Sub({ title, children, note }) { return <div className="d-sub"><h3 className="d-h3">{title}</h3>{note && <p className="d-note">{note}</p>}{children}</div>; }

function Plan() {
  const pal = [['Carvão', '#0A0C0A', 'Fundo. Leve tom verde, nunca preto puro.'], ['Musgo', '#161916', 'Card: agrupa o que é tocável ou comparável.'], ['Líquen', '#1E221D', 'Área de foco: a única coisa a fazer agora.'], ['Osso', '#F0F3EA', 'Texto e estado selecionado neutro.'], ['Limão', '#C8FA4B', 'Ação principal, estado ativo, dado de fit.'], ['Âmbar', '#F5B73E', 'Atenção genética e dados que pedem cuidado.']];
  return <Sec id="plano" n="00" title="Plano" lead="O Helux continua escuro, verde-limão e em Space Grotesk. O que muda é a disciplina: uma assinatura ligada ao DNA, três níveis de superfície com função e uma escala tipográfica que deixa a série atual legível a um braço de distância.">
    <Sub title="Paleta de trabalho">
      <div className="d-pal">{pal.map(([n, h, d]) => <div key={n} className="d-pal-i"><i style={{ background: h, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)' }} /><div><b>{n}</b> <span className="n-sm dim">{h}</span><p className="t-secondary">{d}</p></div></div>)}</div>
    </Sub>
    <Sub title="Tipografia e papéis">
      <ul className="d-list">
        <li><b>Space Grotesk</b> em tudo que é palavra. Display 700 com tracking negativo para nome de exercício e título de tela; 600 para seções; 400/500 para leitura.</li>
        <li><b>JetBrains Mono</b> com algarismos tabulares para kg, reps, tempo, fit e genótipo. Unidade sempre em Space Grotesk, menor e mais clara, para o número ser lido primeiro.</li>
        <li><b>Símbolo de gene em itálico</b>, como na nomenclatura científica (<span className="gene">COL1A1</span>, <span className="gene">ACTN3</span>). O genótipo fica em pé ao lado: <span className="gene">COL1A1</span> <span className="n-sm">C,C</span>. É o detalhe de laboratório que nenhum app fitness genérico tem.</li>
      </ul>
    </Sub>
    <Sub title="A assinatura: a hélice projetada">
      <div className="d-sig">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Helix value={68} n={42} h={44} w={3} gap={3} on="var(--accent)" />
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}><Fit value={68} size="lg" /><Fit value={82} size="md" /><Fit value={44} size="sm" /></div>
        </div>
        <p className="t-body dim">Uma dupla hélice vista de lado vira uma fileira de traços cujo comprimento segue |cos|, com uma volta completa a cada 10,5 pares de base, o valor real do DNA. O fit genético é essa fileira acesa até o valor. A mesma unidade, o traço, conta séries no treino ativo e se acende em sequência ao concluir o treino. É o único elemento expressivo do sistema; todo o resto é quieto.</p>
      </div>
    </Sub>
    <Sub title="Conceito de layout">
      <div className="d-ascii">
        <pre>{`HOJE (375)
┌───────────────────────────────┐
│ ⌇helux           🔥1 sem  (◯) │
│ Quarta-feira, 23 de set.      │
│ Bom treino, Doug              │  display
│╭─ área de foco ──────────────╮│  surface-2
││Treino D — Ombro + Core   7  ││
││Agachamento Livre (Barra)    ││  heading 24
││▮▮▮▮▮▯▯▯ 68 fit              ││  assinatura
││Depois  Leg Press 45°        ││
││        Agach. Búlgaro …     ││
││─────────────────────────────││
││Como você está hoje          ││
││(ótimo)[normal](cansado)(ex.)││
││[      Iniciar treino ▶     ]││  único verde
│╰─────────────────────────────╯│
│ Ciclo atual     2 de 4        │  plano, sem card
│ ▬▬▬ ▬▬▬ ▭▭▭ ▬▬▬               │
│ ───────────────────────────── │
│ Último check-in               │
│ Peso 82,0 kg  Gordura 18,0 %  │
├───────────────────────────────┤
│ Hoje  Treinos  Check-in  Prog.│
└───────────────────────────────┘`}</pre>
        <pre>{`TREINO ATIVO (375)
┌───────────────────────────────┐
│ (×)  Agachamento Livre   (⏱) │
│         1/23 séries           │
│ ▌▌▌▌ ▖▖▖ ▖▖▖ ▖▖▖▖ ▖▖▖ ▖▖▖ ▖▖▖ │  1 traço = 1 série
│ Musculação  ▮▮▮▯ 68 fit       │
│ Agachamento Livre (Barra)     │  title 26
│ 4 × 8–10 reps, descanso 90s   │
│ – Joelhos alinhados…          │
│   [COL1A1 C,C]                │  etiqueta genética
│ – Desça controlado (3s)…      │
│ – …                           │
│ ┌ ▶ Ver execução          › ┐ │  card
│ └ ⇅ Variante c/ fit maior 74› ┘ │
│ Séries                        │
│  1  80×8        80 kg × 8  (✓)│  linha compacta
│╭ Série 2 de 4   Anterior 80×8╮│  foco
││[− 80 kg +][− 8 reps +] [ ✓ ]││  52 px de altura
│╰─────────────────────────────╯│
│  3  80×8        80 kg × 8  ( )│
│ ╭(◔) Descanso 1:12  +15s Pular╮ │  surge ao concluir
│ [     Próximo exercício  ›   ]│
└───────────────────────────────┘`}</pre>
      </div>
    </Sub>
    <Sub title="Princípios do Helux">
      <ol className="d-princ">
        <li><b>Uma coisa por vez.</b> Cada tela tem uma única área de foco. Na academia, é a série atual; em casa, o treino de hoje.</li>
        <li><b>O número manda.</b> Carga, reps e tempo são o maior texto da tela quando estão em uso. Rótulo e unidade recuam.</li>
        <li><b>Todo verde tem motivo.</b> Limão só em ação principal, estado ativo e fit. Se não é um dos três, não é verde.</li>
        <li><b>A genética explica, não decora.</b> Gene aparece como etiqueta ao lado da orientação que ele justifica, nunca como enfeite.</li>
      </ol>
    </Sub>
    <Sub title="Revisão do plano contra o brief" note="O que eu faria por padrão para qualquer app fitness escuro, e o que troquei.">
      <div className="d-swap">{[
        ['Anel de progresso brilhante como herói', 'Hélice projetada como assinatura. O anel fica só no descanso, onde tempo circular faz sentido.'],
        ['Glow verde e gradiente no card principal', 'Nenhum glow no sistema. Destaque vem de superfície (Líquen) e de borda mais clara.'],
        ['Rótulo em caixa alta em cima de cada bloco', 'Cabeçalho de seção em caixa normal, 16/600, e só quando o bloco não se explica sozinho.'],
        ['Chip pílula para tudo', 'Pílula = tocável. Etiqueta informativa é retângulo de 6 px. A forma diz se dá para tocar.'],
        ['Seleção sempre em verde', 'Seleção neutra (Osso) no seletor de cansaço. O verde fica para o CTA logo abaixo, sem competir.'],
        ['Tabela de séries com steppers em todas as linhas', 'Só a série atual abre os steppers de 52 px; as outras viram uma linha legível de 80 kg × 8.'],
      ].map(([a, b], i) => <div key={i}><span className="d-was">{a}</span><span>→</span><span>{b}</span></div>)}</div>
    </Sub>
  </Sec>;
}

function Swatch({ name, v, note }) {
  return <div className="d-sw"><i style={{ background: v }} /><div><div className="t-body-m" style={{ fontSize: 14 }}>{name}</div><div className="n-sm dim" style={{ fontSize: 12 }}>{v}</div>{note && <div className="t-caption faint" style={{ marginTop: 2 }}>{note}</div>}</div></div>;
}
function Foundations() {
  const C = { bg: '#0A0C0A', s1: '#161916', s2: '#1E221D', s3: '#272C25' };
  const pairs = [['text', '#F0F3EA', 'bg'], ['text', '#F0F3EA', 's3'], ['text-dim', '#A4AB9C', 'bg'], ['text-dim', '#A4AB9C', 's2'], ['text-dim', '#A4AB9C', 's3'],
    ['text-faint', '#858C7F', 'bg'], ['text-faint', '#858C7F', 's1'], ['text-faint', '#858C7F', 's2'], ['text-faint (v1)', '#6A7164', 's2'],
    ['accent', '#C8FA4B', 'bg'], ['accent', '#C8FA4B', 's2'], ['accent-ink', '#0C1003', 'accent', '#C8FA4B'], ['bg (seleção)', '#0A0C0A', 'text', '#F0F3EA'],
    ['fit-mid', '#B5CF72', 's1'], ['fit-lo', '#A4AB9C', 's1'], ['warn', '#F5B73E', 's1'], ['danger', '#FF6F5E', 's1'], ['success', '#4ADE80', 's1'], ['text-disabled', '#5E6558', 's1']];
  return <Sec id="fundamentos" n="01" title="Fundamentos" lead="Tokens em CSS. Nomes antigos preservados; novos tokens só onde havia uma decisão sem nome.">
    <Sub title="Superfícies e texto">
      <div className="d-sws">
        <Swatch name="--bg" v="#0A0C0A" note="fundo" /><Swatch name="--surface-1" v="#161916" note="card, folha" /><Swatch name="--surface-2" v="#1E221D" note="área de foco, controles" /><Swatch name="--surface-3" v="#272C25" note="pressionado, trilha" />
        <Swatch name="--text" v="#F0F3EA" /><Swatch name="--text-dim" v="#A4AB9C" /><Swatch name="--text-faint" v="#858C7F" note="era #6A7164" /><Swatch name="--text-disabled" v="#5E6558" note="novo, só desabilitado" />
        <Swatch name="--hairline" v="rgba(255,255,255,.07)" /><Swatch name="--hairline-2" v="rgba(255,255,255,.11)" /><Swatch name="--hairline-3" v="rgba(255,255,255,.20)" note="novo, contorno de controle" /><Swatch name="--scrim" v="rgba(4,5,4,.72)" note="novo, atrás de folhas" />
      </div>
    </Sub>
    <Sub title="Acento e estados">
      <div className="d-sws">
        <Swatch name="--accent" v="#C8FA4B" /><Swatch name="--accent-press" v="#B2E03A" note="novo" /><Swatch name="--accent-ink" v="#0C1003" /><Swatch name="--accent-soft" v="rgba(200,250,75,.14)" />
        <Swatch name="--warn" v="#F5B73E" /><Swatch name="--danger" v="#FF6F5E" /><Swatch name="--success" v="#4ADE80" note="só recovery bom" /><Swatch name="--accent-glow" v="rgba(200,250,75,.30)" note="aposentado" />
      </div>
    </Sub>
    <Sub title="Tokens semânticos" note="Cor nunca é o único portador: o fit tem número e comprimento; traço tem palavra e altura; recovery tem palavra.">
      <div className="d-sem">
        <div><h4>Fit genético</h4>{[[82, 'alto, ≥ 75', '--fit-hi'], [68, 'médio, 50–74', '--fit-mid'], [44, 'baixo, < 50', '--fit-lo']].map(([v, l, t]) => <div key={v} className="d-sem-r"><Fit value={v} size="md" /><span className="t-caption">{l}</span><span className="n-sm faint">{t}</span></div>)}</div>
        <div><h4>Nível de traço genético</h4>{[1, 2, 3].map(n => <div key={n} className="d-sem-r"><Level n={n} /><span className="n-sm faint">--trait-on / off</span></div>)}<p className="t-caption" style={{ marginTop: 8 }}>Neutro de propósito: nível alto não é bom nem ruim.</p></div>
        <div><h4>Recovery</h4>{[['bom', '--rec-good'], ['atenção', '--rec-warn'], ['ruim', '--rec-bad'], ['sem dados recentes', '--rec-stale']].map(([l, t]) => <div key={l} className="d-sem-r"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><i style={{ width: 8, height: 8, borderRadius: 2, background: `var(${t})` }} /><span className="t-body-m" style={{ fontSize: 14 }}>{l[0].toUpperCase() + l.slice(1)}</span></span><span className="n-sm faint">{t}</span></div>)}</div>
        <div><h4>Área de demonstração</h4><div className="hx-stage" style={{ height: 120 }}><div style={{ position: 'absolute', inset: '4px 30%' }}><SquatDemo /></div></div><p className="t-caption" style={{ marginTop: 8 }}>--stage #0D100C + grade de 16 px (--stage-grid). Papel milimetrado de laboratório; só aqui.</p></div>
      </div>
    </Sub>
    <Sub title="Contraste" note="Calculado a partir dos tokens (WCAG 2.x). AA: 4,5 para texto normal, 3 para display ≥ 24 px.">
      <div className="d-ct">{pairs.map(([n, fg, bgk, bgv], i) => { const bg = bgv || C[bgk]; const r = ratio(fg, bg); const ok = r >= 4.5; const dis = n === 'text-disabled';
        return <div key={i} className="d-ct-i" style={{ background: bg }}><span style={{ color: fg, fontWeight: 600, fontSize: 15 }}>Aa 80 kg</span><span className="n-sm" style={{ color: fg, opacity: .9, fontSize: 11 }}>{n} / {bgk}</span>
          <b className="n-sm" style={{ color: bg === '#F0F3EA' || bg === '#C8FA4B' ? '#0A0C0A' : '#F0F3EA' }}>{r.toFixed(1)}:1 {dis ? 'isento' : ok ? 'AA' : 'falha'}</b></div>; })}</div>
      <p className="d-note">--text-faint subiu de #6A7164 (3,6:1 em surface-2) para #858C7F. Não use --text-faint sobre surface-3.</p>
    </Sub>
    <Sub title="Escala tipográfica" note="Base 15 px, razão aproximada de 1,2 (terça menor), à maneira de The Elements of Typographic Style: poucos tamanhos, cada um com uma tarefa.">
      <div className="d-type">{[
        ['t-display', '32 / 36 · 700 · −2,8%', 'Título de tela, saudação', 'Bom treino, Doug'],
        ['t-title', '26 / 30 · 700 · −2,2%', 'Nome do exercício no treino ativo', 'Agachamento Livre (Barra)'],
        ['t-heading', '20 / 26 · 600 · −1,2%', 'Nome em folha e card de foco (24 na Home)', 'Leg Press 45°'],
        ['t-section', '16 / 22 · 600', 'Cabeçalho de seção', 'Recordes pessoais'],
        ['t-body', '15 / 22 · 400', 'Leitura, dicas, passos', 'Desça controlado (3s), suba explosivo'],
        ['t-secondary', '13 / 18 · 500', 'Metadado, descrição curta', 'Técnica, músculos e 4 variantes'],
        ['t-caption', '12 / 16 · 500 · +1%', 'Rótulo de valor, legenda, unidade', 'Informado por você'],
        ['n-xl', 'Mono 44 / 44 · 600 · −4%', 'Número herói: volume, total', '17,4'],
        ['n-lg', 'Mono 28 / 32 · 600 · −3%', 'Descanso, resumo', '1:12'],
        ['n-md', 'Mono 17 / 22 · 600 · −2%', 'kg e reps em linha, métricas', '80 kg × 8'],
        ['n-sm', 'Mono 13 / 16 · 500', 'Contadores, genótipo', '1/23 séries'],
      ].map(([c, s, u, ex]) => <div key={c} className="d-type-r"><div><div className="n-sm" style={{ color: 'var(--text)' }}>.{c}</div><div className="t-caption">{s}</div><div className="t-caption faint">{u}</div></div><div className={c} style={{ color: 'var(--text)' }}>{ex}</div></div>)}</div>
      <p className="d-note">Algarismos tabulares (tnum) em todo número: "80" e "82,5" ocupam a mesma largura por dígito, então o valor não pula quando o stepper muda. Decimal com vírgula, milhar com ponto (9.840 kg).</p>
    </Sub>
    <Sub title="Espaçamento, base 4">
      <div className="d-space">{[4, 8, 12, 16, 20, 24, 32, 40, 56].map((v, i) => <div key={v}><i style={{ width: v, height: v }} /><span className="n-sm">{v}</span><span className="t-caption faint">--s-{[1, 2, 3, 4, 5, 6, 8, 10, 14][i]}</span></div>)}</div>
      <p className="d-note">16 de margem lateral no celular. 8 entre itens do mesmo grupo, 20–28 entre seções. A área de foco usa 20 de respiro interno; cards, 16.</p>
    </Sub>
    <Sub title="Raios: a forma diz o que é">
      <div className="d-radii">{[['6', '--r-xs', 'Etiqueta, marcador genético, nº de passo. Informação, não toque.'], ['12', '--r-sm', 'Stepper, campo, miniatura. Controle de valor.'], ['16', '--r-md', 'Card, banner, área de demonstração.'], ['24', '--r-lg', 'Área de foco, folha, diálogo. Só um por tela.'], ['999', '--r-pill', 'Botão e seletor. Se é pílula, dá para tocar.']].map(([v, t, d]) =>
        <div key={t}><i style={{ borderRadius: +v > 100 ? 999 : +v }} /><div className="n-sm">{t} <span className="dim">{v}</span></div><p className="t-caption">{d}</p></div>)}</div>
    </Sub>
    <Sub title="Superfícies e elevação" note="Quatro níveis. Sombra só em quem flutua sobre outra tela.">
      <div className="d-elev">
        <div style={{ background: 'var(--bg)', boxShadow: 'inset 0 0 0 1px var(--hairline)' }}><b>Plano</b><p className="t-caption">bg + divisória. Listas, histórico, dados de apoio.</p></div>
        <div className="hx-card"><b>Card</b><p className="t-caption">surface-1 + hairline. Um grupo tocável ou comparável.</p></div>
        <div className="hx-focus"><b>Área de foco</b><p className="t-caption">surface-2 + hairline-2, raio 24. A próxima ação. Um por tela.</p></div>
        <div className="hx-raised"><b>Elevado</b><p className="t-caption">surface-1, raio 24, sombra. Folha e diálogo, sempre com scrim.</p></div>
      </div>
    </Sub>
    <Sub title="Movimento">
      <div className="d-motion">{[['--dur-1', '120 ms', 'toque: escala .98, cor'], ['--dur-2', '200 ms', 'troca de estado, seleção'], ['--dur-3', '320 ms', 'folha, descanso, check'], ['--dur-4', '560 ms', 'gráfico, conclusão']].map(([t, v, u]) => <div key={t}><span className="n-sm">{t}</span><b className="n-md">{v}</b><span className="t-caption">{u}</span></div>)}</div>
      <p className="d-note">--ease-out cubic-bezier(.2,.8,.2,1) para entradas; --ease-in (.4,0,1,1) para saídas; --ease-pop (.3,1.5,.5,1) só no ✓ da série. Momento orquestrado: concluir série → ✓ preenche com pop, o traço da série acende na barra do topo, o descanso sobe do rodapé. Ao concluir o treino, os 23 traços acendem em sequência (35 ms cada). Com prefers-reduced-motion, tudo vira troca instantânea e a demonstração fica parada no meio do movimento.</p>
    </Sub>
    <Sub title="Iconografia" note="Traço 1,9, pontas e junções arredondadas, grade de 24 px com 2 px de respiro. Ícone acompanha texto; sozinho, só com aria-label e alvo de 44 px.">
      <div className="d-icons">{['close', 'timer', 'play', 'pause', 'repeat', 'check', 'plus', 'minus', 'chev', 'back', 'swap', 'flame', 'user', 'home', 'dumbbell', 'checkin', 'chart', 'sync', 'alert', 'trophy', 'heart', 'moon', 'wave', 'cloud'].map(n => <div key={n}><Icon n={n} /><span className="t-caption faint">{n}</span></div>)}</div>
    </Sub>
  </Sec>;
}
Object.assign(window, { Sec, Sub, Plan, Foundations, ratio });
