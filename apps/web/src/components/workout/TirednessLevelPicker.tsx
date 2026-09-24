import type { TirednessLevel } from '@helux/types'
import { TIREDNESS_LABELS, TIREDNESS_LEVELS } from '@helux/workouts'
import { Segmented } from '@/components/ui/Segmented'

interface TirednessLevelPickerProps {
  selected: TirednessLevel | null
  onSelect: (level: TirednessLevel) => void
  disabled?: boolean
}

const OPTIONS = TIREDNESS_LEVELS.map(level => ({ value: level, label: TIREDNESS_LABELS[level] }))

/** Os 4 níveis no seletor segmentado neutro da v2 (FR-018), compartilhado pela Home e pela pergunta ao iniciar. */
export function TirednessLevelPicker({ selected, onSelect, disabled }: TirednessLevelPickerProps) {
  return (
    <Segmented
      label="como você está hoje"
      options={OPTIONS}
      value={selected}
      onChange={onSelect}
      disabled={disabled}
    />
  )
}
