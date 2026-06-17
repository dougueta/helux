import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'

export async function workoutHistoryRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/api/workouts/history', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const token = authHeader.slice(7)

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const query = request.query as { limit?: string; offset?: string }
    const limit = Math.min(Number(query.limit ?? 20), 100)
    const offset = Number(query.offset ?? 0)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: sessions, error, count } = await supabase
      .from('workout_sessions')
      .select('id, date, duration_s, exercises, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      app.log.error(error, 'workout-history query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ sessions: sessions ?? [], total: count ?? 0 })
  })
}
