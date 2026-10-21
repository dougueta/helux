import Anthropic from '@anthropic-ai/sdk'
import type { AgentKey, AiOperation, UsageRecord } from '@helux/types'

/** Modelo único dos agentes (R2): um namespace de cache e um preço a rastrear. */
export const AGENT_MODEL = 'claude-opus-5-5'

/** Fallback server-side em caso de recusa (R2): roteado pela categoria. */
export const FALLBACK_PARAMS = {
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
} as const

/** A IA recusou (stop_reason `refusal`): nada é gravado e o usuário vê uma mensagem amigável. */
export class AgentRefusalError extends Error {
  readonly code = 'refusal'
  constructor() {
    super('A IA não pôde responder a este pedido.')
  }
}

export function anthropic(): Anthropic {
  return new Anthropic()
}

type AnyUsage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation?: { ephemeral_1h_input_tokens: number; ephemeral_5m_input_tokens: number } | null
}

/**
 * `usage` da resposta → registros de custo (R11). A escrita de cache de 1 h tem
 * preço próprio, então vira um registro separado. O modelo é o efetivo da resposta.
 */
export function usagesFromMessage(message: { model: string; usage: AnyUsage }, operation: AiOperation, agent: AgentKey | null): UsageRecord[] {
  const u = message.usage
  const oneHour = u.cache_creation?.ephemeral_1h_input_tokens ?? 0
  const base: UsageRecord = {
    model: message.model,
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens,
    cache_creation_input_tokens: (u.cache_creation_input_tokens ?? 0) - oneHour,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    cacheTtl: '5m',
    operation,
    agent,
  }
  if (oneHour <= 0) return [base]
  return [base, { ...base, input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: oneHour, cacheTtl: '1h' }]
}

/** Texto das partes `text` de uma resposta. */
export function messageText(message: { content: Array<{ type: string }> }): string {
  return message.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map(b => b.text)
    .join('')
}
