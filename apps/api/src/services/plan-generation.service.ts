import type { SupabaseClient } from '@supabase/supabase-js'
import { generateMesocyclePlan } from '@helux/ai'
import { gatherPlanInput } from './plan-context.service'
import { getActiveMesocycle, findPendingSessionIndex, markSessionCompleted, isMesocycleComplete } from './mesocycle.service'

interface MinimalLogger {
  error: (obj: unknown, msg?: string) => void
}

/**
 * Generates a new mesocycle for a user and saves it to mesocycle_plans.
 * Meant to be called fire-and-forget (not awaited) — never throws, since
 * callers don't await it. Used both to bootstrap a user's first mesocycle
 * (GET /workout/latest-plan, when none exists yet) and to generate the next
 * one once the active mesocycle is fully completed.
 */
export async function generateAndSaveMesocycle(
  userId: string,
  token: string,
  supabase: SupabaseClient,
  logger: MinimalLogger,
): Promise<void> {
  try {
    const planInput = await gatherPlanInput(userId, token)
    if (!planInput) return

    const mesocycle = await generateMesocyclePlan(planInput)

    const { error } = await supabase.from('mesocycle_plans').insert({
      user_id: userId,
      generated_at: mesocycle.generatedAt,
      days_per_week: mesocycle.daysPerWeek,
      split_type: mesocycle.splitType,
      sessions: mesocycle.sessions,
      rationale: mesocycle.rationale,
    })

    if (error) {
      logger.error(error, 'mesocycle generation: failed to save plan')
    }
  } catch (err) {
    logger.error(err, 'mesocycle generation failed')
  }
}

/**
 * Advances the active mesocycle after a workout session is saved: marks the
 * session that was just completed, and only generates the next mesocycle
 * (fire-and-forget) once the active one is fully completed. Bootstrapping
 * a user's very first mesocycle is handled separately by
 * GET /workout/latest-plan (generateAndSaveMesocycle) — this function does
 * nothing if the user has no active mesocycle yet.
 */
export async function triggerBackgroundPlanGeneration(
  userId: string,
  token: string,
  supabase: SupabaseClient,
  logger: MinimalLogger,
): Promise<void> {
  try {
    const mesocycle = await getActiveMesocycle(userId, supabase)
    if (!mesocycle) return

    const pendingIndex = findPendingSessionIndex(mesocycle.sessions)
    const updatedSessions = markSessionCompleted(mesocycle.sessions, pendingIndex)

    const { error: updateError } = await supabase
      .from('mesocycle_plans')
      .update({ sessions: updatedSessions })
      .eq('id', mesocycle.id)

    if (updateError) {
      logger.error(updateError, 'plan generation: failed to mark session completed')
      return
    }

    if (!isMesocycleComplete(updatedSessions)) return

    await generateAndSaveMesocycle(userId, token, supabase, logger)
  } catch (err) {
    logger.error(err, 'background plan generation failed')
  }
}
