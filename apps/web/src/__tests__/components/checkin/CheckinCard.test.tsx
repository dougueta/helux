import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CheckinCard } from '@/components/checkin/CheckinCard'

// Spec 029 (US5): cartão da Home — peso de tendência, variação, % efetivo com
// origem, cargas do último registro e lembrete de medidas.

vi.mock('@/lib/dates', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return { ...actual, todayLocal: () => '2026-11-08' }
})

const w = (date: string, weight_kg: number) => ({ id: date, date, weight_kg })
const WEIGHTS = [
  w('2026-10-30', 82), w('2026-10-31', 82), w('2026-11-01', 82),
  w('2026-11-06', 81), w('2026-11-07', 81), w('2026-11-08', 81),
]
const RECENT = { id: 'm1', measured_on: '2026-11-01', created_at: 'x', body_fat_navy_pct: 18.1, squat_kg: 120, bench_kg: 90 }
const value = (term: string) => screen.getByText(term).nextElementSibling!

describe('CheckinCard (spec 029)', () => {
  it('sem pesagens nem medidas não renderiza nada', () => {
    const { container } = render(<CheckinCard weights={[]} measurements={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('mostra peso de tendência, variação de 7 dias, % com origem e cargas', () => {
    render(<CheckinCard weights={WEIGHTS} measurements={[RECENT]} />)
    expect(screen.getByRole('heading', { name: 'Peso e medidas' })).toBeInTheDocument()
    expect(value('Peso (tendência)')).toHaveTextContent('81,0kg')
    expect(value('Peso (tendência)')).toHaveClass('n-md')
    expect(value('7 dias')).toHaveTextContent('−1,0kg')
    expect(value('Gordura (fita)')).toHaveTextContent('18,1%')
    expect(value('Agachamento')).toHaveTextContent('120kg')
    expect(value('Supino')).toHaveTextContent('90kg')
  })

  it('sem tendência mostra a última pesagem com a data', () => {
    render(<CheckinCard weights={[w('2026-11-07', 81.4)]} measurements={[]} />)
    expect(value('Peso (07/11)')).toHaveTextContent('81,4kg')
    expect(screen.queryByText('7 dias')).not.toBeInTheDocument()
  })

  it('lembra de refazer as medidas quando o último registro tem mais de 28 dias (FR-018)', () => {
    render(<CheckinCard weights={WEIGHTS} measurements={[{ ...RECENT, measured_on: '2026-10-01' }]} />)
    expect(screen.getByText(/hora de refazer as medidas/i)).toBeInTheDocument()
  })

  it('com medidas recentes não mostra o lembrete', () => {
    render(<CheckinCard weights={WEIGHTS} measurements={[RECENT]} />)
    expect(screen.queryByText(/hora de refazer as medidas/i)).not.toBeInTheDocument()
  })
})
