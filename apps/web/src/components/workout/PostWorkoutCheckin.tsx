'use client'

import { useState } from 'react'
import type { PainReport } from '@helux/types'
import { Button } from '@/components/ui/Button'
import { PainPicker, ScaleRow } from '@/components/workout/CheckinFields'

export interface PostCheckinValues {
  rpe?: number
  feeling?: number
  pains: PainReport[]
}

/** Check-in de depois do treino (spec 024, FR-017): esforço percebido, sensação e dores, com "pular". */
export function PostWorkoutCheckin({ onSubmit, onSkip, saving = false }: { onSubmit: (values: PostCheckinValues) => void; onSkip: () => void; saving?: boolean }) {
  const [values, setValues] = useState<PostCheckinValues>({ pains: [] })
  const set = (patch: Partial<PostCheckinValues>) => setValues(v => ({ ...v, ...patch }))
  return (
    <div>
      <h2 className="t-title">Como foi o treino?</h2>
      <ScaleRow label="Esforço" max={10} value={values.rpe} onChange={rpe => set({ rpe })} low="muito leve" high="máximo" />
      <ScaleRow label="Sensação" max={5} value={values.feeling} onChange={feeling => set({ feeling })} low="péssima" high="ótima" />
      <PainPicker value={values.pains} onChange={pains => set({ pains })} />
      <div style={{ display: 'grid', gap: 8, marginTop: 20 }}>
        <Button kind="primary" size="lg" block loading={saving} onClick={() => onSubmit(values)}>
          Salvar e concluir
        </Button>
        <Button kind="ghost" block disabled={saving} onClick={onSkip}>
          Pular e concluir
        </Button>
      </div>
    </div>
  )
}
