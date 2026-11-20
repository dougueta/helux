import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { getTrainingCalendarMonthView } from '../services/workout-calendar.service'

export async function workoutCalendarRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/api/workouts/calendar', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const token = authHeader.slice(7)

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user },
      error: authError,
    } = await verifyClient.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const query = request.query as { month?: string }
    const result = await getTrainingCalendarMonthView(supabase, user.id, query.month)

    if (!result.ok) {
      return reply.code(400).send({ error: result.error })
    }

    return reply.send(result.view)
  })
}
