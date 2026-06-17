import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

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
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`)
  }

  return response.json()
}
