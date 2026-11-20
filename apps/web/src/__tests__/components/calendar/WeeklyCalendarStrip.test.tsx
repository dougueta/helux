import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklyCalendarStrip } from '@/components/calendar/WeeklyCalendarStrip'
import { buildTrainingCalendarMonth } from '@helux/workouts'

const apiFetchMock = vi.fn()
vi.mock('@/services/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}))

const MONTH_VIEW = buildTrainingCalendarMonth({
  month: '2026-11',
  today: '2026-11-20',
  targetGymDays: 4,
  sessions: [
    {
      id: 's1',
      date: '2026-11-16',
      duration_s: 3000,
      exercises: [{ name: 'Supino reto', sets: [{ reps: 10, weight: 80, effort: 8 }] }],
    },
    {
      id: 's2',
      date: '2026-11-18',
      duration_s: 3000,
      exercises: [{ name: 'Agachamento', sets: [{ reps: 10, weight: 100, effort: 8 }] }],
    },
  ],
  routineLogs: [
    {
      id: 'r1',
      category: 'cardio',
      performed_on: '2026-11-17',
      duration_minutes: 25,
      modality: 'bike',
      effort: 7,
    },
  ],
  weights: [],
})

describe('WeeklyCalendarStrip (031 — US4 / T018)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockResolvedValue(MONTH_VIEW)
  })

  it('exibe os 7 dias da semana atual com resumo rápido e link de 1 toque para /history', () => {
    render(<WeeklyCalendarStrip initialView={MONTH_VIEW} />)

    expect(screen.getByText('Sua semana')).toBeInTheDocument()
    expect(screen.getByText(/2\/4 treinos/i)).toBeInTheDocument()
    expect(screen.getByText(/3 dias ativos/i)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Abrir calendário de treino/i })
    expect(link).toHaveAttribute('href', '/history')
  })
})
