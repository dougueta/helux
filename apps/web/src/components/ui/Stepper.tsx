'use client'

import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'
import { parseStepperInput, roundTo } from '@/lib/stepperInput'

/**
 * Stepper − valor + (`.hx-step`): kg ± 2,5 com até 2 casas, reps ± 1 inteiras.
 * O valor também é digitável (spec 026): confirma no blur/Enter, Escape descarta.
 */
export function Stepper({
  value,
  unit,
  step,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  decimals = 2,
  onChange,
  label,
  disabled,
  error,
}: {
  value: number
  unit: string
  step: number
  min?: number
  max?: number
  decimals?: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
  error?: boolean
}) {
  // Rascunho só enquanto o campo está em edição; fora dele mostra o valor da prop.
  const [draft, setDraft] = useState<string | null>(null)
  const cancelled = useRef(false)

  function commit() {
    if (cancelled.current) {
      cancelled.current = false
      setDraft(null)
      return
    }
    if (draft === null) return
    const next = parseStepperInput(draft, { min, max, decimals })
    setDraft(null)
    if (next !== null && next !== value) onChange(next)
  }

  return (
    <div className={error ? 'hx-step is-err' : 'hx-step'} role="group" aria-label={label}>
      <button type="button" aria-label={`diminuir ${label}`} disabled={disabled}
        onClick={() => onChange(Math.max(min, roundTo(value - step, decimals)))}>
        <Icon name="minus" size={20} />
      </button>
      <div className="hx-step-v" aria-live="polite">
        <input
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          aria-label={label}
          className="n-md"
          disabled={disabled}
          value={draft ?? formatNumber(value)}
          onFocus={e => {
            setDraft(formatNumber(value))
            e.currentTarget.select()
          }}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              // O blur que segue não deve confirmar o rascunho descartado.
              cancelled.current = true
              e.currentTarget.blur()
            }
          }}
        />
        <small>{unit}</small>
      </div>
      <button type="button" aria-label={`aumentar ${label}`} disabled={disabled}
        onClick={() => onChange(Math.min(max, roundTo(value + step, decimals)))}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
