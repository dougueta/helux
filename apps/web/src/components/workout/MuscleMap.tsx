import type { CSSProperties } from 'react'

const MM_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  ombro: 'Deltoide',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  core: 'Core',
  dorsal: 'Dorsais',
  quadriceps: 'Quadríceps',
  antebraco: 'Antebraço',
  trapezio: 'Trapézio',
  lombar: 'Lombar',
  posterior: 'Posterior de coxa',
  gluteo: 'Glúteo',
  adutores: 'Adutores',
  abdutores: 'Abdutores',
  panturrilha: 'Panturrilha',
}

type EllipseShape = ['e', number, number, number, number]
type RectShape = ['r', number, number, number, number, number]
type Shape = EllipseShape | RectShape

type Region = { key: string; shapes: Shape[] }

const MM_REGIONS: Region[] = [
  { key: 'ombro', shapes: [['e', 31, 58, 12, 9], ['e', 89, 58, 12, 9]] },
  { key: 'triceps', shapes: [['e', 15, 96, 6.5, 15], ['e', 105, 96, 6.5, 15]] },
  { key: 'biceps', shapes: [['e', 23, 92, 7, 15], ['e', 97, 92, 7, 15]] },
  { key: 'peito', shapes: [['e', 47, 80, 14, 11], ['e', 73, 80, 14, 11]] },
  { key: 'dorsal', shapes: [['e', 47, 94, 13, 13], ['e', 73, 94, 13, 13]] },
  { key: 'core', shapes: [['r', 50, 100, 20, 40, 8]] },
  { key: 'quadriceps', shapes: [['e', 49, 154, 10, 26], ['e', 71, 154, 10, 26]] },
  { key: 'antebraco', shapes: [['e', 20, 110, 5, 6], ['e', 100, 110, 5, 6]] },
  { key: 'abdutores', shapes: [['e', 40, 112, 4, 10], ['e', 80, 112, 4, 10]] },
  { key: 'adutores', shapes: [['e', 57, 138, 3.5, 14], ['e', 63, 138, 3.5, 14]] },
]

/** Vista de costas (028): aparece quando o item envolve um músculo que só se vê por trás. */
const MM_BACK_REGIONS: Region[] = [
  { key: 'trapezio', shapes: [['e', 60, 50, 15, 7]] },
  { key: 'ombro', shapes: [['e', 31, 58, 12, 9], ['e', 89, 58, 12, 9]] },
  { key: 'triceps', shapes: [['e', 22, 92, 7, 15], ['e', 98, 92, 7, 15]] },
  { key: 'dorsal', shapes: [['e', 47, 80, 12, 13], ['e', 73, 80, 12, 13]] },
  { key: 'lombar', shapes: [['r', 52, 84, 16, 16, 6]] },
  { key: 'gluteo', shapes: [['e', 50, 112, 10, 10], ['e', 70, 112, 10, 10]] },
  { key: 'posterior', shapes: [['e', 49, 145, 9, 20], ['e', 71, 145, 9, 20]] },
  { key: 'panturrilha', shapes: [['e', 54, 180, 5, 12], ['e', 66, 180, 5, 12]] },
]

const BACK_KEYS = ['dorsal', 'trapezio', 'lombar', 'gluteo', 'posterior', 'panturrilha', 'triceps']

/** Silhueta com as regiões; a mesma silhueta serve para a frente e as costas. */
function Figure({
  regions,
  label,
  size,
  fillFor,
  strokeFor,
}: {
  regions: Region[]
  label: string
  size: number
  fillFor: (k: string) => string
  strokeFor: (k: string) => string
}) {
  return (
    <svg viewBox="0 0 120 210" width={size} height={(size * 7) / 4} aria-label={label}>
      <g fill="var(--surface-2)" stroke="var(--hairline)" strokeWidth="1.5">
        <circle cx="60" cy="24" r="13" />
        <path d="M40 44 Q60 38 80 44 L86 70 L80 150 H70 L66 100 H54 L50 150 H40 L34 70 Z" />
        <path d="M40 46 L22 64 L16 116 H26 L34 74 Z" />
        <path d="M80 46 L98 64 L104 116 H94 L86 74 Z" />
        <path d="M50 150 L48 200 H58 L60 156 L62 200 H72 L70 150 Z" />
      </g>
      {regions.map((reg, i) => (
        <g key={i} strokeWidth="1.2">
          {reg.shapes.map((s, j) =>
            s[0] === 'e' ? (
              <ellipse key={j} cx={s[1]} cy={s[2]} rx={s[3]} ry={s[4]} fill={fillFor(reg.key)} stroke={strokeFor(reg.key)} data-muscle={reg.key} />
            ) : (
              <rect key={j} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5]} fill={fillFor(reg.key)} stroke={strokeFor(reg.key)} data-muscle={reg.key} />
            ),
          )}
        </g>
      ))}
    </svg>
  )
}

/** Item da legenda v2: quadrado de 10 px, nome em `.t-body-m` e o papel em `.t-caption` abaixo. */
function LegendItem({ label, role, swatch }: { label: string; role: string; swatch: CSSProperties }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, ...swatch }} />
        <span className="t-body-m">{label}</span>
      </div>
      <div className="t-caption" style={{ marginLeft: 18 }}>
        {role}
      </div>
    </div>
  )
}

export function MuscleMap({
  primary = [],
  secondary = [],
}: {
  primary?: string[]
  secondary?: string[]
}) {
  const fillFor = (k: string) => (primary.includes(k) ? 'var(--accent)' : secondary.includes(k) ? 'var(--accent-soft)' : 'var(--surface-3)')
  const showBack = [...primary, ...secondary].some(k => BACK_KEYS.includes(k))
  const strokeFor = (k: string) => (primary.includes(k) ? 'transparent' : secondary.includes(k) ? 'var(--accent-line)' : 'var(--hairline)')

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Figure regions={MM_REGIONS} label="músculos trabalhados" size={showBack ? 72 : 96} fillFor={fillFor} strokeFor={strokeFor} />
        {showBack && (
          <Figure regions={MM_BACK_REGIONS} label="músculos trabalhados, costas" size={72} fillFor={fillFor} strokeFor={strokeFor} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {primary.map((k) => (
          <LegendItem key={k} label={MM_LABEL[k] || k} role="Primário" swatch={{ background: 'var(--accent)' }} />
        ))}
        {secondary.filter((k) => !primary.includes(k)).map((k) => (
          <LegendItem
            key={k}
            label={MM_LABEL[k] || k}
            role="Secundário"
            swatch={{ background: 'var(--accent-soft)', boxShadow: 'inset 0 0 0 1px var(--accent-line)' }}
          />
        ))}
      </div>
    </div>
  )
}
