import type { FastifyInstance } from 'fastify'
import { acceptGuidance, rejectGuidance } from '../services/guidance.service'
import { authenticate } from './nutrition-auth'

/** Aceitar ou recusar uma orientação proposta por um especialista (spec 022, FR-018). */
export async function agentsGuidanceRoutes(app: FastifyInstance): Promise<void> {
  for (const action of ['accept', 'reject'] as const) {
    app.post<{ Params: { id: string } }>(`/api/agents/guidance/:id/${action}`, async (request, reply) => {
      const auth = await authenticate(request, reply)
      if (!auth) return
      try {
        const fn = action === 'accept' ? acceptGuidance : rejectGuidance
        const result = await fn(auth.user.id, auth.supabase, request.params.id)
        if (result.status === 'not-found') return reply.code(404).send({ error: 'Not Found' })
        if (result.status !== 'ok') return reply.code(409).send({ error: 'A orientação já foi resolvida', code: 'not-pending' })
        return reply.send(result.conflict ? { ...result.guidance, conflict: result.conflict } : result.guidance)
      } catch (err) {
        app.log.error(err, `agents guidance ${action}: failed`)
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
    })
  }
}
