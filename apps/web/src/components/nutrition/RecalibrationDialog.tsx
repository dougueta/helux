'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { RecalibrationEvaluation } from '@helux/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { applyRecalibration, previewRecalibration } from '@/services/nutrition.service'
import { formatNumber } from '@/lib/format'
import { formatDayMonth } from '@/lib/dates'

// Spec 029 (US3, FR-021): recalibração da dieta só a pedido — mostra a
// proposta (metas atuais → novas e o motivo) e aplica se o usuário confirmar.

const signed = (n: number, decimals: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n), { decimals })}`

function Proposal({ ev }: { ev: Extract<RecalibrationEvaluation, { status: 'proposta' }> }) {
  const { before, after, metrics } = ev
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p className="n-md" style={{ margin: 0 }}>{`${before.kcal} → ${after.kcal} kcal`}</p>
      <p className="t-secondary" style={{ margin: 0 }}>
        {`P ${before.proteinG} → ${after.proteinG} g · C ${before.carbsG} → ${after.carbsG} g · G ${before.fatG} → ${after.fatG} g`}
      </p>
      <p className="t-secondary" style={{ margin: 0 }}>
        {`Tendência ${formatNumber(metrics.weightFromKg, { decimals: 1 })} → ${formatNumber(metrics.weightToKg, { decimals: 1 })} kg (${signed(metrics.weeklyRatePct, 2)}%/sem em ${formatNumber(metrics.weeks, { decimals: 1 })} semanas)`}
        {metrics.waistDeltaCm !== undefined ? ` · cintura ${signed(metrics.waistDeltaCm, 1)} cm` : ''}
      </p>
      <p className="t-body" style={{ margin: 0 }}>{ev.reason}</p>
    </div>
  )
}

function Message({ ev }: { ev: Exclude<RecalibrationEvaluation, { status: 'proposta' }> }) {
  if (ev.status === 'intervalo-curto') {
    return <p style={{ margin: 0 }}>{`A recalibração precisa de pelo menos 2 semanas entre uma e outra. Você poderá recalibrar a partir de ${formatDayMonth(ev.availableOn)}.`}</p>
  }
  if (ev.status === 'faltam-pesagens') {
    const where = ev.at.includes('inicio') && ev.at.includes('atual') ? 'no início do período e nesta semana' : ev.at.includes('inicio') ? 'no início do período' : 'nesta semana'
    return (
      <>
        <p style={{ margin: 0 }}>{`Faltam pesagens ${where} para calcular o peso de tendência: registre pelo menos 3 por semana.`}</p>
        <Link href="/checkin/peso?voltar=nutricao" className="hx-btn hx-btn--secondary" style={{ marginTop: 12 }}>
          Registrar peso
        </Link>
      </>
    )
  }
  return (
    <p style={{ margin: 0 }}>
      {ev.missing.includes('sem-fase') ? 'Não há fase de dieta ativa para recalibrar.' : 'Complete altura, data de nascimento e sexo no Perfil para recalibrar.'}
    </p>
  )
}

export function RecalibrateButton({ onApplied }: { onApplied: () => void }) {
  const [ev, setEv] = useState<RecalibrationEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    setError(null)
    setLoading(true)
    try {
      setEv(await previewRecalibration())
    } catch {
      setError('Não foi possível calcular a recalibração. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  async function apply() {
    setApplying(true)
    try {
      await applyRecalibration()
      setEv(null)
      onApplied()
    } catch {
      setError('Não foi possível aplicar. Tente de novo.')
      setEv(null)
    } finally {
      setApplying(false)
    }
  }

  const close = () => setEv(null)

  return (
    <div style={{ marginTop: 16 }}>
      <Button kind="secondary" block loading={loading} onClick={open}>
        Recalibrar dieta
      </Button>
      {error && (
        <p className="hx-field-help is-err" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
      <Dialog
        open={ev !== null}
        onClose={close}
        title={ev?.status === 'proposta' ? 'Proposta de recalibração' : 'Recalibrar dieta'}
        actions={
          ev?.status === 'proposta' ? (
            <>
              <Button kind="primary" block loading={applying} onClick={apply}>
                Aplicar
              </Button>
              <Button kind="ghost" block onClick={close}>
                Descartar
              </Button>
            </>
          ) : (
            <Button kind="ghost" block onClick={close}>
              Fechar
            </Button>
          )
        }
      >
        {ev && (ev.status === 'proposta' ? <Proposal ev={ev} /> : <Message ev={ev} />)}
      </Dialog>
    </div>
  )
}
