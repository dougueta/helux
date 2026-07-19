import type { CSSProperties } from 'react'

export const ICONS = {
  home:     'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  dna:      'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
  chart:    'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play:     'M7 4.5v15l13-7.5z',
  flame:    'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron:  'M9 6l6 6-6 6',
  close:    'M6 6l12 12M18 6 6 18',
  check:    'M5 12.5 10 17.5 19.5 7',
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  timer:    'M12 8v5l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 3h6',
  trophy:   'M7 5h10v3a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 17h4M9 20h6',
  arrowUp:  'M12 19V5M6 11l6-6 6 6',
  pause:    'M9 5v14M15 5v14',
  swap:     'M7 7h11l-3-3M17 17H6l3 3',
  bolt:     'M13 3 5 13h6l-1 8 8-10h-6z',
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 22,
  stroke = 'currentColor',
  sw = 1.9,
  style,
}: {
  name: IconName
  size?: number
  stroke?: string
  sw?: number
  style?: CSSProperties
}) {
  const solid = name === 'play'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? stroke : 'none'}
      stroke={solid ? 'none' : stroke}
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

export function HelixMark({ size = 28, stroke = 'var(--accent)' }: { size?: number; stroke?: string }) {
  const rungs = [0.16, 0.34, 0.5, 0.66, 0.84]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11 3 C 21 9, 21 23, 11 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21 3 C 11 9, 11 23, 21 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      {rungs.map((t, i) => {
        const y = 3 + t * 26
        const amp = Math.sin(t * Math.PI) * 5
        return <line key={i} x1={16 - amp} y1={y} x2={16 + amp} y2={y} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity={0.5} />
      })}
    </svg>
  )
}
