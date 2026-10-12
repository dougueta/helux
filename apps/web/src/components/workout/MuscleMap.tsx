import type { CSSProperties } from 'react'

const MM_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  ombro: 'Deltoide',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  core: 'Core',
  dorsal: 'Dorsais',
  quadriceps: 'Quadríceps',
}

type EllipseShape = ['e', number, number, number, number]
type RectShape = ['r', number, number, number, number, number]
type Shape = EllipseShape | RectShape

const MM_REGIONS: { key: string; shapes: Shape[] }[] = [
  { key: 'ombro', shapes: [['e', 31, 58, 12, 9], ['e', 89, 58, 12, 9]] },
  { key: 'triceps', shapes: [['e', 15, 96, 6.5, 15], ['e', 105, 96, 6.5, 15]] },
  { key: 'biceps', shapes: [['e', 23, 92, 7, 15], ['e', 97, 92, 7, 15]] },
  { key: 'peito', shapes: [['e', 47, 80, 14, 11], ['e', 73, 80, 14, 11]] },
  { key: 'dorsal', shapes: [['e', 47, 94, 13, 13], ['e', 73, 94, 13, 13]] },
  { key: 'core', shapes: [['r', 50, 100, 20, 40, 8]] },
  { key: 'quadriceps', shapes: [['e', 49, 154, 10, 26], ['e', 71, 154, 10, 26]] },
]

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
  const strokeFor = (k: string) => (primary.includes(k) ? 'transparent' : secondary.includes(k) ? 'var(--accent-line)' : 'var(--hairline)')

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <svg viewBox="0 0 120 210" width="96" height="168" aria-label="músculos trabalhados">
        <g fill="var(--surface-2)" stroke="var(--hairline)" strokeWidth="1.5">
          <circle cx="60" cy="24" r="13" />
          <path d="M40 44 Q60 38 80 44 L86 70 L80 150 H70 L66 100 H54 L50 150 H40 L34 70 Z" />
          <path d="M40 46 L22 64 L16 116 H26 L34 74 Z" />
          <path d="M80 46 L98 64 L104 116 H94 L86 74 Z" />
          <path d="M50 150 L48 200 H58 L60 156 L62 200 H72 L70 150 Z" />
        </g>
        {MM_REGIONS.map((reg, i) => (
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
