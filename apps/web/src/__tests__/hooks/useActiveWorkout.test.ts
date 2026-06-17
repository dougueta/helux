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
