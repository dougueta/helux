import type { SupabaseClient } from '@supabase/supabase-js'
import { AgentRefusalError, matchesMedicalRedFlag, routeMessage, streamAgentReply, type AgentMessageParam, type AgentToolHandler } from '@helux/ai'
import type { AgentConversation, AgentKey, AgentMessage, AgentStreamEvent, Channel, SourcesUsed } from '@helux/types'
import { toFact, toGuidance, type FactRow, type GuidanceRow } from './agent-rows'
import { assertBudget, BudgetExceededError, recordUsage } from './ai-budget.service'
import { buildIntegratedProfile } from './integrated-profile.service'
import { requestSessionAdjustment } from './proposals.service'
import { todaySlug } from './tiredness.service'

/** Mensagens da conversa enviadas ao modelo (R3). */
const HISTORY_LIMIT = 20

interface ConversationRow {
  id: string
  channel: Channel
  started_at: string
}

interface MessageRow {
  id: string
  role: 'user' | 'agent'
  agent: AgentKey | null
  content: string
  sources_used: SourcesUsed | null
  created_at: string
}

const toConversation = (r: ConversationRow): AgentConversation => ({ id: r.id, channel: r.channel, startedAt: r.started_at })
const toMessage = (r: MessageRow): AgentMessage => ({ id: r.id, role: r.role, agent: r.agent, content: r.content, sourcesUsed: r.sources_used, createdAt: r.created_at })

/** Eventos SSE do contrato (agents-api.md). */
export type ChatEmit = (event: 'start' | 'routed' | 'delta' | 'fact' | 'proposal' | 'handoff' | 'done' | 'error', data: Record<string, unknown>) => void

/** Qual especialista responde (o canal Equipe roteia; os diretos são o próprio agente). */
export type AgentResolver = (args: { channel: Channel; message: string; recent: MessageRow[] }) => Promise<{ agent: AgentKey; reason?: string; usages?: Parameters<typeof recordUsage>[1] }>

async function openConversation(userId: string, supabase: SupabaseClient, channel: Channel): Promise<ConversationRow | null> {
  const { data, error } = await supabase.from('agent_conversations').select('*').eq('user_id', userId).eq('channel', channel).is('archived_at', null).maybeSingle()
  if (error) throw error
  return (data as ConversationRow | null) ?? null
}

async function createConversation(userId: string, supabase: SupabaseClient, channel: Channel): Promise<ConversationRow> {
  const { data, error } = await supabase.from('agent_conversations').insert({ user_id: userId, channel }).select('*').single()
  if (error) throw error
  return data as ConversationRow
}

