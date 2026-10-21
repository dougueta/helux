import type { SharedGuidance, UsageRecord } from '@helux/types'
import { AGENT_MODEL, anthropic, FALLBACK_PARAMS, messageText, usagesFromMessage } from './client'

const SCHEMA = {
  type: 'object',
  properties: { conflictWith: { type: ['string', 'null'], description: 'id da restrição em conflito, ou null' } },
  required: ['conflictWith'],
  additionalProperties: false,
} as const

/**
 * A recomendação nova conflita com alguma restrição de segurança ativa? (R9,
 * FR-021). Texto livre não dá para comparar por regra: uma chamada curta com
 * saída estruturada decide; id desconhecido conta como sem conflito.
 */
export async function detectGuidanceConflict(args: { candidate: SharedGuidance; active: SharedGuidance[] }): Promise<{ conflictWith: string | null; usage: UsageRecord }> {
  const list = args.active.map(g => `- id ${g.id}: ${g.text} (motivo: ${g.reason})`).join('\n')
  const message = await anthropic().beta.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1000,
    ...FALLBACK_PARAMS,
    betas: [...FALLBACK_PARAMS.betas],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: 'Você verifica se uma recomendação de saúde e treino contradiz alguma restrição de segurança ativa. Só há conflito quando seguir a recomendação exigiria descumprir a restrição.',
    messages: [{ role: 'user', content: `Restrições de segurança ativas:\n${list}\n\nRecomendação nova: ${args.candidate.text} (motivo: ${args.candidate.reason})\n\nResponda com o id da restrição em conflito, ou null.` }],
  })
  const [usage] = usagesFromMessage(message, 'conflito', null)
  try {
    const out = JSON.parse(messageText(message)) as { conflictWith: string | null }
    return { conflictWith: args.active.some(g => g.id === out.conflictWith) ? out.conflictWith : null, usage }
  } catch {
    return { conflictWith: null, usage }
  }
}
