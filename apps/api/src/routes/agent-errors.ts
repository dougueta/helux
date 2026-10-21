import type { FastifyBaseLogger, FastifyReply } from 'fastify'
import { AgentRefusalError, ConstraintsUnsatisfiableError } from '@helux/ai'
import { BudgetExceededError } from '../services/ai-budget.service'
import { NoPendingSessionError } from '../services/proposals.service'

/**
 * Respostas das falhas conhecidas das operações de IA (spec 022): teto,
 * recusa, restrições impossíveis, sem sessão pendente; o resto vira
 * `ai-unavailable` (FR-024: nada parcial é aplicado).
 */
export function sendAgentError(reply: FastifyReply, log: FastifyBaseLogger, err: unknown, context: string) {
  if (err instanceof BudgetExceededError) {
    return reply.code(409).send({ error: 'Teto mensal de IA atingido', code: 'budget-exceeded', budget: err.status })
  }
  if (err instanceof ConstraintsUnsatisfiableError) {
    return reply.code(422).send({ error: err.message, code: 'constraints-unsatisfiable', violations: err.violations })
  }
  if (err instanceof NoPendingSessionError) {
    return reply.code(409).send({ error: err.message, code: 'no-pending-session' })
  }
  if (err instanceof AgentRefusalError) {
    return reply.code(422).send({ error: err.message, code: 'refusal' })
  }
  log.error(err, context)
  return reply.code(503).send({ error: 'O serviço de IA não respondeu. Seu treino atual continua valendo.', code: 'ai-unavailable' })
}
