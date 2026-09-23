import type { CSSProperties } from 'react'

/** Bloco de carregamento com a animação de pulso do tema (`helux-pulse`, em globals.css). */
export function Skeleton({
  width = '100%',
  height,
  radius = 'var(--r-card)',
  style,
}: {
  width?: number | string
  height: number | string
  radius?: string
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--surface-1)',
        animation: 'helux-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style,
      }}
    />
  )
}
