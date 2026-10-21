import { describe, it, expect, vi, beforeEach } from 'vitest'

let jar: Record<string, string> = {}
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n: string) => (n in jar ? { value: jar[n] } : undefined), getAll: () => [] }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { serverFetch } from '@/lib/server-api'

describe('serverFetch (021 T006, R-C)', () => {
  beforeEach(() => {
    jar = {}
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test'
  })

  it('real: fetch na API com a URL base e o init recebido', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"a":1}'))
    const res = await serverFetch('/health', { headers: { Authorization: 'Bearer t' } })
    expect(await res.json()).toEqual({ a: 1 })
    expect(mockFetch).toHaveBeenCalledWith('http://api.test/health', { headers: { Authorization: 'Bearer t' } })
  })

  it('mock: resposta do roteador local, sem rede', async () => {
    jar['helux-data-source'] = 'mock'
    const res = await serverFetch('/health')
    expect(res.ok).toBe(true)
    expect(await res.json()).toMatchObject({ status: 'ok', mock: true })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('mock: erro do roteador vira status HTTP', async () => {
    jar['helux-data-source'] = 'mock'
    const res = await serverFetch('/nao/existe')
    expect(res.status).toBe(404)
    expect(res.ok).toBe(false)
  })
})
