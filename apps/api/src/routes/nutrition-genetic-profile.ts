import type { FastifyInstance } from 'fastify'
import { loadNutritionGenetics } from '../services/nutrition-context.service'
import { getGeneticRaw } from '../services/genetics.service'
import { authenticate } from './nutrition-auth'

/** Perfil nutrigenômico (spec 018, US4): marcadores classificados do laudo do usuário (024: vem do banco). */
export async function nutritionGeneticProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/nutrition/genetic-profile', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const { active, markers } = loadNutritionGenetics(await getGeneticRaw(auth.user.id, auth.supabase))
      return reply.send({ active, markers })
    } catch (error) {
      app.log.error(error, 'nutrition genetic profile: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
