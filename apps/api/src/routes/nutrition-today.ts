import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { MealSwap } from '@helux/types'
import { swapOptions } from '@helux/nutrition'
import { loadNutritionContext } from '../services/nutrition-context.service'
import { computeToday, nutritionHistory } from '../services/nutrition-day.service'
import { authenticate } from './nutrition-auth'

const PutBodySchema = z.object({ dayType: z.enum(['treino', 'descanso']) })
const SwapQuerySchema = z.object({ mealId: z.string().min(1), foodId: z.string().min(1) })
const SwapBodySchema = z.object({ mealId: z.string().min(1), fromFoodId: z.string().min(1), toFoodId: z.string().min(1) })
const HistoryQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(60).default(14) })

/** O dia (spec 018, US1): plano, tipo do dia, troca rápida e histórico. */
export async function nutritionTodayRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/nutrition/today', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      return reply.send(await computeToday(auth.user.id, auth.supabase, ctx))
    } catch (error) {
      app.log.error(error, 'nutrition today: failed to compute')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put('/api/nutrition/today', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = PutBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      const override = parsed.data.dayType === 'descanso' ? 'descanso' : null
      return reply.send(await computeToday(auth.user.id, auth.supabase, ctx, { override }))
    } catch (error) {
      app.log.error(error, 'nutrition today: failed to set day type')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.get('/api/nutrition/today/swap-options', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = SwapQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      const today = await computeToday(auth.user.id, auth.supabase, ctx)
      if (today.status !== 'ok') return reply.code(409).send(today)
      const { mealId, foodId } = parsed.data
      const inPlan = today.plan.meals.find(m => m.id === mealId)?.items.some(i => i.foodId === foodId)
      if (!inPlan) return reply.code(404).send({ error: 'Not Found' })
      return reply.send({ options: swapOptions(today.plan, mealId, foodId, ctx.genetics.flags) })
    } catch (error) {
      app.log.error(error, 'nutrition today: failed to list swap options')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/nutrition/today/swap', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = SwapBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      const today = await computeToday(auth.user.id, auth.supabase, ctx)
      if (today.status !== 'ok') return reply.code(409).send(today)
      const swap: MealSwap = parsed.data
      const allowed = swapOptions(today.plan, swap.mealId, swap.fromFoodId, ctx.genetics.flags).some(o => o.food.id === swap.toFoodId)
      if (!allowed) return reply.code(400).send({ error: 'Bad Request', details: [{ path: ['toFoodId'], message: 'not a valid option' }] })
      const { data } = await auth.supabase
        .from('daily_nutrition_plans')
        .select('swaps')
        .eq('user_id', auth.user.id)
        .eq('date', ctx.today)
        .maybeSingle()
      const swaps = [...(((data as { swaps: MealSwap[] | null } | null)?.swaps) ?? []), swap]
      return reply.send(await computeToday(auth.user.id, auth.supabase, ctx, { swaps }))
    } catch (error) {
      app.log.error(error, 'nutrition today: failed to swap')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.get('/api/nutrition/history', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = HistoryQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const today = new Date().toISOString().slice(0, 10)
      return reply.send({ days: await nutritionHistory(auth.user.id, auth.supabase, today, parsed.data.limit) })
    } catch (error) {
      app.log.error(error, 'nutrition history: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
