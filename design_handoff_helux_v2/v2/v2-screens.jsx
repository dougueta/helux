// v2-screens.jsx — Helux v2 key screens
function Phone({ children, dock, nav, overlay, label }) {
  return <div className="hx-phone" data-screen-label={label}>
    <div className="hx-status"><span className="n-sm" style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font)' }}>9:41</span>
      <span className="hx-status-r"><svg width="17" height="11" viewBox="0 0 17 11" fill="var(--text)"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="var(--text-dim)" /><rect x="2" y="2" width="16" height="8" rx="2" fill="var(--text)" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="var(--text-dim)" /></svg></span></div>
    <div className="hx-scroll">{children}<div style={{ height: dock || nav ? 150 : 40 }} /></div>
    {(dock || nav) && <div className="hx-dock">{dock}{nav && <NavBar cur={nav} />}</div>}
    {overlay}
    <div className="hx-home-ind" />
  </div>;
}
const pad = { padding: '0 16px' };

// ───────── Hoje ─────────
function HomeBody({ loading }) {
  const [feel, setFeel] = useState('normal');
  return <div style={pad}>
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, letterSpacing: '-.02em' }}><HelixMark />helux</span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="hx-btn hx-btn--ghost" style={{ padding: '0 12px', gap: 6, color: 'var(--text)' }} aria-label="sequência de 1 semana"><Icon n="flame" s={18} style={{ color: 'var(--warn)' }} /><span className="n-sm" style={{ fontWeight: 600 }}>1</span><span className="t-caption">sem</span></button>
        <IconBtn n="user" label="perfil e DNA" />
      </span>
    </header>
    <p className="t-secondary" style={{ marginTop: 8 }}>Quarta-feira, 23 de set.</p>
    <h1 className="t-display" style={{ marginTop: 4 }}>Bom treino, Doug</h1>

    <section className="hx-focus" style={{ marginTop: 20, padding: 20 }} aria-label="treino de hoje">
      {loading ? <HomeSkeleton /> : <>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
          <span className="t-secondary" style={{ color: 'var(--text)' }}>Treino D — Ombro + Core</span>
          <span className="t-caption" style={{ whiteSpace: 'nowrap' }}><span className="n-sm" style={{ color: 'var(--text)' }}>7</span> exercícios</span>
        </div>
        <h2 className="t-heading" style={{ marginTop: 14, fontSize: 24, lineHeight: '28px' }}>Agachamento Livre (Barra)</h2>
        <div style={{ marginTop: 10 }}><Fit value={68} size="md" /></div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '6px 12px' }}>
          <span className="t-caption" style={{ paddingTop: 2 }}>Depois</span>
          <div className="t-secondary" style={{ color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 4 }}><span>Leg Press 45°</span><span>Agachamento Búlgaro (Halteres)</span><span className="dim">e mais 4</span></div>
        </div>
        <div style={{ height: 1, background: 'var(--hairline)', margin: '18px -20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span className="t-body-m">Como você está hoje</span><span className="t-caption" style={{ whiteSpace: 'nowrap' }}>Informado por você</span>
        </div>
        <Segmented label="como você está hoje" options={['ótimo', 'normal', 'cansado', 'exausto']} value={feel} onChange={setFeel} />
        <Btn kind="primary" size="lg" block iconRight="play" style={{ marginTop: 16 }}>Iniciar treino</Btn>
      </>}
    </section>

    <section style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 className="t-section">Ciclo atual</h2><span className="t-secondary"><span className="n-sm" style={{ color: 'var(--text)' }}>2</span> de 4 treinos concluídos</span>
      </div>
      <div className="hx-cycle">{[['A', 'on'], ['B', 'on'], ['C', ''], ['D', 'cur']].map(([l, c]) =>
        <div key={l} className={'hx-cycle-s ' + c}><i /><span>{l}{c === 'cur' ? ', hoje' : ''}</span></div>)}</div>
    </section>

    <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 className="t-section">Último check-in</h2><span className="t-caption">jul. 2026</span>
      </div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px 16px', margin: 0 }}>
        {[['Peso', '82,0', 'kg'], ['Gordura', '18,0', '%'], ['Agachamento', '100', 'kg'], ['Supino', '80', 'kg']].map(([k, v, u]) =>
          <div key={k}><dt className="t-caption">{k}</dt><dd className="n-md" style={{ margin: '2px 0 0' }}>{v}<span className="u">{u}</span></dd></div>)}
      </dl>
      <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
        <Btn kind="secondary">Novo check-in</Btn><Btn kind="ghost">Gerar novo plano</Btn>
      </div>
    </section>
  </div>;
}
function HomeSkeleton() {
  return <div aria-busy="true" aria-label="carregando treino"><div style={{ display: 'flex', justifyContent: 'space-between' }}><Sk w={150} h={14} /><Sk w={80} h={12} /></div>
    <Sk w="85%" h={24} style={{ marginTop: 16 }} /><Sk w={90} h={14} style={{ marginTop: 12 }} />
    <Sk w="60%" h={12} style={{ marginTop: 18 }} /><Sk w="70%" h={12} style={{ marginTop: 8 }} />
    <Sk h={52} r={999} style={{ marginTop: 36 }} /><Sk h={56} r={999} style={{ marginTop: 16 }} /></div>;
}
function HomeScreen(p) { return <Phone nav="hoje" label="Hoje"><HomeBody {...p} /></Phone>; }
function HomeDesktop() {
  return <div data-screen-label="Hoje desktop" style={{ width: 1280, height: 820, background: 'var(--bg)', position: 'relative', overflow: 'hidden', borderRadius: 12, boxShadow: '0 0 0 1px var(--hairline-2)' }}>
    <div style={{ width: 512, margin: '0 auto', paddingTop: 24 }}><HomeBody /></div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(14,16,14,.92)', borderTop: '1px solid var(--hairline)' }}>
      <div style={{ width: 512, margin: '0 auto', '--safe-b': '8px' }}><NavBar cur="hoje" /></div></div>
  </div>;
}

