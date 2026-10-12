'use client'

import { useState } from 'react'
import type { ExerciseAdjustmentChange, TirednessAssessment, TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS } from '@helux/workouts'
import { Button } from '@/components/ui/Button'
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

/** "Como você está hoje" da Home (spec 011) no visual v2 (FR-018). */
export function TirednessSelector({ assessment, changes, reason, onChoose, disabled, error }: TirednessSelectorProps) {
  const [showChanges, setShowChanges] = useState(false)
  const discordNote =
    assessment.source === 'automatic' && assessment.conflict && assessment.manualLevel && assessment.automaticLevel
      ? `Você marcou "${TIREDNESS_LABELS[assessment.manualLevel]}", mas o relógio indica "${TIREDNESS_LABELS[assessment.automaticLevel]}".`
      : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span className="t-body-m">Como você está hoje</span>
        <span className="t-caption" style={{ textAlign: 'right' }}>
          {originText(assessment)}
        </span>
      </div>
      <TirednessLevelPicker selected={assessment.effectiveLevel} onSelect={onChoose} disabled={disabled} />
      {discordNote && (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          {discordNote}
        </p>
      )}
      {error && (
        <p role="alert" className="t-secondary" style={{ marginTop: 8, color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      {changes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {reason && <span className="t-secondary">{reason}</span>}
            <Button
              kind="ghost"
              aria-expanded={showChanges}
              style={{ padding: '0 12px', fontSize: 14, whiteSpace: 'nowrap' }}
              onClick={() => setShowChanges(v => !v)}
            >
              {showChanges ? 'Ocultar mudanças' : `Ver o que mudou (${changes.length})`}
            </Button>
          </div>
          {showChanges && <AdjustmentChangesList changes={changes} />}
        </div>
      )}
    </div>
  )
}
