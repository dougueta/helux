import type { SupabaseClient } from '@supabase/supabase-js'
import { generateWorkoutPlan, generateMesocyclePlan } from '@helux/ai'
import { gatherPlanInput } from './plan-context.service'

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
 * Generates the next workout plan for a user and saves it to workout_plans.
 * Meant to be called fire-and-forget (not awaited) right after a workout
 * session is saved, so the plan is ready by the time the user next opens
 * the app — never throws, since callers don't await it.
 */
export async function triggerBackgroundPlanGeneration(
  userId: string,
  token: string,
  supabase: SupabaseClient,
  logger: MinimalLogger,
): Promise<void> {
  try {
    const planInput = await gatherPlanInput(userId, token)
    if (!planInput) return

    const plan = await generateWorkoutPlan(planInput)

    const { error } = await supabase.from('workout_plans').insert({
      user_id: userId,
      generated_at: plan.generatedAt,
      exercises: plan.exercises,
      rationale: plan.rationale,
    })

    if (error) {
      logger.error(error, 'background plan generation: failed to save plan')
    }
  } catch (err) {
    logger.error(err, 'background plan generation failed')
  }
}
