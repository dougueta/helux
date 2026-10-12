import type { MouseEvent } from 'react'
import { Icon } from '@/components/ui/icons'

const CLS = {
  off: 'hx-chk',
  on: 'hx-chk is-on',
  pop: 'hx-chk is-on is-pop',
} as const

/** ✓ da série (`.hx-chk`): 44 px; 52 px na série atual (pela classe `.hx-cur-row`). */
export function Check({
  on,
  pop,
  big,
  onClick,
  label = 'concluir série',
}: {
  on: boolean
  pop?: boolean
  big?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  label?: string
}) {
  return (
    <button type="button" className={on ? (pop ? CLS.pop : CLS.on) : CLS.off} aria-pressed={on} aria-label={label} onClick={onClick}>
      <Icon name="check" size={big ? 24 : 20} sw={on ? 2.6 : 1.9} />
    </button>
  )
}
