'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { BodyWeight } from '@helux/types'
import { trendSeries, weeklyChange, trendAt } from '@helux/nutrition'
import { TrendChart } from '@/components/checkin/TrendChart'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { deleteWeight } from '@/services/weights.service'
import { formatNumber } from '@/lib/format'
import { formatDate, todayLocal } from '@/lib/dates'

// Spec 029 (US1): aba Peso — gráfico de pesagens + tendência e a lista (editar/apagar).

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n), { decimals: 1 })}`

export function WeightHistory({ weights, onChanged }: { weights: BodyWeight[]; onChanged?: () => void }) {
  const [toDelete, setToDelete] = useState<BodyWeight | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (weights.length === 0) {
    return (
      <p className="t-secondary" style={{ marginTop: 24 }}>
        Nenhuma pesagem ainda. <Link href="/checkin/peso">Registrar peso</Link>
      </p>
    )
  }

  const today = todayLocal()
  const series = trendSeries(weights)
  const trend = trendAt(weights, today)
  const change = weeklyChange(weights, today)
  const label =
    trend != null
      ? `Peso: tendência de ${formatNumber(trend, { decimals: 1 })} kg${change ? `, ${signed(change.kg)} kg em 7 dias` : ''}`
      : 'Peso: pesagens registradas (sem tendência ainda)'

  async function confirmDelete() {
    const w = toDelete
    setToDelete(null)
    if (!w) return
    try {
      await deleteWeight(w.date)
      onChanged?.()
    } catch {
      setError('Erro ao apagar a pesagem. Tente novamente.')
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <TrendChart
        label={label}
        series={[
          { name: 'Pesagens', kind: 'dots', points: series.map(p => ({ date: p.date, value: p.weightKg })) },
          { name: 'Tendência', kind: 'line', points: series.map(p => ({ date: p.date, value: p.trendKg })) },
        ]}
      />
      {trend == null && (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          A tendência aparece com pelo menos 3 pesagens nos últimos 7 dias.
        </p>
      )}
      {error && (
        <p className="hx-field-help is-err" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {[...series].reverse().map(p => (
          <li key={p.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
            <span className="t-body" style={{ flex: 1 }}>
              {formatDate(p.date)}
            </span>
            <span className="n-md">
              {formatNumber(p.weightKg, { decimals: 1 })}
              <span className="u">kg</span>
            </span>
            <span className="t-caption" style={{ minWidth: 92, textAlign: 'right' }}>
              {p.trendKg != null ? `tendência ${formatNumber(p.trendKg, { decimals: 1 })}` : '—'}
            </span>
            <Link href={`/checkin/peso?data=${p.date}`} className="hx-btn hx-btn--ghost" aria-label={`Editar pesagem de ${formatDate(p.date)}`}>
              Editar
            </Link>
            <Button kind="ghost" aria-label={`Apagar pesagem de ${formatDate(p.date)}`} onClick={() => setToDelete(weights.find(w => w.date === p.date) ?? null)}>
              Apagar
            </Button>
          </li>
        ))}
      </ul>

      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        role="alertdialog"
        title={toDelete ? `Apagar a pesagem de ${formatDate(toDelete.date)}?` : ''}
        actions={
          <>
            <Button kind="danger" block onClick={confirmDelete}>
              Apagar
            </Button>
            <Button kind="ghost" block onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
          </>
        }
      />
    </div>
  )
}
