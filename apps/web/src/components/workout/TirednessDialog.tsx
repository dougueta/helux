'use client'

import type { ReactNode } from 'react'
import type { ExerciseAdjustmentChange, TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS } from '@helux/workouts'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TirednessLevelPicker } from '@/components/workout/TirednessLevelPicker'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'
import type { ChangesBase, TirednessFlowMode, TirednessFlowStep } from '@/hooks/useTirednessFlow'

export interface TirednessDialogProps {
  open: boolean
  mode: TirednessFlowMode
  step: TirednessFlowStep
  candidate: TirednessLevel
  automaticLevel: TirednessLevel | null
  changes: ExerciseAdjustmentChange[]
  changesBase: ChangesBase
  saving: boolean
  error: string | null
  onSelectCandidate: (level: TirednessLevel) => void
  onContinue: () => void
  onConfirmConflict: () => void
  onDeclineConflict: () => void
  onConfirmChanges: () => void
  onCancelChanges: () => void
  onClose: () => void
}

/**
 * Fluxo de cansaço da spec 011 numa `ui/Sheet` da v2: portal, scrim, Esc e a
 * camada acima do menu inferior vêm da escala de z-index da folha (research V8).
 */
export function TirednessDialog(props: TirednessDialogProps) {
  const { open, mode, step, candidate, automaticLevel, changes, changesBase, saving, error } = props

  const dismiss = step === 'question' ? props.onClose : step === 'conflict' ? props.onDeclineConflict : props.onCancelChanges

  let title: string
  let text: string
  let content: ReactNode = null
  let primary: { label: string; onClick: () => void }
  let secondary: { label: string; onClick: () => void }

  if (step === 'question') {
    title = 'Como você está hoje?'
    text = 'Seu treino de hoje se ajusta ao seu nível de cansaço.'
    content = <TirednessLevelPicker selected={candidate} onSelect={props.onSelectCandidate} disabled={saving} />
    primary = { label: 'Continuar', onClick: props.onContinue }
    secondary = { label: 'Fechar', onClick: props.onClose }
  } else if (step === 'conflict') {
    const auto = automaticLevel ? TIREDNESS_LABELS[automaticLevel] : ''
    title = `Seu relógio indica "${auto}", mas você marcou "${TIREDNESS_LABELS[candidate]}"`
    text = 'Quer mesmo ajustar o treino de hoje pelo que você marcou?'
    primary = { label: 'Sim, ajustar', onClick: props.onConfirmConflict }
    secondary = { label: 'Manter o relógio', onClick: props.onDeclineConflict }
  } else {
    title = changesBase === 'planned' ? 'Seu treino de hoje está ajustado' : 'Seu treino vai mudar'
    text = changesBase === 'planned' ? 'Em relação ao planejado:' : 'O que muda no treino de hoje:'
    content = <AdjustmentChangesList changes={changes} />
    primary = { label: mode === 'start' ? 'Aplicar e iniciar' : 'Aplicar', onClick: props.onConfirmChanges }
    secondary = { label: 'Cancelar', onClick: props.onCancelChanges }
  }

  return (
    <Sheet
      open={open}
      onClose={saving ? () => {} : dismiss}
      label={title}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button kind="primary" size="lg" block onClick={primary.onClick} disabled={saving}>
            {primary.label}
          </Button>
          <Button kind="ghost" block onClick={secondary.onClick} disabled={saving}>
            {secondary.label}
          </Button>
        </div>
      }
    >
      <h2 className="t-heading" style={{ marginTop: 8 }}>
        {title}
      </h2>
      <p className="t-secondary" style={{ marginTop: 6 }}>
        {text}
      </p>
      {content && <div style={{ marginTop: 16 }}>{content}</div>}
      {error && (
        <p role="alert" className="t-secondary" style={{ marginTop: 12, color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </Sheet>
  )
}
