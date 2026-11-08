'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BodyWeight } from '@helux/types'
import { needsConfirmation, trendAt } from '@helux/nutrition'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { listWeights, saveWeight } from '@/services/weights.service'
import { todayLocal } from '@/lib/dates'
import { formatNumber } from '@/lib/format'

// Spec 029 (US1): pesagem rápida — só o peso e a data.

const MIN = 20
const MAX = 500

/** Aceita vírgula decimal (teclado pt-BR): "82,4" → 82.4. */
function toNum(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isNaN(n) ? undefined : n
}

export function WeightForm({ initialDate, returnTo = '/checkin' }: { initialDate?: string; returnTo?: string } = {}) {
  const router = useRouter()
  const today = todayLocal()
  const [weights, setWeights] = useState<BodyWeight[]>([])
  const [date, setDate] = useState(initialDate ?? today)
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listWeights(120).then(setWeights, () => setWeights([]))
  }, [])

  const existing = weights.find(w => w.date === date)
  const trend = trendAt(weights.filter(w => w.date !== date), date)

  useEffect(() => {
    // Editando uma pesagem existente: começa com o valor dela.
    if (initialDate && existing && value === '') setValue(String(existing.weight_kg).replace('.', ','))
  }, [initialDate, existing, value])

  async function persist(kg: number) {
    setSaving(true)
    setError(null)
    try {
      await saveWeight(date, kg)
      router.push(returnTo)
    } catch {
      setError('Erro ao salvar a pesagem. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)
    const kg = toNum(value)
    if (kg === undefined || kg < MIN || kg > MAX) {
      setFieldError(`Peso: valor deve estar entre ${MIN} e ${MAX} kg.`)
      return
    }
    if (date > today) {
      setFieldError('A data não pode ser no futuro.')
      return
    }
    if (needsConfirmation(weights, kg, date)) {
      setConfirming(kg)
      return
    }
    await persist(kg)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ marginTop: 24 }}>
      <p className="t-secondary">De manhã, em jejum, depois de ir ao banheiro e com pouca ou nenhuma roupa.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 16 }}>
        <Field
          label="Peso"
          unit="kg"
          value={value}
          onChange={setValue}
          error={fieldError}
          inputProps={{ autoFocus: true }}
        />
        <div className="hx-field">
          <label htmlFor="weight-date">Data</label>
          <div className="hx-input">
            <input
              id="weight-date"
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value || today)}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit' }}
            />
          </div>
        </div>
      </div>

      {trend != null && (
        <p className="t-caption" style={{ marginTop: 12 }}>
          Peso de tendência: {formatNumber(trend, { decimals: 1 })} kg
        </p>
      )}
      {existing && (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          Já há uma pesagem neste dia ({formatNumber(existing.weight_kg, { decimals: 1 })} kg). Salvar vai substituí-la.
        </p>
      )}

      {error && (
        <div style={{ marginTop: 16 }}>
          <Banner kind="err" title="Não foi possível salvar">
            {error}
          </Banner>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Button type="submit" kind="primary" size="lg" block loading={saving}>
          Salvar peso
        </Button>
      </div>

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Confirmar ${confirming !== null ? formatNumber(confirming, { decimals: 1 }) : ''} kg?`}
        actions={
          <>
            <Button
              kind="primary"
              block
              onClick={() => {
                const kg = confirming
                setConfirming(null)
                if (kg !== null) void persist(kg)
              }}
            >
              Salvar mesmo assim
            </Button>
            <Button kind="ghost" block onClick={() => setConfirming(null)}>
              Corrigir
            </Button>
          </>
        }
      >
        {trend != null
          ? `Está mais de 3 kg longe do seu peso de tendência (${formatNumber(trend, { decimals: 1 })} kg). Confira se não houve erro de digitação.`
          : null}
      </Dialog>
    </form>
  )
}
