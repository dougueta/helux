import Fastify, { type FastifyInstance } from 'fastify'
import { healthRoutes } from './routes/health'
import { geneticProfileRoutes } from './routes/genetic-profile'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(healthRoutes)
  app.register(geneticProfileRoutes)

  return app
}
