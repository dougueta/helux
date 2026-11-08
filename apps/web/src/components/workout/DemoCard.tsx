'use client'

import { keyPhases, type ResolvedDemo } from '@helux/exercises'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'
import { Banner } from '@/components/ui/Banner'
import { Tag } from '@/components/ui/Tag'
import { KIND_LABEL, type GalleryItem } from '@/lib/demo-gallery'

const FRAMES = [
  ['início', 'start'],
  ['meio', 'mid'],
  ['fim', 'end'],
] as const

/** Três quadros fixos (início, meio e fim), para o cartão de revisão. */
function ReviewFrames({ demo, name }: { demo: ResolvedDemo; name: string }) {
  const phases = keyPhases(demo)
  // A legenda vai uma vez, abaixo dos quadros; dentro de cada quadro ela espremeria o desenho.
  const { caption, ...frame } = demo
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
        {FRAMES.map(([label, key]) => (
          <figure key={key} style={{ margin: 0 }}>
            <div className="hx-stage" style={{ height: 150 }}>
              <ExerciseDemo demo={frame} playing={false} phase={phases[key]} label={`demonstração de ${name}, ${label}`} />
            </div>
            <figcaption className="t-caption" style={{ textAlign: 'center' }}>{label}</figcaption>
          </figure>
        ))}
      </div>
      {caption && (
        <p className="t-secondary" style={{ marginTop: 8, textAlign: 'center' }}>
          {caption}
        </p>
      )}
    </>
  )
}

/**
 * Cartão de revisão de um item: demonstração, situação e orientações (galeria e evidência do PR).
 * `review` troca a animação por três quadros fixos (início, meio e fim), para o `card.png`.
 */
export function DemoCard({ item, phase, review = false }: { item: GalleryItem; phase?: number; review?: boolean }) {
  const g = item.guidance
  return (
    <article className="hx-card" data-testid={`demo-card-${item.id}`} data-demo-id={item.id} style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tag kind="outline">{KIND_LABEL[item.kind]}</Tag>
        <Tag kind={item.pending ? 'warn' : 'default'}>{item.pending ? 'Pendente' : 'Aprovado'}</Tag>
      </div>
      <h2 className="t-heading" style={{ marginTop: 8 }}>{item.name}</h2>
      {review && item.demo ? (
        <ReviewFrames demo={item.demo} name={item.name} />
      ) : (
        <div className="hx-stage" style={{ height: 260, marginTop: 12 }}>
          {item.demo ? (
            <ExerciseDemo demo={item.demo} playing={phase === undefined} phase={phase} label={`demonstração de ${item.name}`} />
          ) : (
            <p className="t-secondary" style={{ padding: 16 }}>Sem demonstração</p>
          )}
        </div>
      )}
      {g && (
        <div style={{ marginTop: 12 }}>
          <h3 className="t-section">Posição inicial</h3>
          <ul className="t-body">{g.setup.map((s) => <li key={s}>{s}</li>)}</ul>
          <h3 className="t-section" style={{ marginTop: 8 }}>Execução</h3>
          <ol className="t-body">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          {g.commonError && (
            <div style={{ marginTop: 8 }}>
              <Banner kind="warn" title="Erro comum">{g.commonError}</Banner>
            </div>
          )}
          {g.context && <p className="t-secondary" style={{ marginTop: 8 }}>{g.context}</p>}
        </div>
      )}
    </article>
  )
}
