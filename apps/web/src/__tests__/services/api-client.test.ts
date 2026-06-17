import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase browser client
vi.mock('@/lib/supabase-browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } },
      }),
    },
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('apiFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
  })

  it('injects Bearer token from Supabase session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    })

    const { apiFetch } = await import('@/services/api-client')
    await apiFetch('/health')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    )
  })

  it('prefixes NEXT_PUBLIC_API_URL to path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { apiFetch } = await import('@/services/api-client')
    await apiFetch('/workout/latest-plan')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/workout/latest-plan',
      expect.anything()
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    })

    const { apiFetch } = await import('@/services/api-client')
    await expect(apiFetch('/api/recovery/latest')).rejects.toThrow()
  })
})
