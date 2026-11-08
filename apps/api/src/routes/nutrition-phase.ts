import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { loadNutritionContext } from '../services/nutrition-context.service'
import { applyRecalibration, createPhase, currentBodyFat, endPhase, evaluateRecalibration, toCalibration } from '../services/diet-phase.service'
import { authenticate } from './nutrition-auth'

const CreateBodySchema = z.object({
  goal: z.enum(['perder_gordura', 'ganhar_massa', 'recomposicao', 'manutencao']),
  durationWeeks: z.number().int().min(4).max(52),
})

/** Fase de dieta (spec 018, US0): consultar, iniciar e encerrar; recalibrar sob demanda (spec 029, US3). */
export async function nutritionPhaseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/nutrition/phase', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      let calibrations: ReturnType<typeof toCalibration>[] = []
      if (ctx.phase) {
        const { data, error } = await auth.supabase
          .from('diet_phase_calibrations')
          .select('*')
          .eq('phase_id', ctx.phase.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        calibrations = ((data ?? []) as Parameters<typeof toCalibration>[0][]).map(toCalibration)
      }
      return reply.send({
        phase: ctx.phase,
        calibrations,
        bodyFatPct: currentBodyFat(ctx),
        missing: ctx.missing,
      })
    } catch (error) {
      app.log.error(error, 'nutrition phase: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/nutrition/phase', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = CreateBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      const result = await createPhase(auth.user.id, auth.supabase, parsed.data, ctx)
      if ('error' in result) return reply.code(409).send(result)
      return reply.code(201).send(result)
    } catch (error) {
      app.log.error(error, 'nutrition phase: failed to create')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/nutrition/phase/end', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const phase = await endPhase(auth.user.id, auth.supabase)
      if (!phase) return reply.code(404).send({ error: 'Not Found' })
      return reply.send({ phase })
    } catch (error) {
      app.log.error(error, 'nutrition phase: failed to end')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  // Spec 029 (FR-021): só calcula — nada é gravado.
  app.post('/api/nutrition/phase/recalibration/preview', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      return reply.send(evaluateRecalibration(ctx))
    } catch (error) {
      app.log.error(error, 'nutrition phase: recalibration preview failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  // Spec 029 (FR-021): recalcula no servidor e aplica; o cliente nunca manda metas.
  app.post('/api/nutrition/phase/recalibration', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const ctx = await loadNutritionContext(auth.user.id, auth.supabase)
      const result = await applyRecalibration(auth.user.id, auth.supabase, ctx)
      if ('evaluation' in result) return reply.code(409).send({ error: result.evaluation.status, ...result.evaluation })
      return reply.send(result)
    } catch (error) {
      app.log.error(error, 'nutrition phase: recalibration failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
