import type { FastifyInstance } from 'fastify'
import { getGeneticReport } from '../services/genetics.service'
import { authenticate } from './nutrition-auth'

/** Perfil genético do usuário (spec 020; 024: vem do banco e exige login). */
export async function geneticProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get('/genetic-profile', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const report = await getGeneticReport(auth.user.id, auth.supabase)
      if (!report) return reply.code(404).send({ error: 'Nenhum laudo genético enviado.', code: 'no-genetic-report' })
      return report
    } catch (error) {
      app.log.error(error, 'genetic profile: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
