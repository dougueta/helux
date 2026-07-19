import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionHistoryRow } from '@/components/progress/SessionHistoryRow'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

const session: WorkoutSessionRow = {
  id: 'abc-123',
  date: '2026-07-15',
  duration_s: 3600,
  created_at: '2026-07-15T10:00:00Z',
  exercises: [
    { name: 'Agachamento', sets: [{ reps: 8, weight: 80, effort: 8 }, { reps: 8, weight: 80, effort: 8 }] },
    { name: 'Leg Press', sets: [{ reps: 10, weight: 120, effort: 7 }] },
  ],
}

describe('SessionHistoryRow', () => {
  it('renders the exercise names and total set count', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByText(/Agachamento, Leg Press/)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // total sets across all exercises
  })

  it('renders the duration in minutes', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('renders the total tonnage (sum of reps * weight across all sets)', () => {
    render(<SessionHistoryRow session={session} />)
    // (8*80)+(8*80)+(10*120) = 640+640+1200 = 2480
    expect(screen.getByText('2480kg')).toBeInTheDocument()
  })

  it('links to the session detail route', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/history/abc-123')
  })

  it('truncates to 3 exercise names and shows a "+N" suffix for more', () => {
    const bigSession: WorkoutSessionRow = {
      ...session,
      exercises: [
        ...session.exercises,
        { name: 'Cadeira Extensora', sets: [{ reps: 12, weight: 40, effort: 6 }] },
        { name: 'Panturrilha', sets: [{ reps: 15, weight: 30, effort: 6 }] },
      ],
    }
    render(<SessionHistoryRow session={bigSession} />)
    expect(screen.getByText(/Agachamento, Leg Press, Cadeira Extensora \+1/)).toBeInTheDocument()
  })

  it('omits the duration segment when duration_s is null', () => {
    const { container } = render(<SessionHistoryRow session={{ ...session, duration_s: null }} />)
    expect(container.textContent).not.toMatch(/min/)
  })
})
