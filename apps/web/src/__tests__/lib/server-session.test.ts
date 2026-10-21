import { describe, it, expect, vi, beforeEach } from 'vitest'

let jar: Record<string, string> = {}
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n: string) => (n in jar ? { value: jar[n] } : undefined), getAll: () => [] }),
}))
const getSession = vi.fn()
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: () => ({ auth: { getSession } }) }))

import { getServerSession, MOCK_SESSION } from '@/lib/server-session'

describe('getServerSession (021 T006, R-B)', () => {
  beforeEach(() => {
    jar = {}
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('mock: sessão fake, sem Supabase', async () => {
    jar['helux-data-source'] = 'mock'
    await expect(getServerSession()).resolves.toEqual(MOCK_SESSION)
    expect(MOCK_SESSION.access_token).toBe('mock-token')
    expect(MOCK_SESSION.user.email).toBe('atleta.mock@helux.dev')
    expect(getSession).not.toHaveBeenCalled()
  })

  it('real: sessão do Supabase (ou null)', async () => {
    getSession.mockResolvedValueOnce({ data: { session: { access_token: 't', user: { email: 'a@b.c' } } } })
    await expect(getServerSession()).resolves.toMatchObject({ access_token: 't' })
    getSession.mockResolvedValueOnce({ data: { session: null } })
    await expect(getServerSession()).resolves.toBeNull()
  })
})
