'use client'

import Link from 'next/link'
import type { BodyCheckin } from '@helux/types'

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m, 10) - 1]}/${year}`
}

function fmt(val?: number, decimals = 1): string {
  return val !== undefined ? val.toFixed(decimals) : '—'
}

function DeltaCell({ curr, prev, lowerIsBetter = false, decimals = 1 }: {
  curr?: number; prev?: number; lowerIsBetter?: boolean; decimals?: number
}) {
  if (curr === undefined || prev === undefined) return <span style={{ color: 'var(--text-faint)' }}>—</span>
  const d = curr - prev
  const neutral = Math.abs(d) < 0.05
  const positive = lowerIsBetter ? d < 0 : d > 0
  const color = neutral ? 'var(--text-faint)' : positive ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)'
  const sign = d > 0 ? '+' : ''
  const text = neutral ? '=' : `${sign}${d.toFixed(decimals)}`
  return <span style={{ color, fontSize: 12 }}>{text}</span>
}

interface CheckinHistoryTableProps {
  checkins: BodyCheckin[]
}

export function CheckinHistoryTable({ checkins }: CheckinHistoryTableProps) {
  if (checkins.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Nenhum check-in registrado ainda.</p>
        <Link href="/checkin" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
          Fazer primeiro check-in →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', padding: '0 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
            {['Mês','Peso','Gordura','Cintura','Braço','Agach.','Supino','Terra'].map(h => (
              <th key={h} style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-faint)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checkins.map((c, i) => {
            const next = checkins[i + 1]
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                <td style={{ padding: '10px 6px', color: 'var(--text)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {monthLabel(c.month)}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.weight_kg)}</div>
                  <DeltaCell curr={c.weight_kg} prev={next?.weight_kg} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.body_fat_pct)}</div>
                  <DeltaCell curr={c.body_fat_pct} prev={next?.body_fat_pct} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.waist_cm)}</div>
                  <DeltaCell curr={c.waist_cm} prev={next?.waist_cm} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.arm_cm)}</div>
                  <DeltaCell curr={c.arm_cm} prev={next?.arm_cm} decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.squat_kg, 0)}</div>
                  <DeltaCell curr={c.squat_kg} prev={next?.squat_kg} decimals={0} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.bench_kg, 0)}</div>
                  <DeltaCell curr={c.bench_kg} prev={next?.bench_kg} decimals={0} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.deadlift_kg, 0)}</div>
                  <DeltaCell curr={c.deadlift_kg} prev={next?.deadlift_kg} decimals={0} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
