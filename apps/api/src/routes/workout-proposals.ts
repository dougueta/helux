import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { acceptProposal, rejectProposal, requestSessionAdjustment, type ResolveResult } from '../services/proposals.service'
import { sendAgentError } from './agent-errors'
import { authenticate } from './nutrition-auth'

const AdjustBodySchema = z.object({ request: z.string().trim().min(1).max(500) })

function sendResolve(reply: FastifyReply, result: ResolveResult) {
  if (result.status === 'not-found') return reply.code(404).send({ error: 'Not Found' })
  if (result.status === 'not-pending') return reply.code(409).send({ error: 'A proposta já foi resolvida', code: 'not-pending' })
  if (result.status === 'obsolete') return reply.code(409).send({ error: 'O treino mudou depois da proposta', code: 'obsolete' })
  return reply.send(result)
}

/** Ajustes de treino propostos pelo Agente de Treino (spec 022, FR-009/FR-011). */
export async function workoutProposalsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/workout/adjust', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = AdjustBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const proposal = await requestSessionAdjustment(auth.user.id, auth.supabase, { request: parsed.data.request, scope: 'hoje', kind: 'ajuste-sessao' })
      return reply.send({ proposal })
    } catch (err) {
      return sendAgentError(reply, app.log, err, 'workout adjust: failed')
    }
  })

  for (const action of ['accept', 'reject'] as const) {
    app.post<{ Params: { id: string } }>(`/api/workout/proposals/:id/${action}`, async (request, reply) => {
      const auth = await authenticate(request, reply)
      if (!auth) return
      try {
        const fn = action === 'accept' ? acceptProposal : rejectProposal
        return sendResolve(reply, await fn(auth.user.id, auth.supabase, request.params.id))
      } catch (err) {
        app.log.error(err, `workout proposal ${action}: failed`)
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
    })
  }
}
