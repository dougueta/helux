import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn(() => ({ beta: { messages: { create: mockCreate } } })) }))

import { proposeConditionRules } from '../../agents/condition-rules'

// Spec 024 T055 — regras propostas para uma condição fora do catálogo (FR-007).

const reply = (body: unknown, stop_reason = 'end_turn') => ({
  model: 'claude-opus-5-5',
  stop_reason,
  content: [{ type: 'text', text: JSON.stringify(body) }],
  usage: { input_tokens: 300, output_tokens: 120 },
})

const CONDITION = { customLabel: 'Fascite plantar', region: 'tornozelo' as const, side: 'direito' as const, status: 'ativa' as const, notes: 'dói ao acordar' }

describe('proposeConditionRules (024)', () => {
  beforeEach(() => mockCreate.mockReset())

  it('Agente de Medicina com saída estruturada; mantém só padrões e exercícios do banco', async () => {
    mockCreate.mockResolvedValue(
      reply({
        rules: [
          { text: 'Sem saltos nem corrida enquanto doer', reason: 'impacto agrava a fascite', blockedPatterns: ['agachar', 'inventado'], blockedExercises: ['step-up-halteres', 'nao-existe'] },
          { text: 'Alongar a panturrilha antes do treino', reason: 'reduz a tensão na fáscia', blockedPatterns: [], blockedExercises: [] },
        ],
      }),
    )
    const out = await proposeConditionRules(CONDITION)
    expect(out.rules).toEqual([
      { text: 'Sem saltos nem corrida enquanto doer', reason: 'impacto agrava a fascite', blockedPatterns: ['agachar'], blockedExercises: ['step-up-halteres'] },
      { text: 'Alongar a panturrilha antes do treino', reason: 'reduz a tensão na fáscia', blockedPatterns: [], blockedExercises: [] },
    ])
    expect(out.usages[0]).toMatchObject({ operation: 'condicao', agent: 'medicina' })
    const p = mockCreate.mock.calls[0][0]
    expect(p).toMatchObject({ model: 'claude-opus-5-5', output_config: { effort: 'medium', format: { type: 'json_schema' } }, fallbacks: 'default' })
    expect(p.messages[0].content).toContain('Fascite plantar')
    expect(p.messages[0].content).toContain('tornozelo')
  })

  it('recusa ou resposta inválida → nenhuma regra (o usuário é avisado pela rota)', async () => {
    mockCreate.mockResolvedValue(reply({}, 'refusal'))
    expect((await proposeConditionRules(CONDITION)).rules).toEqual([])
    mockCreate.mockResolvedValue({ ...reply({}), content: [{ type: 'text', text: 'não é json' }] })
    expect((await proposeConditionRules(CONDITION)).rules).toEqual([])
  })
})
