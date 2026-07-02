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

function deltaStr(curr?: number, prev?: number, decimals = 1): string {
  if (curr === undefined || prev === undefined) return ''
  const d = curr - prev
  if (Math.abs(d) < 0.05) return ' ='
  const sign = d > 0 ? '+' : ''
  return ` ${sign}${d.toFixed(decimals)}`
}

function DeltaSpan({ curr, prev, lowerIsBetter = false, decimals = 1 }: {
  curr?: number; prev?: number; lowerIsBetter?: boolean; decimals?: number
}) {
  if (curr === undefined || prev === undefined) return null
  const d = curr - prev
  const neutral = Math.abs(d) < 0.05
  const positive = lowerIsBetter ? d < 0 : d > 0
  const color = neutral ? 'var(--text-faint)' : positive ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)'
  return (
    <span style={{ color, fontSize: 12, marginLeft: 2 }}>
      {deltaStr(curr, prev, decimals)}
    </span>
  )
}

interface CheckinCardProps {
  checkins: BodyCheckin[]
}

export function CheckinCard({ checkins }: CheckinCardProps) {
  if (checkins.length === 0) return null

  const curr = checkins[0]
  const prev = checkins[1]

  return (
    <Link href="/checkin/history" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
          Check-in {monthLabel(curr.month)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0', fontSize: 13, color: 'var(--text)' }}>
          {curr.weight_kg !== undefined && (
            <span>
              Peso <strong>{fmt(curr.weight_kg)}kg</strong>
              <DeltaSpan curr={curr.weight_kg} prev={prev?.weight_kg} lowerIsBetter decimals={1} />
            </span>
          )}
          {curr.body_fat_pct !== undefined && (
            <span>
              Gordura <strong>{fmt(curr.body_fat_pct)}%</strong>
              <DeltaSpan curr={curr.body_fat_pct} prev={prev?.body_fat_pct} lowerIsBetter decimals={1} />
            </span>
          )}
          {curr.squat_kg !== undefined && (
            <span>
              Agach. <strong>{fmt(curr.squat_kg, 0)}kg</strong>
              <DeltaSpan curr={curr.squat_kg} prev={prev?.squat_kg} decimals={0} />
            </span>
          )}
          {curr.bench_kg !== undefined && (
            <span>
              Supino <strong>{fmt(curr.bench_kg, 0)}kg</strong>
              <DeltaSpan curr={curr.bench_kg} prev={prev?.bench_kg} decimals={0} />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
