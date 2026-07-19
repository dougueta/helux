import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchBadge } from '@/components/ui/MatchBadge'
import { Chip } from '@/components/ui/Chip'
import { Label } from '@/components/ui/Label'

describe('MatchBadge', () => {
  it('renders the fit value and "fit" suffix', () => {
    render(<MatchBadge value={94} />)
    expect(screen.getByText('94')).toBeInTheDocument()
    expect(screen.getByText('fit')).toBeInTheDocument()
  })
})

describe('Chip', () => {
  it('renders children', () => {
    render(<Chip>Peito</Chip>)
    expect(screen.getByText('Peito')).toBeInTheDocument()
  })

  it('uses accent background when accent is true', () => {
    render(<Chip accent>Hoje</Chip>)
    expect(screen.getByText('Hoje')).toHaveStyle({ background: 'var(--accent)' })
  })
})

describe('Label', () => {
  it('renders uppercase label text', () => {
    render(<Label>Treino de hoje</Label>)
    expect(screen.getByText('Treino de hoje')).toHaveStyle({ textTransform: 'uppercase' })
  })
})
