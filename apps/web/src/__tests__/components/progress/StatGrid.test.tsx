import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatGrid } from '@/components/progress/StatGrid'

const stats = [
  { value: 3, label: 'esta semana', sub: 'treinos' },
  { value: 42, label: 'no total', sub: 'treinos' },
  { value: 6, label: 'sequência', sub: 'semanas ativas' },
  { value: 58, label: 'HRV', sub: 'recuperação' },
]

describe('StatGrid', () => {
  it('renders all 4 stat values and labels', () => {
    render(<StatGrid stats={stats} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('esta semana')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('no total')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('sequência')).toBeInTheDocument()
    expect(screen.getByText('58')).toBeInTheDocument()
    expect(screen.getByText('HRV')).toBeInTheDocument()
  })

  it('renders every sub label', () => {
    render(<StatGrid stats={stats} />)
    expect(screen.getAllByText('treinos')).toHaveLength(2)
    expect(screen.getByText('semanas ativas')).toBeInTheDocument()
    expect(screen.getByText('recuperação')).toBeInTheDocument()
  })

  it('renders a dash placeholder value as-is (e.g. missing HRV reading)', () => {
    render(<StatGrid stats={[{ value: '—', label: 'HRV', sub: 'sem dados' }]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
