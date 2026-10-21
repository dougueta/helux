import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSession = vi.fn().mockResolvedValue({ data: { session: { access_token: 'real-token' } } })
vi.mock('@/lib/supabase-browser', () => ({ createSupabaseBrowserClient: () => ({ auth: { getSession } }) }))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { apiFetch } from '@/services/api-client'
import { setDataSource } from '@/lib/data-source'
import { resetBrowserMock } from '@/mocks/runtime'

describe('apiFetch: mock vs real (021 T005)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    resetBrowserMock()
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
  })

  it('mock: responde do roteador local sem rede nem Supabase', async () => {
    setDataSource('mock')
    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok', mock: true })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getSession).not.toHaveBeenCalled()
  })

  it('mock: rota desconhecida rejeita como a API (ApiError)', async () => {
    setDataSource('mock')
    await expect(apiFetch('/nao/existe')).rejects.toThrow('HTTP 404')
  })

  it('real: comportamento atual, com o Bearer da sessão', async () => {
    setDataSource('real')
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok' }) })
    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok' })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer real-token' }) }),
    )
  })
})
