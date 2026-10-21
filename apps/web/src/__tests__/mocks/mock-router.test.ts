import { describe, it, expect } from 'vitest'
import { createMockRouter } from '@/mocks/mock-router'
import { ApiError } from '@/services/api-client'
import type { MockStore } from '@/mocks/mock-store'
import type { MockDataset } from '@/mocks/types'

function fakeStore(dataset: Partial<MockDataset> = {}): MockStore {
  let d = dataset as MockDataset
  return {
    getDataset: () => d,
    updateDataset: u => (d = { ...d, ...u(d) }),
    reset: () => d,
    loadPersona: () => d,
    wasCorrupted: () => false,
  }
}

describe('mock-router (T004)', () => {
  it('GET /health responde ok', async () => {
    const router = createMockRouter(fakeStore())
    await expect(router.dispatch('/health')).resolves.toEqual({ status: 'ok', mock: true })
  })

  it('rota desconhecida → ApiError 404', async () => {
    const router = createMockRouter(fakeStore())
    await expect(router.dispatch('/nao/existe')).rejects.toBeInstanceOf(ApiError)
    await expect(router.dispatch('/nao/existe')).rejects.toThrow('HTTP 404')
  })

  it('casa método + path, ignora a query no casamento e passa a query ao handler', async () => {
    const router = createMockRouter(fakeStore())
    router.register('GET', '/eco', ({ query }) => ({ limit: query.get('limit') }))
    router.register('POST', '/eco', ({ body }) => ({ got: body }))
    await expect(router.dispatch('/eco?limit=3')).resolves.toEqual({ limit: '3' })
    await expect(router.dispatch('/eco', { method: 'POST', body: JSON.stringify({ a: 1 }) })).resolves.toEqual({ got: { a: 1 } })
    await expect(router.dispatch('/eco', { method: 'PUT' })).rejects.toThrow('HTTP 404')
  })

  it('aceita a URL absoluta (com NEXT_PUBLIC_API_URL)', async () => {
    const router = createMockRouter(fakeStore())
    await expect(router.dispatch('http://localhost:3001/health')).resolves.toMatchObject({ status: 'ok' })
  })

  it('persona network-error: leituras falham com 503, health inclusive', async () => {
    const router = createMockRouter(fakeStore({ failReads: true }))
    await expect(router.dispatch('/health')).rejects.toThrow('HTTP 503')
  })

  it('devolve cópias: mexer na resposta não altera o store', async () => {
    const store = fakeStore({ bodyCheckins: [] })
    const router = createMockRouter(store)
    router.register('GET', '/x', ({ data }) => ({ list: data.bodyCheckins }))
    const res = (await router.dispatch('/x')) as { list: unknown[] }
    res.list.push(1)
    expect(store.getDataset().bodyCheckins).toEqual([])
  })
})