// ───────── Treino ativo ─────────
const TIPS = [
  { text: 'Mantenha joelhos alinhados com a ponta dos pés, sem colapso valgo', gene: 'COL1A1', geno: 'C,C' },
  { text: 'Desça controlado (3s), suba explosivo' },
  { text: 'Profundidade até paralelo, não force além do conforto' },
  { text: 'Calcanhares no chão o tempo todo' },
  { text: 'Priorize qualidade técnica sobre carga: o objetivo é voltar a correr 5 km sem dor no joelho' },
];
const GROUPS = [4, 3, 3, 4, 3, 3, 3];
function ActiveScreen({ resting, sheet, label = 'Treino ativo' }) {
  const [sets, setSets] = useState(() => [0, 1, 2, 3].map(i => ({ prev: '80 × 8', w: 80, r: 8, done: i === 0 })));
  const [edit, setEdit] = useState(null);
  const [pop, setPop] = useState(-1);
  const [rest, setRest] = useState(resting ? 72 : 0);
  const [open, setOpen] = useState(!!sheet);
  useEffect(() => { if (rest <= 0) return; const t = setTimeout(() => setRest(r => r - 1), 1000); return () => clearTimeout(t); }, [rest]);
  const cur = edit != null ? edit : sets.findIndex(s => !s.done);
  const doneN = sets.filter(s => s.done).length;
  const upd = (i, k, v) => setSets(ss => ss.map((s, j) => j === i ? { ...s, [k]: v } : s));
  const complete = i => { upd(i, 'done', true); setPop(i); setEdit(null); setRest(90); };
  const toggle = i => sets[i].done ? upd(i, 'done', false) : complete(i);
  const mm = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const dock = <div className="hx-cta-dock">
    {rest > 0 && <div className="hx-focus" role="timer" aria-label="descanso" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px 10px 12px', marginBottom: 10, animation: 'hx-up 320ms var(--ease-out)' }}>
      <Ring size={48} stroke={3} value={rest / 90}><Icon n="timer" s={20} style={{ color: 'var(--accent)' }} /></Ring>
      <div style={{ flex: 1 }}><div className="t-caption">Descanso</div><div className="n-lg">{mm(rest)}</div></div>
      <Btn kind="secondary" style={{ padding: '0 14px' }} onClick={() => setRest(r => r + 15)}>+15s</Btn>
      <Btn kind="ghost" style={{ padding: '0 12px' }} onClick={() => setRest(0)}>Pular</Btn>
    </div>}
    <Btn kind={rest > 0 ? 'secondary' : 'primary'} size="lg" block iconRight="chev">Próximo exercício</Btn>
  </div>;
  return <Phone label={label} dock={dock} overlay={open && <><div className="hx-scrim" style={{ zIndex: 29 }} onClick={() => setOpen(false)} /><ExecSheet onClose={() => setOpen(false)} /></>}>
    <ScreenHeader left={<IconBtn n="close" label="encerrar treino" />} title="Agachamento Livre" sub={`${doneN}/23 séries`} right={<IconBtn n="timer" label="cronômetro de descanso" />} />
    <div style={{ padding: '4px 16px 0' }}><WorkoutProgress groups={GROUPS} done={[doneN, 0, 0, 0, 0, 0, 0]} cur={0} /></div>
    <div style={{ ...pad, marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Tag>Musculação</Tag><Fit value={68} /></div>
      <h1 className="t-title" style={{ marginTop: 12 }}>Agachamento Livre (Barra)</h1>
      <p className="t-body dim" style={{ marginTop: 6 }}><span className="n-sm" style={{ fontSize: 15, color: 'var(--text)' }}>4 × 8–10</span> reps, descanso <span className="n-sm" style={{ fontSize: 15, color: 'var(--text)' }}>90s</span></p>
      <section style={{ marginTop: 22 }}><Tips items={TIPS} /></section>
      <div className="hx-card" style={{ marginTop: 20, overflow: 'hidden' }}>
        <button className="hx-row-btn" onClick={() => setOpen(true)} style={{ background: 'none' }}>
          <span className="hx-stage" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, display: 'block' }}><SquatDemo playing={false} small /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span className="t-body-m" style={{ display: 'block' }}>Ver execução</span><span className="t-secondary">Técnica, músculos e 4 variantes</span></span>
          <span className="dim"><Icon n="chev" s={20} /></span>
        </button>
        <button className="hx-row-btn" style={{ background: 'none', borderTop: '1px solid var(--hairline)', minHeight: 52 }}>
          <span style={{ width: 52, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}><Icon n="swap" s={20} /></span>
          <span className="t-secondary" style={{ flex: 1, minWidth: 0, color: 'var(--text)' }}>Variante com fit maior disponível</span>
          <Fit value={74} /><span className="dim"><Icon n="chev" s={20} /></span>
        </button>
      </div>
      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Séries" aside="kg × reps" />
        <div className="hx-sets">{sets.map((s, i) => i === cur
          ? <CurrentSet key={i} no={i + 1} total={sets.length} prev={s.prev} w={s.w} r={s.r} onW={v => upd(i, 'w', v)} onR={v => upd(i, 'r', v)} onDone={() => complete(i)} />
          : <SetRow key={i} no={i + 1} prev={s.prev} w={s.w} r={s.r} done={s.done} pop={pop === i} onToggle={() => toggle(i)} onEdit={() => setEdit(i)} />)}</div>
        <Btn kind="ghost" block icon="plus" style={{ marginTop: 6 }} onClick={() => setSets(ss => [...ss, { ...ss[ss.length - 1], prev: null, done: false }])}>Adicionar série</Btn>
      </section>
    </div>
  </Phone>;
}

// ───────── Folha de execução ─────────
const STEPS = [{ text: 'Barra apoiada no trapézio, pés na largura dos ombros, ponta dos pés levemente para fora' },
  { text: 'Desça levando o quadril para trás e para baixo até a coxa ficar paralela ao chão' },
  { text: 'Mantenha o peito erguido e os joelhos alinhados com a direção dos pés' },
  { text: 'deixar os joelhos colapsarem para dentro na subida', warn: true }];
const VARIANTS = [{ n: 'Agachamento Livre (Barra)', eq: 'Barra', lv: 'Avançado', fit: 68, cur: true },
  { n: 'Agachamento Goblet (Halter)', eq: 'Halter', lv: 'Intermediário', fit: 74 },
  { n: 'Agachamento no Smith', eq: 'Máquina', lv: 'Intermediário', fit: 71 },
  { n: 'Hack Machine', eq: 'Máquina', lv: 'Iniciante', fit: 62 }];
function ExecSheet({ onClose }) {
  const [tab, setTab] = useState('exec');
  const [play, setPlay] = useState(true);
  const [nonce, setNonce] = useState(0);
  return <div className="hx-sheet" role="dialog" aria-modal="true" aria-label="Execução do exercício" style={{ top: 44 }}>
    <div className="hx-sheet-h" />
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', scrollbarWidth: 'none' }}>
      <div className="hx-stage" style={{ height: 216 }}>
        <div style={{ position: 'absolute', inset: '8px 60px 8px 60px' }}><SquatDemo playing={play} nonce={nonce} /></div>
        <div style={{ position: 'absolute', top: 12, right: 12, textAlign: 'right' }}><div className="n-md">2·0·1</div><div className="t-caption">cadência</div></div>
        <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 6 }}>
          <IconBtn n={play ? 'pause' : 'play'} label={play ? 'pausar demonstração' : 'reproduzir demonstração'} onClick={() => setPlay(p => !p)} s={18} />
          <Btn kind="secondary" icon="repeat" style={{ padding: '0 14px', fontSize: 14 }} onClick={() => { setNonce(n => n + 1); setPlay(true); }}>Repetir</Btn>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 18 }}>
        <h2 className="t-heading">Agachamento Livre (Barra)</h2><span style={{ paddingTop: 4 }}><Fit value={68} /></span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}><Tag>Quadríceps</Tag><Tag>Barra</Tag><Tag>Avançado</Tag></div>
      <div style={{ marginTop: 20 }}><Segmented tabs label="conteúdo" options={[{ v: 'exec', l: 'Execução' }, { v: 'var', l: 'Variantes (4)' }]} value={tab} onChange={setTab} /></div>
      {tab === 'exec' ? <>
        <div style={{ marginTop: 20 }}><Steps items={STEPS} /></div>
        <h3 className="t-section" style={{ marginTop: 28 }}>Músculos trabalhados</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}><BodyMap />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /><span className="t-body-m">Quadríceps</span></div><div className="t-caption" style={{ marginLeft: 18 }}>Primário</div></div>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-soft)', boxShadow: 'inset 0 0 0 1px var(--accent-line)' }} /><span className="t-body-m">Core</span></div><div className="t-caption" style={{ marginLeft: 18 }}>Secundário</div></div>
          </div></div>
      </> : <div style={{ marginTop: 12 }}>{VARIANTS.map((v, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '6px 12px', padding: '14px 0', borderTop: i ? '1px solid var(--hairline)' : 0, alignItems: 'center' }}>
        <div className="t-body-m">{v.n}</div><Fit value={v.fit} />
        <div style={{ display: 'flex', gap: 6 }}><Tag>{v.eq}</Tag><Tag>{v.lv}</Tag>{v.cur && <Tag kind="outline">Atual</Tag>}</div>
        {!v.cur && <Btn kind={v.fit > 68 ? 'secondary' : 'ghost'} style={{ minHeight: 40, padding: '0 14px', fontSize: 14 }}>Trocar</Btn>}
      </div>)}</div>}
    </div>
    <div style={{ padding: '12px 16px var(--safe-b)', borderTop: '1px solid var(--hairline)' }}><Btn kind="secondary" size="lg" block onClick={onClose}>Fechar</Btn></div>
  </div>;
}

