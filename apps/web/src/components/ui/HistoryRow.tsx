import Link from 'next/link'
import { Icon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'

/** Linha de histórico plana: nome e data à esquerda, volume e séries/duração à direita. */
export function HistoryRow({
  href,
  name,
  date,
  sets,
  durationMin,
  volumeT,
}: {
  href: string
  name: string
  date: string
  sets: number
  durationMin: number | null
  volumeT: number
}) {
  return (
    <Link
      href={href}
      className="hx-row-btn"
      style={{ padding: '12px 0', background: 'none', borderTop: '1px solid var(--hairline)', minHeight: 64 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body-m">{name}</div>
        <div className="t-secondary">{date}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div>
          <span className="n-md">{formatNumber(volumeT, { decimals: 1 })}</span>
          <span className="u">t</span>
        </div>
        <div className="n-sm dim">
          {sets} séries{durationMin ? `, ${durationMin} min` : ''}
        </div>
      </div>
      <span className="faint">
        <Icon name="chev" size={18} />
      </span>
    </Link>
  )
}
