import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/services/recovery.service', () => ({
  getLatestRecovery: vi.fn(),
}))

describe('useRecovery', () => {
  it('fetches recovery on mount', async () => {
    const { getLatestRecovery } = await import('@/services/recovery.service')
    vi.mocked(getLatestRecovery).mockResolvedValueOnce({
      date: '2026-06-15', hrv: 58, restingHR: 52, activeCalories: 420, source: 'healthkit'
    })
    const { useRecovery } = await import('@/hooks/useRecovery')
    const { result } = renderHook(() => useRecovery())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).not.toBeNull()
    expect(result.current.hasData).toBe(true)
  })

  it('marks isStale when date is > 24h ago', async () => {
    const { getLatestRecovery } = await import('@/services/recovery.service')
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString().split('T')[0]
    vi.mocked(getLatestRecovery).mockResolvedValueOnce({
      date: oldDate, hrv: 52, restingHR: 55, activeCalories: 300, source: 'healthkit'
    })
    const { useRecovery } = await import('@/hooks/useRecovery')
    const { result } = renderHook(() => useRecovery())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isStale).toBe(true)
  })

  it('hasData is false when no data', async () => {
    const { getLatestRecovery } = await import('@/services/recovery.service')
    vi.mocked(getLatestRecovery).mockResolvedValueOnce(null)
    const { useRecovery } = await import('@/hooks/useRecovery')
    const { result } = renderHook(() => useRecovery())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasData).toBe(false)
  })
})
