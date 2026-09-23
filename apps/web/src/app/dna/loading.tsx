import { Skeleton } from '@/components/ui/Skeleton'
import { pageContainer } from '@/components/ui/layout'

export default function Loading() {
  return (
    <div
      aria-busy="true"
      style={{ ...pageContainer, paddingTop: 24, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Skeleton w={144} h={24} r="var(--r-sm)" style={{ marginBottom: 12 }} />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} h={80} style={{ border: '1px solid var(--hairline)' }} />
      ))}
    </div>
  )
}
