'use client'

import { useState } from 'react'
import type { ExerciseAdjustmentChange, PainReport } from '@helux/types'
import { Button } from '@/components/ui/Button'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'
import { PainPicker, ScaleRow } from '@/components/workout/CheckinFields'

export interface PreCheckinValues {
  energy?: number
  sleep?: number
  motivation?: number
  pains: PainReport[]
}

export interface PreCheckinAdjustment {
  reason: string
  changes: ExerciseAdjustmentChange[]
}

/**
 * Check-in de antes do treino (spec 024, FR-017): energia, sono, motivação e
 * dores em poucos toques, com "pular". Com dor relevante, mostra as trocas do dia.
 */
export function PreWorkoutCheckin({
  onSubmit,
  onSkip,
  onContinue,
  adjustment,
  saving = false,
}: {
  onSubmit: (values: PreCheckinValues) => void
  onSkip: () => void
  onContinue: () => void
  adjustment?: PreCheckinAdjustment | null
  saving?: boolean
}) {
  const [values, setValues] = useState<PreCheckinValues>({ pains: [] })

  if (adjustment) {
    return (
      <div>
        <h2 className="t-title">Treino de hoje ajustado</h2>
        <p className="t-body dim" style={{ marginTop: 6 }}>
          {adjustment.reason}
        </p>
        {adjustment.changes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <AdjustmentChangesList changes={adjustment.changes} />
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <Button kind="primary" size="lg" block onClick={onContinue}>
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  const set = (patch: Partial<PreCheckinValues>) => setValues(v => ({ ...v, ...patch }))
  return (
    <div>
      <h2 className="t-title">Antes de começar</h2>
      <ScaleRow label="Energia" max={5} value={values.energy} onChange={energy => set({ energy })} low="sem energia" high="cheio de energia" />
      <ScaleRow label="Sono" max={5} value={values.sleep} onChange={sleep => set({ sleep })} low="dormi mal" high="dormi bem" />
      <ScaleRow label="Motivação" max={5} value={values.motivation} onChange={motivation => set({ motivation })} low="nenhuma" high="muita" />
      <PainPicker value={values.pains} onChange={pains => set({ pains })} />
      <div style={{ display: 'grid', gap: 8, marginTop: 20 }}>
        <Button kind="primary" size="lg" block loading={saving} onClick={() => onSubmit(values)}>
          Começar treino
        </Button>
        <Button kind="ghost" block disabled={saving} onClick={onSkip}>
          Pular
        </Button>
      </div>
    </div>
  )
}
