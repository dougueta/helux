import { Skeleton } from '@/components/ui/Skeleton'

/** Home carregando (FR-019): skeletons com a forma final da Home v2. */
export default function Loading() {
  return (
    <div className="hx-page" aria-busy="true" aria-label="carregando" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Skeleton w={84} h={20} />
        <Skeleton w={44} h={44} r={999} />
      </div>
      <Skeleton w={160} h={14} style={{ marginTop: 8 }} />
      <Skeleton w="70%" h={32} style={{ marginTop: 8 }} />

      <div className="hx-focus" style={{ marginTop: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton w={150} h={14} />
          <Skeleton w={80} h={12} />
        </div>
        <Skeleton w="85%" h={24} style={{ marginTop: 16 }} />
        <Skeleton w={90} h={14} style={{ marginTop: 12 }} />
        <Skeleton w="60%" h={12} style={{ marginTop: 18 }} />
        <Skeleton w="70%" h={12} style={{ marginTop: 8 }} />
        <Skeleton h={52} r={999} style={{ marginTop: 36 }} />
        <Skeleton h={56} r={999} style={{ marginTop: 16 }} />
      </div>

      <Skeleton w={120} h={18} style={{ marginTop: 28 }} />
      <Skeleton h={44} style={{ marginTop: 12 }} />
    </div>
  )
}
