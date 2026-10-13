import type { ReactNode } from 'react'

/** Cabeçalho de seção: `.t-section` + complemento `.t-caption` à direita. */
export function SectionHeader({
  title,
  aside,
  action,
  level = 2,
}: {
  title: ReactNode
  aside?: ReactNode
  action?: ReactNode
  level?: 2 | 3
}) {
  const H = level === 3 ? 'h3' : 'h2'
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <H className="t-section">{title}</H>
      {aside && <span className="t-caption" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{aside}</span>}
      {action}
    </div>
  )
}
