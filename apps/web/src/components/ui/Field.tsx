'use client'

import { useId, type InputHTMLAttributes } from 'react'

const INPUT_CLS = {
  base: 'hx-input',
  err: 'hx-input is-err',
  dis: 'hx-input is-dis',
} as const

/** Campo numérico da v2 (`.hx-field`): mono, `inputMode="decimal"`, unidade fixa. */
export function Field({
  label,
  value,
  onChange,
  unit,
  help,
  error,
  disabled,
  placeholder,
  inputProps,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  unit?: string
  help?: string
  error?: string | null
  disabled?: boolean
  placeholder?: string
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'value' | 'onChange' | 'id'>
}) {
  const id = useId()
  const msgId = `${id}-msg`
  const message = error || help
  return (
    <div className="hx-field">
      <label htmlFor={id}>{label}</label>
      <div className={error ? INPUT_CLS.err : disabled ? INPUT_CLS.dis : INPUT_CLS.base}>
        <input
          id={id}
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={message ? msgId : undefined}
          onChange={e => onChange(e.target.value)}
          {...inputProps}
        />
        {unit && <span className="u">{unit}</span>}
      </div>
      {message && (
        <div id={msgId} className={error ? 'hx-field-help is-err' : 'hx-field-help'}>
          {message}
        </div>
      )}
    </div>
  )
}
