import type { FastifyInstance } from 'fastify'
import type { MesocycleSession } from '@helux/types'
import { authenticate } from './nutrition-auth'
import { assertBudget, BudgetExceededError } from '../services/ai-budget.service'
import { effectiveStatus, getGenerationStatus, markGenerating } from '../services/generation-status.service'
import { findPendingSessionIndex, getActiveMesocycle } from '../services/mesocycle.service'
import { generateAndSaveMesocycle } from '../services/plan-generation.service'

/** Última semana do ciclo (formato semanal) ou a rotação inteira (formato antigo). */
function lastWeek(sessions: MesocycleSession[]): MesocycleSession[] {
  const weeks = sessions.map(s => s.week).filter((w): w is number => w !== undefined)
  if (weeks.length === 0) return sessions
  const last = Math.max(...weeks)
  return sessions.filter(s => s.week === last)
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
      await assertBudget(auth.user.id, auth.supabase)
      const current = await getActiveMesocycle(auth.user.id, auth.supabase)
      await markGenerating(auth.user.id, auth.supabase)
      if (current) void generateAndSaveMesocycle(auth.user.id, token, auth.supabase, app.log, { generated_at: current.generated_at, sessions: current.sessions })
      else void generateAndSaveMesocycle(auth.user.id, token, auth.supabase, app.log)
      return reply.code(202).send({ status: 'gerando' })
    } catch (error) {
      if (error instanceof BudgetExceededError) return reply.code(402).send({ error: 'O teto mensal de IA foi atingido.', code: 'budget-exceeded' })
      app.log.error(error, 'mesocycle regenerate: failed')
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
      const sessions = lastWeek(current.sessions).map(s => ({ ...s, completedAt: null, ...(s.week !== undefined ? { week: 1 } : {}) }))
      const { data, error } = await auth.supabase
        .from('mesocycle_plans')
        .insert({
          user_id: auth.user.id,
          generated_at: new Date().toISOString(),
          days_per_week: current.days_per_week,
          split_type: current.split_type,
          sessions,
          rationale: 'Repetição da última semana do ciclo anterior enquanto o próximo ciclo é gerado.',
        })
        .select('id')
        .single()
      if (error) throw error
      return reply.code(201).send({ mesocycleId: (data as { id: string }).id })
    } catch (error) {
      app.log.error(error, 'mesocycle repeat-week: failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}