// ───────── DNA ─────────
const TRAITS = [
  { gene: 'COL1A1', geno: 'C,C', name: 'Suscetibilidade a lesão ligamentar', lvl: 3, warn: true, impact: 'Joelho alinhado em todo agachamento e progressão de carga mais lenta.' },
  { gene: 'ACTN3', geno: 'R,X', name: 'Fibras de contração rápida', lvl: 2, impact: 'Compostos em 6–10 reps; potência responde bem.' },
  { gene: 'WNT16', geno: 'C,T', name: 'Densidade mineral óssea', lvl: 2, impact: 'Carga axial progressiva (agachamento, terra) para estimular o osso.' },
  { gene: 'PPARGC1A', geno: 'G,A', name: 'Capacidade aeróbica', lvl: 1, impact: 'Corrida em zona 2 com volume crescente até os 5 km.' },
];
const LVL = ['', 'baixo', 'médio', 'alto'];
function Level({ n }) { return <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }} aria-label={'nível ' + LVL[n]}>{[1, 2, 3].map(i => <i key={i} style={{ width: 3, height: 6 + i * 3, borderRadius: 1.5, background: i <= n ? 'var(--trait-on)' : 'var(--trait-off)' }} />)}<span className="t-caption" style={{ marginLeft: 6, color: 'var(--text)' }}>{LVL[n]}</span></span>; }
function Strand() {
  const n = 44, loci = { 5: 'COL1A1', 16: 'ACTN3', 27: 'WNT16', 38: 'PPARGC1A' };
  return <div style={{ position: 'relative' }}>
    <svg width="100%" height="64" viewBox={`0 0 ${n * 7.8} 64`} preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => { const k = .2 + .8 * Math.abs(Math.cos(2 * Math.PI * i / 10.5)); const h = 60 * k; const on = loci[i] != null;
        return <rect key={i} x={i * 7.8} y={(64 - h) / 2} width="3" height={h} rx="1.5" fill={on ? 'var(--accent)' : 'var(--rung-off)'} />; })}
    </svg>
    <div style={{ position: 'relative', height: 18, marginTop: 6 }}>{Object.entries(loci).map(([i, g]) =>
      <span key={g} className="gene" style={{ position: 'absolute', left: `${(i / n) * 100}%`, fontSize: 11, color: 'var(--text-dim)', transform: 'translateX(-2px)' }}>{g}</span>)}</div>
  </div>;
}
function DNAScreen() {
  return <Phone nav="none" label="DNA">
    <ScreenHeader left={<IconBtn n="back" label="voltar" bare />} title="Perfil" />
    <div style={pad}>
      <h1 className="t-display" style={{ marginTop: 8 }}>Seu DNA</h1>
      <p className="t-body dim" style={{ marginTop: 8 }}>Quatro marcadores do teste Genera definem como o Helux escolhe exercícios, cargas e descanso.</p>
      <div style={{ marginTop: 24 }}><Strand /></div>
      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Marcadores genéticos" aside="4 de 4 lidos" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{TRAITS.map(t =>
          <article key={t.gene} className="hx-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span><span className="gene" style={{ fontSize: 17, color: 'var(--text)' }}>{t.gene}</span><span className="n-sm dim" style={{ marginLeft: 8 }}>{t.geno}</span></span>
              <Level n={t.lvl} />
            </div>
            <div className="t-secondary" style={{ marginTop: 6, color: 'var(--text)' }}>{t.name}</div>
            <p className="t-secondary" style={{ marginTop: 10, display: 'flex', gap: 8 }}>{t.warn && <i style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--warn)', marginTop: 6, flexShrink: 0 }} />}{t.impact}</p>
          </article>)}</div>
      </section>
      <section style={{ marginTop: 32 }}>
        <SectionHeader title="Como molda seu treino" />
        {[['Técnica antes de carga no joelho', 'Dicas de alinhamento e aumento de no máximo 2,5 kg por semana.', ['COL1A1']],
          ['Faixa de 6–10 reps nos compostos', 'Descanso de 90s para manter a potência entre séries.', ['ACTN3']],
          ['Agachamento e terra fixos no ciclo', 'Carga axial duas vezes por semana.', ['WNT16']],
          ['Corrida em zona 2 no dia livre', 'Progressão de 3 para 5 km em 6 semanas.', ['PPARGC1A']]].map(([h, d, g], i) =>
          <div key={i} style={{ padding: '14px 0', borderTop: '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><span className="t-body-m">{h}</span>{g.map(x => <GeneTag key={x} gene={x} />)}</div>
            <p className="t-secondary" style={{ marginTop: 4 }}>{d}</p>
          </div>)}
      </section>
    </div>
  </Phone>;
}

// ───────── Progresso ─────────
const VOL = [{ w: '29/7', v: 11.2 }, { w: '5/8', v: 13.0 }, { w: '12/8', v: 12.1 }, { w: '19/8', v: 14.6 }, { w: '26/8', v: 15.3 }, { w: '2/9', v: 9.8 }, { w: '9/9', v: 16.2 }, { w: '16/9', v: 17.4 }];
function ProgressScreen() {
  return <Phone nav="progresso" label="Progresso">
    <div style={pad}>
      <h1 className="t-display" style={{ marginTop: 20 }}>Sua evolução</h1>
      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Recovery de hoje" aside="Apple Watch" />
        <Banner kind="warn" title="Dados antigos — sincronize novamente" action={<Btn kind="secondary" icon="sync" style={{ minHeight: 40, fontSize: 14, padding: '0 14px' }}>Sincronizar</Btn>}>Última leitura ontem, 07:12. O treino de hoje usa só o que você informou.</Banner>
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, margin: '10px 0 0' }}>
          {[['HRV', '48', 'ms', 'wave'], ['FC de repouso', '58', 'bpm', 'heart'], ['Sono', '6h52', '', 'moon'], ['Calorias', '2.340', 'kcal', 'flame']].map(([k, v, u, ic]) =>
            <div key={k} className="hx-card" style={{ padding: '12px 14px' }}><dt className="t-caption" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon n={ic} s={14} />{k}</dt>
              <dd className="n-lg dim" style={{ margin: '6px 0 0', fontSize: 24 }}>{v}<span className="u">{u}</span></dd></div>)}
        </dl>
      </section>
      <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
        <SectionHeader title="Volume semanal" aside="toneladas" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}><span className="n-xl">17,4<span className="u" style={{ fontSize: 16 }}>t</span></span><span className="n-sm" style={{ color: 'var(--text)' }}>+7%</span><span className="t-caption" style={{ whiteSpace: 'nowrap' }}>vs. semana anterior</span></div>
        <Bars data={VOL} />
      </section>
      <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
        <SectionHeader title="Recordes pessoais" />
        <PRCard lift="Agachamento Livre (Barra)" kg={100} reps={5} delta="+5 kg" when="Check-in de jul." />
        <PRCard lift="Supino Reto (Barra)" kg={80} reps={6} delta="+2,5 kg" when="Há 9 dias" />
        <PRCard lift="Leg Press 45°" kg={220} reps={10} delta="+20 kg" when="Segunda-feira" fresh />
      </section>
      <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
        <SectionHeader title="Histórico" />
        <HistoryRow name="Treino C — Costas + Bíceps" date="Segunda, 21 de set." sets={19} dur={52} vol="12,6" />
        <HistoryRow name="Treino B — Peito + Tríceps" date="Sábado, 19 de set." sets={21} dur={57} vol="14,1" />
        <HistoryRow name="Treino A — Pernas" date="Quinta, 17 de set." sets={23} dur={61} vol="18,9" />
      </section>
    </div>
  </Phone>;
}

