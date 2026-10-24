import { MOVEMENT_PATTERNS, type HealthConditionInput, type UsageRecord } from '@helux/types'
import { AGENT_MODEL, anthropic, FALLBACK_PARAMS, messageText, usagesFromMessage } from './client'
import { findBankExercise } from './constraints'

// Spec 024 (R1, FR-007): para uma condição fora do catálogo, o Agente de
// Medicina propõe regras de treino. Elas só valem depois do aceite do usuário
// (gravadas como restrições compartilhadas pendentes da 022).

export interface ProposedConditionRule {
  text: string
  reason: string
  blockedPatterns: string[]
  blockedExercises: string[]
}

const SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Regra curta para o treino, em português.' },
          reason: { type: 'string', description: 'Por que a regra protege a condição.' },
          blockedPatterns: { type: 'array', items: { type: 'string', enum: [...MOVEMENT_PATTERNS] } },
          blockedExercises: { type: 'array', items: { type: 'string' }, description: 'Ids de exercícios do banco a bloquear (pode ser vazio).' },
        },
        required: ['text', 'reason', 'blockedPatterns', 'blockedExercises'],
        additionalProperties: false,
      },
    },
  },
  required: ['rules'],
  additionalProperties: false,
} as const

const SYSTEM = `Você é o Agente de Medicina Esportiva do Helux. O usuário registrou uma condição de saúde que não está no catálogo do app. Proponha de 1 a 4 regras de treino conservadoras que protejam essa condição: padrões de movimento ou exercícios a bloquear quando fizer sentido, e cuidados de execução. Não faça diagnóstico nem indique remédio. As regras só passam a valer se o usuário aceitar.`

type Condition = Pick<HealthConditionInput, 'customLabel' | 'region' | 'side' | 'status' | 'notes'>

export async function proposeConditionRules(condition: Condition): Promise<{ rules: ProposedConditionRule[]; usages: UsageRecord[] }> {
  const message = await anthropic().beta.messages.create({
    model: AGENT_MODEL,
    max_tokens: 4000,
    ...FALLBACK_PARAMS,
    betas: [...FALLBACK_PARAMS.betas],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Condição: ${condition.customLabel}\nRegião: ${condition.region}${condition.side ? ` (${condition.side})` : ''}\nEstado: ${condition.status}${condition.notes ? `\nObservações do usuário: ${condition.notes}` : ''}`,
      },
    ],
  })
  const usages = usagesFromMessage(message, 'condicao', 'medicina')
  if (message.stop_reason === 'refusal') return { rules: [], usages }
  try {
    const out = JSON.parse(messageText(message)) as { rules?: ProposedConditionRule[] }
    const rules = (out.rules ?? []).map(r => ({
      text: r.text,
      reason: r.reason,
      blockedPatterns: r.blockedPatterns.filter(p => (MOVEMENT_PATTERNS as readonly string[]).includes(p)),
      blockedExercises: r.blockedExercises.filter(e => !!findBankExercise(e)).map(e => findBankExercise(e)!.id),
    }))
    return { rules, usages }
  } catch {
    return { rules: [], usages }
  }
}
