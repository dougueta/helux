import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActiveRoutine, ACTIVE_ROUTINE_STORAGE_KEY } from '@/hooks/useActiveRoutine'
import type { ComplementaryRoutine } from '@helux/types'

const createRoutineLogMock = vi.fn()
vi.mock('@/services/routines.service', () => ({
  createRoutineLog: (...args: unknown[]) => createRoutineLogMock(...args),
}))

const STRETCH_ROUTINE: ComplementaryRoutine = {
  category: 'alongamento-mobilidade',
  title: 'Alongamento & Mobilidade',
  subtitle: '2 movimentos · 10 min',
  purpose: 'Mobilidade articular diária',
  daysPerWeek: 5,
  estimatedMinutes: 10,
  items: [
    {
      id: 'gato-camelo',
      name: 'Gato-Camelo',
      mode: 'repeticoes',
      sets: 1,
      reps: '10 reps',
      unilateral: false,
      restSeconds: 10,
      cues: ['Inspire arqueando, expire arredondando'],
      motion: 'plank',
    },
    {
      id: 'alongamento-flexores-quadril',
      name: 'Alongamento de Flexores de Quadril',
      mode: 'tempo',
      sets: 1,
      seconds: 30,
      unilateral: true,
      restSeconds: 10,
      cues: ['Mantenha pelve encaixada'],
      motion: 'lunge',
    },
  ],
}

describe('useActiveRoutine (030 — SC-001, FR-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('usa chave isolada helux:active-routine e preserva helux:active-workout intocada (SC-001)', async () => {
    const fakeGymWorkout = JSON.stringify({
      planExercises: [{ name: 'Agachamento Livre', sets: 4, reps: '8', weight: '100kg' }],
      currentExerciseIndex: 1,
      startedAt: '2026-11-08T10:00:00Z',
    })
    localStorage.setItem('helux:active-workout', fakeGymWorkout)

    const { result } = renderHook(() => useActiveRoutine())

    act(() => {
      result.current.startRoutine(STRETCH_ROUTINE)
    })

    expect(localStorage.getItem(ACTIVE_ROUTINE_STORAGE_KEY)).toBeTruthy()
    expect(localStorage.getItem('helux:active-workout')).toBe(fakeGymWorkout)

    act(() => {
      result.current.toggleSet(0, 0)
      result.current.toggleSet(1, 0)
    })

    expect(result.current.activeRoutine?.completedSets[0]).toEqual([true])
    expect(localStorage.getItem('helux:active-workout')).toBe(fakeGymWorkout)

    createRoutineLogMock.mockResolvedValue({
      log: { id: 'log-1', category: 'alongamento-mobilidade' },
      view: {},
    })

    await act(async () => {
      await result.current.finishRoutine('Rotina matinal concluída')
    })

    expect(createRoutineLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'alongamento-mobilidade',
        notes: 'Rotina matinal concluída',
      }),
    )
    expect(localStorage.getItem(ACTIVE_ROUTINE_STORAGE_KEY)).toBeNull()
    // Treino principal em andamento continua 100% preservado
    expect(localStorage.getItem('helux:active-workout')).toBe(fakeGymWorkout)
  })

  it('restaura sessão ativa de rotina complementar do localStorage ao montar', () => {
    const first = renderHook(() => useActiveRoutine())
    act(() => {
      first.result.current.startRoutine(STRETCH_ROUTINE)
      first.result.current.toggleSet(0, 0)
    })
    first.unmount()

    const second = renderHook(() => useActiveRoutine())
    expect(second.result.current.activeRoutine?.routine.category).toBe('alongamento-mobilidade')
    expect(second.result.current.activeRoutine?.completedSets[0]).toEqual([true])
  })
})
