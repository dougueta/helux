import type { OutgoingHttpHeaders } from 'node:http'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { CHANNELS } from '@helux/types'
import { BudgetExceededError } from '../services/ai-budget.service'
import { getConversation, newConversation, runChat, type ChatEmit } from '../services/agent-chat.service'
import { authenticate } from './nutrition-auth'

const ChannelParams = z.object({ channel: z.enum(CHANNELS as unknown as [string, ...string[]]) })
const ChatBody = z.object({ channel: z.enum(CHANNELS as unknown as [string, ...string[]]), message: z.string().trim().min(1).max(2000) })

/** Conversas com os especialistas (spec 022, FR-022/023, R3): SSE com `fetch` + `ReadableStream` na web. */
export async function agentsChatRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/agents/conversations/:channel', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const params = ChannelParams.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'Bad Request' })
    try {
      return reply.send(await getConversation(auth.user.id, auth.supabase, params.data.channel as never))
    } catch (err) {
      app.log.error(err, 'agents conversations: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/agents/conversations/:channel/new', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const params = ChannelParams.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'Bad Request' })
    try {
      return reply.code(201).send({ conversation: await newConversation(auth.user.id, auth.supabase, params.data.channel as never) })
    } catch (err) {
      app.log.error(err, 'agents conversations: failed to create')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/agents/chat', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const body = ChatBody.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.errors })

    let started = false
    const emit: ChatEmit = (event, data) => {
      if (!started) {
        started = true
        // Os headers do CORS e de outros hooks foram definidos no reply; reaproveita no stream cru.
        reply.hijack()
        reply.raw.writeHead(200, { ...(reply.getHeaders() as OutgoingHttpHeaders), 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      }
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    try {
      await runChat(auth.user.id, auth.supabase, body.data as never, emit)
    } catch (err) {
      if (!started) {
        if (err instanceof BudgetExceededError) return reply.code(409).send({ error: 'Teto mensal de IA atingido', code: 'budget-exceeded', budget: err.status })
        app.log.error(err, 'agents chat: failed before streaming')
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
      app.log.error(err, 'agents chat: failed while streaming')
    }
    if (started) reply.raw.end()
  })
}
