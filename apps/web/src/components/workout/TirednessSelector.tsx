'use client'

import { useState } from 'react'
import type { ExerciseAdjustmentChange, TirednessAssessment, TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS } from '@helux/workouts'
import { TirednessLevelPicker } from '@/components/workout/TirednessLevelPicker'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'

interface TirednessSelectorProps {
  assessment: TirednessAssessment
  changes: ExerciseAdjustmentChange[]
  reason?: string
  onChoose: (level: TirednessLevel) => void
  disabled?: boolean
  error?: string | null
}

function originText(a: TirednessAssessment): string {
  if (a.source === 'automatic') return `Indicado pelo relógio (HRV ${a.automaticHrv} ms)`
  if (a.source === 'manual') {
    if (a.overrideAutomatic && a.automaticLevel) {
      return `Escolhido por você (relógio indica "${TIREDNESS_LABELS[a.automaticLevel]}")`
    }
    return 'Informado por você'
  }
  return 'Não informado'
}

export function TirednessSelector({ assessment, changes, reason, onChoose, disabled, error }: TirednessSelectorProps) {
  const [showChanges, setShowChanges] = useState(false)
  const discordNote =
    assessment.source === 'automatic' && assessment.conflict && assessment.manualLevel && assessment.automaticLevel
      ? `Você marcou "${TIREDNESS_LABELS[assessment.manualLevel]}", mas o relógio indica "${TIREDNESS_LABELS[assessment.automaticLevel]}".`
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>Como você está hoje</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{originText(assessment)}</span>
      </div>
      <TirednessLevelPicker selected={assessment.effectiveLevel} onSelect={onChoose} disabled={disabled} />
      {discordNote && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>{discordNote}</p>}
      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--danger, #e5484d)' }}>{error}</p>}
      {changes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="flex items-center justify-between" style={{ gap: 8 }}>
            {reason && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{reason}</span>}
            <button
              type="button"
              onClick={() => setShowChanges((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {showChanges ? 'Ocultar mudanças' : `Ver o que mudou (${changes.length})`}
            </button>
          </div>
          {showChanges && <AdjustmentChangesList changes={changes} />}
        </div>
      )}
    </div>
  )
}
