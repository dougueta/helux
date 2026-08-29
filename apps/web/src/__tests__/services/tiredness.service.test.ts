import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('tiredness.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('markTiredToday calls POST /api/tiredness-today and returns active', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ active: true })
    const { markTiredToday } = await import('@/services/tiredness.service')
    const result = await markTiredToday()
    expect(apiFetch).toHaveBeenCalledWith('/api/tiredness-today', { method: 'POST' })
    expect(result).toEqual({ active: true })
  })

  it('clearTiredToday calls DELETE /api/tiredness-today and returns active', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ active: false })
    const { clearTiredToday } = await import('@/services/tiredness.service')
    const result = await clearTiredToday()
    expect(apiFetch).toHaveBeenCalledWith('/api/tiredness-today', { method: 'DELETE' })
    expect(result).toEqual({ active: false })
  })
})
