import { describe, it, expect, vi, afterEach } from 'vitest'

let jar: Record<string, string> = {}
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n: string) => (n in jar ? { value: jar[n] } : undefined), getAll: () => [] }),
}))
const getSession = vi.fn().mockResolvedValue({ data: { session: null } })
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: () => ({ auth: { getSession } }) }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

import { getDataSource, resolveDataSource, setDataSource, shouldBypassAuth, showDevBar } from '@/lib/data-source'
import { getServerSession, MOCK_SESSION } from '@/lib/server-session'
import DevDemosPage from '@/app/dev/demos/page'

describe('guarda de produção (021 T018, FR-008/SC-006)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    jar = {}
  })

  it('com NODE_ENV=production tudo é real, mesmo com cookie e env em mock', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', 'mock')
    jar['helux-data-source'] = 'mock'
    document.cookie = 'helux-data-source=mock; path=/'

    expect(resolveDataSource({ nodeEnv: 'production', cookie: 'mock', envDefault: 'mock' })).toBe('real')
    expect(getDataSource()).toBe('real')
    expect(shouldBypassAuth({ cookies: { get: () => ({ value: 'mock' }) } })).toBe(false)
    expect(await getServerSession()).not.toEqual(MOCK_SESSION)
    expect(getSession).toHaveBeenCalled()
    expect(showDevBar()).toBe(false)
    setDataSource('real')
  })

  it('com NODE_ENV=production a galeria /dev/demos não existe (028)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => DevDemosPage({ searchParams: {} })).toThrow('NEXT_NOT_FOUND')
  })

  it('fora de produção a Dev Bar aparece', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(showDevBar()).toBe(true)
  })
})
