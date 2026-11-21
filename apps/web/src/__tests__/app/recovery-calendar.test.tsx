import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecoveryPage from '@/app/recovery/page'
import { TreinosClient } from '@/app/treinos/TreinosClient'
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

describe('Calendário nas abas principais Progresso (/recovery) e Treinos (/treinos) (031 — T023)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/workouts/calendar')) return Promise.resolve(MONTH_VIEW)
      if (url.startsWith('/api/workouts/history')) return Promise.resolve({ sessions: [], total: 0 })
      if (url.startsWith('/api/workouts/review')) return Promise.resolve({ sessions: [] })
      if (url.startsWith('/api/workouts/analytics')) {
        return Promise.resolve({
          weeklyVolume: [],
          personalRecords: [],
          totalSessions: 0,
          currentStreakWeeks: 0,
          thisWeekSessions: 0,
        })
      }
      if (url.startsWith('/api/recovery/latest')) return Promise.resolve(null)
      if (url.startsWith('/workout/latest-plan')) return Promise.resolve(null)
      return Promise.resolve({})
    })
  })

  it('RecoveryPage (/recovery - aba Progresso) abre em Calendário por padrão e permite alternar para Evolução', async () => {
    render(<RecoveryPage />)

    const calBtn = screen.getByRole('button', { name: 'Calendário' })
    const evoBtn = screen.getByRole('button', { name: 'Evolução' })
    expect(calBtn).toHaveAttribute('aria-pressed', 'true')

    expect(await screen.findByText('Novembro 2026')).toBeInTheDocument()
    expect(screen.getByText(/Saldo da semana/i)).toBeInTheDocument()

    fireEvent.click(evoBtn)
    expect(evoBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Recovery de hoje')).toBeInTheDocument()
  })

  it('TreinosClient (/treinos - aba Treinos) oferece Academia | Rotinas | Calendário no seletor do topo', async () => {
    render(<TreinosClient plan={null} recentSessions={[]} />)

    const calBtn = screen.getByRole('button', { name: 'Calendário' })
    fireEvent.click(calBtn)
    expect(calBtn).toHaveAttribute('aria-pressed', 'true')

    expect(await screen.findByText('Novembro 2026')).toBeInTheDocument()
    expect(screen.getByText(/Saldo da semana/i)).toBeInTheDocument()
  })
})
