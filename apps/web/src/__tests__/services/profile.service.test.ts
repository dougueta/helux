import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('profile.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getProfile calls GET /api/profile and returns the profile', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const profile = { goal: 'Hipertrofia', level: 'intermediario', updatedAt: '2026-08-27T00:00:00Z' }
    vi.mocked(apiFetch).mockResolvedValueOnce({ profile })
    const { getProfile } = await import('@/services/profile.service')
    const result = await getProfile()
    expect(apiFetch).toHaveBeenCalledWith('/api/profile')
    expect(result).toEqual(profile)
  })

  it('getProfile returns null when the user never filled the profile', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ profile: null })
    const { getProfile } = await import('@/services/profile.service')
    const result = await getProfile()
    expect(result).toBeNull()
  })

  it('getProfile returns null on error', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 401'))
    const { getProfile } = await import('@/services/profile.service')
    const result = await getProfile()
    expect(result).toBeNull()
  })

  it('upsertProfile calls POST /api/profile with body', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const saved = { goal: 'Hipertrofia', level: 'avancado', updatedAt: '2026-08-27T00:00:00Z' }
    vi.mocked(apiFetch).mockResolvedValueOnce({ profile: saved })
    const { upsertProfile } = await import('@/services/profile.service')
    const result = await upsertProfile({ goal: 'Hipertrofia', level: 'avancado' })
    expect(apiFetch).toHaveBeenCalledWith('/api/profile', {
      method: 'POST',
      body: JSON.stringify({ goal: 'Hipertrofia', level: 'avancado' }),
    })
    expect(result).toEqual(saved)
  })
})
