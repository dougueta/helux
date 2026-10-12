import { Skeleton } from '@/components/ui/Skeleton'

/** Carregando de telas de formulário v2 (Check-in, histórico de check-ins, Perfil): título e campos. */
export function FormSkeleton() {
  return (
    <div className="hx-page" aria-busy="true" aria-label="carregando" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Skeleton w={80} h={14} style={{ marginTop: 20 }} />
      <Skeleton w={180} h={32} style={{ marginTop: 8 }} />
      <Skeleton w={160} h={18} style={{ marginTop: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 12 }}>
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} h={74} />
        ))}
      </div>
    </div>
  )
}
