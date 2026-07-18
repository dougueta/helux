import type { ReactNode, CSSProperties } from 'react'

export function Chip({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        fontSize: 11.5,
        fontWeight: 600,
        color: accent ? 'var(--accent-ink)' : 'var(--text-dim)',
        background: accent ? 'var(--accent)' : 'var(--surface-2)',
        border: accent ? '1px solid transparent' : '1px solid var(--hairline)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
