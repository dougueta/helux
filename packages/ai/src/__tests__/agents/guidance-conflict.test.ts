import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SharedGuidance } from '@helux/types'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn(() => ({ beta: { messages: { create: mockCreate } } })) }))

import { detectGuidanceConflict } from '../../agents/guidance-conflict'

const G = (over: Partial<SharedGuidance>): SharedGuidance => ({
  id: 'x',
  kind: 'recomendacao',
  text: '',
  reason: '',
  originAgent: 'nutricao',
  status: 'ativa',
  startsAt: null,
  expiresAt: null,
  durationDays: null,
  blockedPatterns: [],
  blockedExercises: [],
  createdAt: '',
  ...over,
})
const reply = (text: string) => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 200, output_tokens: 10 } })

describe('detectGuidanceConflict (022 T032, FR-021)', () => {
  beforeEach(() => mockCreate.mockReset())

  it('pergunta com saída estruturada e devolve a restrição em conflito', async () => {
    mockCreate.mockResolvedValue(reply('{"conflictWith":"r1"}'))
    const r = await detectGuidanceConflict({
      candidate: G({ id: 'c1', text: 'Treino de perna pesado 3x por semana' }),
      active: [G({ id: 'r1', kind: 'restricao-seguranca', text: 'Sem carga axial por 2 semanas', originAgent: 'medicina' })],
    })
    expect(r.conflictWith).toBe('r1')
    expect(r.usage).toMatchObject({ operation: 'conflito', agent: null })
    const p = mockCreate.mock.calls[0][0]
    expect(p.output_config).toMatchObject({ effort: 'low', format: { type: 'json_schema' } })
    expect(p.messages[0].content).toContain('Sem carga axial por 2 semanas')
    expect(p.messages[0].content).toContain('r1')
  })

  it('id fora da lista ou null → sem conflito', async () => {
    mockCreate.mockResolvedValue(reply('{"conflictWith":"inventado"}'))
    const active = [G({ id: 'r1', kind: 'restricao-seguranca' })]
    expect((await detectGuidanceConflict({ candidate: G({}), active })).conflictWith).toBeNull()
    mockCreate.mockResolvedValue(reply('{"conflictWith":null}'))
    expect((await detectGuidanceConflict({ candidate: G({}), active })).conflictWith).toBeNull()
  })
})
