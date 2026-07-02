import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export interface ApiErrorDetail {
  path: (string | number)[]
  message: string
}

export class ApiError extends Error {
  details?: ApiErrorDetail[]

  constructor(message: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.details = details
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const parsed = body as { error?: string; details?: ApiErrorDetail[] }
    throw new ApiError(parsed.error ?? `HTTP ${response.status}`, parsed.details)
  }

  return response.json()
}
