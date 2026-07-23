import { Chip } from '@/components/ui/Chip'
import { Icon } from '@/components/ui/icons'

export function RecoveryAdjustedBadge({ reason }: { reason?: string }) {
  if (!reason) return null

  return (
    <span title={reason}>
      <Chip accent>
        <Icon name="bolt" size={12} stroke="var(--accent-ink)" />
        Ajustado pelo recovery de hoje
      </Chip>
    </span>
  )
}
