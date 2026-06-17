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
  source: 'healthkit',
}

describe('RecoveryCard', () => {
  it('renders 4 metric tiles', () => {
    render(<RecoveryCard data={mockData} isStale={false} />)
    expect(screen.getByText(/58/)).toBeInTheDocument()  // HRV
    expect(screen.getByText(/52/)).toBeInTheDocument()  // HR
    expect(screen.getByText(/420/)).toBeInTheDocument() // Calories
    expect(screen.getByText(/7\.5/)).toBeInTheDocument() // Sleep
  })

  it('shows staleness badge when isStale', () => {
    render(<RecoveryCard data={mockData} isStale={true} />)
    expect(screen.getByText(/dados antigos/i)).toBeInTheDocument()
  })

  it('renders empty-state guidance when no data', () => {
    render(<RecoveryCard data={null} isStale={false} />)
    expect(screen.getByText(/shortcut/i)).toBeInTheDocument()
  })
})
