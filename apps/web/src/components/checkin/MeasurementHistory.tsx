'use client'

import Link from 'next/link'
import type { BodyFatSource, BodyMeasurement, BodyWeight } from '@helux/types'
import { BODY_FAT_SOURCE_LABEL, bodyComposition, effectiveBodyFat, referenceWeight, waistHeightRatio } from '@helux/nutrition'
import { TrendChart, type ChartSeries } from '@/components/checkin/TrendChart'
import { formatNumber } from '@/lib/format'
import { formatDate } from '@/lib/dates'

// Spec 029 (US2 + US5): histórico de medidas — % com a origem (nunca compara
// origens diferentes), massa gorda/magra e cintura/altura.

type Num = number | null | undefined

const SINGLE: [keyof BodyMeasurement, string][] = [
  ['waist_cm', 'Cintura'],
  ['neck_cm', 'Pescoço'],
  ['hip_cm', 'Quadril'],
  ['shoulders_cm', 'Ombros'],
  ['chest_cm', 'Peitoral'],
]
const PAIRS: [keyof BodyMeasurement, keyof BodyMeasurement, string][] = [
  ['arm_left_cm', 'arm_right_cm', 'Braço esq./dir.'],
  ['leg_left_cm', 'leg_right_cm', 'Coxa esq./dir.'],
  ['calf_left_cm', 'calf_right_cm', 'Panturrilha esq./dir.'],
]
const LOADS: [keyof BodyMeasurement, string][] = [
  ['squat_kg', 'Agachamento'],
  ['bench_kg', 'Supino'],
  ['deadlift_kg', 'Terra'],
]

const SERIES_COLORS = ['var(--accent)', 'var(--warn)', 'var(--success)', 'var(--danger)', 'var(--text-dim)']

function fatOf(m: BodyMeasurement, source: BodyFatSource): number | null {
  if (source === 'navy') return m.body_fat_navy_pct ?? null
  return m.body_fat_device_source === source ? (m.body_fat_device_pct ?? null) : null
}

function sourcesOf(m: BodyMeasurement): BodyFatSource[] {
  const out: BodyFatSource[] = []
  if (m.body_fat_navy_pct != null) out.push('navy')
  if (m.body_fat_device_pct != null) out.push(m.body_fat_device_source ?? 'outro')
  return out
}

function delta(curr: number, prev: number | null): string | null {
  if (prev == null) return null
  const d = curr - prev
  if (Math.abs(d) < 0.05) return '='
  return `${d > 0 ? '+' : '−'}${formatNumber(Math.abs(d), { decimals: 1 })}`
}

function Item({ label, value, unit, note, decimals = 1 }: { label: string; value: string | number; unit?: string; note?: string | null; decimals?: number }) {
  return (
    <div>
      <dt className="t-caption">{label}</dt>
      <dd className="n-md" style={{ margin: '2px 0 0' }}>
        {typeof value === 'number' ? formatNumber(value, { decimals }) : value}
        {unit && <span className="u">{unit}</span>}
        {note && (
          <span className="t-caption" style={{ marginLeft: 6 }}>
            {note}
          </span>
        )}
      </dd>
    </div>
  )
}

export function MeasurementHistory({
  measurements,
  weights,
  heightCm,
}: {
  measurements: BodyMeasurement[]
  weights: BodyWeight[]
  heightCm?: number | null
}) {
  if (measurements.length === 0) {
    return (
      <p className="t-secondary" style={{ marginTop: 24 }}>
        Nenhum registro de medidas ainda.{' '}
        <Link href="/checkin/medidas">
          Registrar medidas
        </Link>
      </p>
    )
  }

  const sorted = [...measurements].sort((a, b) => b.measured_on.localeCompare(a.measured_on) || b.created_at.localeCompare(a.created_at))

  // Uma série por origem (FR-012), em ordem cronológica.
  const allSources = Array.from(new Set(sorted.flatMap(sourcesOf)))
  const chart: ChartSeries[] = allSources.flatMap((source, i) => {
    const name = BODY_FAT_SOURCE_LABEL[source]
    const points = [...sorted]
      .reverse()
      .map(m => ({ date: m.measured_on, value: fatOf(m, source) }))
      .filter(p => p.value != null)
    const color = SERIES_COLORS[i % SERIES_COLORS.length]
    return [
      { name, kind: 'dots' as const, points, color },
      { name: `${name}-linha`, kind: 'line' as const, points, color },
    ]
  })

  return (
    <div style={{ marginTop: 16 }}>
      {chart.length > 0 && (
        <TrendChart
          label={`% de gordura por origem: ${allSources.map(s => BODY_FAT_SOURCE_LABEL[s]).join(', ')}`}
          series={chart}
        />
      )}

      {sorted.map((m, idx) => {
        const older = sorted.slice(idx + 1)
        const fat = effectiveBodyFat([m])
        const refKg = referenceWeight(weights, m.measured_on)
        const comp = fat && refKg != null ? bodyComposition(refKg, fat.pct) : null
        const whr = m.waist_cm != null && heightCm ? waistHeightRatio(Number(m.waist_cm), heightCm) : null
        const dateLabel = formatDate(m.measured_on)

        return (
          <article key={m.id} aria-label={`Medidas de ${dateLabel}`} className="hx-plain" style={{ marginTop: 20, paddingTop: 16 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h2 className="t-heading">{dateLabel}</h2>
              <Link href={`/checkin/medidas/${m.id}`} className="hx-btn hx-btn--ghost">
                Editar
              </Link>
            </header>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px 16px', margin: '12px 0 0' }}>
              {sourcesOf(m).map(source => {
                const value = fatOf(m, source)!
                const prev = older.map(o => fatOf(o, source)).find(v => v != null) ?? null
                return (
                  <Item key={source} label={`Gordura (${BODY_FAT_SOURCE_LABEL[source]})`} value={value} unit="%" note={delta(value, prev)} />
                )
              })}
              {SINGLE.filter(([k]) => m[k] != null).map(([k, label]) => (
                <Item key={k} label={label} value={Number(m[k])} unit="cm" />
              ))}
              {PAIRS.filter(([l, r]) => m[l] != null || m[r] != null).map(([l, r, label]) => {
                const fmt = (v: Num) => (v != null ? formatNumber(Number(v), { decimals: 1 }) : '—')
                return <Item key={label} label={label} value={`${fmt(m[l] as Num)} / ${fmt(m[r] as Num)}`} unit="cm" />
              })}
              {LOADS.filter(([k]) => m[k] != null).map(([k, label]) => (
                <Item key={k} label={label} value={Number(m[k])} unit="kg" decimals={0} />
              ))}
              {comp && fat && (
                <>
                  <Item label="Massa gorda" value={comp.fatKg} unit="kg" />
                  <Item label="Massa magra" value={comp.leanKg} unit="kg" note={`pela ${BODY_FAT_SOURCE_LABEL[fat.source]}`} />
                </>
              )}
              {whr != null && <Item label="Cintura/altura" value={whr} decimals={2} note="abaixo de 0,5 é a faixa saudável" />}
            </dl>
            {m.notes && (
              <p className="t-secondary" style={{ marginTop: 12 }}>
                {m.notes}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}
