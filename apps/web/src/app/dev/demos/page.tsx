import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DemoCard } from '@/components/workout/DemoCard'
import { coverageLines, filterGallery, galleryItems, KIND_LABEL, parsePhase, type GalleryParams } from '@/lib/demo-gallery'

/**
 * Galeria de demonstrações (028, FR-024). Só fora de produção, sem link em nenhum menu.
 * Parâmetros de captura: `?ids=a,b&phase=0.5&frame=1`; com `card=1`, o cartão traz início, meio e fim.
 */
export default function DevDemosPage({ searchParams }: { searchParams: GalleryParams }) {
  if (process.env.NODE_ENV === 'production') notFound()

  const all = galleryItems()
  const items = filterGallery(all, searchParams)
  const phase = parsePhase(searchParams.phase)

  if (searchParams.frame === '1') {
    return (
      // Fixo e por cima da Dev Bar: a captura mostra só o cartão.
      <div data-frame style={{ position: 'fixed', top: 0, left: 0, zIndex: 'var(--z-dialog)', width: '390px', height: '844px', overflow: 'hidden', padding: 12, background: 'var(--bg)' }}>
        {items.slice(0, 1).map((item) => <DemoCard key={item.id} item={item} phase={phase} review={searchParams.card === '1'} />)}
      </div>
    )
  }

  return (
    <main className="hx-page" style={{ padding: 16 }}>
      <h1 className="t-title">Demonstrações</h1>
      <p className="t-secondary">
        {coverageLines(all).map((line) => <span key={line} style={{ marginRight: 12 }}>{line}</span>)}
      </p>
      <nav aria-label="Filtros" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
        <Link href="/dev/demos">Todos</Link>
        {Object.entries(KIND_LABEL).map(([kind, label]) => <Link key={kind} href={`/dev/demos?kind=${kind}`}>{label}</Link>)}
        <Link href="/dev/demos?pending=1">Pendentes</Link>
      </nav>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {items.map((item) => <DemoCard key={item.id} item={item} phase={phase} />)}
      </div>
    </main>
  )
}
