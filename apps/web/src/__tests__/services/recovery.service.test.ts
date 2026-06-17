import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('recovery.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getLatestRecovery calls GET /api/recovery/latest', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const mockData = { date: '2026-06-15', hrv: 58, restingHR: 52, activeCalories: 420, source: 'healthkit' }
    vi.mocked(apiFetch).mockResolvedValueOnce(mockData)
    const { getLatestRecovery } = await import('@/services/recovery.service')
    const result = await getLatestRecovery()
    expect(apiFetch).toHaveBeenCalledWith('/api/recovery/latest')
    expect(result).toEqual(mockData)
  })

  it('returns null on 404', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 404'))
    const { getLatestRecovery } = await import('@/services/recovery.service')
    const result = await getLatestRecovery()
    expect(result).toBeNull()
  })
})
