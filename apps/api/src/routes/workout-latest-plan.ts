import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import type { NextWorkoutPlan } from '@helux/types'

export async function workoutLatestPlanRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/workout/latest-plan', async (request, reply) => {
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data, error } = await supabase
      .from('workout_plans')
      .select('generated_at, exercises, rationale')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      app.log.error(error, 'workout-latest-plan query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    if (!data) {
      return reply.status(404).send({
        error: 'Nenhum plano gerado ainda. Use POST /workout/generate para criar o primeiro plano.',
      })
    }

    const plan: NextWorkoutPlan = {
      generatedAt: data.generated_at,
      exercises: data.exercises,
      rationale: data.rationale,
    }

    return reply.send(plan)
  })
}
