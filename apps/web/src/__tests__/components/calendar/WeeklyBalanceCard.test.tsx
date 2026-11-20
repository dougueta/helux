import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklyBalanceCard } from '@/components/calendar/WeeklyBalanceCard'
import type { WeeklyBalance } from '@helux/types'

const BALANCE_FIXTURE: WeeklyBalance = {
  weekStart: '2026-11-16',
  weekEnd: '2026-11-22',
  label: '16 a 22 de nov.',
  activeDays: 4,
  gymDays: 3,
  targetGymDays: 4,
  gymSessionsCount: 3,
  complementaryCount: 2,
  tonnageKg: 13500,
  totalSets: 46,
  activeMinutes: 195,
  avgEffort: 8.2,
  effortClassification: 'forte',
  avgWeightKg: 81.6,
  latestWeightKg: 81.5,
  weightEntriesCount: 3,
  deltas: {
    activeDaysDelta: 1,
    gymDaysDelta: 1,
    tonnageKgDelta: 1500,
    avgEffortDelta: 0.4,
    avgWeightKgDelta: -0.4,
  },
}

describe('WeeklyBalanceCard (031 — US2 / T012)', () => {
  it('exibe assiduidade, esforço médio qualitativo + numérico, peso médio + delta e volume/séries/tempo ativo', () => {
    render(<WeeklyBalanceCard balance={BALANCE_FIXTURE} isCurrentWeek />)

    expect(screen.getByText(/Saldo da semana/i)).toBeInTheDocument()
    expect(screen.getByText(/16 a 22 de nov\./i)).toBeInTheDocument()

    // Assiduidade
    expect(screen.getByText('3/4')).toBeInTheDocument()
    expect(screen.getByText(/\+2 rotinas/i)).toBeInTheDocument()

    // Esforço
    expect(screen.getByText('Forte')).toBeInTheDocument()
    expect(screen.getByText(/8,2/)).toBeInTheDocument()
    expect(screen.getByText(/\+0,4 vs\. sem\. ant\./i)).toBeInTheDocument()

    // Peso corporal
    expect(screen.getByText('81,6')).toBeInTheDocument()
    expect(screen.getByText(/-0,4 kg vs\. sem\. ant\./i)).toBeInTheDocument()

    // Volume & tempo
    expect(screen.getByText('13,5 t')).toBeInTheDocument()
    expect(screen.getByText(/46 séries/i)).toBeInTheDocument()
    expect(screen.getByText(/3h 15min/i)).toBeInTheDocument()
  })

  it('exibe estado Sem pesagem com link para /checkin/peso quando não há pesagens na semana atual', () => {
    const noWeight: WeeklyBalance = {
      ...BALANCE_FIXTURE,
      avgEffort: null,
      effortClassification: null,
      avgWeightKg: null,
      latestWeightKg: null,
      weightEntriesCount: 0,
      deltas: {
        ...BALANCE_FIXTURE.deltas,
        avgEffortDelta: null,
        avgWeightKgDelta: null,
      },
    }
    render(<WeeklyBalanceCard balance={noWeight} isCurrentWeek />)

    expect(screen.getByText('Sem registro')).toBeInTheDocument()
    expect(screen.getByText('Sem pesagem')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Registrar peso/i })
    expect(link).toHaveAttribute('href', '/checkin/peso')
  })
})
