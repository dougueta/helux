import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('@/services/workout.service', () => ({
  getLatestPlan: vi.fn().mockResolvedValue(null),
  regeneratePlan: vi.fn().mockResolvedValue(undefined),
  repeatLastWeek: vi.fn().mockResolvedValue(undefined),
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

  it('024: generatePlan pede um novo mesociclo à API e acompanha até ficar pronto, sem plano solto no cache', async () => {
    const { getLatestPlan, regeneratePlan } = await import('@/services/workout.service')
    const generating = { mesocycleId: 'm1', generatedAt: null, today: null, upcoming: [], progress: null, status: 'generating' as const }
    const ready = { mesocycleId: 'm2', generatedAt: '2026-10-24T10:00:00Z', today: { letter: 'A', focus: 'Superior', exercises: [], adjusted: false }, upcoming: [], progress: { completed: 0, total: 16 } }
    vi.mocked(getLatestPlan).mockResolvedValueOnce(null).mockResolvedValueOnce(generating).mockResolvedValueOnce(ready)
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan({ pollMs: 1 }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.generatePlan() })
    expect(regeneratePlan).toHaveBeenCalledTimes(1)
    expect(result.current.plan?.mesocycleId).toBe('m2')
    expect(result.current.generating).toBe(false)
    expect(JSON.parse(localStorage.getItem('helux:workout-plan')!).mesocycleId).toBe('m2')
  })

  it('024: generatePlan com falha da geração mostra o erro', async () => {
    const { getLatestPlan } = await import('@/services/workout.service')
    const failed = { mesocycleId: 'm1', generatedAt: null, today: null, upcoming: [], progress: null, status: 'generation-failed' as const, generation: { status: 'falhou' as const, attempts: 3, errorCode: 'incomplete-response' as const, startedAt: null } }
    vi.mocked(getLatestPlan).mockResolvedValueOnce(null).mockResolvedValueOnce(failed)
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan({ pollMs: 1 }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.generatePlan() })
    expect(result.current.generationError).toMatch(/não foi possível gerar/i)
    expect(localStorage.getItem('helux:workout-plan')).toBeNull()
  })

  it('024: repeatWeek cria a semana de repetição e recarrega o plano', async () => {
    const { getLatestPlan, repeatLastWeek } = await import('@/services/workout.service')
    const ready = { mesocycleId: 'm3', generatedAt: '2026-10-24T10:00:00Z', today: { letter: 'A', focus: 'Superior', exercises: [], adjusted: false }, upcoming: [], progress: { completed: 0, total: 4 } }
    vi.mocked(getLatestPlan).mockResolvedValueOnce(null).mockResolvedValueOnce(ready)
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.repeatWeek() })
    expect(repeatLastWeek).toHaveBeenCalled()
    expect(result.current.plan?.mesocycleId).toBe('m3')
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

    it('024: plano solto do gerador antigo (mesocycleId null) no cache é descartado e busca de novo', async () => {
      const legacy = { ...cachedPlan('ignorado'), mesocycleId: null } as { today: Record<string, unknown> }
      delete legacy.today.tiredness
      localStorage.setItem('helux:workout-plan', JSON.stringify(legacy))
      const { getLatestPlan } = await import('@/services/workout.service')
      const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
      const { result } = renderHook(() => useWorkoutPlan())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(getLatestPlan).toHaveBeenCalled()
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
