import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { computeRecoveryFromSamples } from '../services/recovery.service'

export async function recoveryLatestRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/api/recovery/latest', async (request, reply) => {
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

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: samples, error } = await supabase
      .from('health_samples')
      .select('type, value, unit, start_at')
      .eq('user_id', user.id)
      .gte('start_at', since)
      .order('start_at', { ascending: false })

    if (error) {
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    if (!samples || samples.length === 0) {
      return reply.code(404).send({ error: 'No data found' })
    }

    const recovery = computeRecoveryFromSamples(samples)

    return reply.send(recovery)
  })
}
