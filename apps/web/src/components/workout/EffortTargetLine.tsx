'use client'

import { useId, useState } from 'react'
import { effortTarget } from '@helux/workouts'

/**
 * Esforço-alvo do exercício em linguagem simples (spec 027, FR-001/FR-002/FR-006).
 * Na sessão (`explainable`), um toque abre a explicação de como sentir o esforço (FR-003).
 */
export function EffortTargetLine({
  rir,
  deload,
  explainable = false,
}: {
  rir: number | undefined
  deload?: boolean
  explainable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const target = effortTarget(rir)
  if (!target) return null

  const text = `${deload ? 'Semana de descarga · ' : ''}Esforço-alvo: ${target.label} · ${target.remaining}`
  if (!explainable) return <span className="t-secondary">{text}</span>

  return (
    <>
      <button
        type="button"
        className="t-secondary"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'block',
          minHeight: 44,
          padding: 0,
          border: 0,
          background: 'none',
          color: 'var(--text)',
          font: 'inherit',
          textAlign: 'left',
          textDecoration: 'underline dotted',
          textUnderlineOffset: 3,
          cursor: 'pointer',
        }}
      >
        {text}
      </button>
      {open && (
        <p id={id} className="t-secondary" style={{ marginTop: 2 }}>
          {target.explanation}
        </p>
      )}
    </>
  )
}
