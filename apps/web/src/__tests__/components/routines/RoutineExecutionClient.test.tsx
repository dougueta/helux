import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RoutineExecutionClient } from '@/components/routines/RoutineExecutionClient'
import type { ComplementaryRoutine, ComplementaryRoutinesView } from '@helux/types'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}))

const createRoutineLogMock = vi.fn()
const getRoutinesMock = vi.fn()
vi.mock('@/services/routines.service', () => ({
  createRoutineLog: (...args: unknown[]) => createRoutineLogMock(...args),
  getRoutines: (...args: unknown[]) => getRoutinesMock(...args),
}))

const STRETCH_ROUTINE: ComplementaryRoutine = {
  category: 'alongamento-mobilidade',
  title: 'Alongamento & Mobilidade',
  subtitle: '2 movimentos · 10 min',
  purpose: 'Protege joelho e melhora amplitude articular.',
  daysPerWeek: 7,
  estimatedMinutes: 10,
  items: [
    {
      id: 'alongamento-flexores-quadril',
      name: 'Alongamento de Flexores de Quadril (Meio Ajoelhado)',
      mode: 'tempo',
      sets: 1,
      seconds: 30,
      unilateral: true,
      restSeconds: 10,
      cues: [
        'Meio ajoelhado sobre apoio macio, tronco ereto e pelve encaixada',
        'Sustente respirando fundo sem arquear a lombar',
      ],
      motion: 'lunge',
    },
    {
      id: 'gato-camelo',
      name: 'Gato-Camelo (Mobilidade de Coluna)',
      mode: 'repeticoes',
      sets: 1,
      reps: '10 repetições lentas',
      unilateral: false,
      restSeconds: 10,
      cues: ['Quatro apoios, alterne arqueando e arredondando a coluna'],
      motion: 'plank',
    },
  ],
}

const CORE_ROUTINE: ComplementaryRoutine = {
  category: 'core-abdominal',
  title: 'Core / Abdominal',
  subtitle: '2 exercícios · 10 min',
  purpose: 'Estabiliza a coluna sem comprimir a lombar.',
  daysPerWeek: 3,
  estimatedMinutes: 10,
  items: [
    {
      id: 'prancha-frontal-isometrica',
      name: 'Prancha Frontal Isométrica',
      mode: 'tempo',
      sets: 3,
      seconds: 30,
      unilateral: false,
      restSeconds: 30,
      cues: ['Apoie antebraços, contraia glúteos e abdômen'],
      motion: 'plank',
    },
    {
      id: 'dead-bug-estabilidade',
      name: 'Dead Bug (Estabilidade Lombar)',
      mode: 'repeticoes',
      sets: 3,
      reps: '8 por lado',
      unilateral: true,
      restSeconds: 30,
      cues: ['Lombar colada no chão durante todo o movimento'],
      motion: 'leg-raise',
    },
  ],
}

const CARDIO_ROUTINE: ComplementaryRoutine = {
  category: 'cardio',
  title: 'Cardio Complementar',
  subtitle: 'Bike ergométrica · 25 min (leve)',
  purpose: 'Condicionamento aeróbico sem impacto articular.',
  daysPerWeek: 3,
  estimatedMinutes: 25,
  legDayWarning:
    'Hoje você tem treino de membros inferiores na academia: se fizer o cardio antes do treino, mantenha ritmo leve e sem impacto para preservar a força das pernas à noite.',
  items: [
    {
      id: 'bike',
      name: 'Bike ergométrica',
      mode: 'cardio',
      sets: 1,
      reps: '25 min',
      restSeconds: 0,
      cues: ['Ajuste o selim na altura do quadril', 'Zona 2 leve'],
      motion: 'leg-press',
      cardio: {
        modality: 'bike',
        minutes: 25,
        zone: 'leve',
        allowedModalities: ['bike', 'eliptico', 'remo'],
      },
    },
  ],
}

const MOCK_VIEW: ComplementaryRoutinesView = {
  routines: {
    'alongamento-mobilidade': STRETCH_ROUTINE,
    'core-abdominal': CORE_ROUTINE,
    cardio: CARDIO_ROUTINE,
  },
  progress: {
    'alongamento-mobilidade': { category: 'alongamento-mobilidade', doneToday: false, completedThisWeek: 2, targetPerWeek: 7, lastPerformedOn: null },
    'core-abdominal': { category: 'core-abdominal', doneToday: false, completedThisWeek: 1, targetPerWeek: 3, lastPerformedOn: null },
    cardio: { category: 'cardio', doneToday: false, completedThisWeek: 1, targetPerWeek: 3, lastPerformedOn: null },
  },
  recentLogs: [],
  preferences: {},
  completedToday: [],
}

describe('RoutineExecutionClient (030 — US3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getRoutinesMock.mockResolvedValue(MOCK_VIEW)
    createRoutineLogMock.mockResolvedValue({ log: { id: 'l1' }, view: MOCK_VIEW })
  })

  it('alongamento-mobilidade: exibe animação, orientações, indicador unilateral, timer regressivo e conclui sem pedir carga (kg)', async () => {
    render(<RoutineExecutionClient category="alongamento-mobilidade" initialRoutine={STRETCH_ROUTINE} />)

    expect(screen.getByText(/Alongamento de Flexores de Quadril/)).toBeInTheDocument()
    expect(screen.getByText(/Lado esquerdo/i)).toBeInTheDocument()
    expect(screen.getByText(/00:30/)).toBeInTheDocument()
    expect(screen.queryByText(/kg/i)).not.toBeInTheDocument()

    // Alterna para lado direito e conclui movimento
    fireEvent.click(screen.getByRole('button', { name: /Lado direito/i }))
    fireEvent.click(screen.getByRole('button', { name: /Concluir movimento/i }))

    // Avança para o segundo movimento
    expect(screen.getByText(/Gato-Camelo/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Concluir rotina/i }))

    await waitFor(() => {
      expect(createRoutineLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'alongamento-mobilidade',
          duration_minutes: 10,
        }),
      )
    })
  })

  it('core-abdominal: lista séries sem campo de carga (kg), permite marcar séries com 1 toque e concluir', async () => {
    render(<RoutineExecutionClient category="core-abdominal" initialRoutine={CORE_ROUTINE} />)

    expect(screen.getByText(/Prancha Frontal Isométrica/)).toBeInTheDocument()
    expect(screen.queryByText(/kg/i)).not.toBeInTheDocument()

    const setButtons = screen.getAllByRole('button', { name: /Série 1/i })
    fireEvent.click(setButtons[0])

    fireEvent.click(screen.getByRole('button', { name: /Concluir rotina/i }))

    await waitFor(() => {
      expect(createRoutineLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'core-abdominal',
        }),
      )
    })
  })

  it('cardio: exibe alerta de dia de pernas, permite trocar modalidade compatível, ajustar duração/esforço e concluir (< 15s)', async () => {
    render(<RoutineExecutionClient category="cardio" initialRoutine={CARDIO_ROUTINE} />)

    // Alerta de treino de membros inferiores no mesmo dia (FR-015)
    expect(screen.getByText(/membros inferiores na academia/i)).toBeInTheDocument()

    // Troca modalidade para Remo ergométrico
    fireEvent.click(screen.getByRole('button', { name: /Remo ergométrico/i }))

    // Conclui cardio
    fireEvent.click(screen.getByRole('button', { name: /Concluir cardio/i }))

    await waitFor(() => {
      expect(createRoutineLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cardio',
          modality: 'remo',
          duration_minutes: 25,
        }),
      )
    })
  })
})
