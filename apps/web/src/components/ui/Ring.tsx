import type { ReactNode } from 'react'

export function Ring({
  value,
  size = 64,
  sw = 6,
  children,
}: {
  value: number
  size?: number
  sw?: number
  children?: ReactNode
}) {
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={sw}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1 }}>{children}</div>
    </div>
  )
}
