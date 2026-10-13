import type { ReactNode } from 'react'

/** Anel (`.hx-ring`): só para tempo que corre (descanso). `value` de 0 a 1. */
export function Ring({
  size,
  stroke,
  value,
  children,
}: {
  size: number
  stroke: number
  value: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className="hx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rung-off)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
        />
      </svg>
      {children}
    </div>
  )
}
