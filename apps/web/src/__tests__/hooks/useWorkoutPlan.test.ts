import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('@/services/workout.service', () => ({
  getLatestPlan: vi.fn().mockResolvedValue(null),
  generatePlan: vi.fn(),
  getWorkoutHistory: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/genetics.service', () => ({
  getGeneticProfile: vi.fn().mockResolvedValue({ traits: [] }),
}))

vi.mock('@/services/recovery.service', () => ({
  getLatestRecovery: vi.fn().mockResolvedValue(null),
}))

describe('useWorkoutPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('loads plan on mount', async () => {
    const { getLatestPlan } = await import('@/services/workout.service')
    vi.mocked(getLatestPlan).mockResolvedValueOnce({
      mesocycleId: 'meso-001',
      generatedAt: '2026-07-21T10:00:00Z',
      today: { letter: 'A', focus: 'Peito + Tríceps', exercises: [], adjusted: false },
      upcoming: [{ letter: 'B', focus: 'Costas + Bíceps' }],
      progress: { completed: 0, total: 4 },
    })
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.plan).not.toBeNull()
    expect(result.current.plan?.today?.letter).toBe('A')
  })

  it('generatePlan sets generating true then wraps the legacy single-session result into the plan view', async () => {
    const { generatePlan } = await import('@/services/workout.service')
    const newPlan = { generatedAt: new Date().toISOString(), exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }], rationale: 'new' }
    vi.mocked(generatePlan).mockResolvedValueOnce(newPlan)
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan())
    await act(async () => { await result.current.generatePlan() })
    expect(result.current.plan?.today?.exercises).toEqual(newPlan.exercises)
    expect(result.current.plan?.mesocycleId).toBeNull()
    expect(result.current.generating).toBe(false)
  })

  describe('011: cache local de outro dia', () => {
    function cachedPlan(date: string) {
      return {
        mesocycleId: 'meso-001',
        generatedAt: null,
        today: {
          letter: 'A',
          focus: 'Peito',
          exercises: [],
          adjusted: false,
          tiredness: {
            date,
            manualLevel: 'exausto',
            overrideAutomatic: false,
            automaticLevel: null,
            automaticHrv: null,
            effectiveLevel: 'exausto',
            source: 'manual',
            conflict: false,
          },
        },
        upcoming: [],
        progress: null,
      }
    }

    it('usa o cache quando a avaliação de cansaço é de hoje', async () => {
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem('helux:workout-plan', JSON.stringify(cachedPlan(today)))
      const { getLatestPlan } = await import('@/services/workout.service')
      const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
      const { result } = renderHook(() => useWorkoutPlan())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(getLatestPlan).not.toHaveBeenCalled()
      expect(result.current.plan?.today?.tiredness?.manualLevel).toBe('exausto')
    })

    it('FR-018: descarta cache do mesmo dia no formato anterior (sem today.tiredness) e busca de novo', async () => {
      const old = cachedPlan('ignorado') as { today: Record<string, unknown> }
      delete old.today.tiredness
      localStorage.setItem('helux:workout-plan', JSON.stringify(old))
      const { getLatestPlan } = await import('@/services/workout.service')
      vi.mocked(getLatestPlan).mockResolvedValueOnce(null)
      const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
      const { result } = renderHook(() => useWorkoutPlan())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(getLatestPlan).toHaveBeenCalledTimes(1)
      expect(result.current.plan).toBeNull()
    })

    it('FR-018: plano legado do botão gerar (mesocycleId null) continua vindo do cache', async () => {
      const legacy = { ...cachedPlan('ignorado'), mesocycleId: null } as { today: Record<string, unknown> }
      delete legacy.today.tiredness
      localStorage.setItem('helux:workout-plan', JSON.stringify(legacy))
      const { getLatestPlan } = await import('@/services/workout.service')
      const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
      const { result } = renderHook(() => useWorkoutPlan())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(getLatestPlan).not.toHaveBeenCalled()
      expect(result.current.plan?.today?.letter).toBe('A')
    })

    it('descarta o cache cuja avaliação de cansaço é de outro dia e busca de novo', async () => {
      localStorage.setItem('helux:workout-plan', JSON.stringify(cachedPlan('2000-01-01')))
      const { getLatestPlan } = await import('@/services/workout.service')
      vi.mocked(getLatestPlan).mockResolvedValueOnce(null)
      const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
      const { result } = renderHook(() => useWorkoutPlan())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(getLatestPlan).toHaveBeenCalledTimes(1)
      expect(result.current.plan).toBeNull()
    })
  })
})
