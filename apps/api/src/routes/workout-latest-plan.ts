import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { buildAdjustedSession, constraintsFromConditions } from '@helux/workouts'
import { adaptSessionForSafety } from '@helux/ai'
import { EMPTY_HARD_CONSTRAINTS, type AdjustedSession, type AdjustedWorkoutPlanView, type HealthCondition } from '@helux/types'
import { getActiveMesocycle, findPendingSessionIndex } from '../services/mesocycle.service'
import { generateAndSaveMesocycle } from '../services/plan-generation.service'
import { getTodayTirednessAssessment } from '../services/tiredness.service'
import { effectiveStatus, getGenerationStatus, markGenerating, shouldRetry } from '../services/generation-status.service'
import type { MesocycleRow } from '../services/mesocycle.service'
import { isOnboardingComplete } from '../services/onboarding.service'
import { listConditions } from '../services/conditions.service'

/**
 * Regras das condições de saúde aplicadas ao treino do dia (024, FR-009): vale
 * também para ciclos gerados antes da 024 e para a crise de gota.
 */
function applyConditions(today: AdjustedSession, conditions: HealthCondition[], now: Date): AdjustedSession {
  const constraints = { ...EMPTY_HARD_CONSTRAINTS, ...constraintsFromConditions(conditions, now) }
  const flare = conditions.find(c => c.flare)?.flare
  const result = adaptSessionForSafety(today.exercises, constraints, flare ? `crise no ${flare.region}` : 'condições de saúde')
  if (result.changes.length === 0) return today
  return {
    ...today,
    exercises: result.exercises,
    adjusted: true,
    changes: [...(today.changes ?? []), ...result.changes],
    adjustmentReason: [today.adjustmentReason, result.reason].filter(Boolean).join(' '),
  }
}

/** Ciclo concluído usado como base da progressão do próximo (spec 014). */
const previousOf = (m: MesocycleRow) => ({ generated_at: m.generated_at, sessions: m.sessions })

export async function workoutLatestPlanRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/workout/latest-plan', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const token = authHeader.slice(7)

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    let mesocycle
    try {
      mesocycle = await getActiveMesocycle(user.id, supabase)
    } catch (error) {
      app.log.error(error, 'workout-latest-plan: failed to load active mesocycle')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    const pendingIndex = mesocycle ? findPendingSessionIndex(mesocycle.sessions) : -1
    const completed = mesocycle ? mesocycle.sessions.filter((s) => s.completedAt !== null).length : 0
    const total = mesocycle?.sessions.length ?? 0

    if (!mesocycle || pendingIndex === -1) {
      // Sem mesociclo (primeiro uso) ou ciclo concluído: o próximo está sendo
      // gerado, ou falhou e é tentado de novo aqui (024, FR-031).
      const view: AdjustedWorkoutPlanView = {
        mesocycleId: mesocycle?.id ?? null,
        generatedAt: mesocycle?.generated_at ?? null,
        today: null,
        upcoming: [],
        progress: mesocycle ? { completed, total } : null,
        status: 'generating',
      }
      try {
        // Spec 024 (FR-001/002): sem onboarding, o próximo ciclo espera.
        if (!(await isOnboardingComplete(user.id, supabase))) {
          view.status = 'onboarding-required'
          return reply.send(view)
        }
        const status = await getGenerationStatus(user.id, supabase)
        if (shouldRetry(status)) {
          await markGenerating(user.id, supabase)
          if (mesocycle) void generateAndSaveMesocycle(user.id, token, supabase, app.log, previousOf(mesocycle))
          else void generateAndSaveMesocycle(user.id, token, supabase, app.log)
        } else if (status && effectiveStatus(status).status === 'falhou') {
          view.status = 'generation-failed'
          view.generation = effectiveStatus(status)
        }
      } catch (error) {
        app.log.error(error, 'workout-latest-plan: failed to read generation status')
      }
      return reply.send(view)
    }

    let tiredness
    try {
      tiredness = await getTodayTirednessAssessment(user.id, supabase)
    } catch (error) {
      app.log.error(error, 'workout-latest-plan: failed to load tiredness assessment')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    const pendingSession = mesocycle.sessions[pendingIndex]
    const conditions = await listConditions(user.id, supabase).catch((error) => {
      app.log.error(error, 'workout-latest-plan: failed to load conditions')
      return [] as HealthCondition[]
    })
    const today = applyConditions(buildAdjustedSession(pendingSession, tiredness), conditions, new Date())
    const upcoming = mesocycle.sessions.slice(pendingIndex + 1).map((s) => ({ letter: s.letter, focus: s.focus, ...(s.week !== undefined ? { week: s.week } : {}) }))

    const view: AdjustedWorkoutPlanView = {
      mesocycleId: mesocycle.id,
      generatedAt: mesocycle.generated_at,
      today,
      upcoming,
      progress: { completed, total },
      ...(pendingSession.week !== undefined
        ? {
            week: { current: pendingSession.week, total: Math.max(...mesocycle.sessions.map((s) => s.week ?? 0)), deload: !!pendingSession.deload },
            kind: pendingSession.kind ?? 'forca',
          }
        : {}),
      ...(mesocycle.rationale_decisions ? { rationaleDecisions: mesocycle.rationale_decisions } : {}),
      ...(mesocycle.sources_used ? { sourcesUsed: mesocycle.sources_used } : {}),
    }
    return reply.send(view)
  })
}
