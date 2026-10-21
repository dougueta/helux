import { serverDataSource } from '@/lib/data-source'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requestCookies } from '@/lib/server-api'

/** O que as páginas de servidor usam da sessão. */
export interface ServerSession {
  access_token: string
  user: { email?: string }
}

/** Sessão fake do modo mock (spec 021, R-B). */
export const MOCK_SESSION: ServerSession = {
  access_token: 'mock-token',
  user: { email: 'atleta.mock@helux.dev' },
}

/** Sessão da página de servidor: fake em modo mock, Supabase em modo real (ou null). */
export async function getServerSession(): Promise<ServerSession | null> {
  if (serverDataSource(requestCookies()) === 'mock') return MOCK_SESSION
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
