export function MatchBadge({ value, size = 'md' }: { value: number; size?: 'md' | 'sm' }) {
  const sm = size === 'sm'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 'var(--r-pill)',
        fontWeight: 600,
        color: 'var(--accent)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-line)',
        fontSize: sm ? 11 : 12,
        padding: sm ? '3px 7px' : '4px 9px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{value}</span>
      <span style={{ opacity: 0.7 }}>fit</span>
    </span>
  )
}
