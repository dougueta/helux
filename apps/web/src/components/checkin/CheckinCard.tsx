import type { ReactNode } from 'react'
import type { BodyMeasurement, BodyWeight } from '@helux/types'
import { BODY_FAT_SOURCE_LABEL, effectiveBodyFat, measurementsDue, trendAt, weeklyChange } from '@helux/nutrition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatNumber } from '@/lib/format'
import { formatDayMonth, todayLocal } from '@/lib/dates'

/**
 * Cartão "Peso e medidas" da Home (spec 029, US5): superfície plana, grade 2×2
 * com números em mono pt-BR. Campos sem dado ficam ocultos (FR-024 da 012).
 */
export function CheckinCard({
  weights,
  measurements,
  children,
}: {
  weights: BodyWeight[]
  measurements: BodyMeasurement[]
  children?: ReactNode
}) {
  if (weights.length === 0 && measurements.length === 0) return null

  const today = todayLocal()
  const trend = trendAt(weights, today)
  const change = trend != null ? weeklyChange(weights, today) : null
  const last = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  const fat = effectiveBodyFat(measurements)
  const latest = [...measurements].sort((a, b) => b.measured_on.localeCompare(a.measured_on))[0]

  const num = (v: number | null | undefined, decimals: number) => (v != null ? formatNumber(v, { decimals }) : null)
  const signed = (v: number | null | undefined) => (v != null ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatNumber(Math.abs(v), { decimals: 1 })}` : null)

  const items: [label: string, value: string | null, unit: string][] = [
    trend != null
      ? ['Peso (tendência)', num(trend, 1), 'kg']
      : [last ? `Peso (${formatDayMonth(last.date)})` : 'Peso', num(last?.weight_kg, 1), 'kg'],
    ['7 dias', signed(change?.kg), 'kg'],
    [fat ? `Gordura (${BODY_FAT_SOURCE_LABEL[fat.source]})` : 'Gordura', num(fat?.pct, 1), '%'],
    ['Agachamento', num(latest?.squat_kg, 0), 'kg'],
    ['Supino', num(latest?.bench_kg, 0), 'kg'],
  ]

  return (
    <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
      <SectionHeader title="Peso e medidas" />
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px 16px', margin: 0 }}>
        {items
          .filter(([, v]) => v != null)
          .map(([label, v, unit]) => (
            <div key={label}>
              <dt className="t-caption">{label}</dt>
              <dd className="n-md" style={{ margin: '2px 0 0' }}>
                {v}
                <span className="u">{unit}</span>
              </dd>
            </div>
          ))}
      </dl>
      {measurementsDue(measurements, today) && (
        <p className="t-secondary" style={{ marginTop: 14 }}>
          Hora de refazer as medidas: o último registro tem mais de 4 semanas.
        </p>
      )}
      {children && <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>{children}</div>}
    </section>
  )
}
