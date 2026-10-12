// v2-core.jsx — Helux v2 primitives
const { useState, useEffect, useRef, useMemo } = React;

const IC = {
  close: 'M6 6l12 12M18 6L6 18',
  timer: 'M12 8.5v4.5l2.5 1.5M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.5 2.5h5',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8 5v14M16 5v14',
  repeat: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  chev: 'M9.5 6l6 6-6 6',
  back: 'M14.5 6l-6 6 6 6',
  swap: 'M7 4v14M3.5 14.5L7 18l3.5-3.5M17 20V6M13.5 9.5L17 6l3.5 3.5',
  flame: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 3-5.8 3.9-9.3 2.2 1.3 3.2 3.4 3.1 5 1-1 1.7-2.2 1.8-3.6 2.4 1.8 4.2 4.6 4.2 7.9 0 3.6-2.6 6.2-6.5 6.2z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  home: 'M4 10.5L12 4l8 6.5V20h-5.5v-6h-5v6H4z',
  dumbbell: 'M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11',
  checkin: 'M8 4h8v3H8zM6 5.5H5v15h14v-15h-1M9 13l2 2 4-4',
  chart: 'M4 20h16M7 16.5v-5M12 16.5V7M17 16.5v-8',
  dna: 'M7 3c0 6 10 6 10 12 0 3-2 5-5 6M17 3c0 3-2 5-5 6M7 21c0-3 2-5 5-6M9 6h6M9 18h6',
  sync: 'M20 11a8 8 0 0 0-14.3-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.5l1.7-2M20 20v-4.5h-4.5',
  alert: 'M12 8.5v5M12 17h.01M10.3 3.9L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3 3 0 0 0 8 10.5M16 6h3.5v1.5a3 3 0 0 1-3.5 3M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z',
  up: 'M12 19V5M6 11l6-6 6 6',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  wave: 'M3 12h3.5l2.5-6 4 12 2.5-6H21',
  bolt: 'M13 3L5 13.5h6L10.5 21 19 10h-6z',
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5z',
};
function Icon({ n, s = 24, w = 1.9, fill, style }) {
  const filled = n === 'play' && fill;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true"><path d={IC[n]} /></svg>;
}

// Signature: helix-projected rungs. DNA has ~10.5 bp per turn; a rung's projected length follows |cos|.
function Helix({ value = 68, n = 21, h = 16, w = 2, gap = 2, on, off = 'var(--rung-off)', phase = 0, lit, anim }) {
  const litN = lit != null ? lit : Math.round(n * value / 100);
  const W = n * (w + gap) - gap;
  return (
    <svg className="hx-helix" width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => {
        const k = 0.26 + 0.74 * Math.abs(Math.cos((2 * Math.PI * (i + phase)) / 10.5));
        const rh = Math.max(2, h * k);
        return <rect key={i} x={i * (w + gap)} y={(h - rh) / 2} width={w} height={rh} rx={w / 2} fill={i < litN ? on : off}
          style={anim ? { transition: `fill 200ms ${i * 28}ms` } : undefined} />;
      })}
    </svg>
  );
}
const fitColor = v => v >= 75 ? 'var(--fit-hi)' : v >= 50 ? 'var(--fit-mid)' : 'var(--fit-lo)';
const fitWord = v => v >= 75 ? 'alto' : v >= 50 ? 'médio' : 'baixo';
function Fit({ value = 68, size = 'sm', label = true }) {
  const cfg = { sm: { n: 11, h: 12 }, md: { n: 16, h: 16 }, lg: { n: 32, h: 28, w: 2.5, gap: 2.5 } }[size];
  const c = fitColor(value);
  return (
    <span className={`hx-fit hx-fit--${size}`} aria-label={`fit genético ${value} de 100, ${fitWord(value)}`}>
      <Helix value={value} on={c} {...cfg} />
      <span className="hx-fit-n" style={{ color: c }}>{value}</span>{label && <span className="hx-fit-u">fit</span>}
    </span>
  );
}
function GeneTag({ gene, geno, warn }) {
  return <span className={'hx-gtag' + (warn ? ' hx-gtag--warn' : '')}><i>{gene}</i>{geno}</span>;
}
function Tag({ children, kind }) { return <span className={'hx-tag' + (kind ? ' hx-tag--' + kind : '')}>{children}</span>; }

