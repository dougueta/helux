import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

vi.mock('@/services/api-client', () => ({ apiFetch: vi.fn().mockResolvedValue({}) }))

const mockPlan = [
  { name: 'Agachamento', sets: 3, reps: '8-10', weight: '80kg', notes: 'Foco excêntrico' },
  { name: 'Supino', sets: 3, reps: '6-8', weight: '70kg', notes: '' },
]

describe('useActiveWorkout', () => {
  beforeEach(() => { localStorageMock.clear(); vi.clearAllMocks() })

  it('initialises with no session', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    expect(result.current.session).toBeNull()
    expect(result.current.isActive).toBe(false)
  })

  it('startWorkout creates exerciseStates', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    expect(result.current.session?.exerciseStates).toHaveLength(2)
    expect(result.current.session?.exerciseStates[0]).toHaveLength(3) // 3 sets
    expect(result.current.session?.exerciseStates[0][0].weight).toBe(80)
  })

  it('toggleSetDone marks set as done', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.toggleSetDone(0, 0) })
    expect(result.current.session?.exerciseStates[0][0].done).toBe(true)
  })

  it('updateSet changes weight', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.updateSet(0, 0, 'weight', 85) })
    expect(result.current.session?.exerciseStates[0][0].weight).toBe(85)
  })

  it('addSet appends a new set', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.addSet(0) })
    expect(result.current.session?.exerciseStates[0]).toHaveLength(4)
  })

  it('startWorkout initialises variantByExerciseIndex as empty', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    expect(result.current.session?.variantByExerciseIndex).toEqual({})
  })

  it('selectVariant records the chosen variant id for an exercise index', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.selectVariant(0, 'e1b') })
    expect(result.current.session?.variantByExerciseIndex[0]).toBe('e1b')
  })

  it('selectVariant persists to localStorage', async () => {
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.selectVariant(1, 'e2c') })
    const saved = JSON.parse(localStorageMock.getItem('helux:active-workout')!)
    expect(saved.variantByExerciseIndex[1]).toBe('e2c')
  })

  it('hydrates a legacy session with no variantByExerciseIndex field without crashing', async () => {
    const legacySession = {
      planExercises: mockPlan,
      exerciseStates: [
        [{ weight: 80, reps: 8, done: false }, { weight: 80, reps: 8, done: false }, { weight: 80, reps: 8, done: false }],
        [{ weight: 70, reps: 6, done: false }, { weight: 70, reps: 6, done: false }, { weight: 70, reps: 6, done: false }],
      ],
      currentExerciseIndex: 0,
      startedAt: '2026-07-18T10:00:00.000Z',
    }
    localStorageMock.setItem('helux:active-workout', JSON.stringify(legacySession))

    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())

    expect(result.current.session?.variantByExerciseIndex).toEqual({})
    expect(result.current.session?.currentExerciseIndex).toBe(0)
  })

  it('finishWorkout calls apiFetch and clears session', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.toggleSetDone(0, 0) })
    await act(async () => { await result.current.finishWorkout() })
    expect(apiFetch).toHaveBeenCalledWith('/api/workouts/sessions', expect.objectContaining({ method: 'POST' }))
    expect(result.current.session).toBeNull()
  })
})
