import Fastify, { type FastifyInstance } from 'fastify'
import { healthRoutes } from './routes/health'
import { geneticProfileRoutes } from './routes/genetic-profile'
import { workoutGenerateRoutes } from './routes/workout-generate'
import { workoutLatestPlanRoutes } from './routes/workout-latest-plan'
import { healthSyncRoutes } from './routes/health-sync'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(healthRoutes)
  app.register(geneticProfileRoutes)
  app.register(workoutGenerateRoutes)
  app.register(workoutLatestPlanRoutes)
  app.register(healthSyncRoutes)

  return app
}
