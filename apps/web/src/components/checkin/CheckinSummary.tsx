'use client'

import Link from 'next/link'
import type { BodyMeasurement, BodyWeight } from '@helux/types'
import { measurementsDue, trendAt, weeklyChange } from '@helux/nutrition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatNumber } from '@/lib/format'
import { formatDate, formatDayMonth, todayLocal } from '@/lib/dates'

// Spec 029: resumo da aba Check-in — peso de tendência, variação e atalhos.

const signed = (n: number, decimals: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n), { decimals })}`

export function CheckinSummary({
  weights,
  measurements,
  children,
}: {
  weights: BodyWeight[]
  measurements: BodyMeasurement[]
  children?: React.ReactNode
}) {
  const today = todayLocal()
  const trend = trendAt(weights, today)
  const change = weeklyChange(weights, today)
  const last = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastMeasurement = [...measurements].sort((a, b) => b.measured_on.localeCompare(a.measured_on))[0]

  return (
    <section style={{ marginTop: 24 }}>
      <SectionHeader title="Peso" />
      {trend != null ? (
        <div>
          <p className="t-caption">Peso de tendência</p>
          <p className="n-lg" style={{ margin: '2px 0 0' }}>
            {formatNumber(trend, { decimals: 1 })}
            <span className="u">kg</span>
          </p>
          {change && (
            <p className="t-secondary" style={{ marginTop: 4 }}>
              {`${signed(change.kg, 1)} kg (${signed(change.pct, 1)}%) em 7 dias`}
            </p>
          )}
        </div>
      ) : last ? (
        <div>
          <p className="t-caption">Última pesagem</p>
          <p className="n-lg" style={{ margin: '2px 0 0' }}>
            {formatNumber(last.weight_kg, { decimals: 1 })}
            <span className="u">kg</span>
          </p>
          <p className="t-secondary" style={{ marginTop: 4 }}>
            {formatDayMonth(last.date)} · A tendência precisa de pelo menos 3 pesagens nos últimos 7 dias.
          </p>
        </div>
      ) : (
        <p className="t-secondary">Nenhuma pesagem ainda. Pese-se de manhã e registre aqui; com 3 pesagens na semana aparece a tendência.</p>
      )}

      <SectionHeader title="Medidas" />
      <p className="t-secondary">
        {lastMeasurement ? `Últimas medidas em ${formatDate(lastMeasurement.measured_on)}.` : 'Registre suas medidas com fita a cada 2 a 4 semanas.'}
        {measurementsDue(measurements, today) && lastMeasurement ? ' Hora de refazer as medidas: o último registro tem mais de 4 semanas.' : ''}
      </p>

      {children}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
        <Link href="/checkin/peso" className="hx-btn hx-btn--primary">
          Registrar peso
        </Link>
        <Link href="/checkin/medidas" className="hx-btn hx-btn--secondary">
          Registrar medidas
        </Link>
      </div>
    </section>
  )
}
