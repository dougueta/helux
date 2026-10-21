import type Anthropic from '@anthropic-ai/sdk'
import type { AgentKey, AgentStreamEvent, IntegratedProfile, UsageRecord } from '@helux/types'
import { AGENT_MODEL, AgentRefusalError, anthropic, FALLBACK_PARAMS, usagesFromMessage } from './client'
import { PERSONA } from './personas'
import { renderDay, renderProfile, type DayContext } from './render-profile'
import { AGENT_TOOLS, validateToolInput, type ValidatedInput } from './tools'

/** Máximo de rodadas de ferramentas por mensagem do usuário (R5). */
const MAX_TOOL_ITERATIONS = 3

export type AgentMessageParam = Anthropic.Beta.BetaMessageParam

/** Execução de uma ferramenta pela API (persistência); o evento vai para o SSE. */
export type AgentToolHandler = (call: ValidatedInput) => Promise<{ content: string; isError?: boolean; event?: AgentStreamEvent }>

export interface StreamAgentArgs {
  agent: AgentKey
  /** Snapshot já filtrado por fontes ativas. */
  profile: IntegratedProfile
  dayContext: DayContext
  /** Últimas mensagens da conversa (api_content quando houver), sem alteração. */
  history: AgentMessageParam[]
  userMessage: string
  handleTool: AgentToolHandler
  onEvent: (e: AgentStreamEvent) => void
}

export interface StreamAgentResult {
  text: string
  /** Turnos depois da mensagem do usuário (assistente + tool_result), para replay fiel do histórico. */
  apiContent: AgentMessageParam[]
  usages: UsageRecord[]
}

/**
 * Resposta de um especialista em streaming (contrato agent-runtime.md): três
 * blocos de sistema com cache, deltas repassados, laço de ferramentas que só
 * cria pendências (≤ 3 rodadas), recusa vira erro amigável.
 */
export async function streamAgentReply(args: StreamAgentArgs): Promise<StreamAgentResult> {
  const client = anthropic()
  const tools = AGENT_TOOLS[args.agent]
  const allowed = new Set(tools.map(t => t.name))
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: PERSONA[args.agent], cache_control: { type: 'ephemeral', ttl: '1h' } },
    { type: 'text', text: renderProfile(args.profile), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: renderDay(args.dayContext) },
  ]
  const turn: AgentMessageParam[] = []
  const usages: UsageRecord[] = []
  let text = ''

  for (let iteration = 0; ; iteration++) {
    const stream = client.beta.messages.stream({
      model: AGENT_MODEL,
      max_tokens: 8000,
      ...FALLBACK_PARAMS,
      betas: [...FALLBACK_PARAMS.betas],
      output_config: { effort: 'low' },
      // Auto-cache do histórico no último bloco; os 2 breakpoints do sistema completam a prefixação estável.
      cache_control: { type: 'ephemeral' },
      tools,
      tool_choice: { type: 'auto' },
      system,
      messages: [...args.history, { role: 'user', content: args.userMessage }, ...turn],
    })
    stream.on('text', delta => {
      text += delta
      args.onEvent({ type: 'delta', text: delta })
    })
    const message = await stream.finalMessage()
    usages.push(...usagesFromMessage(message, 'chat', args.agent))
    if (message.stop_reason === 'refusal') throw new AgentRefusalError()

    turn.push({ role: 'assistant', content: message.content as Anthropic.Beta.BetaContentBlockParam[] })
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
    // max_tokens pode truncar o input da ferramenta: nunca executa; termina com o texto obtido.
    if (message.stop_reason !== 'tool_use' || toolUses.length === 0 || iteration >= MAX_TOOL_ITERATIONS) break

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
    for (const use of toolUses) {
      if (!allowed.has(use.name)) {
        results.push({ type: 'tool_result', tool_use_id: use.id, content: `A ferramenta ${use.name} não está disponível para este especialista.`, is_error: true })
        continue
      }
      const validated = validateToolInput(use.name, use.input)
      if (!validated.ok) {
        results.push({ type: 'tool_result', tool_use_id: use.id, content: validated.error, is_error: true })
        continue
      }
      try {
        const r = await args.handleTool({ name: use.name, value: validated.value } as ValidatedInput)
        if (r.event) args.onEvent(r.event)
        results.push(r.isError ? { type: 'tool_result', tool_use_id: use.id, content: r.content, is_error: true } : { type: 'tool_result', tool_use_id: use.id, content: r.content })
      } catch (err) {
        results.push({ type: 'tool_result', tool_use_id: use.id, content: `Falha ao executar: ${(err as Error).message}`, is_error: true })
      }
    }
    // Todos os resultados numa única mensagem (mantém o paralelismo de ferramentas).
    turn.push({ role: 'user', content: results })
  }

  return { text, apiContent: turn, usages }
}
