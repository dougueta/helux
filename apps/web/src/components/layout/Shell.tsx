import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icons'

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
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120, position: 'relative', ...style }}>
      {/* Spec 022: acesso à Equipe Helux em qualquer tela com menu (sem aba nova na barra). */}
      <Link href="/equipe" className="hx-icbtn" aria-label="Equipe Helux" style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 16 }}>
        <Icon name="heart" size={20} />
      </Link>
      {children}
    </div>
  )
}
