import { formatNumber } from '@/lib/format'

/** Gráfico de barras (`.hx-bars`): sem eixo, sem grade, sem verde; semana atual em `--text`. */
export function Bars({
  data,
  currentIndex = data.length - 1,
  unit = 't',
  label = 'volume semanal',
}: {
  data: { label: string; value: number }[]
  currentIndex?: number
  unit?: string
  label?: string
}) {
  const max = Math.max(0, ...data.map(d => d.value))
  const desc = `${label}: ${data.map(d => `${d.label} ${formatNumber(d.value, { decimals: 1 }).replace(/,0$/, '')} ${unit}`).join(', ')}`
  return (
    <div className="hx-bars" role="img" aria-label={desc}>
      {data.map((d, i) => (
        <div key={i} className={i === currentIndex ? 'hx-bar cur' : 'hx-bar'}>
          <i style={{ height: max > 0 ? `${(d.value / max) * 88}%` : 0 }} />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  )
}
