import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('checkin.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCheckins calls GET /api/checkins with limit', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ checkins: [] })
    const { getCheckins } = await import('@/services/checkin.service')
    const result = await getCheckins(2)
    expect(apiFetch).toHaveBeenCalledWith('/api/checkins?limit=2')
    expect(result).toEqual([])
  })

  it('getCheckins returns empty array on error', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 401'))
    const { getCheckins } = await import('@/services/checkin.service')
    const result = await getCheckins(2)
    expect(result).toEqual([])
  })

  it('upsertCheckin calls POST /api/checkins with body', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const saved = { id: 'c-1', month: '2026-06-01', weight_kg: 82, created_at: '2026-06-01T00:00:00Z' }
    vi.mocked(apiFetch).mockResolvedValueOnce(saved)
    const { upsertCheckin } = await import('@/services/checkin.service')
    const result = await upsertCheckin({ month: '2026-06-01', weight_kg: 82 })
    expect(apiFetch).toHaveBeenCalledWith('/api/checkins', {
      method: 'POST',
      body: JSON.stringify({ month: '2026-06-01', weight_kg: 82 }),
    })
    expect(result).toEqual(saved)
  })
})
