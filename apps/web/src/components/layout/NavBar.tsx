'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/icons'

const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/', label: 'Hoje', icon: 'home', match: [] },
  { href: '/treinos', label: 'Treinos', icon: 'dumbbell', match: ['/treinos'] },
  { href: '/checkin', label: 'Check-in', icon: 'checkin', match: ['/checkin'] },
  // Histórico faz parte de Progresso na v2 (research V9).
  { href: '/recovery', label: 'Progresso', icon: 'chart', match: ['/recovery', '/history'] },
]

function isActive(tab: (typeof TABS)[number], pathname: string) {
  if (tab.href === '/') return pathname === '/'
  return tab.match.some(m => pathname === m || pathname.startsWith(`${m}/`))
}

/** Menu inferior da v2 (`.hx-nav`, research V8). Oculto no login, auth e treino ativo/conclusão. */
export function NavBar() {
  const pathname = usePathname()
  if (pathname === '/login' || pathname.startsWith('/auth') || pathname === '/workout') return null

  return (
    <nav className="hx-nav" aria-label="principal">
      {TABS.map(tab => (
        <Link key={tab.href} href={tab.href} aria-current={isActive(tab, pathname) ? 'page' : undefined}>
          <Icon name={tab.icon} size={22} />
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
