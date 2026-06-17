import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockAnalytics = {
  weeklyVolume: Array.from({ length: 8 }, (_, i) => ({ weekStart: `2026-04-${String(i + 1).padStart(2, '0')}`, tonnage: i * 100, sessions: i > 0 ? 1 : 0 })),
  personalRecords: [{ exerciseName: 'Agachamento', maxWeight: 100, reps: 8, achievedAt: '2026-06-15' }],
  totalSessions: 5,
  currentStreakWeeks: 2,
  thisWeekSessions: 1,
}

vi.mock('@/services/workout.service', () => ({
  getWorkoutAnalytics: vi.fn(),
}))

describe('useWorkoutAnalytics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts loading and then returns data', async () => {
    const { getWorkoutAnalytics } = await import('@/services/workout.service')
    vi.mocked(getWorkoutAnalytics).mockResolvedValueOnce(mockAnalytics as any)

    const { useWorkoutAnalytics } = await import('@/hooks/useWorkoutAnalytics')
    const { result } = renderHook(() => useWorkoutAnalytics())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockAnalytics)
  })

  it('returns null data when service fails', async () => {
    const { getWorkoutAnalytics } = await import('@/services/workout.service')
    vi.mocked(getWorkoutAnalytics).mockResolvedValueOnce(null)

    const { useWorkoutAnalytics } = await import('@/hooks/useWorkoutAnalytics')
    const { result } = renderHook(() => useWorkoutAnalytics())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
  })
})
