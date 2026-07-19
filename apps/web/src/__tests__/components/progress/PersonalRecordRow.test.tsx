import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonalRecordRow } from '@/components/progress/PersonalRecordRow'
import type { PersonalRecord } from '@helux/types'

describe('PersonalRecordRow', () => {
  it('renders the exercise name, weight x reps, and a relative "when" label', () => {
    const record: PersonalRecord = {
      exerciseName: 'Supino Reto',
      maxWeight: 90,
      reps: 5,
      achievedAt: new Date().toISOString().split('T')[0],
    }
    render(<PersonalRecordRow record={record} />)
    expect(screen.getByText('Supino Reto')).toBeInTheDocument()
    expect(screen.getByText('90kg × 5')).toBeInTheDocument()
    expect(screen.getByText('esta semana')).toBeInTheDocument()
  })

  it('renders the trophy icon', () => {
    const record: PersonalRecord = { exerciseName: 'Agachamento', maxWeight: 120, reps: 3, achievedAt: '2026-01-01' }
    const { container } = render(<PersonalRecordRow record={record} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
