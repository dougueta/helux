import { cookies } from 'next/headers'
import { serverDataSource, serverPersonaId, type CookieReader } from '@/lib/data-source'
import { ApiError } from '@/services/api-client'

const NO_COOKIES: CookieReader = { get: () => undefined }

/** Cookies da requisição; fora de uma requisição (ex.: testes), nenhum. */
export function requestCookies(): CookieReader {
  try {
    return cookies()
  } catch {
    return NO_COOKIES
  }
}

/**
 * `fetch` das páginas de servidor para a API (spec 021, R-C). Em modo mock
 * responde com o roteador local sobre o dataset inicial da persona do cookie
 * (o servidor não enxerga o `localStorage`), no mesmo formato de `Response`.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const jar = requestCookies()
  if (process.env.NODE_ENV !== 'production' && serverDataSource(jar) === 'mock') {
    const { getServerMock } = await import('@/mocks/runtime')
    try {
      const body = await getServerMock(serverPersonaId(jar)).router.dispatch(path, { method: init?.method, body: init?.body })
      return new Response(JSON.stringify(body ?? null), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      const status = error instanceof ApiError ? Number(/HTTP (\d+)/.exec(error.message)?.[1] ?? 500) : 500
      return new Response(JSON.stringify({ error: (error as Error).message }), { status })
    }
  }
  return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}${path}`, init)
}

/** Plano mais recente para as páginas de servidor (Home, Treinos, preview); null se falhar. */
export async function getLatestPlan(token: string) {
  try {
    const res = await serverFetch(`/workout/latest-plan`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}
