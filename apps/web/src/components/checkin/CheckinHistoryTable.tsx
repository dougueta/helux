'use client'

import Link from 'next/link'
import type { BodyCheckin } from '@helux/types'
import { formatMonthYear, formatNumber } from '@/lib/format'

type NumKey = 'weight_kg' | 'body_fat_pct' | 'waist_cm' | 'arm_cm' | 'squat_kg' | 'bench_kg' | 'deadlift_kg'

const FIELDS: { key: NumKey; label: string; unit: string; decimals: number }[] = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', decimals: 1 },
  { key: 'body_fat_pct', label: 'Gordura', unit: '%', decimals: 1 },
  { key: 'waist_cm', label: 'Cintura', unit: 'cm', decimals: 1 },
  { key: 'arm_cm', label: 'Braço', unit: 'cm', decimals: 1 },
  { key: 'squat_kg', label: 'Agachamento', unit: 'kg', decimals: 0 },
  { key: 'bench_kg', label: 'Supino', unit: 'kg', decimals: 0 },
  { key: 'deadlift_kg', label: 'Terra', unit: 'kg', decimals: 0 },
]

/** Variação contra o mês anterior, neutra (sem cor): "+5", "−1,2", "=". */
function delta(curr: number | null | undefined, prev: number | null | undefined, decimals: number): string | null {
  if (curr == null || prev == null) return null
  const d = curr - prev
  if (Math.abs(d) < 0.05) return '='
  return `${d > 0 ? '+' : '−'}${formatNumber(Math.abs(d), { decimals })}`
}

/** Histórico de check-ins (FR-023): um bloco plano por mês, grade 2 colunas em mono pt-BR. */
export function CheckinHistoryTable({ checkins }: { checkins: BodyCheckin[] }) {
  if (checkins.length === 0) {
    return (
      <div style={{ marginTop: 24 }}>
        <h2 className="t-section">Nenhum check-in registrado ainda</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          O check-in mensal ajusta cargas e volume do seu plano.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/checkin" className="hx-btn hx-btn--secondary">
            Fazer primeiro check-in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {checkins.map((c, i) => {
        const prev = checkins[i + 1]
        const shown = FIELDS.filter(f => c[f.key] != null)
        return (
          <article key={c.id} className="hx-plain" style={{ marginTop: i ? 24 : 16, paddingTop: 16 }}>
            <h2 className="t-section">{formatMonthYear(c.month)}</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px 16px', margin: '12px 0 0' }}>
              {shown.map(f => {
                const d = delta(c[f.key], prev?.[f.key], f.decimals)
                return (
                  <div key={f.key}>
                    <dt className="t-caption">{f.label}</dt>
                    <dd style={{ margin: '2px 0 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="n-md">
                        {formatNumber(c[f.key] as number, { decimals: f.decimals })}
                        <span className="u">{f.unit}</span>
                      </span>
                      {d && <span className="n-sm dim">{d}</span>}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </article>
        )
      })}
    </div>
  )
}
