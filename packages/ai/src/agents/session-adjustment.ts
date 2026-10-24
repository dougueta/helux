import type { AiOperation, ConstraintViolation, HardConstraints, IntegratedProfile, MesocycleSession, PlannedExercise, SessionChange, UsageRecord } from '@helux/types'
import { buildTrainingMethod } from '../mesocycle-prompts'
import { ConstraintsUnsatisfiableError, enrichExercise } from '../mesocycle-planner'
import { AGENT_MODEL, AgentRefusalError, anthropic, FALLBACK_PARAMS, messageText, usagesFromMessage } from './client'
import { validatePlanAgainstConstraints } from './constraints'
import { EXERCISE_ITEM_SCHEMA, rawToPlanned, type RawExercise } from './mesocycle-schema'
import { renderProfile } from './render-profile'

const ADJUSTMENT_SCHEMA = {
  type: 'object',
  properties: {
    sessions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          letter: { type: 'string' },
          focus: { type: 'string' },
          exercises: { type: 'array', items: EXERCISE_ITEM_SCHEMA },
        },
        required: ['index', 'letter', 'focus', 'exercises'],
        additionalProperties: false,
      },
    },
    reason: { type: 'string' },
  },
  required: ['sessions', 'reason'],
  additionalProperties: false,
} as const

const isMain = (e: PlannedExercise) => e.phase !== 'aquecimento' && e.phase !== 'volta-calma'
const describe = (e: PlannedExercise) => `${e.name} ${e.sets}x${e.reps} ${e.weight}`

/** Resumo por exercício principal, antes → depois (formato de mudanças da 011). */
export function computeSessionChanges(before: MesocycleSession[], after: MesocycleSession[], sessionIndexes: number[]): SessionChange[] {
  const changes: SessionChange[] = []
  sessionIndexes.forEach((sessionIndex, i) => {
    const b = before[i]?.exercises.filter(isMain) ?? []
    const a = after[i]?.exercises.filter(isMain) ?? []
    const letter = after[i]?.letter ?? before[i]?.letter ?? ''
    for (let k = 0; k < Math.max(a.length, b.length); k++) {
      const x = b[k]
      const y = a[k]
      if (x && !y) changes.push({ sessionIndex, letter, kind: 'removido', before: describe(x), after: null })
      else if (!x && y) changes.push({ sessionIndex, letter, kind: 'adicionado', before: null, after: describe(y) })
      else if (x && y && x.name !== y.name) changes.push({ sessionIndex, letter, kind: 'trocado', before: x.name, after: y.name })
      else if (x && y && describe(x) !== describe(y)) changes.push({ sessionIndex, letter, kind: 'alterado', before: describe(x), after: describe(y) })
    }
  })
  return changes
}

function toExercise(e: RawExercise): PlannedExercise {
  return enrichExercise(rawToPlanned(e))
}

function renderSessions(sessions: MesocycleSession[], indexes: number[]): string {
  return indexes
    .map(i => {
      const s = sessions[i]
      return `### Sessão ${s.letter} (índice ${i}) — ${s.focus}\n${s.exercises.map(e => `- [${e.phase ?? 'principal'}] ${describe(e)}`).join('\n')}`
    })
    .join('\n\n')
}

/**
 * Proposta de ajuste das sessões pendentes (FR-009, FR-011, R7): a IA reescreve
 * só as sessões pedidas, o validador confere as restrições rígidas (1 retry) e o
 * resultado vira antes → depois para o usuário confirmar. Nada é aplicado aqui.
 */
export async function proposeSessionAdjustment(input: {
  profile: IntegratedProfile
  constraints: HardConstraints
  sessions: MesocycleSession[]
  sessionIndexes: number[]
  request: string
  operation: Extract<AiOperation, 'ajuste-sessao' | 'adaptacao-restricao'>
}): Promise<{ after: MesocycleSession[]; changes: SessionChange[]; reason: string; usages: UsageRecord[] }> {
  const { sessions, sessionIndexes } = input
  if (sessionIndexes.some(i => !sessions[i] || sessions[i].completedAt !== null)) {
    throw new Error('Sessão concluída ou inexistente não pode ser ajustada')
  }
  const client = anthropic()
  const usages: UsageRecord[] = []
  const before = sessionIndexes.map(i => sessions[i])
  let violations: ConstraintViolation[] = []

  for (let attempt = 0; attempt < 2; attempt++) {
    const retry = violations.length > 0 ? `\n\nA proposta anterior violou: ${violations.map(v => v.message).join('; ')}. Corrija sem violar nenhuma restrição.` : ''
    const message = await client.beta.messages
      .stream({
        model: AGENT_MODEL,
        max_tokens: 16000,
        ...FALLBACK_PARAMS,
        betas: [...FALLBACK_PARAMS.betas],
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ADJUSTMENT_SCHEMA } },
        system: [
          { type: 'text', text: buildTrainingMethod(), cache_control: { type: 'ephemeral', ttl: '1h' } },
          { type: 'text', text: renderProfile(input.profile), cache_control: { type: 'ephemeral' } },
        ],
        messages: [
          {
            role: 'user',
            content: `## Ajuste de sessões pendentes

Reescreva apenas as sessões abaixo (mantendo o índice, a letra e as 3 fases) para atender ao pedido, respeitando as restrições rígidas: equipamentos ${
              input.constraints.availableEquipment.join(', ') || 'todos'
            }${input.constraints.maxSessionMinutes ? `; no máximo ${input.constraints.maxSessionMinutes} min por sessão` : ''}${
              input.constraints.exercisesToAvoid.length ? `; evitar ${input.constraints.exercisesToAvoid.join(', ')}` : ''
            }${input.constraints.blockedPatterns.length ? `; padrões bloqueados ${input.constraints.blockedPatterns.join(', ')}` : ''}. Mude o mínimo necessário e explique em \`reason\`.

Pedido: ${input.request}

${renderSessions(sessions, sessionIndexes)}${retry}`,
          },
        ],
      })
      .finalMessage()

    usages.push(...usagesFromMessage(message, input.operation, 'treino'))
    if (message.stop_reason === 'refusal') throw new AgentRefusalError()

    const raw = JSON.parse(messageText(message)) as { sessions: { index: number; letter: string; focus: string; exercises: RawExercise[] }[]; reason: string }
    const after: MesocycleSession[] = sessionIndexes.map(i => {
      const proposed = raw.sessions.find(s => s.index === i)
      return proposed ? { letter: sessions[i].letter, focus: proposed.focus, completedAt: null, exercises: proposed.exercises.map(toExercise) } : sessions[i]
    })
    violations = validatePlanAgainstConstraints(after, input.constraints)
    if (violations.length === 0) {
      return { after, changes: computeSessionChanges(before, after, sessionIndexes), reason: raw.reason, usages }
    }
  }
  throw new ConstraintsUnsatisfiableError(violations, usages)
}
