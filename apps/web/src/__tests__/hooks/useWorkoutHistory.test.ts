import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('useWorkoutHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches history on mount', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({
      sessions: [{ id: 's1', date: '2026-06-15', duration_s: 3600, exercises: [], created_at: '' }],
      total: 1,
    })
    const { useWorkoutHistory } = await import('@/hooks/useWorkoutHistory')
    const { result } = renderHook(() => useWorkoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.sessions).toHaveLength(1)
    expect(result.current.total).toBe(1)
  })

  it('calls GET /api/workouts/history', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ sessions: [], total: 0 })
    const { useWorkoutHistory } = await import('@/hooks/useWorkoutHistory')
    renderHook(() => useWorkoutHistory())
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/api/workouts/history'))
    })
  })
})
