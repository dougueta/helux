import type Anthropic from '@anthropic-ai/sdk'
import { AGENT_KEYS, MOVEMENT_PATTERNS, type AgentKey, type FactCategory, type GuidanceKind } from '@helux/types'
import { findBankExercise } from './constraints'

// Ferramentas dos agentes (022 R5): todas só registram algo pendente ou informativo.
// Nada muda no treino nem no perfil sem o usuário aceitar.

type Tool = Anthropic.Beta.BetaTool & { strict: true; eager_input_streaming: true }

const tool = (name: string, description: string, properties: Record<string, unknown>): Tool => ({
  name,
  description,
  strict: true,
  eager_input_streaming: true,
  input_schema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
})

const RECORD_FACT = tool(
  'record_conversation_fact',
  'Registra um fato que o USUÁRIO declarou e que será útil aos outros especialistas (sintoma, preferência ou decisão). Não registre suposições suas. O usuário vê e pode apagar o relato.',
  {
    category: { type: 'string', enum: ['sintoma', 'preferencia', 'decisao'] },
    text: { type: 'string', description: 'Fato curto, 3 a 280 caracteres, em português.' },
  },
)

const PROPOSE_GUIDANCE = tool(
  'propose_shared_guidance',
  'Propõe uma restrição de segurança (só Medicina Esportiva) ou uma recomendação que os outros especialistas passarão a respeitar. Fica pendente até o usuário aceitar.',
  {
    kind: { type: 'string', enum: ['restricao-seguranca', 'recomendacao'] },
    text: { type: 'string', description: 'A orientação, até 280 caracteres.' },
    reason: { type: 'string', description: 'O motivo, até 500 caracteres.' },
    durationDays: { type: ['integer', 'null'], description: 'Prazo em dias (1 a 90) ou null para sem prazo.' },
    blockedPatterns: { type: 'array', items: { type: 'string', enum: [...MOVEMENT_PATTERNS] }, description: 'Padrões de movimento bloqueados no treino (restrições).' },
    blockedExercises: { type: 'array', items: { type: 'string' }, description: 'Ids de exercícios do banco bloqueados no treino.' },
  },
)

const PROPOSE_ADJUSTMENT = tool(
  'propose_session_adjustment',
  'Gera uma proposta de ajuste do treino (antes → depois) para o usuário confirmar. Use quando ele pedir para mudar a sessão de hoje ou as pendentes.',
  {
    request: { type: 'string', description: 'O que o usuário pediu, reescrito de forma objetiva (até 500 caracteres).' },
    scope: { type: 'string', enum: ['hoje', 'pendentes'] },
  },
)

const SUGGEST_SPECIALIST = tool(
  'suggest_specialist',
  'Indica que a pergunta pertence a outro especialista; a interface oferece continuar com ele.',
  {
    to: { type: 'string', enum: [...AGENT_KEYS] },
    reason: { type: 'string', description: 'Por que esse especialista (até 200 caracteres).' },
  },
)

/** Ferramentas por agente, em ordem fixa (o cache depende disso). */
export const AGENT_TOOLS: Record<AgentKey, Tool[]> = {
  treino: [RECORD_FACT, PROPOSE_GUIDANCE, PROPOSE_ADJUSTMENT, SUGGEST_SPECIALIST],
  medicina: [RECORD_FACT, PROPOSE_GUIDANCE, SUGGEST_SPECIALIST],
  nutricao: [RECORD_FACT, PROPOSE_GUIDANCE, SUGGEST_SPECIALIST],
}

export interface ToolInputs {
  record_conversation_fact: { category: FactCategory; text: string }
  propose_shared_guidance: {
    kind: GuidanceKind
    text: string
    reason: string
    durationDays: number | null
    blockedPatterns: string[]
    blockedExercises: string[]
  }
  propose_session_adjustment: { request: string; scope: 'hoje' | 'pendentes' }
  suggest_specialist: { to: AgentKey; reason: string }
}

export type ToolName = keyof ToolInputs
export type ValidatedInput = { [K in ToolName]: { name: K; value: ToolInputs[K] } }[ToolName]

const isStr = (v: unknown, min: number, max: number): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max
const isOneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)
const keysExactly = (o: Record<string, unknown>, keys: string[]) => Object.keys(o).length === keys.length && keys.every(k => k in o)

/**
 * Validação local do input (R5): com `eager_input_streaming` o servidor não
 * valida, e o input pode chegar truncado. Inválido → `tool_result` com erro.
 */
export function validateToolInput(name: string, input: unknown): { ok: true; value: ToolInputs[ToolName] } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error })
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('input não é um objeto')
  const o = input as Record<string, unknown>
  switch (name) {
    case 'record_conversation_fact':
      if (!keysExactly(o, ['category', 'text']) || !isOneOf(o.category, ['sintoma', 'preferencia', 'decisao'] as const) || !isStr(o.text, 3, 280)) {
        return fail('relato inválido: categoria sintoma/preferencia/decisao e texto de 3 a 280 caracteres')
      }
      return { ok: true, value: { category: o.category, text: o.text.trim() } }
    case 'propose_shared_guidance': {
      const keys = ['kind', 'text', 'reason', 'durationDays', 'blockedPatterns', 'blockedExercises']
      if (!keysExactly(o, keys) || !isOneOf(o.kind, ['restricao-seguranca', 'recomendacao'] as const) || !isStr(o.text, 1, 280) || !isStr(o.reason, 1, 500)) {
        return fail('orientação inválida: tipo, texto (≤ 280) e motivo (≤ 500) são obrigatórios')
      }
      if (o.durationDays !== null && !(Number.isInteger(o.durationDays) && (o.durationDays as number) >= 1 && (o.durationDays as number) <= 90)) {
        return fail('durationDays deve ser inteiro de 1 a 90 ou null')
      }
      if (!Array.isArray(o.blockedPatterns) || !o.blockedPatterns.every(p => isOneOf(p, MOVEMENT_PATTERNS))) return fail('padrão de movimento desconhecido')
      if (!Array.isArray(o.blockedExercises) || !o.blockedExercises.every(e => typeof e === 'string' && findBankExercise(e))) {
        return fail('exercício fora do banco em blockedExercises')
      }
      return {
        ok: true,
        value: {
          kind: o.kind,
          text: o.text.trim(),
          reason: o.reason.trim(),
          durationDays: o.durationDays as number | null,
          blockedPatterns: o.blockedPatterns as string[],
          blockedExercises: (o.blockedExercises as string[]).map(e => findBankExercise(e)!.id),
        },
      }
    }
    case 'propose_session_adjustment':
      if (!keysExactly(o, ['request', 'scope']) || !isStr(o.request, 1, 500) || !isOneOf(o.scope, ['hoje', 'pendentes'] as const)) return fail('ajuste inválido: request (≤ 500) e scope hoje/pendentes')
      return { ok: true, value: { request: o.request.trim(), scope: o.scope } }
    case 'suggest_specialist':
      if (!keysExactly(o, ['to', 'reason']) || !isOneOf(o.to, AGENT_KEYS) || !isStr(o.reason, 1, 200)) return fail('encaminhamento inválido')
      return { ok: true, value: { to: o.to, reason: o.reason.trim() } }
    default:
      return fail(`ferramenta desconhecida: ${name}`)
  }
}
