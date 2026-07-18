export interface BarChartPoint {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartPoint[]
  max?: number
  height?: number
}

// Ported from the design handoff's BarChart primitive (helux-components.jsx).
// Deviation from the handoff: the middle "bar wrapper" div is given flex: 1
// here (the handoff's version omits it), because a percentage `height` only
// resolves against a wrapper that itself has a resolved (non-auto) height —
// without flex: 1 the wrapper's height stays auto and every bar collapses to 0.
export function BarChart({ data, max, height = 120 }: BarChartProps) {
  if (data.length === 0) return null

  const top = max ?? Math.max(...data.map(d => d.value), 1) * 1.12

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height }}>
      {data.map((d, i) => {
        const barHeight = Math.max(6, (d.value / top) * 100)
        const isLast = i === data.length - 1
        return (
          <div
            key={`${d.label}-${i}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}
          >
            <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div
                data-testid="bar"
                style={{
                  width: '100%',
                  maxWidth: 26,
                  borderRadius: '6px 6px 3px 3px',
                  background: isLast ? 'var(--accent)' : 'var(--surface-3)',
                  boxShadow: isLast ? '0 0 14px var(--accent-glow)' : 'none',
                  height: `${barHeight}%`,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
