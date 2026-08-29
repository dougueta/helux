import type { FastifyInstance, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { UserTrainingProfile } from '@helux/types'

const ProfileBodySchema = z.object({
  goal: z.string().max(300).optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
  trainingTime: z.string().max(300).optional(),
  timeOff: z.string().max(300).optional(),
  currentInjury: z.string().max(300).optional(),
})

interface ProfileRow {
  goal: string | null
  level: 'iniciante' | 'intermediario' | 'avancado' | null
  training_time: string | null
  time_off: string | null
  current_injury: string | null
  updated_at: string
}

function toProfile(row: ProfileRow): UserTrainingProfile {
  return {
    goal: row.goal,
    level: row.level,
    trainingTime: row.training_time,
    timeOff: row.time_off,
    currentInjury: row.current_injury,
    updatedAt: row.updated_at,
  }
}

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  async function getUser(authHeader: string | undefined, reply: FastifyReply) {
    if (!authHeader?.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Unauthorized' })
      return null
    }
    const token = authHeader.slice(7)
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error } = await verifyClient.auth.getUser(token)
    if (error || !user) {
      await reply.code(401).send({ error: 'Unauthorized' })
      return null
    }
    return { user, token }
  }

  app.get('/api/profile', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { data, error } = await supabase
      .from('user_training_profile')
      .select('*')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (error) {
      app.log.error(error, 'profile query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ profile: data ? toProfile(data as ProfileRow) : null })
  })

  app.post('/api/profile', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const parsed = ProfileBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }

    const { goal, level, trainingTime, timeOff, currentInjury } = parsed.data
    const fields: Record<string, unknown> = {}
    if (goal !== undefined) fields.goal = goal
    if (level !== undefined) fields.level = level
    if (trainingTime !== undefined) fields.training_time = trainingTime
    if (timeOff !== undefined) fields.time_off = timeOff
    if (currentInjury !== undefined) fields.current_injury = currentInjury

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { data, error } = await supabase
      .from('user_training_profile')
      .upsert({ user_id: auth.user.id, ...fields }, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      app.log.error(error, 'profile upsert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ profile: toProfile(data as ProfileRow) })
  })
}
