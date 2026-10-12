type Option<T extends string> = T | { value: T; label: string }

/**
 * Seletor segmentado neutro (`.hx-seg`): grupo com `aria-pressed`, ou abas
 * (`tabs`) com `role="tab"` e `aria-selected`.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  tabs = false,
  disabled = false,
}: {
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
  label: string
  tabs?: boolean
  disabled?: boolean
}) {
  return (
    <div className={tabs ? 'hx-seg hx-seg--tabs' : 'hx-seg'} role={tabs ? 'tablist' : 'group'} aria-label={label}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        const selected = v === value
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            role={tabs ? 'tab' : undefined}
            {...(tabs ? { 'aria-selected': selected } : { 'aria-pressed': selected })}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}
