import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const CheckinBodySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  weight_kg: z.number().min(20).max(500).optional(),
  body_fat_pct: z.number().min(1).max(70).optional(),
  waist_cm: z.number().min(30).max(300).optional(),
  hip_cm: z.number().min(30).max(300).optional(),
  arm_cm: z.number().min(10).max(100).optional(),
  leg_cm: z.number().min(10).max(150).optional(),
  squat_kg: z.number().min(0).max(1000).optional(),
  bench_kg: z.number().min(0).max(1000).optional(),
  deadlift_kg: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional(),
})

export async function checkinsRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  async function getUser(authHeader: string | undefined, reply: any) {
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

  app.post('/api/checkins', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const parsed = CheckinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }

    const { month, ...fields } = parsed.data
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { data, error } = await supabase
      .from('body_checkins')
      .upsert({ user_id: auth.user.id, month, ...fields }, { onConflict: 'user_id,month' })
      .select('*')
      .single()

    if (error) {
      app.log.error(error, 'checkins upsert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send(data)
  })

  app.get('/api/checkins', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const query = request.query as { limit?: string }
    const limit = Math.min(Number(query.limit ?? 13), 60)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    // RLS on the user-scoped client enforces user isolation; no explicit .eq() needed
    const { data: checkins, error } = await supabase
      .from('body_checkins')
      .select('*')
      .order('month', { ascending: false })
      .range(0, limit - 1)

    if (error) {
      app.log.error(error, 'checkins query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ checkins: checkins ?? [] })
  })
}
