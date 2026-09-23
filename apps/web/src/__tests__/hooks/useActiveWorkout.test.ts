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

const mockPlanWithVariants = [
  {
    name: 'Supino Reto (Barra)',
    sets: 3,
    reps: '8-10',
    weight: '80kg',
    notes: '',
    match: 96,
    variants: [
      { id: 'rec1', name: 'Supino Reto (Barra)', equip: 'Barra', level: 'Avançado', match: 96, rec: true, motion: 'press-flat', implement: 'barbell', why: '' },
      { id: 'alt1', name: 'Supino Reto com Halteres', equip: 'Halteres', level: 'Intermediário', match: 84, motion: 'press-flat', implement: 'dumbbell', why: '' },
    ],
  },
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

  it('finishWorkout clears the cached workout plan so the home page refetches', async () => {
    localStorageMock.setItem('helux:workout-plan', JSON.stringify({ mesocycleId: null, today: null }))
    const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
    const { result } = renderHook(() => useActiveWorkout())
    act(() => { result.current.startWorkout(mockPlan as any) })
    act(() => { result.current.toggleSetDone(0, 0) })
    await act(async () => { await result.current.finishWorkout() })
    expect(localStorageMock.getItem('helux:workout-plan')).toBeNull()
  })

  describe('getSkippedExercises', () => {
    it('returns an empty list when every exercise has at least one done set', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlan as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      act(() => { result.current.toggleSetDone(1, 0) })
      expect(result.current.getSkippedExercises()).toEqual([])
    })

    it('returns the exercises that have no done sets', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlan as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      const skipped = result.current.getSkippedExercises()
      expect(skipped).toHaveLength(1)
      expect(skipped[0].name).toBe('Supino')
    })

    it('returns every exercise when none has a done set (fully empty workout)', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlan as any) })
      const skipped = result.current.getSkippedExercises()
      expect(skipped.map(e => e.name)).toEqual(['Agachamento', 'Supino'])
    })
  })

  describe('executedVariantByExerciseIndex locking', () => {
    it('locks to the active variant on the first done toggle for that exercise', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      expect(result.current.session?.executedVariantByExerciseIndex[0]).toBe('alt1')
    })

    it('locks to null (planned exercise) when no variant was ever selected before the first done toggle', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      expect(result.current.session?.executedVariantByExerciseIndex[0]).toBeNull()
    })

    it('does not change after a later variant switch, once locked', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      act(() => { result.current.selectVariant(0, 'rec1') })
      expect(result.current.session?.executedVariantByExerciseIndex[0]).toBe('alt1')
    })
  })

  describe('chosen variant persists for the rest of the workout (FR-012)', () => {
    it('keeps the variant when navigating to another exercise and back', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout([...mockPlanWithVariants, ...mockPlan] as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.setExercise(1) })
      act(() => { result.current.setExercise(0) })
      expect(result.current.session?.variantByExerciseIndex[0]).toBe('alt1')
    })

    it('keeps the variant when the workout is resumed from storage', async () => {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const first = renderHook(() => useActiveWorkout())
      act(() => { first.result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { first.result.current.selectVariant(0, 'alt1') })
      first.unmount()

      const { result } = renderHook(() => useActiveWorkout())
      await vi.waitFor(() => expect(result.current.loaded).toBe(true))
      expect(result.current.session?.variantByExerciseIndex[0]).toBe('alt1')
    })
  })

  describe('finishWorkout executedVariant payload', () => {
    it('includes executedVariant when the locked variant differs from the recommended one', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const call = (apiFetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.exercises[0].executedVariant).toEqual({ name: 'Supino Reto com Halteres', match: 84 })
    })

    it('omits executedVariant when no variant was ever switched', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const call = (apiFetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.exercises[0].executedVariant).toBeUndefined()
    })

    it('omits executedVariant when the user switches away and back to the recommended variant before logging any set', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.selectVariant(0, 'rec1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const call = (apiFetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.exercises[0].executedVariant).toBeUndefined()
    })
  })

  describe('lock survives reload and unticking', () => {
    const payloadOf = async (apiFetch: any) => JSON.parse(apiFetch.mock.calls[0][1].body)

    async function remount() {
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const hook = renderHook(() => useActiveWorkout())
      await vi.waitFor(() => expect(hook.result.current.loaded).toBe(true))
      return hook
    }

    it('keeps the planned-exercise lock after a reload, ignoring a later variant switch', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const first = await remount()
      act(() => { first.result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { first.result.current.toggleSetDone(0, 0) })
      first.unmount()

      const { result } = await remount()
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 1) })
      await act(async () => { await result.current.finishWorkout() })

      expect((await payloadOf(apiFetch)).exercises[0].executedVariant).toBeUndefined()
    })

    it('keeps a variant lock after a reload, ignoring a switch back to the recommended one', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const first = await remount()
      act(() => { first.result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { first.result.current.selectVariant(0, 'alt1') })
      act(() => { first.result.current.toggleSetDone(0, 0) })
      first.unmount()

      const { result } = await remount()
      act(() => { result.current.selectVariant(0, 'rec1') })
      act(() => { result.current.toggleSetDone(0, 1) })
      await act(async () => { await result.current.finishWorkout() })

      expect((await payloadOf(apiFetch)).exercises[0].executedVariant).toEqual({ name: 'Supino Reto com Halteres', match: 84 })
    })

    it('releases the lock when every done set of the exercise is unticked', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { result } = await remount()
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      act(() => { result.current.toggleSetDone(0, 0) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      expect((await payloadOf(apiFetch)).exercises[0].executedVariant).toEqual({ name: 'Supino Reto com Halteres', match: 84 })
    })

    it('keeps the lock while at least one set of the exercise is still done', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { result } = await remount()
      act(() => { result.current.startWorkout(mockPlanWithVariants as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      act(() => { result.current.toggleSetDone(0, 1) })
      act(() => { result.current.toggleSetDone(0, 1) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 2) })
      await act(async () => { await result.current.finishWorkout() })

      expect((await payloadOf(apiFetch)).exercises[0].executedVariant).toBeUndefined()
    })
  })

  describe('finishWorkout with variants but none marked rec', () => {
    const noRecPlan = [{
      ...mockPlanWithVariants[0],
      variants: mockPlanWithVariants[0].variants.map(({ rec: _rec, ...v }) => v),
    }]

    it('treats the first variant as the recommended one and records the second as executed', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(noRecPlan as any) })
      act(() => { result.current.selectVariant(0, 'alt1') })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const body = JSON.parse((apiFetch as any).mock.calls[0][1].body)
      expect(body.exercises[0].executedVariant).toEqual({ name: 'Supino Reto com Halteres', match: 84 })
    })

    it('records no executed variant when nothing was switched', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(noRecPlan as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const body = JSON.parse((apiFetch as any).mock.calls[0][1].body)
      expect(body.exercises[0].executedVariant).toBeUndefined()
    })
  })

  describe('finishWorkout skipped payload', () => {
    it('marks skipped: true only on exercises with no done sets', async () => {
      const { apiFetch } = await import('@/services/api-client')
      const { useActiveWorkout } = await import('@/hooks/useActiveWorkout')
      const { result } = renderHook(() => useActiveWorkout())
      act(() => { result.current.startWorkout(mockPlan as any) })
      act(() => { result.current.toggleSetDone(0, 0) })
      await act(async () => { await result.current.finishWorkout() })

      const call = (apiFetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.exercises).toHaveLength(2)
      const agachamento = body.exercises.find((e: any) => e.name === 'Agachamento')
      const supino = body.exercises.find((e: any) => e.name === 'Supino')
      expect(agachamento.skipped).toBeUndefined()
      expect(supino.skipped).toBe(true)
      expect(supino.sets).toEqual([])
    })
  })
})
