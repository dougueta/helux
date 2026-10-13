import type { CSSProperties } from 'react'

/**
 * Ícones da v2 (objeto IC de design_handoff_helux_v2/v2/v2-core.jsx):
 * traço 1.9, pontas redondas, grade 24 px, fill none, stroke currentColor.
 */
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
  // spec 018: aba Nutrição
  leaf: 'M5 19c0-8.3 5.5-14 14-14 0 8.5-5.7 14-14 14zM5 19l8-8',
} as const

export const ICONS = {
  ...IC,
  // nomes usados antes da v2
  chevron: IC.chev,
  arrowUp: IC.up,
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 24,
  stroke = 'currentColor',
  sw = 1.9,
  filled = false,
  style,
}: {
  name: IconName
  size?: number
  stroke?: string
  sw?: number
  /** Só para o play dentro do botão principal. */
  filled?: boolean
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? stroke : 'none'}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

/** Marca: 7 traços com altura por |cos|, os 4 primeiros em acento. */
export function HelixMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const h = 5 + 14 * Math.abs(Math.cos((2 * Math.PI * i) / 7))
        return (
          <rect key={i} x={2 + i * 3} y={12 - h / 2} width="2" height={h} rx="1"
            fill={i < 4 ? 'var(--accent)' : 'var(--text-dim)'} />
        )
      })}
    </svg>
  )
}
