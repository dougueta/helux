import type { PainReport } from '@helux/types'

export interface SessionCheckinsView {
  antes?: { energy: number | null; sleep: number | null; motivation: number | null; pains: PainReport[] }
  depois?: { rpe: number | null; feeling: number | null; pains: PainReport[] }
}

const INTENSITY = { 1: 'leve', 2: 'moderada', 3: 'forte' } as const

/** Sensações de antes e depois do treino no histórico (spec 024, FR-017). */
export function SessionFeelings({ checkins }: { checkins?: SessionCheckinsView }) {
  if (!checkins || (!checkins.antes && !checkins.depois)) return null
  const items: [string, number | null | undefined, number][] = [
    ['Energia', checkins.antes?.energy, 5],
    ['Sono', checkins.antes?.sleep, 5],
    ['Motivação', checkins.antes?.motivation, 5],
    ['Esforço', checkins.depois?.rpe, 10],
    ['Sensação', checkins.depois?.feeling, 5],
  ]
  const shown = items.filter(([, v]) => typeof v === 'number')
  const pains = [...(checkins.antes?.pains ?? []), ...(checkins.depois?.pains ?? [])]
  return (
    <section className="hx-plain" style={{ marginTop: 24, paddingTop: 16 }} aria-label="sensações">
      <h2 className="t-section">Como você se sentiu</h2>
      {shown.length > 0 && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px 16px', margin: '12px 0 0' }}>
          {shown.map(([label, value, max]) => (
            <div key={label}>
              <dt className="t-caption">{label}</dt>
              <dd className="n-md" style={{ margin: '2px 0 0' }}>
                {value}/{max}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {pains.length > 0 && (
        <p className="t-secondary" style={{ marginTop: 12 }}>
          Dor: {pains.map(p => `${p.region} · ${INTENSITY[p.intensity]}`).join(', ')}
        </p>
      )}
    </section>
  )
}
