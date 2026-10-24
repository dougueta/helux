import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { healthRoutes } from './routes/health'
import { geneticProfileRoutes } from './routes/genetic-profile'
import { geneticsReportRoutes } from './routes/genetics-report'
import { workoutLatestPlanRoutes } from './routes/workout-latest-plan'
import { mesocycleActionsRoutes } from './routes/mesocycle-actions'
import { conditionsRoutes } from './routes/conditions'
import { onboardingRoutes } from './routes/onboarding'
import { healthSyncRoutes } from './routes/health-sync'
import { recoveryLatestRoutes } from './routes/recovery-latest'
import { workoutSessionsRoutes } from './routes/workout-sessions'
import { workoutHistoryRoutes } from './routes/workout-history'
import { workoutAnalyticsRoutes } from './routes/workout-analytics'
import { checkinsRoutes } from './routes/checkins'
import { profileRoutes } from './routes/profile'
import { tirednessTodayRoutes } from './routes/tiredness-today'
import { nutritionPhaseRoutes } from './routes/nutrition-phase'
import { nutritionTodayRoutes } from './routes/nutrition-today'
import { nutritionGeneticProfileRoutes } from './routes/nutrition-genetic-profile'
import { workoutProposalsRoutes } from './routes/workout-proposals'
import { workoutSessionEditRoutes } from './routes/workout-session-edit'
import { trainingPreferencesRoutes } from './routes/training-preferences'
import { agentsProfileRoutes } from './routes/agents-profile'
import { agentsChatRoutes } from './routes/agents-chat'
import { agentsGuidanceRoutes } from './routes/agents-guidance'
import { loadEnv, type AppEnv } from './config/env'

export function buildApp(config: Pick<AppEnv, 'CORS_ORIGIN'> = loadEnv()): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
    // PUT: /api/tiredness-today (spec 011); PATCH: edição manual e relatos (spec 022).
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  app.register(healthRoutes)
  app.register(geneticProfileRoutes)
  app.register(geneticsReportRoutes)
  app.register(mesocycleActionsRoutes)
  app.register(conditionsRoutes)
  app.register(onboardingRoutes)
  app.register(workoutLatestPlanRoutes)
  app.register(healthSyncRoutes)
  app.register(recoveryLatestRoutes)
  app.register(workoutSessionsRoutes)
  app.register(workoutHistoryRoutes)
  app.register(workoutAnalyticsRoutes)
  app.register(checkinsRoutes)
  app.register(profileRoutes)
  app.register(tirednessTodayRoutes)
  app.register(nutritionPhaseRoutes)
  app.register(nutritionTodayRoutes)
  app.register(nutritionGeneticProfileRoutes)
  app.register(workoutProposalsRoutes)
  app.register(workoutSessionEditRoutes)
  app.register(trainingPreferencesRoutes)
  app.register(agentsProfileRoutes)
  app.register(agentsChatRoutes)
  app.register(agentsGuidanceRoutes)

  return app
}
