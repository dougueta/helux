import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HistoryPage from '@/app/history/page'
import { buildTrainingCalendarMonth } from '@helux/workouts'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

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
      id: 'sess-1',
      date: '2026-11-16',
      duration_s: 3000,
      exercises: [{ name: 'Supino reto', sets: [{ reps: 10, weight: 80, effort: 8 }] }],
    },
  ],
  routineLogs: [],
  weights: [],
})

describe('HistoryPage (/history — 031 US4 / T018)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/workouts/calendar')) return Promise.resolve(MONTH_VIEW)
      if (url.startsWith('/api/workouts/history')) {
        return Promise.resolve({
          sessions: [
            {
              id: 'sess-1',
              date: '2026-11-16',
              duration_s: 3000,
              exercises: [{ name: 'Supino reto', sets: [{ reps: 10, weight: 80, effort: 8 }] }],
              created_at: '2026-11-16T18:00:00Z',
            },
          ],
          total: 1,
        })
      }
      return Promise.resolve({})
    })
  })

  it('abre na visão Calendário por padrão e permite alternar para a visão Lista', async () => {
    render(<HistoryPage />)

    // Seletor Calendário | Lista presente com Calendário selecionado
    const calTab = screen.getByRole('button', { name: 'Calendário' })
    const listTab = screen.getByRole('button', { name: 'Lista' })
    expect(calTab).toHaveAttribute('aria-pressed', 'true')

    // Visão Calendário carregada
    expect(await screen.findByText('Novembro 2026')).toBeInTheDocument()
    expect(screen.getByText(/Saldo da semana/i)).toBeInTheDocument()

    // Alternar para Lista
    fireEvent.click(listTab)
    expect(listTab).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('Supino reto')).toBeInTheDocument()
  })
})
