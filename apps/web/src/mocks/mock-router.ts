import { ApiError } from '@/services/api-client'
import type { MockStore } from './mock-store'
import type { MockDataset } from './types'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface MockRequest {
  data: MockDataset
  store: MockStore
  query: URLSearchParams
  body: unknown
  params: Record<string, string>
}

export type MockHandler = (req: MockRequest) => unknown

export interface MockRouter {
  /** Resolve a requisição em memória: JSON da resposta ou `ApiError` (como o `apiFetch`). */
  dispatch(path: string, options?: RequestInit): Promise<unknown>
  /** `pattern` aceita segmentos `:param` (ex.: `/api/items/:id`). */
  register(method: Method, pattern: string, handler: MockHandler): void
}

interface Route {
  method: Method
  regex: RegExp
  keys: string[]
  handler: MockHandler
}

function compile(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = []
  const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, (_m, k: string) => {
    keys.push(k)
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${source}/?$`), keys }
}

/** Roteador do modo mock (spec 021): mesma forma de resposta da API real. */
export function createMockRouter(store: MockStore): MockRouter {
  const routes: Route[] = []

  const router: MockRouter = {
    register(method, pattern, handler) {
      routes.push({ method, ...compile(pattern), handler })
    },

    async dispatch(path, options = {}) {
      const url = new URL(path, 'http://mock.local')
      const method = (options.method ?? 'GET').toUpperCase() as Method
      const data = store.getDataset()
      if (data.failReads && method === 'GET') throw new ApiError('HTTP 503')

      for (const route of routes) {
        if (route.method !== method) continue
        const match = route.regex.exec(url.pathname)
        if (!match) continue
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]))
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : undefined
        const result = await route.handler({ data, store, query: url.searchParams, body, params })
        return result === undefined ? result : structuredClone(result)
      }
      throw new ApiError('HTTP 404')
    },
  }

  router.register('GET', '/health', () => ({ status: 'ok', mock: true }))
  return router
}
