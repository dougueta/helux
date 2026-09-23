import type { FastifyInstance, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getTodayTirednessAssessment, todaySlug } from '../services/tiredness.service'

const PutBodySchema = z.object({
  level: z.enum(['otimo', 'normal', 'cansado', 'exausto']),
  overrideAutomatic: z.boolean().optional().default(false),
})

export async function tirednessTodayRoutes(app: FastifyInstance): Promise<void> {
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    return { user, supabase }
  }

  app.get('/api/tiredness-today', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    try {
      return reply.send(await getTodayTirednessAssessment(auth.user.id, auth.supabase))
    } catch (error) {
      app.log.error(error, 'tiredness-today: failed to load assessment')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put('/api/tiredness-today', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const parsed = PutBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }

    const { error } = await auth.supabase
      .from('daily_tiredness_signals')
      .upsert(
        {
          user_id: auth.user.id,
          date: todaySlug(),
          level: parsed.data.level,
          override_automatic: parsed.data.overrideAutomatic,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' },
      )

    if (error) {
      app.log.error(error, 'tiredness-today upsert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    try {
      return reply.send(await getTodayTirednessAssessment(auth.user.id, auth.supabase))
    } catch (err) {
      app.log.error(err, 'tiredness-today: failed to reload assessment')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
