import type { FastifyReply, FastifyRequest } from 'fastify'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

/**
 * Autenticação das rotas de nutrição (spec 018): valida o Bearer token e
 * devolve o usuário + um cliente Supabase com o token dele (RLS). Responde
 * 401 e devolve null quando inválido.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    await reply.code(401).send({ error: 'Unauthorized' })
    return null
  }
  const token = authHeader.slice(7)
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
  const { data: { user }, error } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (error || !user) {
    await reply.code(401).send({ error: 'Unauthorized' })
    return null
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  return { user, supabase }
}
