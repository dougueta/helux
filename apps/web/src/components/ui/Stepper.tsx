'use client'

import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'
import { parseStepperInput, roundTo } from '@/lib/stepperInput'

/** Número cru para edição: vírgula decimal, sem separador de milhar nem arredondamento. */
function editText(n: number): string {
  return String(n).replace('.', ',')
}

/**
 * Stepper − valor + (`.hx-step`): kg ± 2,5 com até 2 casas, reps ± 1 inteiras.
 * O valor também é digitável (spec 026): cada texto válido já vai para `onChange`,
 * para que concluir a série sem sair do campo salve o valor digitado (revisão do PR #20).
 * Blur/Enter encerram a edição; Escape volta ao valor de antes dela.
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
  // Só as mudanças dos botões são anunciadas; a digitação não.
  const [announcement, setAnnouncement] = useState('')
  const [prevValue, setPrevValue] = useState(value)
  const before = useRef(value)
  const emitted = useRef<number | null>(null)

  // `value` mudou de fora durante a edição (troca de variante, avanço da série): o rascunho segue o novo valor.
  if (value !== prevValue) {
    setPrevValue(value)
    if (draft !== null && value !== emitted.current) {
      setDraft(editText(value))
      before.current = value
    }
  }

  function emit(next: number) {
    if (next === value) return
    emitted.current = next
    onChange(next)
  }

  function stepBy(delta: number) {
    const next = Math.min(max, Math.max(min, roundTo(value + delta, decimals)))
    setDraft(null)
    setAnnouncement(`${formatNumber(next)} ${unit}`)
    emit(next)
  }

  return (
    <div className={error ? 'hx-step is-err' : 'hx-step'} role="group" aria-label={label}>
      <button type="button" aria-label={`diminuir ${label}`} disabled={disabled} onClick={() => stepBy(-step)}>
        <Icon name="minus" size={20} />
      </button>
      <div className="hx-step-v">
        <input
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          aria-label={label}
          className="n-md"
          disabled={disabled}
          value={draft ?? formatNumber(value)}
          onFocus={e => {
            before.current = value
            emitted.current = null
            setDraft(editText(value))
            e.currentTarget.select()
          }}
          onChange={e => {
            setDraft(e.target.value)
            const next = parseStepperInput(e.target.value, { min, max, decimals })
            if (next !== null) emit(next)
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              if (value !== before.current) emit(before.current)
              e.currentTarget.blur()
            }
          }}
        />
        <small>{unit}</small>
      </div>
      <span className="sr" aria-live="polite">{announcement}</span>
      <button type="button" aria-label={`aumentar ${label}`} disabled={disabled} onClick={() => stepBy(step)}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
