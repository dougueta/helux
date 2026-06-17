import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import type { NextWorkoutPlan } from '@helux/types'

const mockPlan: NextWorkoutPlan = {
  generatedAt: '2026-06-15T10:00:00Z',
  exercises: [
    { name: 'Agachamento', sets: 4, reps: '6-8', weight: '80kg', notes: 'Foco no excêntrico' },
    { name: 'Leg Press', sets: 3, reps: '12', weight: '120kg' },
  ],
  rationale: 'HRV elevado indica boa recuperação.',
}

describe('WorkoutCard', () => {
  it('renders all exercises', () => {
    render(<WorkoutCard plan={mockPlan} onStart={vi.fn()} />)
    expect(screen.getByText('Agachamento')).toBeInTheDocument()
    expect(screen.getByText('Leg Press')).toBeInTheDocument()
  })

  it('renders the rationale', () => {
    render(<WorkoutCard plan={mockPlan} onStart={vi.fn()} />)
    expect(screen.getByText(/HRV elevado/i)).toBeInTheDocument()
  })

  it('calls onStart when "Iniciar Treino" button is clicked', async () => {
    const onStart = vi.fn()
    const { getByRole } = render(<WorkoutCard plan={mockPlan} onStart={onStart} />)
    getByRole('button', { name: /iniciar treino/i }).click()
    expect(onStart).toHaveBeenCalledOnce()
  })
})
