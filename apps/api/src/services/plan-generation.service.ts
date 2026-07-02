import type { SupabaseClient } from '@supabase/supabase-js'
import { generateWorkoutPlan } from '@helux/ai'
import { gatherPlanInput } from './plan-context.service'

interface MinimalLogger {
  error: (obj: unknown, msg?: string) => void
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
