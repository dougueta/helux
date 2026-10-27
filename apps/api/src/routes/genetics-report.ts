import type { FastifyInstance } from 'fastify'
import { deleteGeneticReport, InvalidGeneticReportError, saveGeneticReport } from '../services/genetics.service'
import { authenticate } from './nutrition-auth'

/** Laudo genético do usuário (spec 024, R14): envio e remoção. */
export async function geneticsReportRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/genetics/report', { bodyLimit: 1_048_576 }, async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const { traits } = await saveGeneticReport(auth.user.id, request.body, auth.supabase)
      return reply.code(201).send({ uploadedAt: new Date().toISOString(), traits })
    } catch (error) {
      if (error instanceof InvalidGeneticReportError) return reply.code(400).send({ error: error.message, code: error.code })
      app.log.error(error, 'genetics report: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete('/api/genetics/report', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      await deleteGeneticReport(auth.user.id, auth.supabase)
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'genetics report: failed to delete')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
