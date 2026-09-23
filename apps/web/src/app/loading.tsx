import { Skeleton } from '@/components/ui/Skeleton'
import { pageContainer } from '@/components/ui/layout'

const cardBlock = { border: '1px solid var(--hairline)' }

export default function Loading() {
  return (
    <div
      aria-busy="true"
      style={{ ...pageContainer, paddingTop: 24, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Skeleton w={192} h={24} r="var(--r-sm)" />
      <Skeleton h={192} style={cardBlock} />
      <Skeleton h={48} style={cardBlock} />
    </div>
  )
}
