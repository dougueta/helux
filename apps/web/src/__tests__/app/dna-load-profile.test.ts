import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadGeneticProfile } from '@/app/dna/load-profile'

const SUMMARY = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'baixo',
  predisposicao: 'misto',
  alertas: [],
}

function mockFetch(impl: (input?: unknown) => Promise<Response>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

describe('loadGeneticProfile (spec 017, US2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('200 → ok com o perfil e os marcadores', async () => {
    const traits = [{ key: 'a', gene: 'WNT16', label: 'Densidade', level: 0.9, note: 'n', warn: true }]
    const fetchFn = mockFetch(() => json({ ...SUMMARY, traits }))
    const state = await loadGeneticProfile()
    expect(state).toEqual({ status: 'ok', profile: { ...SUMMARY, traits } })
    expect(String(fetchFn.mock.calls[0][0])).toMatch(/\/genetic-profile$/)
  })

  it('200 sem traits (API antiga) → ok com lista vazia', async () => {
    mockFetch(() => json(SUMMARY))
    expect(await loadGeneticProfile()).toEqual({ status: 'ok', profile: { ...SUMMARY, traits: [] } })
  })

  it('404 → missing', async () => {
    mockFetch(() => json({ error: 'Perfil genético não encontrado' }, 404))
    expect(await loadGeneticProfile()).toEqual({ status: 'missing' })
  })

  it('500 (genera malformado) → error', async () => {
    mockFetch(() => json({ error: 'x' }, 500))
    expect(await loadGeneticProfile()).toEqual({ status: 'error' })
  })

  it('falha de rede → error', async () => {
    mockFetch(() => Promise.reject(new TypeError('fetch failed')))
    expect(await loadGeneticProfile()).toEqual({ status: 'error' })
  })

  it('JSON inválido → error', async () => {
    mockFetch(() => Promise.resolve(new Response('<html>', { status: 200 })))
    expect(await loadGeneticProfile()).toEqual({ status: 'error' })
  })
})
