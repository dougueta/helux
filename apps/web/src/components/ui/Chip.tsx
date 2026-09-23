import type { ReactNode, CSSProperties, HTMLAttributes } from 'react'

type ChipProps = {
  children: ReactNode
  accent?: boolean
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLSpanElement>, 'style' | 'children'>

export function Chip({ children, accent, style, ...rest }: ChipProps) {
  return (
    <span
      {...rest}
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
