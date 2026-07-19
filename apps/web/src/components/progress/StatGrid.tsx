export interface StatGridItem {
  value: string | number
  label: string
  sub: string
}

interface StatGridProps {
  stats: StatGridItem[]
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
      {stats.map((s, i) => (
        <div
          key={`${s.label}-${i}`}
          style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}
        >
          <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.03em', fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
            {s.value}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'var(--text)' }}>{s.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
