import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'

describe('ScreenHeader', () => {
  it('grade 44/1fr/44 com título em elipse, subtítulo e laterais', () => {
    const { container } = render(
      <ScreenHeader title="Agachamento Livre" sub="1/23 séries" left={<button>L</button>} right={<button>R</button>} />,
    )
    const header = container.querySelector('header')!
    expect(header.style.gridTemplateColumns).toBe('44px minmax(0,1fr) 44px')
    const title = screen.getByText('Agachamento Livre')
    expect(title).toHaveClass('t-body-m')
    expect(title.style.textOverflow).toBe('ellipsis')
    expect(screen.getByText('1/23 séries')).toHaveClass('n-sm', 'dim')
    expect(screen.getByRole('button', { name: 'L' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'R' })).toBeInTheDocument()
  })
})

describe('SectionHeader', () => {
  it('título .t-section e complemento .t-caption', () => {
    render(<SectionHeader title="Séries" aside="kg × reps" />)
    expect(screen.getByRole('heading', { name: 'Séries' })).toHaveClass('t-section')
    expect(screen.getByText('kg × reps')).toHaveClass('t-caption')
  })

  it('nível de título configurável e ação', () => {
    render(<SectionHeader title="Histórico" level={3} action={<a href="/history">Ver todos</a>} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todos' })).toBeInTheDocument()
  })
})