// ───────── Treino concluído ─────────
function DoneScreen({ state = 'ok', label }) {
  const [lit, setLit] = useState(0);
  useEffect(() => { const id = setTimeout(() => setLit(23), 250); return () => clearTimeout(id); }, []);
  let k = 0;
  const dock = <div className="hx-cta-dock">
    {state === 'err' && <div style={{ marginBottom: 10 }}><Banner kind="err" title="Não foi possível salvar">Sem conexão com o servidor. O treino está guardado neste aparelho e não será perdido.</Banner></div>}
    <Btn kind="primary" size="lg" block loading={state === 'saving'} icon={state === 'err' ? 'sync' : null}>{state === 'err' ? 'Tentar de novo' : 'Voltar para Hoje'}</Btn>
    {state === 'saving' && <p className="t-caption" style={{ textAlign: 'center', marginTop: 10 }} role="status">Salvando treino…</p>}
    {state === 'err' && <Btn kind="ghost" block style={{ marginTop: 4 }}>Sair sem sincronizar</Btn>}
  </div>;
  return <Phone dock={dock} label={label}>
    <div style={{ ...pad, paddingTop: 56 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 40 }} aria-label="23 de 23 séries">
        {GROUPS.map((n, gi) => <div key={gi} style={{ flex: `${n} 1 0`, display: 'flex', gap: 2, alignItems: 'center' }}>
          {Array.from({ length: n }).map((_, i) => { const idx = k++; const hh = 12 + 28 * Math.abs(Math.cos(2 * Math.PI * idx / 10.5));
            return <i key={i} style={{ flex: 1, height: hh, borderRadius: 2, background: idx < lit ? 'var(--accent)' : 'var(--rung-off)', transition: `background 200ms ${idx * 35}ms` }} />; })}
        </div>)}
      </div>
      <h1 className="t-display" style={{ marginTop: 28 }}>Treino concluído</h1>
      <p className="t-body dim" style={{ marginTop: 6 }}>Treino D — Ombro + Core, 58 min</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '20px 16px', margin: '28px 0 0', paddingTop: 20, borderTop: '1px solid var(--hairline)' }}>
        {[['Volume', '9.840', 'kg'], ['Séries', '23/23', ''], ['Duração', '58', 'min'], ['Recordes', '1', '']].map(([a, v, u]) =>
          <div key={a}><dt className="t-caption">{a}</dt><dd className="n-lg" style={{ margin: '4px 0 0' }}>{v}<span className="u">{u}</span></dd></div>)}
      </dl>
      <section className="hx-focus" style={{ marginTop: 24, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-3)', color: 'var(--warn)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="trophy" s={22} /></span>
        <div style={{ flex: 1 }}><div className="t-caption">Novo recorde</div><div className="t-body-m">Agachamento Livre (Barra)</div></div>
        <div className="n-md" style={{ textAlign: 'right' }}>85<span className="u">kg</span><div className="n-sm dim">× 8</div></div>
      </section>
    </div>
  </Phone>;
}

Object.assign(window, { Phone, HomeScreen, HomeBody, HomeDesktop, ActiveScreen, ExecSheet, DNAScreen, ProgressScreen, DoneScreen, GROUPS, TIPS, Level });
