import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { REGIONS } from '@helux/types'
import { authenticate } from './nutrition-auth'
import {
  InvalidModalityError,
  createRoutineLog,
  deleteRoutineLog,
  getRoutinesView,
  saveComplementaryPreferences,
} from '../services/routines.service'
import { todaySlug } from '../services/tiredness.service'

const CategorySchema = z.enum(['alongamento-mobilidade', 'core-abdominal', 'cardio'])

const StretchCorePrefSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  targetMinutes: z.number().int().min(5).max(30).optional(),
  focusRegions: z.array(z.enum(REGIONS)).optional(),
})

const CardioPrefSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  targetMinutes: z.number().int().min(10).max(90).optional(),
  preferredModality: z.string().min(1).max(60).optional(),
})

const PreferencesSchema = z.object({
  'alongamento-mobilidade': StretchCorePrefSchema.optional(),
  'core-abdominal': StretchCorePrefSchema.optional(),
  cardio: CardioPrefSchema.optional(),
})

const LogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  setsCompleted: z.number().int().nonnegative(),
  secondsOrReps: z.string().max(60).optional(),
})

const CreateLogSchema = z.object({
  category: CategorySchema,
  performed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_minutes: z.number().int().min(1).max(240),
  modality: z.string().min(1).max(80).nullable().optional(),
  zone: z.enum(['leve', 'moderada', 'intervalado-leve']).nullable().optional(),
  effort: z.number().int().min(1).max(10).nullable().optional(),
  items: z.array(LogItemSchema),
  notes: z.string().max(500).nullable().optional(),
})

/** Rotinas complementares de alongamento/mobilidade, core/abdominal e cardio (spec 030). */
export async function routinesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { days?: string } }>('/api/routines', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const daysParam = request.query?.days ? Number(request.query.days) : undefined
      const days = daysParam && Number.isFinite(daysParam) ? daysParam : undefined
      const view = await getRoutinesView(auth.user.id, auth.supabase, { days })
      return reply.send(view)
    } catch (error) {
      app.log.error(error, 'routines: failed to load view')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put('/api/routines/preferences', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = PreferencesSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }
    try {
      const view = await saveComplementaryPreferences(auth.user.id, parsed.data, auth.supabase)
      return reply.send(view)
    } catch (error) {
      if (error instanceof InvalidModalityError) {
        return reply.code(400).send({ error: 'invalid-modality', message: error.message })
      }
      app.log.error(error, 'routines: failed to save preferences')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/routines/logs', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = CreateLogSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }
    const today = todaySlug()
    if (parsed.data.performed_on > today) {
      return reply.code(400).send({
        error: 'future-date',
        message: 'Não é possível registrar uma rotina complementar em data futura.',
      })
    }
    try {
      const result = await createRoutineLog(auth.user.id, parsed.data, auth.supabase)
      return reply.code(201).send(result)
    } catch (error) {
      app.log.error(error, 'routines: failed to create log')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete<{ Params: { id: string } }>('/api/routines/logs/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const deleted = await deleteRoutineLog(auth.user.id, request.params.id, auth.supabase)
      if (!deleted) {
        return reply.code(404).send({ error: 'Not Found' })
      }
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'routines: failed to delete log')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
