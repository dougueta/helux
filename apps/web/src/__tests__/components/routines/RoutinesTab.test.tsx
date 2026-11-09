import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RoutinesTab } from '@/components/routines/RoutinesTab'
import type { ComplementaryRoutinesView } from '@helux/types'

const getRoutinesMock = vi.fn()
const updateRoutinePreferencesMock = vi.fn()
const deleteRoutineLogMock = vi.fn()

vi.mock('@/services/routines.service', () => ({
  getRoutines: (...args: unknown[]) => getRoutinesMock(...args),
  updateRoutinePreferences: (...args: unknown[]) => updateRoutinePreferencesMock(...args),
  deleteRoutineLog: (...args: unknown[]) => deleteRoutineLogMock(...args),
  createRoutineLog: vi.fn(),
}))

const VIEW_FIXTURE: ComplementaryRoutinesView = {
  routines: {
    'alongamento-mobilidade': {
      category: 'alongamento-mobilidade',
      title: 'Alongamento & Mobilidade',
      subtitle: '5 movimentos · 10 min',
      purpose: 'Protege joelho, quadril e melhora a amplitude articular.',
      daysPerWeek: 5,
      estimatedMinutes: 10,
      items: [
        {
          id: 'gato-camelo',
          name: 'Gato-Camelo',
          mode: 'repeticoes',
          sets: 1,
          reps: '10 reps',
          restSeconds: 10,
          cues: [],
          motion: 'plank',
        },
      ],
    },
    'core-abdominal': {
      category: 'core-abdominal',
      title: 'Core / Abdominal',
      subtitle: '3 exercícios · 10 min',
      purpose: 'Fortalece o cinturão abdominal sem comprimir a lombar.',
      daysPerWeek: 3,
      estimatedMinutes: 10,
      items: [
        {
          id: 'prancha-frontal-isometrica',
          name: 'Prancha Frontal Isométrica',
          mode: 'tempo',
          sets: 3,
          seconds: 30,
          restSeconds: 30,
          cues: [],
          motion: 'plank',
        },
      ],
    },
    cardio: {
      category: 'cardio',
      title: 'Cardio Complementar',
      subtitle: 'Bike ergométrica · 25 min (leve)',
      purpose: 'Condicionamento aeróbico sem impacto articular.',
      daysPerWeek: 3,
      estimatedMinutes: 25,
      items: [
        {
          id: 'bike',
          name: 'Bike ergométrica',
          mode: 'cardio',
          sets: 1,
          reps: '25 min',
          restSeconds: 0,
          cues: [],
          motion: 'leg-press',
          cardio: {
            modality: 'bike',
            minutes: 25,
            zone: 'leve',
            allowedModalities: ['bike', 'eliptico', 'remo'],
          },
        },
      ],
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
  recentLogs: [
    {
      id: 'log-1',
      category: 'cardio',
      performed_on: '2026-11-07',
      performed_at: '2026-11-07T08:00:00Z',
      duration_minutes: 25,
      modality: 'bike',
      zone: 'leve',
      effort: 6,
      items: [{ id: 'bike', name: 'Bike ergométrica', setsCompleted: 1, secondsOrReps: '25 min' }],
      notes: 'Cardio matinal',
    },
  ],
  preferences: {},
  completedToday: ['alongamento-mobilidade'],
}

describe('RoutinesTab (030 — US2 & US4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRoutinesMock.mockResolvedValue(VIEW_FIXTURE)
    updateRoutinePreferencesMock.mockResolvedValue({
      ...VIEW_FIXTURE,
      routines: {
        ...VIEW_FIXTURE.routines,
        'alongamento-mobilidade': {
          ...VIEW_FIXTURE.routines['alongamento-mobilidade'],
          daysPerWeek: 7,
          estimatedMinutes: 15,
          subtitle: '7 movimentos · 15 min',
        },
      },
    })
    deleteRoutineLogMock.mockResolvedValue(undefined)
  })

  it('exibe as 3 rotinas fixas com propósito, placar semanal, histórico recente e permite ajustar preferências (SC-002)', async () => {
    render(<RoutinesTab initialView={VIEW_FIXTURE} />)

    expect(screen.getByText('Alongamento & Mobilidade')).toBeInTheDocument()
    expect(screen.getByText(/Protege joelho, quadril/)).toBeInTheDocument()
    expect(screen.getByText('Core / Abdominal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cardio Complementar' })).toBeInTheDocument()
    expect(screen.getByText(/Cardio matinal/)).toBeInTheDocument()

    // Abre a folha de ajustes de Alongamento & Mobilidade
    const adjustButtons = screen.getAllByRole('button', { name: /Ajustar/i })
    fireEvent.click(adjustButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /15 min/i }))
    fireEvent.click(screen.getByRole('button', { name: /Salvar ajustes/i }))

    await waitFor(() => {
      expect(updateRoutinePreferencesMock).toHaveBeenCalled()
    })
    expect(screen.getByText('7 movimentos · 15 min')).toBeInTheDocument()
  })
})
