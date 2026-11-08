// Spec 029 (R9): gráfico simples em SVG — pontos (pesagens) e linhas
// (tendência, % por origem). Linhas quebram onde o valor é null.

export interface ChartSeries {
  name: string
  kind: 'dots' | 'line'
  points: { date: string; value: number | null }[]
  /** Cor CSS; padrão usa os tokens do tema. */
  color?: string
}

const W = 320
const H = 140
const PAD = { top: 10, right: 8, bottom: 18, left: 34 }

const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function TrendChart({ series, label }: { series: ChartSeries[]; label: string }) {
  const all = series.flatMap(s => s.points.filter((p): p is { date: string; value: number } => p.value != null))
  if (all.length === 0) return null

  const xs = all.map(p => day(p.date))
  const ys = all.map(p => p.value)
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  let [y0, y1] = [Math.min(...ys), Math.max(...ys)]
  if (y1 - y0 < 1) {
    y0 -= 0.5
    y1 += 0.5
  }
  const sx = (d: string) => PAD.left + (x1 === x0 ? (W - PAD.left - PAD.right) / 2 : ((day(d) - x0) / (x1 - x0)) * (W - PAD.left - PAD.right))
  const sy = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom)

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', maxWidth: '100%', marginTop: 12 }}
    >
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--hairline)" />
      <text x={PAD.left - 4} y={sy(y1) + 4} textAnchor="end" fontSize="10" fill="var(--text-dim, currentColor)">
        {fmt(y1)}
      </text>
      <text x={PAD.left - 4} y={sy(y0) + 4} textAnchor="end" fontSize="10" fill="var(--text-dim, currentColor)">
        {fmt(y0)}
      </text>
      {series.map((s, i) => {
        const color = s.color ?? (s.kind === 'dots' ? 'var(--text-dim, currentColor)' : 'var(--accent, currentColor)')
        if (s.kind === 'dots') {
          return s.points
            .filter((p): p is { date: string; value: number } => p.value != null)
            .map(p => <circle key={`${i}-${p.date}`} data-series={s.name} cx={sx(p.date)} cy={sy(p.value)} r={2.5} fill={color} opacity={0.6} />)
        }
        // Segmentos contínuos (sem null no meio); segmento de 1 ponto não vira linha.
        const segments: { date: string; value: number }[][] = []
        let cur: { date: string; value: number }[] = []
        for (const p of s.points) {
          if (p.value == null) {
            if (cur.length) segments.push(cur)
            cur = []
          } else cur.push({ date: p.date, value: p.value })
        }
        if (cur.length) segments.push(cur)
        return segments
          .filter(seg => seg.length > 1)
          .map((seg, j) => (
            <path
              key={`${i}-${j}`}
              data-series={s.name}
              d={seg.map((p, k) => `${k === 0 ? 'M' : 'L'}${sx(p.date).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))
      })}
    </svg>
  )
}
