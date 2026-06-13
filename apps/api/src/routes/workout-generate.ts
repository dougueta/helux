import type { FastifyInstance } from 'fastify'
import { generateWorkoutPlan } from '@helux/ai'
import type { PlanInput } from '@helux/types'

export async function workoutGenerateRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: PlanInput }>('/workout/generate', async (request, reply) => {
    try {
      const plan = await generateWorkoutPlan(request.body)
      return plan
    } catch (err) {
      const error = err as Error
      if (error.name === 'AuthenticationError') {
        return reply.status(500).send({
          error: 'ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente antes de gerar planos.',
        })
      }
      return reply.status(500).send({ error: `Erro ao gerar plano: ${error.message}` })
    }
  })
}
