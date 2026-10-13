'use client'

import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModal } from '@/components/ui/useModal'

/**
 * Folha inferior (`.hx-sheet`): superfície elevada acima do menu, com scrim,
 * alça, conteúdo rolável e rodapé fixo com área segura. Renderizada em portal.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(open, onClose, ref)
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="hx-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="hx-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className="hx-sheet-h" aria-hidden="true" />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 16px' }}>{children}</div>
        {footer && (
          <div style={{ padding: '12px 16px max(12px, var(--safe-b))', borderTop: '1px solid var(--hairline)' }}>
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}
