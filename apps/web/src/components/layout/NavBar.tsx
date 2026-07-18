'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICONS: Record<string, string> = {
  home:     'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  dna:      'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
  chart:    'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play:     'M7 4.5v15l13-7.5z',
  flame:    'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron:  'M9 6l6 6-6 6',
}

function Icon({ name, size = 22, stroke = 'currentColor', sw = 1.9 }: { name: keyof typeof ICONS; size?: number; stroke?: string; sw?: number }) {
  const solid = name === 'play'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={solid ? stroke : 'none'} stroke={solid ? 'none' : stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const tabs = [
  { href: '/', label: 'Hoje', icon: 'home' as const },
  { href: '/treinos', label: 'Treinos', icon: 'dumbbell' as const },
  { href: '/dna', label: 'DNA', icon: 'dna' as const },
  { href: '/recovery', label: 'Progresso', icon: 'chart' as const },
]

export function NavBar() {
  const pathname = usePathname()
  if (pathname === '/login' || pathname.startsWith('/auth') || pathname === '/workout') return null

  return (
    <nav style={{ background: 'rgba(22,25,22,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--hairline)' }}
      className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex max-w-lg mx-auto pb-safe">
        {tabs.map(tab => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center py-3 gap-1 min-h-[56px] justify-center transition-colors"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-faint)' }}>
              <Icon name={tab.icon} size={22} stroke="currentColor" />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', fontFamily: 'var(--font-space-grotesk)' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
