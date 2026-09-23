'use client'

import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModal } from '@/components/ui/useModal'

/**
 * Diálogo centrado (`.hx-dialog`), só para confirmar algo que perde dados.
 * Ações empilhadas: destrutiva em cima, "Continuar" ghost embaixo.
 */
export function Dialog({
  open,
  onClose,
  title,
  actions,
  children,
  role = 'dialog',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  actions: ReactNode
  children?: ReactNode
  role?: 'dialog' | 'alertdialog'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const bodyId = useId()
  useModal(open, onClose, ref)
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="hx-scrim hx-scrim--dialog" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className="hx-dialog"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
      >
        <h2 id={titleId} className="t-heading">{title}</h2>
        {children && (
          <div id={bodyId} className="t-body dim" style={{ marginTop: 8 }}>
            {children}
          </div>
        )}
        {actions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>{actions}</div>
        )}
      </div>
    </>,
    document.body,
  )
}
