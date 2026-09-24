import { Skeleton } from '@/components/ui/Skeleton'

/** DNA carregando: skeletons na forma da tela v2 (título, texto, fita e cards). */
export default function Loading() {
  return (
    <div
      className="hx-page"
      aria-busy="true"
      aria-label="carregando"
      style={{ paddingTop: 'calc(68px + env(safe-area-inset-top))' }}
    >
      <Skeleton w={150} h={32} />
      <Skeleton w="90%" h={14} style={{ marginTop: 12 }} />
      <Skeleton w="70%" h={14} style={{ marginTop: 8 }} />
      <Skeleton h={64} style={{ marginTop: 24 }} />
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} h={112} r="var(--r-md)" style={{ marginTop: i ? 8 : 28 }} />
      ))}
    </div>
  )
}
