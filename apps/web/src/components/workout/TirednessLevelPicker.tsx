import type { TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS, TIREDNESS_LEVELS } from '@helux/workouts'

interface TirednessLevelPickerProps {
  selected: TirednessLevel | null
  onSelect: (level: TirednessLevel) => void
  disabled?: boolean
}

/** Grupo de 4 botões de nível, compartilhado pela Home e pela pergunta ao iniciar. */
export function TirednessLevelPicker({ selected, onSelect, disabled }: TirednessLevelPickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {TIREDNESS_LEVELS.map((level) => {
        const active = level === selected
        return (
          <button
            key={level}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(level)}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--r-pill)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: disabled ? 'default' : 'pointer',
              color: active ? 'var(--accent-ink)' : 'var(--text-dim)',
              background: active ? 'var(--accent)' : 'var(--surface-2)',
              border: active ? '1px solid transparent' : '1px solid var(--hairline)',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {TIREDNESS_LABELS[level]}
          </button>
        )
      })}
    </div>
  )
}
