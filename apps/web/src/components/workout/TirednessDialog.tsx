'use client'

import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ExerciseAdjustmentChange, TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS } from '@helux/workouts'
import { TirednessLevelPicker } from '@/components/workout/TirednessLevelPicker'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'
import type { ChangesBase, TirednessFlowMode, TirednessFlowStep } from '@/hooks/useTirednessFlow'

/** Acima do NavBar (`z-50`). */
export const TIREDNESS_DIALOG_Z_INDEX = 60

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

const buttonBase: CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: 'var(--r-pill)',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--font-space-grotesk)',
  cursor: 'pointer',
}

function SecondaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...buttonBase, background: 'transparent', border: '1px solid var(--hairline-2)', color: 'var(--text-dim)' }}
    >
      {children}
    </button>
  )
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...buttonBase, background: 'var(--accent)', border: 'none', color: 'var(--accent-ink)', opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  )
}

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text)',
  margin: 0,
  fontFamily: 'var(--font-space-grotesk)',
}

export function TirednessDialog(props: TirednessDialogProps) {
  const { open, mode, step, candidate, automaticLevel, changes, changesBase, saving, error } = props
  if (!open) return null

  const dismiss = step === 'question' ? props.onClose : step === 'conflict' ? props.onDeclineConflict : props.onCancelChanges

  let body: ReactNode
  if (step === 'question') {
    body = (
      <>
        <h2 style={titleStyle}>Como você está hoje?</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
          Seu treino de hoje se ajusta ao seu nível de cansaço.
        </p>
        <TirednessLevelPicker selected={candidate} onSelect={props.onSelectCandidate} disabled={saving} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SecondaryButton onClick={props.onClose} disabled={saving}>Fechar</SecondaryButton>
          <PrimaryButton onClick={props.onContinue} disabled={saving}>Continuar</PrimaryButton>
        </div>
      </>
    )
  } else if (step === 'conflict') {
    const auto = automaticLevel ? TIREDNESS_LABELS[automaticLevel] : ''
    body = (
      <>
        <h2 style={titleStyle}>{`Seu relógio indica "${auto}", mas você marcou "${TIREDNESS_LABELS[candidate]}"`}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
          Quer mesmo ajustar o treino de hoje pelo que você marcou?
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SecondaryButton onClick={props.onDeclineConflict}>Manter o relógio</SecondaryButton>
          <PrimaryButton onClick={props.onConfirmConflict}>Sim, ajustar</PrimaryButton>
        </div>
      </>
    )
  } else {
    body = (
      <>
        <h2 style={titleStyle}>{changesBase === 'planned' ? 'Seu treino de hoje está ajustado' : 'Seu treino vai mudar'}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
          {changesBase === 'planned' ? 'Em relação ao planejado:' : 'O que muda no treino de hoje:'}
        </p>
        <AdjustmentChangesList changes={changes} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SecondaryButton onClick={props.onCancelChanges} disabled={saving}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={props.onConfirmChanges} disabled={saving}>
            {mode === 'start' ? 'Aplicar e iniciar' : 'Aplicar'}
          </PrimaryButton>
        </div>
      </>
    )
  }

  // Portal em document.body + camada própria acima do NavBar (fixed, z-50), para
  // que o menu inferior nunca cubra os botões do diálogo (FR-017).
  return createPortal(
    <div
      data-testid="tiredness-dialog-backdrop"
      onClick={saving ? undefined : dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: TIREDNESS_DIALOG_Z_INDEX,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(4,6,4,.62)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '24px 20px calc(28px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--bg)',
          border: '1px solid var(--hairline-2)',
          borderBottom: 'none',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -20px 50px -12px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--surface-3)', margin: '-14px auto 4px' }} />
        {body}
        {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--danger, #e5484d)' }}>{error}</p>}
      </div>
    </div>,
    document.body,
  )
}
