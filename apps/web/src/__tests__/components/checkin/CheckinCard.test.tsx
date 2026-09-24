import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckinCard } from '@/components/checkin/CheckinCard'
import type { BodyCheckin } from '@helux/types'

const checkin1: BodyCheckin = {
  id: '1', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1,
  squat_kg: 120, bench_kg: 90, created_at: '2026-06-01T00:00:00Z',
}
const checkin2: BodyCheckin = {
  id: '2', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0,
  squat_kg: 115, bench_kg: 90, created_at: '2026-05-01T00:00:00Z',
}

describe('CheckinCard (v2: "Último check-in", spec 012 T053)', () => {
  it('renders nothing when no checkins', () => {
    const { container } = render(<CheckinCard checkins={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the section header with the latest month in pt-BR', () => {
    render(<CheckinCard checkins={[checkin1, checkin2]} />)
    expect(screen.getByRole('heading', { name: 'Último check-in' })).toBeInTheDocument()
    expect(screen.getByText('jun. 2026')).toBeInTheDocument()
  })

  it('shows the 2x2 grid with mono numbers in pt-BR and units', () => {
    render(<CheckinCard checkins={[checkin1]} />)
    const value = (term: string) => screen.getByText(term).nextElementSibling!
    expect(value('Peso')).toHaveTextContent('82,2kg')
    expect(value('Peso')).toHaveClass('n-md')
    expect(value('Gordura')).toHaveTextContent('18,1%')
    expect(value('Agachamento')).toHaveTextContent('120kg')
    expect(value('Supino')).toHaveTextContent('90kg')
  })

  it('hides the fields that are not filled (no invented data)', () => {
    const withNulls = {
      id: '3', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: null,
      squat_kg: null, bench_kg: null, created_at: '2026-06-01T00:00:00Z',
    } as unknown as BodyCheckin
    render(<CheckinCard checkins={[withNulls]} />)
    expect(screen.getByText('Peso')).toBeInTheDocument()
    expect(screen.queryByText('Gordura')).not.toBeInTheDocument()
    expect(screen.queryByText('Supino')).not.toBeInTheDocument()
  })

  it('renders the actions passed as children', () => {
    render(<CheckinCard checkins={[checkin1]}><button>Novo check-in</button></CheckinCard>)
    expect(screen.getByRole('button', { name: 'Novo check-in' })).toBeInTheDocument()
  })
})
