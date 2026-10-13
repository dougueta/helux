import type { ReactNode } from 'react'
import type { BodyCheckin } from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatMonthYear, formatNumber } from '@/lib/format'

/**
 * "Último check-in" da Home v2 (handoff 5.1): superfície plana, grade 2×2 com
 * números em mono pt-BR. Campos não preenchidos ficam ocultos (FR-024).
 */
export function CheckinCard({ checkins, children }: { checkins: BodyCheckin[]; children?: ReactNode }) {
  if (checkins.length === 0) return null
  const curr = checkins[0]

  const items: [string, number | null | undefined, string, number][] = [
    ['Peso', curr.weight_kg, 'kg', 1],
    ['Gordura', curr.body_fat_pct, '%', 1],
    ['Agachamento', curr.squat_kg, 'kg', 0],
    ['Supino', curr.bench_kg, 'kg', 0],
  ]

  return (
    <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
      <SectionHeader title="Último check-in" aside={formatMonthYear(curr.month)} />
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px 16px', margin: 0 }}>
        {items
          .filter(([, v]) => v != null)
          .map(([label, v, unit, decimals]) => (
            <div key={label}>
              <dt className="t-caption">{label}</dt>
              <dd className="n-md" style={{ margin: '2px 0 0' }}>
                {formatNumber(v as number, { decimals })}
                <span className="u">{unit}</span>
              </dd>
            </div>
          ))}
      </dl>
      {children && <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>{children}</div>}
    </section>
  )
}
