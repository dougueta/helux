import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { SOURCE_KEYS } from '@helux/types'
import { toFact, type FactRow } from '../services/agent-rows'
import { budgetStatus, setBudgetCap } from '../services/ai-budget.service'
import { buildIntegratedProfile } from '../services/integrated-profile.service'
import { authenticate } from './nutrition-auth'

const SourceParams = z.object({ source: z.enum(SOURCE_KEYS) })
const SourceBody = z.object({ enabled: z.boolean() })
const BudgetBody = z.object({ monthlyCapUsd: z.number().min(1).max(10000) })
const FactBody = z.object({ text: z.string().trim().min(3).max(280) })

/** Perfil Integrado e controle do usuário (spec 022, FR-002/003, FR-019/020a, FR-025). */
export async function agentsProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/agents/profile', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const [{ profile }, budget] = await Promise.all([buildIntegratedProfile(auth.user.id, auth.supabase), budgetStatus(auth.user.id, auth.supabase)])
      return reply.send({ ...profile, budget })
    } catch (err) {
      app.log.error(err, 'agents profile: failed to build')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put('/api/agents/sources/:source', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const params = SourceParams.safeParse(request.params)
    const body = SourceBody.safeParse(request.body)
    if (!params.success || !body.success) return reply.code(400).send({ error: 'Bad Request' })
    const { error } = await auth.supabase
      .from('agent_source_settings')
      .upsert({ user_id: auth.user.id, source: params.data.source, enabled: body.data.enabled, updated_at: new Date().toISOString() }, { onConflict: 'user_id,source' })
    if (error) {
      app.log.error(error, 'agents sources: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    return reply.code(204).send()
  })

  app.put('/api/agents/budget', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const body = BudgetBody.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.errors })
    try {
      return reply.send(await setBudgetCap(auth.user.id, body.data.monthlyCapUsd, auth.supabase))
    } catch (err) {
      app.log.error(err, 'agents budget: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.patch<{ Params: { id: string } }>('/api/agents/facts/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const body = FactBody.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.errors })
    const { data, error } = await auth.supabase
      .from('conversation_facts')
      .update({ text: body.data.text, updated_at: new Date().toISOString() })
      .eq('id', request.params.id)
      .eq('user_id', auth.user.id)
      .select('*')
      .maybeSingle()
    if (error) {
      app.log.error(error, 'agents facts: failed to update')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    if (!data) return reply.code(404).send({ error: 'Not Found' })
    return reply.send(toFact(data as FactRow))
  })

  app.delete<{ Params: { id: string } }>('/api/agents/facts/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { error } = await auth.supabase
      .from('conversation_facts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', request.params.id)
      .eq('user_id', auth.user.id)
    if (error) {
      app.log.error(error, 'agents facts: failed to delete')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    return reply.code(204).send()
  })

  app.delete<{ Params: { id: string } }>('/api/agents/guidance/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { data, error } = await auth.supabase.from('shared_guidance').select('status').eq('id', request.params.id).eq('user_id', auth.user.id).maybeSingle()
    if (error) {
      app.log.error(error, 'agents guidance: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    if (!data) return reply.code(404).send({ error: 'Not Found' })
    if ((data as { status: string }).status !== 'ativa') return reply.code(409).send({ error: 'Só orientações ativas podem ser removidas', code: 'not-active' })
    await auth.supabase.from('shared_guidance').update({ status: 'removida', updated_at: new Date().toISOString() }).eq('id', request.params.id)
    return reply.code(204).send()
  })
}
