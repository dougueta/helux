import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import type { RecoveryData } from '@helux/types'

const mockData: RecoveryData = {
  date: new Date().toISOString().split('T')[0],
  hrv: 58,
  restingHR: 52,
  activeCalories: 420,
  sleepHours: 7.5,
  cardioRecovery: 28,
  source: 'healthkit',
}

describe('RecoveryCard (v2, spec 012 T057)', () => {
  it('renders one card per metric with mono numbers and units', () => {
    render(<RecoveryCard data={{ ...mockData, activeCalories: 2340 }} isStale={false} />)
    const value = (term: string) => screen.getByText(term).closest('div')!.querySelector('dd')!
    expect(value('HRV')).toHaveTextContent('58ms')
    expect(value('HRV')).toHaveClass('n-lg')
    expect(value('FC de repouso')).toHaveTextContent('52bpm')
    expect(value('Sono')).toHaveTextContent('7h30')
    expect(value('Calorias')).toHaveTextContent('2.340kcal')
    expect(value('Recuperação cardíaca')).toHaveTextContent('28bpm')
  })

  it('hides a metric without reading instead of inventing it', () => {
    render(<RecoveryCard data={{ ...mockData, cardioRecovery: undefined }} isStale={false} />)
    expect(screen.queryByText('Recuperação cardíaca')).not.toBeInTheDocument()
  })

  it('when stale: warn banner and dimmed numbers', () => {
    render(<RecoveryCard data={mockData} isStale={true} />)
    expect(screen.getByText('Dados antigos — sincronize novamente')).toBeInTheDocument()
    expect(document.querySelector('.hx-banner--warn')).toBeInTheDocument()
    document.querySelectorAll('dd').forEach(dd => expect(dd).toHaveClass('dim'))
  })

  it('does not show the stale banner when data is fresh', () => {
    render(<RecoveryCard data={mockData} isStale={false} />)
    expect(screen.queryByText(/dados antigos/i)).not.toBeInTheDocument()
    document.querySelectorAll('dd').forEach(dd => expect(dd).not.toHaveClass('dim'))
  })

  it('renders empty-state guidance when no data', () => {
    render(<RecoveryCard data={null} isStale={false} />)
    expect(screen.getByText(/shortcut/i)).toBeInTheDocument()
  })
})
