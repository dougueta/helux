import type { FastifyInstance } from 'fastify'
import type { MesocycleSession, PlanDecision } from '@helux/types'
import { authenticate } from './nutrition-auth'
import { assertBudget, BudgetExceededError } from '../services/ai-budget.service'
import { effectiveStatus, getGenerationStatus, markGenerating } from '../services/generation-status.service'
import { findPendingSessionIndex, getActiveMesocycle } from '../services/mesocycle.service'
import { generateAndSaveMesocycle } from '../services/plan-generation.service'
import { isOnboardingComplete } from '../services/onboarding.service'
import { getCycleAnalysis } from '../services/cycle-analysis.service'

/**
 * Semana a repetir, já pronta para ser feita de novo: a última semana sem deload
 * (repetir a descarga não faz sentido), numerada depois da última do ciclo.
 * Formato antigo (sem semanas): a rotação inteira.
 */
export function weekToRepeat(sessions: MesocycleSession[]): MesocycleSession[] {
  const weeks = sessions.map(s => s.week).filter((w): w is number => w !== undefined)
  if (weeks.length === 0) return sessions.map(s => ({ ...s, completedAt: null }))
  const regular = sessions.filter(s => s.week !== undefined && !s.deload).map(s => s.week!)
  const source = regular.length > 0 ? Math.max(...regular) : Math.max(...weeks)
  const next = Math.max(...weeks) + 1
  return sessions.filter(s => s.week === source).map(s => ({ ...s, completedAt: null, week: next, deload: false }))
}

/** Ações sobre o mesociclo (spec 024, R13): gerar de novo e repetir a última semana. */
export async function mesocycleActionsRoutes(app: FastifyInstance): Promise<void> {
  // Substitui o antigo POST /workout/generate: mesmo Agente de Treino do mesociclo, salvo na conta (FR-028).
  app.post('/workout/mesocycle/regenerate', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const token = request.headers.authorization!.slice(7)
    try {
      const status = await getGenerationStatus(auth.user.id, auth.supabase)
      if (status && effectiveStatus(status).status === 'gerando') {
        return reply.code(409).send({ error: 'O próximo ciclo já está sendo gerado.', code: 'already-generating' })
      }
      if (!(await isOnboardingComplete(auth.user.id, auth.supabase))) {
        return reply.code(409).send({ error: 'Conclua o onboarding antes de gerar um novo ciclo.', code: 'onboarding-required' })
      }
      await assertBudget(auth.user.id, auth.supabase)
      const current = await getActiveMesocycle(auth.user.id, auth.supabase)
      await markGenerating(auth.user.id, auth.supabase)
      // Ciclo concluído: passa o id para a análise do ciclo e o vínculo com o novo (PR #19).
      // Ciclo em andamento: só a progressão de carga; analisar um ciclo pela metade daria achados falsos.
      const completed = current && findPendingSessionIndex(current.sessions) === -1
      if (current) void generateAndSaveMesocycle(auth.user.id, token, auth.supabase, app.log, { ...(completed ? { id: current.id } : {}), generated_at: current.generated_at, sessions: current.sessions })
      else void generateAndSaveMesocycle(auth.user.id, token, auth.supabase, app.log)
      return reply.code(202).send({ status: 'gerando' })
    } catch (error) {
      if (error instanceof BudgetExceededError) return reply.code(402).send({ error: 'O teto mensal de IA foi atingido.', code: 'budget-exceeded' })
      app.log.error(error, 'mesocycle regenerate: failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  // Resumo do ciclo concluído e o que mudou no novo (024, FR-025/026).
  app.get<{ Params: { id: string } }>('/workout/mesocycle/:id/analysis', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const summary = await getCycleAnalysis(auth.user.id, auth.supabase, request.params.id)
      if (!summary) return reply.code(404).send({ error: 'Análise não encontrada.' })
      const { data, error } = await auth.supabase.from('mesocycle_plans').select('rationale_decisions').eq('user_id', auth.user.id).eq('id', request.params.id).maybeSingle()
      if (error) throw error
      const decisions = ((data as { rationale_decisions: PlanDecision[] | null } | null)?.rationale_decisions ?? []).filter(d => d.topic === 'ciclo')
      return reply.send({ summary, changes: decisions })
    } catch (error) {
      app.log.error(error, 'mesocycle analysis: failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  // Enquanto o próximo ciclo não fica pronto, o usuário não fica sem treino (FR-031).
  app.post('/workout/mesocycle/repeat-week', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const current = await getActiveMesocycle(auth.user.id, auth.supabase)
      if (!current || findPendingSessionIndex(current.sessions) !== -1) {
        return reply.code(409).send({ error: 'Não há um ciclo concluído para repetir.', code: 'no-completed-cycle' })
      }
      // A semana repetida entra no próprio ciclo (PR #19): quando acabar, a análise e a
      // progressão olham o ciclo inteiro, e não uma semana avulsa.
      const { error } = await auth.supabase
        .from('mesocycle_plans')
        .update({ sessions: [...current.sessions, ...weekToRepeat(current.sessions)] })
        .eq('user_id', auth.user.id)
        .eq('id', current.id)
      if (error) throw error
      return reply.code(201).send({ mesocycleId: current.id })
    } catch (error) {
      app.log.error(error, 'mesocycle repeat-week: failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