function Btn({ kind = 'primary', size, block, icon, iconRight, children, loading, disabled, press, className = '', ...p }) {
  const cls = ['hx-btn', 'hx-btn--' + kind, size && 'hx-btn--' + size, block && 'hx-btn--block', loading && 'is-loading', press && 'is-press', className].filter(Boolean).join(' ');
  return <button className={cls} disabled={disabled} aria-busy={loading || undefined} {...p}>
    {icon && <Icon n={icon} s={20} />}{children}
    {iconRight && (kind === 'primary' && iconRight === 'play' ? <span className="hx-btn-ico"><Icon n="play" s={13} fill /></span> : <Icon n={iconRight} s={20} />)}
  </button>;
}
function IconBtn({ n, label, bare, press, s = 22, ...p }) {
  return <button className={'hx-icbtn' + (bare ? ' hx-icbtn--bare' : '') + (press ? ' is-press' : '')} aria-label={label} {...p}><Icon n={n} s={s} /></button>;
}

function Segmented({ options, value, onChange, kind, tabs, label, disabled }) {
  return <div className={'hx-seg' + (tabs ? ' hx-seg--tabs' : '') + (kind ? ' hx-seg--' + kind : '')} role={tabs ? 'tablist' : 'group'} aria-label={label}>
    {options.map(o => {
      const v = typeof o === 'string' ? o : o.v, l = typeof o === 'string' ? o : o.l;
      const sel = v === value;
      return <button key={v} disabled={disabled} role={tabs ? 'tab' : undefined}
        {...(tabs ? { 'aria-selected': sel } : { 'aria-pressed': sel })} onClick={() => onChange && onChange(v)}>{l}</button>;
    })}
  </div>;
}

function fmt(n) { return String(n).replace('.', ','); }
function Stepper({ value, unit, step = 1, onChange, disabled, err, label }) {
  return <div className={'hx-step' + (err ? ' is-err' : '')} role="group" aria-label={label}>
    <button aria-label={`diminuir ${label}`} disabled={disabled} onClick={() => onChange && onChange(Math.max(0, +(value - step).toFixed(1)))}><Icon n="minus" s={20} /></button>
    <div className="hx-step-v" aria-live="polite"><span className="n-md" style={disabled ? { color: 'var(--text-disabled)' } : null}>{fmt(value)}</span><small>{unit}</small></div>
    <button aria-label={`aumentar ${label}`} disabled={disabled} onClick={() => onChange && onChange(+(value + step).toFixed(1))}><Icon n="plus" s={20} /></button>
  </div>;
}

function Check({ on, pop, onClick, big, label = 'concluir série' }) {
  return <button className={'hx-chk' + (on ? ' is-on' : '') + (pop ? ' is-pop' : '')} aria-pressed={!!on} aria-label={label} onClick={onClick}>
    <Icon n="check" s={big ? 24 : 20} w={on ? 2.6 : 1.9} /></button>;
}

// Compact set row (done / upcoming)
function SetRow({ no, prev, w, r, done, onToggle, onEdit, pop }) {
  return <div className={'hx-set ' + (done ? 'is-done' : 'is-upcoming')} tabIndex={0} role="button" aria-label={`série ${no}, ${w} kg por ${r}, ${done ? 'concluída' : 'editar'}`} onClick={onEdit}>
    <span className="hx-set-no">{no}</span>
    <span className="hx-set-prev">{prev ? prev : '—'}</span>
    <span className="hx-set-val">{fmt(w)}<span> kg</span> × {r}</span>
    <span onClick={e => { e.stopPropagation(); onToggle && onToggle(); }}><Check on={done} pop={pop} /></span>
  </div>;
}
// Current (focused) set
function CurrentSet({ no, total, prev, w, r, onW, onR, onDone, disabled }) {
  return <div className="hx-cur">
    <div className="hx-cur-top"><span className="t-body-m">Série {no} <span className="dim">de {total}</span></span><span className="t-caption">Anterior <span className="n-sm" style={{ color: 'var(--text)' }}>{prev || '—'}</span></span></div>
    <div className="hx-cur-row">
      <Stepper value={w} unit="kg" step={2.5} onChange={onW} label="carga" disabled={disabled} />
      <Stepper value={r} unit="reps" onChange={onR} label="repetições" disabled={disabled} />
      <Check big onClick={onDone} />
    </div>
  </div>;
}

function WorkoutProgress({ groups, done, cur, onPick }) {
  let k = 0;
  return <div className="hx-prog" role="progressbar" aria-valuemin={0} aria-valuemax={groups.reduce((a, b) => a + b, 0)} aria-valuenow={done.reduce((a, b) => a + b, 0)} aria-label="séries concluídas">
    {groups.map((n, gi) => <button key={gi} className={'hx-prog-g' + (gi === cur ? ' is-cur' : '')} style={{ '--n': n }} aria-label={`exercício ${gi + 1}`} onClick={() => onPick && onPick(gi)}>
      {Array.from({ length: n }).map((_, i) => <i key={i} className={i < done[gi] ? 'on' : ''} />)}
    </button>)}
  </div>;
}

function Ring({ size = 44, stroke = 3, value = .5, color = 'var(--accent)', track = 'var(--rung-off)', children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return <div className="hx-ring" style={{ width: size, height: size }}>
    <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} /></svg>
    {children}
  </div>;
}

