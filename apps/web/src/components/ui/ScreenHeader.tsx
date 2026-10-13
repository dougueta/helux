import type { ReactNode } from 'react'

/** Cabeçalho de tela: grade 44/1fr/44, título 15/500 centrado com elipse. */
export function ScreenHeader({
  title,
  sub,
  left,
  right,
}: {
  title: ReactNode
  sub?: ReactNode
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0,1fr) 44px',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px 8px',
      }}
    >
      <div>{left}</div>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <div className="t-body-m" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {sub && <div className="n-sm dim">{sub}</div>}
      </div>
      <div>{right}</div>
    </header>
  )
}
