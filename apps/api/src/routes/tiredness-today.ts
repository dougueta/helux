import type { FastifyInstance, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'

function todaySlug(): string {
  return new Date().toISOString().slice(0, 10)
}

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
    return { user, token }
  }

  app.post('/api/tiredness-today', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { error } = await supabase
      .from('daily_tiredness_signals')
      .upsert({ user_id: auth.user.id, date: todaySlug() }, { onConflict: 'user_id,date' })
      .select('id')
      .single()

    if (error) {
      app.log.error(error, 'tiredness-today upsert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ active: true })
  })

  app.delete('/api/tiredness-today', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { error } = await supabase
      .from('daily_tiredness_signals')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('date', todaySlug())

    if (error) {
      app.log.error(error, 'tiredness-today delete error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ active: false })
  })
}
