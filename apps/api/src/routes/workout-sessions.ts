import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const SetSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  effort: z.number().min(1).max(10),
})

const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(SetSchema),
})

const SessionBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_s: z.number().int().nonnegative().optional(),
  exercises: z.array(ExerciseSchema),
})

export async function workoutSessionsRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.post('/api/workouts/sessions', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const token = authHeader.slice(7)

    // Verify token validity
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const parsed = SessionBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }

    const { date, duration_s, exercises } = parsed.data

    // Use user-scoped client so auth.uid() is set and RLS passes
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, date, duration_s, exercises })
      .select('id, created_at')
      .single()

    if (error) {
      app.log.error(error, 'workout-sessions insert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.code(201).send(data)
  })
}
