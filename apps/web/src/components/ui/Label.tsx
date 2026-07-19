import type { ReactNode, CSSProperties } from 'react'

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-faint)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
