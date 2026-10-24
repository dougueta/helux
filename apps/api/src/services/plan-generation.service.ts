import type { SupabaseClient } from '@supabase/supabase-js'
import { AgentRefusalError, ConstraintsUnsatisfiableError, generateMesocyclePlan, IncompleteResponseError } from '@helux/ai'
import type { GenerationErrorCode, GeneticProfile, MesocycleSession } from '@helux/types'
import { applyProgression, computeMesocycleProgression, normalizeSessionExercises } from '@helux/workouts'
import { assertBudget, BudgetExceededError, recordUsage } from './ai-budget.service'
import { buildIntegratedProfile } from './integrated-profile.service'
import { fetchSessionsSince } from './plan-context.service'
import { getActiveMesocycle, findPendingSessionIndex, markSessionCompleted, isMesocycleComplete } from './mesocycle.service'
import { markFailed, markGenerating, markOk } from './generation-status.service'

/** Código de erro gravado no estado da geração (024, FR-031). */
function errorCodeOf(err: unknown): GenerationErrorCode {
  if (err instanceof BudgetExceededError) return 'budget-exceeded'
  if (err instanceof ConstraintsUnsatisfiableError) return 'constraints-unsatisfiable'
  if (err instanceof IncompleteResponseError) return 'incomplete-response'
  if (err instanceof AgentRefusalError) return 'refusal'
  return 'unknown'
}

interface MinimalLogger {
  error: (obj: unknown, msg?: string) => void
  info?: (obj: unknown, msg?: string) => void
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
    await markGenerating(userId, supabase)
    // Spec 022: o Agente de Treino lê o Perfil Integrado (fontes ativas + restrições rígidas).
    const build = await buildIntegratedProfile(userId, supabase)
    // Teto de IA atingido: o mesociclo atual continua; o estado "falhou" deixa o usuário saber (FR-026).
    await assertBudget(userId, supabase)

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
      if (err instanceof ConstraintsUnsatisfiableError || err instanceof IncompleteResponseError) await recordUsage(userId, err.usages, supabase)
      throw err
    }
    await recordUsage(userId, result.usages, supabase)
    // R13: métricas da geração, sem conteúdo.
    logger.info?.(
      {
        agent: 'treino',
        operation: 'mesociclo',
        model: result.usages[0]?.model ?? null,
        attempts: result.usages.filter(u => u.cacheTtl === '5m').length,
        inputTokens: result.usages.reduce((n, u) => n + u.input_tokens, 0),
        outputTokens: result.usages.reduce((n, u) => n + u.output_tokens, 0),
        cacheReadTokens: result.usages.reduce((n, u) => n + u.cache_read_input_tokens, 0),
      },
      'ai call',
    )
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

    if (error) throw error
    await markOk(userId, supabase)
  } catch (err) {
    logger.error(err, 'mesocycle generation failed')
    try {
      await markFailed(userId, errorCodeOf(err), supabase)
    } catch (e) {
      logger.error(e, 'mesocycle generation: failed to save status')
    }
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
