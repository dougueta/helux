import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DemoCard } from '@/components/workout/DemoCard'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'
import { blindDraw, coverageLines, filterGallery, galleryItems, KIND_LABEL, parsePhase, parseSeed, type GalleryParams } from '@/lib/demo-gallery'

/**
 * Galeria de demonstrações (028, FR-024). Só fora de produção, sem link em nenhum menu.
 * Parâmetros de captura: `?ids=a,b&phase=0.5&frame=1`; com `card=1`, o cartão traz início, meio e fim.
 * Teste às cegas (SC-006): `?blind=1&seed=7` sorteia 20 aprovados sem o nome; `&answers=1` mostra o gabarito.
 */
export default function DevDemosPage({ searchParams }: { searchParams: GalleryParams }) {
  if (process.env.NODE_ENV === 'production') notFound()

  const all = galleryItems()

  if (searchParams.blind === '1') {
    const seed = parseSeed(searchParams.seed)
    const drawn = blindDraw(all, seed)
    return (
      <main className="hx-page" style={{ padding: 16 }}>
        <h1 className="t-title">Teste às cegas</h1>
        <p className="t-secondary">
          Sorteio {seed}: anote, para cada número, o exercício ou o grupo de variações. Depois abra o gabarito.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', marginTop: 12 }}>
          {drawn.map((item, i) => (
            <article key={item.id} className="hx-card" data-blind-item style={{ padding: 16 }}>
              <h2 className="t-heading">Demonstração {i + 1}</h2>
              <div className="hx-stage" style={{ height: 260, marginTop: 12 }}>
                <ExerciseDemo demo={item.demo!} playing label={`demonstração ${i + 1}`} />
              </div>
            </article>
          ))}
        </div>
        {searchParams.answers === '1' ? (
          <section aria-label="Gabarito" style={{ marginTop: 24 }}>
            <h2 className="t-heading">Gabarito</h2>
            <ol>
              {drawn.map((item) => <li key={item.id}>{item.name}</li>)}
            </ol>
          </section>
        ) : (
          <p style={{ marginTop: 24 }}>
            <Link href={`/dev/demos?blind=1&seed=${seed}&answers=1`}>Ver gabarito</Link>
          </p>
        )}
      </main>
    )
  }
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
