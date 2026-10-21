import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { isMockActive } from '@/lib/data-source'

export interface ApiErrorDetail {
  path: (string | number)[]
  message: string
}

export class ApiError extends Error {
  details?: ApiErrorDetail[]
  /** Código de erro da API (ex.: `budget-exceeded`, `safety-warning`) — spec 022. */
  code?: string
  /** Corpo completo da resposta de erro (ex.: `reasons`, `violations`). */
  body?: Record<string, unknown>

  constructor(message: string, details?: ApiErrorDetail[], code?: string, body?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.details = details
    this.code = code
    this.body = body
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  // A checagem literal de NODE_ENV deixa o bundler remover o modo mock do build de produção.
  if (process.env.NODE_ENV !== 'production' && isMockActive()) {
    // Modo mock (spec 021): resolve no navegador, sem Supabase nem rede.
    const { getBrowserMock } = await import('@/mocks/runtime')
    return getBrowserMock().router.dispatch(path, options)
  }

  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const parsed = body as { error?: string; details?: ApiErrorDetail[]; code?: string }
    throw new ApiError(parsed.error ?? `HTTP ${response.status}`, parsed.details, parsed.code, body as Record<string, unknown>)
  }

  // 204 (ex.: liga/desliga de fonte, remoções da spec 022) não tem corpo.
  if (response.status === 204) return null
  return response.json()
}
