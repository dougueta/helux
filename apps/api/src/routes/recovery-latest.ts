import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import type { RecoveryData } from '@helux/types'

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

    const avg = (arr: number[]): number | undefined =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

    const hrv = avg(samples.filter(s => s.type === 'hrv').map(s => Number(s.value)))
    const restingHR = avg(samples.filter(s => s.type === 'heart_rate').map(s => Number(s.value)))
    const activeCalories = sum(samples.filter(s => s.type === 'active_energy').map(s => Number(s.value)))
    const sleepSample = samples.find(s => s.type === 'sleep_duration')
    const sleepHours = sleepSample ? Number(sleepSample.value) : undefined

    const latestDate = samples[0]?.start_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]

    const recovery: RecoveryData = {
      date: latestDate,
      hrv: hrv !== undefined ? Math.round(hrv) : undefined,
      restingHR: restingHR !== undefined ? Math.round(restingHR) : undefined,
      activeCalories: Math.round(activeCalories),
      sleepHours,
      source: 'healthkit',
    }

    return reply.send(recovery)
  })
}
