import type { EffortLevel } from '@helux/workouts'
import { Segmented } from '@/components/ui/Segmented'

const OPTIONS: { value: EffortLevel; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'limite', label: 'No limite' },
]

/** Esforço percebido do exercício em 1 toque (spec 014, FR-014). */
export function EffortPicker({ value, onChange }: { value: EffortLevel | null; onChange: (level: EffortLevel) => void }) {
  return <Segmented options={OPTIONS} value={value} onChange={onChange} label="Esforço percebido" />
}
