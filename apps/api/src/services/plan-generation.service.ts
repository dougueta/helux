import type { SupabaseClient } from '@supabase/supabase-js'
import { ConstraintsUnsatisfiableError, generateMesocyclePlan } from '@helux/ai'
import type { GeneticProfile, MesocycleSession } from '@helux/types'
import { applyProgression, computeMesocycleProgression, normalizeSessionExercises } from '@helux/workouts'
import { assertBudget, BudgetExceededError, recordUsage } from './ai-budget.service'
import { buildIntegratedProfile } from './integrated-profile.service'
import { fetchSessionsSince } from './plan-context.service'
import { getActiveMesocycle, findPendingSessionIndex, markSessionCompleted, isMesocycleComplete } from './mesocycle.service'

interface MinimalLogger {
  error: (obj: unknown, msg?: string) => void
}

/** Mesociclo anterior concluído — base da progressão de carga (spec 014, US3). */
export interface PreviousMesocycle {
  generated_at: string
  sessions: Pick<MesocycleSession, 'exercises'>[]
}

/**
 * Generates a new mesocycle for a user and saves it to mesocycle_plans.
 * Meant to be called fire-and-forget (not awaited) — never throws, since
 * callers don't await it. Used both to bootstrap a user's first mesocycle
 * (GET /workout/latest-plan, when none exists yet) and to generate the next
 * one once the active mesocycle is fully completed. With `previous` (only
 * on that transition), load progression is computed from its history, sent
 * to the AI and applied deterministically after generation (spec 014, FR-018);
 * the bootstrap passes no `previous` and gets no progression (FR-020).
 */
export async function generateAndSaveMesocycle(
  userId: string,
  token: string,
  supabase: SupabaseClient,
  logger: MinimalLogger,
  previous?: PreviousMesocycle,
): Promise<void> {
  try {
    // Spec 022: o Agente de Treino lê o Perfil Integrado (fontes ativas + restrições rígidas).
    const build = await buildIntegratedProfile(userId, supabase)
    try {
      await assertBudget(userId, supabase)
    } catch (err) {
      // Teto de IA atingido: o mesociclo atual continua; tenta de novo no próximo acesso (FR-026).
      if (err instanceof BudgetExceededError) return
      throw err
    }

    const perfil = build.profile.sources.perfil
    const userLevel = (perfil.status === 'ativa' ? (perfil.data as { level?: string } | null)?.level : null) ?? 'intermediario'
    const decisions = previous
      ? computeMesocycleProgression({
          previousSessions: previous.sessions,
          history: await fetchSessionsSince(userId, supabase, previous.generated_at.slice(0, 10)),
          userLevel: userLevel as 'iniciante' | 'intermediario' | 'avancado',
        })
      : []
    const withLoad = decisions.filter((d) => d.action !== 'sem-dados')
    const genetica = build.profile.sources.genetica
    const geneticProfile = genetica.status === 'ativa' ? (genetica.data as GeneticProfile) : null

    let result
    try {
      result = await generateMesocyclePlan({
        profile: build.profile,
        constraints: build.constraints,
        daysPerWeek: build.preferences.availableDays.length || 4,
        geneticProfile,
        ...(withLoad.length > 0 ? { loadProgression: withLoad } : {}),
      })
    } catch (err) {
      if (err instanceof ConstraintsUnsatisfiableError) await recordUsage(userId, err.usages, supabase)
      throw err
    }
    await recordUsage(userId, result.usages, supabase)
    const mesocycle = result.plan

    // Spec 014: fases ordenadas e bisets válidos antes de gravar; depois a carga da progressão.
    const sessions = applyProgression(
      mesocycle.sessions.map((session) => ({
        ...session,
        exercises: normalizeSessionExercises(session.exercises),
      })),
      withLoad,
    )

    const { error } = await supabase.from('mesocycle_plans').insert({
      user_id: userId,
      generated_at: mesocycle.generatedAt,
      days_per_week: mesocycle.daysPerWeek,
      split_type: mesocycle.splitType,
      sessions,
      rationale: mesocycle.rationale,
      rationale_decisions: result.decisions,
      sources_used: build.sourcesUsed,
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
    // Already fully completed (e.g. a retried/duplicate session POST arriving
    // after the cycle was already advanced) — nothing new to mark, and
    // regenerating here would spuriously create an extra mesocycle.
    if (pendingIndex === -1) return

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

    await generateAndSaveMesocycle(userId, token, supabase, logger, {
      generated_at: mesocycle.generated_at,
      sessions: updatedSessions,
    })
  } catch (err) {
    logger.error(err, 'background plan generation failed')
  }
}
