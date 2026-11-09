import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyRoutinesSection } from '@/components/routines/DailyRoutinesSection'
import type { ComplementaryRoutinesView } from '@helux/types'

const getRoutinesMock = vi.fn()
vi.mock('@/services/routines.service', () => ({
  getRoutines: (...args: unknown[]) => getRoutinesMock(...args),
}))

const VIEW_FIXTURE: ComplementaryRoutinesView = {
  routines: {
    'alongamento-mobilidade': {
      category: 'alongamento-mobilidade',
      title: 'Alongamento & Mobilidade',
      subtitle: '5 movimentos · 10 min',
      purpose: 'Protege joelho e melhora amplitude articular.',
      daysPerWeek: 5,
      estimatedMinutes: 10,
      items: [],
    },
    'core-abdominal': {
      category: 'core-abdominal',
      title: 'Core / Abdominal',
      subtitle: '3 exercícios · 10 min',
      purpose: 'Estabiliza a lombar.',
      daysPerWeek: 3,
      estimatedMinutes: 10,
      items: [],
    },
    cardio: {
      category: 'cardio',
      title: 'Cardio Complementar',
      subtitle: 'Bike ergométrica · 25 min (leve)',
      purpose: 'Capacidade aeróbica sem impacto.',
      daysPerWeek: 3,
      estimatedMinutes: 25,
      items: [],
    },
  },
  progress: {
    'alongamento-mobilidade': {
      category: 'alongamento-mobilidade',
      doneToday: true,
      completedThisWeek: 3,
      targetPerWeek: 5,
      lastPerformedOn: '2026-11-08',
    },
    'core-abdominal': {
      category: 'core-abdominal',
      doneToday: false,
      completedThisWeek: 1,
      targetPerWeek: 3,
      lastPerformedOn: '2026-11-06',
    },
    cardio: {
      category: 'cardio',
      doneToday: false,
      completedThisWeek: 2,
      targetPerWeek: 3,
      lastPerformedOn: '2026-11-07',
    },
  },
  recentLogs: [],
  preferences: {},
  completedToday: ['alongamento-mobilidade'],
}

describe('DailyRoutinesSection (030 — US4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRoutinesMock.mockResolvedValue(VIEW_FIXTURE)
  })

  it('exibe as 3 rotinas do dia com placar semanal, status Feito hoje e links de início rápido', () => {
    render(<DailyRoutinesSection initialView={VIEW_FIXTURE} />)

    expect(screen.getByText('Rotinas do dia')).toBeInTheDocument()
    expect(screen.getByText('Alongamento & Mobilidade')).toBeInTheDocument()
    expect(screen.getByText('Core / Abdominal')).toBeInTheDocument()
    expect(screen.getByText('Cardio Complementar')).toBeInTheDocument()

    expect(screen.getByText('Feito hoje')).toBeInTheDocument()
    expect(screen.getByText('3/5 sem.')).toBeInTheDocument()
    expect(screen.getByText('1/3 sem.')).toBeInTheDocument()
    expect(screen.getByText('2/3 sem.')).toBeInTheDocument()

    const stretchLink = screen.getByRole('link', { name: /Alongamento & Mobilidade/i })
    expect(stretchLink).toHaveAttribute('href', '/treinos/rotina/alongamento-mobilidade')
  })
})