function Tips({ items }) {
  return <ul className="hx-tips">{items.map((t, i) => <li key={i} className={t.gene ? 'is-gene' : ''}>
    <div><div className="hx-tip-t">{t.text}</div>{t.gene && <div className="hx-tip-meta"><GeneTag gene={t.gene} geno={t.geno} warn /></div>}</div>
  </li>)}</ul>;
}
function Steps({ items }) { return <ol className="hx-steps">{items.map((s, i) => <li key={i} className={s.warn ? 'is-warn' : ''}><span>{s.warn && <b style={{ color: 'var(--warn)', fontWeight: 600 }}>Erro comum: </b>}{s.text}</span></li>)}</ol>; }

function ScreenHeader({ title, sub, left, right }) {
  return <header style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) 44px', alignItems: 'center', gap: 8, padding: '4px 12px 8px' }}>
    <div>{left}</div>
    <div style={{ textAlign: 'center', minWidth: 0 }}><div className="t-body-m" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>{sub && <div className="n-sm dim">{sub}</div>}</div>
    <div>{right}</div>
  </header>;
}
function SectionHeader({ title, aside, action }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
    <h2 className="t-section">{title}</h2>{aside && <span className="t-caption" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{aside}</span>}{action}
  </div>;
}

function NavBar({ cur = 'hoje' }) {
  const items = [['hoje', 'Hoje', 'home'], ['treinos', 'Treinos', 'dumbbell'], ['checkin', 'Check-in', 'checkin'], ['progresso', 'Progresso', 'chart']];
  return <nav className="hx-nav" aria-label="principal">{items.map(([k, l, i]) =>
    <a key={k} href="#" onClick={e => e.preventDefault()} aria-current={k === cur ? 'page' : undefined}><Icon n={i} s={22} />{l}</a>)}</nav>;
}

function Field({ label, value, unit, placeholder, help, err, dis, focus }) {
  const id = useMemo(() => 'f' + Math.random().toString(36).slice(2, 7), []);
  return <div className="hx-field">
    <label htmlFor={id}>{label}</label>
    <div className={'hx-input' + (err ? ' is-err' : '') + (dis ? ' is-dis' : '') + (focus ? ' is-focus' : '')}>
      <input id={id} inputMode="decimal" defaultValue={value} placeholder={placeholder} disabled={dis} aria-invalid={!!err} /><span className="u">{unit}</span>
    </div>
    {(help || err) && <div className={'hx-field-help' + (err ? ' is-err' : '')}>{err || help}</div>}
  </div>;
}

function Banner({ kind = 'warn', title, children, action }) {
  return <div className={'hx-banner hx-banner--' + kind} role={kind === 'err' ? 'alert' : 'status'}>
    <Icon n={kind === 'err' ? 'cloud' : 'alert'} s={20} />
    <div><b>{title}</b><span className="dim">{children}</span>{action && <div style={{ marginTop: 10 }}>{action}</div>}</div>
  </div>;
}

function HistoryRow({ name, date, sets, dur, vol }) {
  return <button className="hx-row-btn" style={{ padding: '12px 0', background: 'none', borderTop: '1px solid var(--hairline)', minHeight: 64 }}>
    <div style={{ flex: 1, minWidth: 0 }}><div className="t-body-m">{name}</div><div className="t-secondary">{date}</div></div>
    <div style={{ textAlign: 'right' }}><div className="n-md">{vol}<span className="u">t</span></div><div className="n-sm dim">{sets} séries, {dur} min</div></div>
    <span className="faint"><Icon n="chev" s={18} /></span>
  </button>;
}
function PRCard({ lift, kg, reps, delta, when, fresh }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '2px 12px', padding: '14px 0', borderTop: '1px solid var(--hairline)' }}>
    <div className="t-body-m">{lift}</div>
    <div className="n-md" style={{ textAlign: 'right' }}>{fmt(kg)}<span className="u">kg</span> <span className="dim" style={{ fontWeight: 500 }}>× {reps}</span></div>
    <div className="t-secondary">{when}</div>
    <div className="n-sm" style={{ textAlign: 'right', color: fresh ? 'var(--accent)' : 'var(--text-dim)' }}>{delta}</div>
  </div>;
}
function Bars({ data, unit = 't' }) {
  const max = Math.max(...data.map(d => d.v));
  return <div className="hx-bars" role="img" aria-label={'volume semanal: ' + data.map(d => `${d.w} ${fmt(d.v)} ${unit}`).join(', ')}>
    {data.map((d, i) => <div key={i} className={'hx-bar' + (i === data.length - 1 ? ' cur' : '')}><i style={{ height: `${(d.v / max) * 88}%` }} /><span>{d.w}</span></div>)}
  </div>;
}
function Sk({ w = '100%', h = 14, r, style }) { return <div className="hx-sk" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />; }

