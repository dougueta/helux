'use client'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

/** Confirmação de finalizar com exercícios pulados (spec 009), no diálogo da v2. */
export function FinishWorkoutConfirmDialog({
  skippedNames,
  onConfirm,
  onCancel,
}: {
  skippedNames: string[]
  onConfirm: () => void
  onCancel: () => void
}) {
  if (skippedNames.length === 0) return null

  return (
    <Dialog
      open
      role="alertdialog"
      onClose={onCancel}
      title={
        skippedNames.length === 1
          ? '1 exercício será salvo como pulado'
          : `${skippedNames.length} exercícios serão salvos como pulados`
      }
      actions={
        <>
          <Button kind="danger" size="lg" block onClick={onConfirm}>
            Finalizar mesmo assim
          </Button>
          <Button kind="ghost" size="lg" block onClick={onCancel}>
            Continuar treinando
          </Button>
        </>
      }
    >
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {skippedNames.map(name => (
          <li key={name} style={{ color: 'var(--text)' }}>
            {name}
          </li>
        ))}
      </ul>
      <p className="t-secondary" style={{ marginTop: 12 }}>
        Confirma finalizar o treino mesmo assim?
      </p>
    </Dialog>
  )
}
