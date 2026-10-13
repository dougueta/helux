import type { CSSProperties, ReactNode } from 'react'

interface ShellProps {
  children: ReactNode
  style?: CSSProperties
}

/**
 * Página com menu inferior: coluna de 512 px (`.hx-page`), área segura no topo
 * e espaço para o menu embaixo. As páginas não somam mais um recuo próprio no
 * topo (achado 9 da Parte 1: 48 + 48).
 */
export function Shell({ children, style }: ShellProps) {
  return (
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120, ...style }}>
      {children}
    </div>
  )
}
