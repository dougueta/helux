import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('genetics.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getGeneticProfile calls GET /genetic-profile', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ traits: [] })
    const { getGeneticProfile } = await import('@/services/genetics.service')
    const result = await getGeneticProfile()
    expect(apiFetch).toHaveBeenCalledWith('/genetic-profile')
    expect(result).toEqual({ traits: [] })
  })

  it('returns null on error', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 404'))
    const { getGeneticProfile } = await import('@/services/genetics.service')
    const result = await getGeneticProfile()
    expect(result).toBeNull()
  })
})
