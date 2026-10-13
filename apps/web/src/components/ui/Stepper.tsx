import { Icon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'

const round1 = (n: number) => Math.round(n * 10) / 10

/** Stepper − valor + (`.hx-step`): kg ± 2,5, reps ± 1, mínimo 0. */
export function Stepper({
  value,
  unit,
  step,
  min = 0,
  onChange,
  label,
  disabled,
  error,
}: {
  value: number
  unit: string
  step: number
  min?: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
  error?: boolean
}) {
  return (
    <div className={error ? 'hx-step is-err' : 'hx-step'} role="group" aria-label={label}>
      <button type="button" aria-label={`diminuir ${label}`} disabled={disabled}
        onClick={() => onChange(Math.max(min, round1(value - step)))}>
        <Icon name="minus" size={20} />
      </button>
      <div className="hx-step-v" aria-live="polite">
        <span className="n-md" style={disabled ? { color: 'var(--text-disabled)' } : undefined}>{formatNumber(value)}</span>
        <small>{unit}</small>
      </div>
      <button type="button" aria-label={`aumentar ${label}`} disabled={disabled}
        onClick={() => onChange(round1(value + step))}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
