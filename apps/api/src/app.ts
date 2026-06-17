import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { healthRoutes } from './routes/health'
import { geneticProfileRoutes } from './routes/genetic-profile'
import { workoutGenerateRoutes } from './routes/workout-generate'
import { workoutLatestPlanRoutes } from './routes/workout-latest-plan'
import { healthSyncRoutes } from './routes/health-sync'
import { recoveryLatestRoutes } from './routes/recovery-latest'
import { workoutSessionsRoutes } from './routes/workout-sessions'
import { workoutHistoryRoutes } from './routes/workout-history'
import { workoutAnalyticsRoutes } from './routes/workout-analytics'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })

  app.register(healthRoutes)
  app.register(geneticProfileRoutes)
  app.register(workoutGenerateRoutes)
  app.register(workoutLatestPlanRoutes)
  app.register(healthSyncRoutes)
  app.register(recoveryLatestRoutes)
  app.register(workoutSessionsRoutes)
  app.register(workoutHistoryRoutes)
  app.register(workoutAnalyticsRoutes)

  return app
}
