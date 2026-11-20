import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkoutCalendarView } from '@/components/calendar/WorkoutCalendarView'
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
      id: 'sess-16',
      date: '2026-11-16',
      duration_s: 3000,
      rpe: 8,
      exercises: [
        { name: 'Supino reto', sets: [{ reps: 10, weight: 80, effort: 8 }, { reps: 10, weight: 80, effort: 8 }] },
      ],
    },
    {
      id: 'sess-10',
      date: '2026-11-10',
      duration_s: 2700,
      rpe: 7,
      exercises: [
        { name: 'Agachamento Livre', sets: [{ reps: 10, weight: 100, effort: 7 }] },
      ],
    },
  ],
  routineLogs: [
    {
      id: 'rout-16',
      category: 'cardio',
      performed_on: '2026-11-16',
      duration_minutes: 25,
      modality: 'bike',
      effort: 7,
    },
    {
      id: 'rout-17',
      category: 'alongamento-mobilidade',
      performed_on: '2026-11-17',
      duration_minutes: 15,
      effort: 6,
    },
  ],
  weights: [
    { id: 'w-16', date: '2026-11-16', weight_kg: 81.8 },
  ],
})

describe('WorkoutCalendarView (031 — US1/US2/US3 / T011)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockResolvedValue(MONTH_VIEW)
  })

  it('renderiza a grade mensal, destaca dias com academia e rotinas e atualiza detalhe do dia e saldo ao tocar num dia', () => {
    render(<WorkoutCalendarView initialView={MONTH_VIEW} />)

    expect(screen.getByText('Novembro 2026')).toBeInTheDocument()
    expect(screen.getByText(/3 dias ativos/i)).toBeInTheDocument()

    // Tocar no dia 16 (que possui treino de academia + rotina de cardio + pesagem 81,8 kg)
    const day16Btn = screen.getByRole('button', { name: /16 de nov/i })
    fireEvent.click(day16Btn)

    // Detalhe do dia 16 mostra a sessão Supino reto com link para /history/sess-16, o cardio e o peso
    expect(screen.getByText('Supino reto')).toBeInTheDocument()
    const sessionLink = screen.getByRole('link', { name: /Supino reto/i })
    expect(sessionLink).toHaveAttribute('href', '/history/sess-16')
    expect(screen.getByText(/Cardio/i)).toBeInTheDocument()
    expect(screen.getByText(/81,8 kg/i)).toBeInTheDocument()

    // Tocar no dia 10 (da semana anterior: 9 a 15 de nov.) atualiza o Saldo da Semana para 9 a 15 de nov.
    const day10Btn = screen.getByRole('button', { name: /10 de nov/i })
    fireEvent.click(day10Btn)

    expect(screen.getByRole('heading', { name: '9 a 15 de nov.' })).toBeInTheDocument()
    expect(screen.getByText('Agachamento Livre')).toBeInTheDocument()
  })
})
