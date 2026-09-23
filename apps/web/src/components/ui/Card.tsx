import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  padding?: number | string
  as?: 'div' | 'section' | 'article'
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLElement>, 'style' | 'children'>

/** Cartão padrão do tema: superfície, borda fina e raio de cartão. */
export function Card({ children, padding = 16, as: Tag = 'div', style, ...rest }: CardProps) {
  return (
    <Tag
      {...rest}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
