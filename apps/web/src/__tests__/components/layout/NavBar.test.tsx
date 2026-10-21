import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let pathname = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

import { NavBar } from '@/components/layout/NavBar'

describe('NavBar (v2)', () => {
  beforeEach(() => {
    pathname = '/'
  })

  it('5 links: Hoje, Treinos, Nutrição, Check-in, Progresso (spec 018)', () => {
    render(<NavBar />)
    const nav = screen.getByRole('navigation', { name: 'principal' })
    expect(nav).toHaveClass('hx-nav')
    const links = screen.getAllByRole('link')
    expect(links.map(l => l.textContent)).toEqual(['Hoje', 'Treinos', 'Nutrição', 'Check-in', 'Progresso'])
    expect(links.map(l => l.getAttribute('href'))).toEqual(['/', '/treinos', '/nutricao', '/checkin', '/recovery'])
  })

  it('Nutrição fica atual em /nutricao', () => {
    pathname = '/nutricao'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: 'Nutrição' })).toHaveAttribute('aria-current', 'page')
  })

  it('aria-current="page" só no item da rota', () => {
    pathname = '/recovery'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: 'Progresso' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
  })

  it('subrotas marcam o item (checkin/history → Check-in; history → Progresso)', () => {
    pathname = '/checkin/history'
    const { unmount } = render(<NavBar />)
    expect(screen.getByRole('link', { name: 'Check-in' })).toHaveAttribute('aria-current', 'page')
    unmount()
    pathname = '/history/abc'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: 'Progresso' })).toHaveAttribute('aria-current', 'page')
  })

  it('Hoje só é atual na raiz', () => {
    pathname = '/treinos'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Treinos' })).toHaveAttribute('aria-current', 'page')
  })

  it.each(['/login', '/auth/callback', '/workout'])('oculto em %s', p => {
    pathname = p
    const { container } = render(<NavBar />)
    expect(container).toBeEmptyDOMElement()
  })
})
