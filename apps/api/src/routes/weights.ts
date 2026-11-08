import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { BodyWeight } from '@helux/types'
import { addDays } from '@helux/nutrition'
import { authenticate } from './nutrition-auth'
import { isValidDate, localToday } from '../services/local-date'

// Spec 029 (US1): pesagens — uma por usuário por dia, sem datas futuras.

const ListQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(730).default(90) })
const PutBodySchema = z.object({ weight_kg: z.number().min(20).max(500) })

const toWeight = (row: Record<string, unknown>): BodyWeight => ({
  id: String(row.id),
  date: String(row.date),
  weight_kg: Number(row.weight_kg),
})

export async function weightsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/weights', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = ListQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })

    const today = localToday()
    const { data, error } = await auth.supabase
      .from('body_weights')
      .select('id, date, weight_kg')
      .eq('user_id', auth.user.id)
      .gte('date', addDays(today, -(parsed.data.days - 1)))
      .lte('date', today)
      .order('date', { ascending: true })
    if (error) {
      app.log.error(error, 'weights: list failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    return reply.send({ weights: (data ?? []).map(toWeight) })
  })

  app.put<{ Params: { date: string } }>('/api/weights/:date', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { date } = request.params
    if (!isValidDate(date)) return reply.code(400).send({ error: 'Bad Request', details: [{ path: ['date'], message: 'date must be YYYY-MM-DD' }] })
    if (date > localToday()) return reply.code(400).send({ error: 'future-date' })
    const parsed = PutBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })

    try {
      const { data: existing, error: findError } = await auth.supabase
        .from('body_weights')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('date', date)
        .maybeSingle()
      if (findError) throw findError

      const { data, error } = await auth.supabase
        .from('body_weights')
        .upsert(
          { user_id: auth.user.id, date, weight_kg: parsed.data.weight_kg, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        )
        .select('id, date, weight_kg')
        .single()
      if (error) throw error
      return reply.send({ weight: toWeight(data as Record<string, unknown>), replaced: existing != null })
    } catch (error) {
      app.log.error(error, 'weights: save failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete<{ Params: { date: string } }>('/api/weights/:date', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { date } = request.params
    if (!isValidDate(date)) return reply.code(400).send({ error: 'Bad Request' })

    try {
      const { data: existing, error: findError } = await auth.supabase
        .from('body_weights')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('date', date)
        .maybeSingle()
      if (findError) throw findError
      if (!existing) return reply.code(404).send({ error: 'Not Found' })

      const { error } = await auth.supabase.from('body_weights').delete().eq('user_id', auth.user.id).eq('date', date)
      if (error) throw error
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'weights: delete failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
