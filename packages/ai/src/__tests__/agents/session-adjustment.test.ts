import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SOURCE_KEYS, type HardConstraints, type IntegratedProfile, type MesocycleSession } from '@helux/types'

const { mockStream } = vi.hoisted(() => ({ mockStream: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn(() => ({ beta: { messages: { stream: mockStream } } })) }))

import { computeSessionChanges, proposeSessionAdjustment } from '../../agents/session-adjustment'
import { ConstraintsUnsatisfiableError } from '../../mesocycle-planner'

const PROFILE: IntegratedProfile = {
  generatedAt: '2026-10-20T10:00:00Z',
  sources: Object.fromEntries(SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null }])) as IntegratedProfile['sources'],
}
const NONE: HardConstraints = { availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null }

const S = (letter: string, names: string[], completedAt: string | null = null): MesocycleSession => ({
  letter,
  focus: `Foco ${letter}`,
  completedAt,
  exercises: names.map(name => ({ name, sets: 4, reps: '8', weight: '80 kg', phase: 'principal' as const })),
})
const SESSIONS = [S('A', ['Supino Reto (Barra)'], '2026-10-18T10:00:00Z'), S('B', ['Remada Curvada (Barra)', 'Rosca Direta (Barra)']), S('C', ['Agachamento Livre (Barra)'])]

function reply(sessions: unknown[], stop_reason = 'end_turn') {
  return {
    finalMessage: async () => ({
      model: 'claude-opus-5-5',
      stop_reason,
      content: [{ type: 'text', text: JSON.stringify({ sessions, reason: 'Hotel com halteres e 30 min.' }) }],
      usage: { input_tokens: 10, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    }),
  }
}
const ex = (name: string, sets = 3) => ({ phase: 'principal', name, sets, reps: '10', weight: '20 kg', notes: null, supersetGroup: null })

beforeEach(() => mockStream.mockReset())

describe('computeSessionChanges (formato de mudanças da 011)', () => {
  it('troca, alteração de séries/carga, remoção e adição', () => {
    const before = [S('B', ['Remada Curvada (Barra)', 'Rosca Direta (Barra)', 'Face Pull (Cabo)'])]
    const after: MesocycleSession[] = [
      {
        ...before[0],
        exercises: [
          { name: 'Remada Unilateral (Halteres)', sets: 4, reps: '8', weight: '80 kg' },
          { name: 'Rosca Direta (Barra)', sets: 3, reps: '8', weight: '70 kg' },
          { name: 'Face Pull (Cabo)', sets: 4, reps: '8', weight: '80 kg' },
          { name: 'Prancha Abdominal (Peso Corporal)', sets: 3, reps: '45 s', weight: '—' },
        ],
      },
    ]
    expect(computeSessionChanges(before, after, [1])).toEqual([
      { sessionIndex: 1, letter: 'B', kind: 'trocado', before: 'Remada Curvada (Barra)', after: 'Remada Unilateral (Halteres)' },
      { sessionIndex: 1, letter: 'B', kind: 'alterado', before: 'Rosca Direta (Barra) 4x8 80 kg', after: 'Rosca Direta (Barra) 3x8 70 kg' },
      { sessionIndex: 1, letter: 'B', kind: 'adicionado', before: null, after: 'Prancha Abdominal (Peso Corporal) 3x45 s —' },
    ])
  })
})

describe('proposeSessionAdjustment (022 T015)', () => {
  it('pede só as sessões pendentes afetadas, valida e devolve antes → depois', async () => {
    mockStream.mockReturnValueOnce(reply([{ index: 1, letter: 'B', focus: 'Costas', exercises: [ex('Remada Unilateral (Halteres)'), ex('Rosca Direta (Halteres)')] }]))
    const r = await proposeSessionAdjustment({ profile: PROFILE, constraints: NONE, sessions: SESSIONS, sessionIndexes: [1], request: 'hoje só 30 min, hotel com halteres', operation: 'ajuste-sessao' })
    const params = mockStream.mock.calls[0][0]
    expect(params.output_config).toMatchObject({ effort: 'medium', format: { type: 'json_schema' } })
    expect(params.messages[0].content).toContain('hoje só 30 min, hotel com halteres')
    expect(params.messages[0].content).toContain('Sessão B')
    expect(params.messages[0].content).not.toContain('Sessão A ')
    expect(r.after).toHaveLength(1)
    expect(r.after[0].exercises.map(e => e.name)).toEqual(['Remada Unilateral (Halteres)', 'Rosca Direta (Halteres)'])
    expect(r.after[0].completedAt).toBeNull()
    expect(r.changes.length).toBeGreaterThan(0)
    expect(r.reason).toBe('Hotel com halteres e 30 min.')
    expect(r.usages[0]).toMatchObject({ operation: 'ajuste-sessao', agent: 'treino' })
  })

  it('sessão concluída nunca entra', async () => {
    await expect(
      proposeSessionAdjustment({ profile: PROFILE, constraints: NONE, sessions: SESSIONS, sessionIndexes: [0], request: 'x', operation: 'ajuste-sessao' }),
    ).rejects.toThrow(/concluída/)
    expect(mockStream).not.toHaveBeenCalled()
  })

  it('viola de novo após o retry → ConstraintsUnsatisfiableError', async () => {
    mockStream.mockReturnValue(reply([{ index: 1, letter: 'B', focus: 'Costas', exercises: [ex('Remada Curvada (Barra)')] }]))
    const err = await proposeSessionAdjustment({
      profile: PROFILE,
      constraints: { ...NONE, availableEquipment: ['halteres'] },
      sessions: SESSIONS,
      sessionIndexes: [1],
      request: 'x',
      operation: 'adaptacao-restricao',
    }).catch(e => e)
    expect(mockStream).toHaveBeenCalledTimes(2)
    expect(err).toBeInstanceOf(ConstraintsUnsatisfiableError)
  })
})
