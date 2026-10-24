import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SOURCE_KEYS, type HardConstraints, type IntegratedProfile } from '@helux/types'

const { mockStream } = vi.hoisted(() => ({ mockStream: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({ beta: { messages: { stream: mockStream } } })),
}))

import { generateMesocyclePlan, ConstraintsUnsatisfiableError } from '../mesocycle-planner'
import { AgentRefusalError } from '../agents/client'

const PROFILE: IntegratedProfile = {
  generatedAt: '2026-10-20T10:00:00Z',
  sources: Object.fromEntries(SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null }])) as IntegratedProfile['sources'],
}
PROFILE.sources.perfil = { status: 'ativa', updatedAt: null, summary: 'Objetivo: hipertrofia', data: null }

const NONE: HardConstraints = { availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null }
const HALTERES: HardConstraints = { ...NONE, availableEquipment: ['halteres'] }

const ex = (name: string, phase: 'principal' | 'aquecimento' | 'volta-calma' = 'principal') => ({
  phase,
  name,
  sets: phase === 'principal' ? 3 : 1,
  reps: '10',
  weight: '20 kg',
  notes: null,
  supersetGroup: null,
})
const output = (mainName: string) => ({
  daysPerWeek: 2,
  splitType: 'Upper/Lower',
  rationale: 'Divisão superior/inferior.',
  decisions: [{ topic: 'divisao', choice: 'Upper/Lower', sources: ['preferencias'], reason: '2 dias por semana' }],
  sessions: [
    { letter: 'A', focus: 'Superior', exercises: [ex('Mobilidade de ombros', 'aquecimento'), ex(mainName), ex('Alongamento de peitoral', 'volta-calma')] },
    { letter: 'B', focus: 'Inferior', exercises: [ex('Agachamento Goblet (Halteres)')] },
  ],
})

function reply(body: unknown, stop_reason = 'end_turn') {
  return {
    finalMessage: async () => ({
      model: 'claude-opus-5-5',
      stop_reason,
      content: [{ type: 'text', text: JSON.stringify(body) }],
      usage: {
        input_tokens: 1000,
        output_tokens: 2000,
        cache_creation_input_tokens: 3000,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_1h_input_tokens: 2000, ephemeral_5m_input_tokens: 1000 },
      },
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStream.mockReset()
})

describe('generateMesocyclePlan (022 T013)', () => {
  it('Opus 5.5, esforço medium, structured output, fallback e prompt em blocos com cache', async () => {
    mockStream.mockReturnValueOnce(reply(output('Supino Reto (Halteres)')))
    await generateMesocyclePlan({ profile: PROFILE, constraints: HALTERES, daysPerWeek: 2 })
    const params = mockStream.mock.calls[0][0]
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema' } },
    })
    expect(params.system[0].cache_control).toEqual({ type: 'ephemeral', ttl: '1h' })
    expect(params.system[0].text).toContain('Agente de Treino')
    expect(params.system[1].cache_control).toEqual({ type: 'ephemeral' })
    expect(params.system[1].text).toContain('Objetivo: hipertrofia')
    expect(params.messages[0].content).toContain('Equipamentos disponíveis: halteres')
    expect(params.thinking).toBeUndefined()
  })

  it('devolve plano enriquecido, decisões e uso (com a escrita de 1 h separada)', async () => {
    mockStream.mockReturnValueOnce(reply(output('Supino Reto (Halteres)')))
    const { plan, decisions, usages } = await generateMesocyclePlan({ profile: PROFILE, constraints: HALTERES, daysPerWeek: 2 })
    expect(plan.sessions).toHaveLength(2)
    expect(plan.sessions[0].completedAt).toBeNull()
    const main = plan.sessions[0].exercises.find(e => e.name === 'Supino Reto (Halteres)')!
    expect(main.cues?.length).toBeGreaterThan(0)
    expect(main.notes).toBeUndefined()
    expect(decisions).toEqual([{ topic: 'divisao', choice: 'Upper/Lower', sources: ['preferencias'], reason: '2 dias por semana' }])
    expect(usages.map(u => [u.cacheTtl, u.cache_creation_input_tokens])).toEqual([
      ['5m', 1000],
      ['1h', 2000],
    ])
    expect(usages[0]).toMatchObject({ operation: 'mesociclo', agent: 'treino', model: 'claude-opus-5-5' })
  })

  it('violação → 1 nova tentativa com as violações; ok na segunda', async () => {
    mockStream.mockReturnValueOnce(reply(output('Supino Reto (Barra)'))).mockReturnValueOnce(reply(output('Supino Reto (Halteres)')))
    const { plan, usages } = await generateMesocyclePlan({ profile: PROFILE, constraints: HALTERES, daysPerWeek: 2 })
    expect(mockStream).toHaveBeenCalledTimes(2)
    expect(mockStream.mock.calls[1][0].messages[0].content).toContain('Supino Reto (Barra) usa equipamento indisponível')
    expect(plan.sessions[0].exercises.map(e => e.name)).toContain('Supino Reto (Halteres)')
    expect(usages).toHaveLength(4)
  })

  it('violação de novo → ConstraintsUnsatisfiableError com as violações e o uso', async () => {
    mockStream.mockReturnValue(reply(output('Supino Reto (Barra)')))
    const err = await generateMesocyclePlan({ profile: PROFILE, constraints: HALTERES, daysPerWeek: 2 }).catch(e => e)
    expect(err).toBeInstanceOf(ConstraintsUnsatisfiableError)
    expect(err.violations[0]).toMatchObject({ rule: 'equipamento' })
    expect(err.usages).toHaveLength(4)
  })

  it('recusa → AgentRefusalError', async () => {
    mockStream.mockReturnValueOnce(reply({}, 'refusal'))
    await expect(generateMesocyclePlan({ profile: PROFILE, constraints: NONE, daysPerWeek: 2 })).rejects.toBeInstanceOf(AgentRefusalError)
  })
})