// Squat demo, side view. Cadence 2·0·1: 2s down, 0 pause, 1s up, 0.6s rest at top.
const SQ = { top: { K: [114, 178], H: [110, 133], S: [112, 80] }, bot: { K: [140, 189], H: [94, 189], S: [126, 147] } };
function SquatDemo({ playing = true, nonce = 0, small }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setT(.5); return; }
    let raf, st = performance.now();
    const loop = now => {
      const u = ((now - st) / 1000) % 3.6;
      const e = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      setT(u < 2 ? e(u / 2) : u < 3 ? 1 - e(u - 2) : 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, nonce]);
  const L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const A = [112, 224], K = L(SQ.top.K, SQ.bot.K), H = L(SQ.top.H, SQ.bot.H), S = L(SQ.top.S, SQ.bot.S);
  const dx = S[0] - H[0], dy = S[1] - H[1], len = Math.hypot(dx, dy);
  const head = [S[0] + dx / len * 24 + 9, S[1] + dy / len * 24];
  const limb = { stroke: 'var(--text)', strokeWidth: small ? 9 : 7, strokeLinecap: 'round', fill: 'none' };
  return <svg viewBox="40 50 170 190" width="100%" height="100%" aria-label="demonstração: agachamento livre com barra, vista lateral">
    {!small && <g><line x1="52" x2="198" y1={SQ.bot.H[1]} y2={SQ.bot.H[1]} stroke="var(--hairline-3)" strokeDasharray="3 4" />
      <text x="198" y={SQ.bot.H[1] - 6} textAnchor="end" fontSize="9" fill="var(--text-dim)" fontFamily="var(--font)">paralelo</text></g>}
    <line x1="98" x2="136" y1="226" y2="226" stroke="var(--surface-3)" strokeWidth="4" strokeLinecap="round" />
    <polyline points={`${A} ${K} ${H} ${S}`} {...limb} strokeLinejoin="round" />
    <line x1={A[0]} y1={A[1]} x2={A[0] + 16} y2={A[1]} {...limb} />
    <circle cx={head[0]} cy={head[1]} r="11" {...limb} />
    <polyline points={`${S} ${S[0] + 14},${S[1] + 14} ${S[0] + 2},${S[1] - 2}`} stroke="var(--text-dim)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx={S[0] - 6} cy={S[1] + 2} r={small ? 13 : 11} fill="var(--stage)" stroke="var(--accent)" strokeWidth={small ? 6 : 4} />
    <circle cx={S[0] - 6} cy={S[1] + 2} r="2.5" fill="var(--accent)" />
  </svg>;
}

function BodyMap({ primary = ['quad'], secondary = ['core'] }) {
  const f = k => primary.includes(k) ? 'var(--accent)' : secondary.includes(k) ? 'var(--accent-soft)' : 'var(--surface-3)';
  const s = k => secondary.includes(k) ? 'var(--accent-line)' : 'none';
  return <svg viewBox="0 0 120 214" width="84" height="150" role="img" aria-label="Quadríceps primário, core secundário">
    <g fill="var(--surface-2)" stroke="var(--hairline-2)" strokeWidth="1.2">
      <circle cx="60" cy="22" r="12" /><path d="M40 42Q60 36 80 42L86 70L80 148H40L34 70Z" />
      <path d="M40 44L22 62L16 114H26L34 72Z" /><path d="M80 44L98 62L104 114H94L86 72Z" />
      <path d="M40 148L44 206H57L60 156L63 206H76L80 148Z" /></g>
    <rect x="50" y="98" width="20" height="44" rx="7" fill={f('core')} stroke={s('core')} />
    <ellipse cx="50" cy="168" rx="8" ry="20" fill={f('quad')} /><ellipse cx="70" cy="168" rx="8" ry="20" fill={f('quad')} />
  </svg>;
}

const HelixMark = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
  {[0, 1, 2, 3, 4, 5, 6].map(i => { const k = Math.abs(Math.cos(2 * Math.PI * i / 7)); const h = 5 + 14 * k; return <rect key={i} x={2 + i * 3} y={12 - h / 2} width="2" height={h} rx="1" fill={i < 4 ? 'var(--accent)' : 'var(--text-dim)'} />; })}
</svg>;

Object.assign(window, { Icon, Helix, Fit, fitColor, fitWord, GeneTag, Tag, Btn, IconBtn, Segmented, Stepper, Check, SetRow, CurrentSet, WorkoutProgress, Ring, Tips, Steps, ScreenHeader, SectionHeader, NavBar, Field, Banner, HistoryRow, PRCard, Bars, Sk, SquatDemo, BodyMap, HelixMark, fmt });
