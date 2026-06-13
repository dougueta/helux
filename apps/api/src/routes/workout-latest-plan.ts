import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'

const LATEST_PLAN_PATH = resolve(process.cwd(), 'data', 'workouts', 'latest-plan.json')

export async function workoutLatestPlanRoutes(app: FastifyInstance): Promise<void> {
  app.get('/workout/latest-plan', async (_request, reply) => {
    if (!existsSync(LATEST_PLAN_PATH)) {
      return reply.status(404).send({
        error: 'Nenhum plano gerado ainda. Use POST /workout/generate para criar o primeiro plano.',
      })
    }
    const raw = readFileSync(LATEST_PLAN_PATH, 'utf-8')
    return JSON.parse(raw)
  })
}
