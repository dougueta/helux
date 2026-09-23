import { Skeleton } from '@/components/ui/Skeleton'
import { pageContainer } from '@/components/ui/layout'

const cardBlock = { border: '1px solid var(--hairline)' }

export default function Loading() {
  return (
    <div
      aria-busy="true"
      style={{ ...pageContainer, paddingTop: 24, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Skeleton width={192} height={24} radius="var(--r-sm)" />
      <Skeleton height={192} style={cardBlock} />
      <Skeleton height={48} style={cardBlock} />
    </div>
  )
}
