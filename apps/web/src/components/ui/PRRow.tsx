import { formatNumber } from '@/lib/format'

/** Recorde pessoal (plano). O delta só ganha acento quando é recorde recém-batido (`fresh`). */
export function PRRow({
  lift,
  kg,
  reps,
  when,
  delta,
  fresh,
}: {
  lift: string
  kg: number
  reps?: number | null
  when?: string | null
  delta?: string | null
  fresh?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: '2px 12px',
        padding: '14px 0',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div className="t-body-m">{lift}</div>
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span className="n-md">
          {formatNumber(kg)}
          <span className="u">kg</span>
        </span>
        {reps != null && <span className="n-md dim" style={{ fontWeight: 500 }}> {`× ${reps}`}</span>}
      </div>
      <div className="t-secondary">{when ?? ''}</div>
      <div className="n-sm" style={{ textAlign: 'right', color: fresh ? 'var(--accent)' : 'var(--text-dim)' }}>
        {delta ?? ''}
      </div>
    </div>
  )
}
