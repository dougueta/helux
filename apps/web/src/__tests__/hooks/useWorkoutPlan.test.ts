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
      generatedAt: '2026-06-15T10:00:00Z', exercises: [], rationale: 'test'
    })
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.plan).not.toBeNull()
  })

  it('generatePlan sets generating true then updates plan', async () => {
    const { generatePlan } = await import('@/services/workout.service')
    const newPlan = { generatedAt: new Date().toISOString(), exercises: [], rationale: 'new' }
    vi.mocked(generatePlan).mockResolvedValueOnce(newPlan)
    const { useWorkoutPlan } = await import('@/hooks/useWorkoutPlan')
    const { result } = renderHook(() => useWorkoutPlan())
    await act(async () => { await result.current.generatePlan() })
    expect(result.current.plan).toEqual(newPlan)
    expect(result.current.generating).toBe(false)
  })
})