async function conversationMessages(supabase: SupabaseClient, conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase.from('agent_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MessageRow[]
}

/** Conversa aberta do canal e suas mensagens (FR-022). */
export async function getConversation(userId: string, supabase: SupabaseClient, channel: Channel) {
  const conversation = await openConversation(userId, supabase, channel)
  if (!conversation) return { conversation: null, messages: [] as AgentMessage[] }
  return { conversation: toConversation(conversation), messages: (await conversationMessages(supabase, conversation.id)).map(toMessage) }
}

/** "Nova conversa": arquiva a atual do canal e abre outra (FR-022). */
export async function newConversation(userId: string, supabase: SupabaseClient, channel: Channel): Promise<AgentConversation> {
  await supabase.from('agent_conversations').update({ archived_at: new Date().toISOString() }).eq('user_id', userId).eq('channel', channel).is('archived_at', null)
  return toConversation(await createConversation(userId, supabase, channel))
}

/**
 * Histórico para o modelo (R3): últimas 20 mensagens, em texto. As respostas
 * são reenviadas como texto (sem blocos de raciocínio nem de ferramenta), o
 * que mantém o histórico só acrescentado e válido mesmo com a janela andando.
 */
function toHistory(rows: MessageRow[]): AgentMessageParam[] {
  const recent = rows.slice(-HISTORY_LIMIT)
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift()
  return recent.map(r => ({ role: r.role === 'user' ? 'user' : 'assistant', content: r.content }))
}

/**
 * Canais diretos respondem com o próprio especialista. No chat Equipe (R4), um
 * sinal de alerta médico vai direto para a Medicina (sem gastar o roteador);
 * o resto passa pelo roteador com as últimas mensagens como contexto.
 */
const defaultResolver: AgentResolver = async ({ channel, message, recent }) => {
  if (channel !== 'equipe') return { agent: channel }
  if (matchesMedicalRedFlag(message)) return { agent: 'medicina', reason: 'possível sinal de alerta médico' }
  const routed = await routeMessage({ message, recent: recent.map(m => ({ role: m.role, content: m.content })) })
  return { agent: routed.agent, reason: routed.reason, usages: [routed.usage] }
}

/**
 * Uma mensagem do usuário (agents-api.md): checa o teto, grava a mensagem,
 * escolhe o especialista, monta o contexto, faz o streaming com as ferramentas
 * e grava a resposta e o uso. Em falha, nada do agente é gravado (FR-024).
 * Lança `BudgetExceededError` antes de qualquer evento quando o teto acabou.
 */
export async function runChat(
  userId: string,
  supabase: SupabaseClient,
  input: { channel: Channel; message: string },
  emit: ChatEmit,
  resolveAgent: AgentResolver = defaultResolver,
  log?: { info: (obj: Record<string, unknown>, msg?: string) => void },
): Promise<void> {
  const { warning } = await assertBudget(userId, supabase)
  const conversation = (await openConversation(userId, supabase, input.channel)) ?? (await createConversation(userId, supabase, input.channel))
  const previous = await conversationMessages(supabase, conversation.id)

  const { data: userRow, error: userError } = await supabase
    .from('agent_messages')
    .insert({ conversation_id: conversation.id, user_id: userId, role: 'user', content: input.message })
    .select('id')
    .single()
  if (userError) throw userError
  emit('start', { userMessageId: (userRow as { id: string }).id, ...(warning ? { budgetWarning: warning } : {}) })

  try {
    const routed = await resolveAgent({ channel: input.channel, message: input.message, recent: previous.slice(-4) })
    if (routed.usages?.length) await recordUsage(userId, routed.usages, supabase)
    if (input.channel === 'equipe') emit('routed', { agent: routed.agent, reason: routed.reason ?? '' })
    const agent = routed.agent

    const build = await buildIntegratedProfile(userId, supabase)
    const pending = build.mesocycle?.sessions.find(s => s.completedAt === null)

    const handleTool: AgentToolHandler = async call => {
      switch (call.name) {
        case 'record_conversation_fact': {
          const { data, error } = await supabase
            .from('conversation_facts')
            .insert({ user_id: userId, category: call.value.category, text: call.value.text, origin_agent: agent })
            .select('*')
            .single()
          if (error) throw error
          const fact = toFact(data as FactRow)
          return { content: 'Relato registrado; o usuário pode ver e apagar no Perfil Integrado.', event: { type: 'fact', fact } }
        }
        case 'propose_shared_guidance': {
          if (call.value.kind === 'restricao-seguranca' && agent !== 'medicina') {
            return { content: 'Só a Medicina Esportiva pode propor restrições de segurança; proponha uma recomendação ou encaminhe com suggest_specialist.', isError: true }
          }
          const { data, error } = await supabase
            .from('shared_guidance')
            .insert({
              user_id: userId,
              kind: call.value.kind,
              text: call.value.text,
              reason: call.value.reason,
              origin_agent: agent,
              status: 'pendente',
              duration_days: call.value.durationDays,
              blocked_patterns: call.value.blockedPatterns,
              blocked_exercises: call.value.blockedExercises,
            })
            .select('*')
            .single()
          if (error) throw error
          const guidance = toGuidance(data as GuidanceRow)
          return { content: 'Proposta registrada; ela só vale depois que o usuário aceitar no cartão abaixo da resposta.', event: { type: 'proposal', guidance } }
        }
        case 'propose_session_adjustment': {
          try {
            const adjustment = await requestSessionAdjustment(userId, supabase, { request: call.value.request, scope: call.value.scope, kind: 'ajuste-sessao' })
            const summary = adjustment.changes.map(c => `Sessão ${c.letter}: ${c.before ?? '—'} → ${c.after ?? '—'}`).join('; ')
            return { content: `Proposta criada para o usuário confirmar. ${adjustment.reason} Mudanças: ${summary || 'nenhuma'}.`, event: { type: 'proposal', adjustment } }
          } catch (err) {
            if (err instanceof BudgetExceededError) return { content: 'O teto mensal de IA foi atingido; não foi possível gerar a proposta.', isError: true }
            return { content: `Não foi possível gerar a proposta: ${(err as Error).message}`, isError: true }
          }
        }
        case 'suggest_specialist':
          return { content: 'Encaminhamento oferecido ao usuário.', event: { type: 'handoff', to: call.value.to, reason: call.value.reason } }
      }
    }

    const reply = await streamAgentReply({
      agent,
      profile: build.profile,
      dayContext: {
        date: todaySlug(),
        todaySession: pending ? `${pending.letter} — ${pending.focus}` : null,
        tiredness: build.tiredness?.effectiveLevel ?? null,
        notices: build.notices,
      },
      history: toHistory(previous),
      userMessage: input.message,
      handleTool,
      onEvent: (e: AgentStreamEvent) => {
        if (e.type === 'delta') emit('delta', { text: e.text })
        else if (e.type === 'fact') emit('fact', { fact: e.fact })
        else if (e.type === 'proposal') emit('proposal', { ...(e.guidance ? { guidance: e.guidance } : {}), ...(e.adjustment ? { adjustment: e.adjustment } : {}) })
        else emit('handoff', { to: e.to, reason: e.reason })
      },
    })

    const { data: agentRow, error: agentError } = await supabase
      .from('agent_messages')
      .insert({ conversation_id: conversation.id, user_id: userId, role: 'agent', agent, content: reply.text, sources_used: build.sourcesUsed, api_content: reply.apiContent })
      .select('id')
      .single()
    if (agentError) throw agentError
    await recordUsage(userId, reply.usages, supabase)
    // R13: métricas por chamada de IA, sem conteúdo das mensagens (dados de saúde).
    log?.info(
      {
        agent,
        operation: 'chat',
        model: reply.usages[0]?.model ?? null,
        ...reply.metrics,
        inputTokens: reply.usages.reduce((n, u) => n + u.input_tokens, 0),
        outputTokens: reply.usages.reduce((n, u) => n + u.output_tokens, 0),
        cacheReadTokens: reply.usages.reduce((n, u) => n + u.cache_read_input_tokens, 0),
      },
      'ai call',
    )
    emit('done', { agentMessageId: (agentRow as { id: string }).id, agent, sourcesUsed: build.sourcesUsed })
  } catch (err) {
    if (err instanceof AgentRefusalError) emit('error', { message: 'A IA não pôde responder a esta mensagem.', code: 'refusal' })
    else if (err instanceof BudgetExceededError) emit('error', { message: 'Teto mensal de IA atingido.', code: 'budget-exceeded' })
    else {
      emit('error', { message: 'O serviço de IA não respondeu. Tente de novo em instantes.', code: 'ai-unavailable' })
      throw err
    }
  }
}

export type { MessageRow as AgentMessageRow }
