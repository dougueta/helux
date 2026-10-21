import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { editExercise, listAlternatives } from '../services/session-edit.service'
import { authenticate } from './nutrition-auth'

const ParamsSchema = z.object({ index: z.coerce.number().int().min(0), exerciseIndex: z.coerce.number().int().min(0) })
const PatchSchema = z
  .object({
    exerciseId: z.string().min(1).optional(),
    sets: z.number().int().min(1).max(10).optional(),
    reps: z.string().trim().min(1).max(30).optional(),
    load: z.string().trim().min(1).max(30).optional(),
    confirmSafetyOverride: z.boolean().optional(),
  })
  .refine(b => b.exerciseId !== undefined || b.sets !== undefined || b.reps !== undefined || b.load !== undefined, 'nada para editar')

/** Edição manual das sessões pendentes (spec 022, FR-009a). Não passa pelo teto de IA. */
export async function workoutSessionEditRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/workout/sessions/:index/exercises/:exerciseIndex/alternatives', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const params = ParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'Bad Request', details: params.error.errors })
    try {
      const alternatives = await listAlternatives(auth.user.id, auth.supabase, params.data.index, params.data.exerciseIndex)
      if (!alternatives) return reply.code(404).send({ error: 'Not Found' })
      return reply.send({ alternatives })
    } catch (err) {
      app.log.error(err, 'session edit: failed to list alternatives')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.patch('/api/workout/sessions/:index/exercises/:exerciseIndex', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const params = ParamsSchema.safeParse(request.params)
    const body = PatchSchema.safeParse(request.body)
    if (!params.success || !body.success) return reply.code(400).send({ error: 'Bad Request' })
    try {
      const result = await editExercise(auth.user.id, auth.supabase, params.data.index, params.data.exerciseIndex, body.data)
      switch (result.status) {
        case 'ok':
          return reply.send({ session: result.session })
        case 'not-found':
          return reply.code(404).send({ error: 'Not Found' })
        case 'session-completed':
          return reply.code(409).send({ error: 'Sessão já concluída', code: 'session-completed' })
        case 'safety-warning':
          return reply.code(409).send({ error: 'A edição fere uma restrição de segurança', code: 'safety-warning', reasons: result.reasons })
        default:
          return reply.code(400).send({ error: 'Troca não permitida para este exercício', code: result.status })
      }
    } catch (err) {
      app.log.error(err, 'session edit: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
