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
})
