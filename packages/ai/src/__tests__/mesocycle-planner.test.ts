import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EMPTY_HARD_CONSTRAINTS, SOURCE_KEYS, type HardConstraints, type IntegratedProfile, type MethodPrescription } from '@helux/types'

const { mockStream } = vi.hoisted(() => ({ mockStream: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({ beta: { messages: { stream: mockStream } } })),
}))

import { generateMesocyclePlan, ConstraintsUnsatisfiableError, IncompleteResponseError } from '../mesocycle-planner'
import { AgentRefusalError } from '../agents/client'

// Spec 022 T013 + 024 T077: Agente de Treino com semana-modelo, método e condições.

const PROFILE: IntegratedProfile = {
  generatedAt: '2026-10-20T10:00:00Z',
  sources: Object.fromEntries(SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null }])) as IntegratedProfile['sources'],
}
PROFILE.sources.perfil = { status: 'ativa', updatedAt: null, summary: 'Objetivo principal: hipertrofia', data: null }
PROFILE.sources.preferencias = { status: 'ativa', updatedAt: null, summary: 'Dias: 2', data: null }

const NONE: HardConstraints = EMPTY_HARD_CONSTRAINTS
const HALTERES: HardConstraints = { ...NONE, availableEquipment: ['halteres', 'peso-corporal'] }

const METHOD: MethodPrescription = {
  goal: 'hipertrofia',
  weeks: 5,
  deloadWeek: 5,
  strengthDays: 2,
  cardioSessions: 1,
  mobilitySessions: 1,
  allowedSplits: ['full-body'],
  minFrequencyPerGroup: 2,
  weeklySetsPerGroup: { min: 4, max: 12 },
  weekly: [],
  repRanges: { basicos: [6, 10], acessorios: [10, 15] },
  cardio: { minutes: 20, zone: 'leve', maxImpact: 2, allowed: ['bike'] },
  modifiers: [],
}

const main = (name: string, sets = 3) => ({ phase: 'principal', name, sets, reps: '8-10', weight: '20 kg', rirTarget: 2, notes: null, supersetGroup: null })
const free = (phase: string, name: string, region: string | null = null) => ({ phase, name, sets: 1, reps: '5 min', weight: '—', region, notes: null })
const body = (chest = 'Supino Reto (Halteres)') => {
  const day = [
    free('aquecimento', 'Mobilidade de ombros'),
    main(chest, 2),
    main('Remada Unilateral (Halteres)', 2),
    main('Desenvolvimento com Halteres', 2),
    main('Agachamento Goblet (Halteres)', 2),
    main('Levantamento Terra Romeno (Halteres)', 2),
    main('Elevação Pélvica (Peso Corporal)', 2),
    free('volta-calma', 'Alongamento de peitoral'),
  ]
  return {
    splitType: 'Full Body',
    rationale: 'Full body 2× por semana.',
    decisions: [{ topic: 'divisao', choice: 'Full Body', sources: ['preferencias'], reason: '2 dias de força' }],
    weekTemplate: [
      { letter: 'A', kind: 'forca', focus: 'Corpo todo', exercises: [...day, { phase: 'cardio', modality: 'bike', minutes: 20, zone: 'leve', notes: null }] },
      { letter: 'B', kind: 'forca', focus: 'Corpo todo', exercises: [...day, free('mobilidade', 'Mobilidade de quadril', 'quadril')] },
    ],
  }
}

function reply(content: unknown, stop_reason = 'end_turn') {
  return {
    finalMessage: async () => ({
      model: 'claude-opus-5-5',
      stop_reason,
      content: [{ type: 'text', text: JSON.stringify(content) }],
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

const input = (over: Record<string, unknown> = {}) => ({ profile: PROFILE, constraints: HALTERES, method: METHOD, conditions: [], ...over })

beforeEach(() => {
  vi.clearAllMocks()
  mockStream.mockReset()
})

describe('generateMesocyclePlan — pedido', () => {
  it('Opus 5.5, esforço high, 64k tokens, structured output, fallback e prompt em blocos com cache', async () => {
    mockStream.mockReturnValueOnce(reply(body()))
    await generateMesocyclePlan(input())
    const params = mockStream.mock.calls[0][0]
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      max_tokens: 64000,
      output_config: { effort: 'high', format: { type: 'json_schema' } },
    })
    expect(params.system[0].cache_control).toEqual({ type: 'ephemeral', ttl: '1h' })
    expect(params.system[0].text).toContain('Agente de Treino')
    expect(params.system[1].cache_control).toEqual({ type: 'ephemeral' })
    expect(params.system[1].text).toContain('Objetivo principal: hipertrofia')
    expect(params.messages[0].content[0].text).toContain('2 dias de força')
    expect(params.messages[0].content[0].text).toContain('Equipamentos disponíveis: halteres, peso-corporal')
    expect(params.messages[0].content[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(params.thinking).toBeUndefined()
  })

  it('024 R17: o schema só aceita exercícios e cardio permitidos', async () => {
    mockStream.mockReturnValueOnce(reply(body()))
    await generateMesocyclePlan(input())
    const schema = JSON.stringify(mockStream.mock.calls[0][0].output_config.format.schema)
    expect(schema).toContain('Supino Reto (Halteres)')
    expect(schema).not.toContain('Supino Reto (Barra)')
    expect(schema).toContain('"bike"')
    expect(schema).not.toContain('"corrida"')
  })

  it('024 R17: sem nenhum exercício permitido → erro antes de chamar a IA', async () => {
    const err = await generateMesocyclePlan(input({ constraints: { ...NONE, availableEquipment: ['inexistente'] } })).catch(e => e)
    expect(err).toBeInstanceOf(ConstraintsUnsatisfiableError)
    expect(mockStream).not.toHaveBeenCalled()
  })

  it('aceita esforço explícito (eval) e manda as condições', async () => {
    mockStream.mockReturnValueOnce(reply(body()))
    await generateMesocyclePlan(input({ effort: 'high', conditions: [{ label: 'Artrose (joelho esquerdo)', rules: ['Carga no joelho ≤ 1'] }] }))
    expect(mockStream.mock.calls[0][0].output_config.effort).toBe('high')
    expect(mockStream.mock.calls[0][0].messages[0].content[0].text).toContain('Artrose (joelho esquerdo)')
  })
})

describe('generateMesocyclePlan — resultado', () => {
  it('semana-modelo enriquecida (força com cues; cardio e mobilidade sem), decisões e uso', async () => {
    mockStream.mockReturnValueOnce(reply(body()))
    const { plan, decisions, usages } = await generateMesocyclePlan(input())
    expect(plan.sessions).toHaveLength(2)
    expect(plan.daysPerWeek).toBe(2)
    expect(plan.splitType).toBe('Full Body')
    expect(plan.sessions[0]).toMatchObject({ letter: 'A', kind: 'forca', completedAt: null })
    const chest = plan.sessions[0].exercises.find(e => e.name === 'Supino Reto (Halteres)')!
    expect(chest.cues?.length).toBeGreaterThan(0)
    expect(chest.rirTarget).toBe(2)
    const bike = plan.sessions[0].exercises.find(e => e.cardio)!
    expect(bike).toMatchObject({ name: 'Bike ergométrica', cardio: { modality: 'bike', minutes: 20 } })
    expect(bike.cues).toBeUndefined()
    expect(plan.sessions[1].exercises.find(e => e.region)).toMatchObject({ name: 'Mobilidade de quadril', region: 'quadril' })
    expect(decisions).toEqual([{ topic: 'divisao', choice: 'Full Body', sources: ['preferencias'], reason: '2 dias de força' }])
    expect(usages.map(u => [u.cacheTtl, u.cache_creation_input_tokens])).toEqual([
      ['5m', 1000],
      ['1h', 2000],
    ])
    expect(usages[0]).toMatchObject({ operation: 'mesociclo', agent: 'treino', model: 'claude-opus-5-5' })
  })

  it('violação de restrição → nova tentativa sobre a resposta anterior, com a violação; ok na segunda', async () => {
    mockStream.mockReturnValueOnce(reply(body('Supino Reto (Barra)'))).mockReturnValueOnce(reply(body()))
    const { plan, usages } = await generateMesocyclePlan(input())
    expect(mockStream).toHaveBeenCalledTimes(2)
    const retry = mockStream.mock.calls[1][0].messages
    expect(retry).toHaveLength(3)
    expect(retry[1]).toMatchObject({ role: 'assistant' })
    expect(retry[1].content).toContain('Supino Reto (Barra)')
    expect(retry[2].content).toContain('Supino Reto (Barra) usa equipamento indisponível')
    expect(plan.sessions[0].exercises.map(e => e.name)).toContain('Supino Reto (Halteres)')
    expect(usages).toHaveLength(4)
  })

  it('violação do método (falta cardio) também volta para correção', async () => {
    const noCardio = body()
    noCardio.weekTemplate[0].exercises = noCardio.weekTemplate[0].exercises.filter(e => e.phase !== 'cardio')
    mockStream.mockReturnValueOnce(reply(noCardio)).mockReturnValueOnce(reply(body()))
    await generateMesocyclePlan(input())
    expect(mockStream.mock.calls[1][0].messages[2].content).toMatch(/sessões com cardio na semana/)
  })

  it('violação de novo → ConstraintsUnsatisfiableError com as violações e o uso', async () => {
    mockStream.mockReturnValue(reply(body('Supino Reto (Barra)')))
    const err = await generateMesocyclePlan(input()).catch(e => e)
    expect(err).toBeInstanceOf(ConstraintsUnsatisfiableError)
    expect(err.violations[0]).toMatchObject({ rule: 'equipamento' })
    expect(err.usages).toHaveLength(4)
  })

  it('resposta cortada → nova tentativa; persistindo → IncompleteResponseError', async () => {
    mockStream.mockReturnValueOnce(reply({ cortado: true }, 'max_tokens')).mockReturnValueOnce(reply(body()))
    expect((await generateMesocyclePlan(input())).plan.sessions).toHaveLength(2)
    mockStream.mockReset()
    mockStream.mockReturnValue(reply({ cortado: true }, 'max_tokens'))
    const err = await generateMesocyclePlan(input()).catch(e => e)
    expect(err).toBeInstanceOf(IncompleteResponseError)
    expect((err as IncompleteResponseError).usages).toHaveLength(4)
  })

  it('024 R17: séries fora da faixa são acertadas por código, sem nova tentativa; o método volta no resultado', async () => {
    mockStream.mockReturnValueOnce(reply(body()))
    const { plan, method } = await generateMesocyclePlan(input({ method: { ...METHOD, weeklySetsPerGroup: { min: 6, max: 8 } } }))
    expect(mockStream).toHaveBeenCalledTimes(1)
    const chestSets = plan.sessions.flatMap(s => s.exercises).filter(e => e.name === 'Supino Reto (Halteres)').reduce((n, e) => n + e.sets, 0)
    expect(chestSets).toBe(6)
    expect(method.weeklySetsPerGroup).toEqual({ min: 6, max: 8 })
  })

  it('recusa → AgentRefusalError', async () => {
    mockStream.mockReturnValueOnce(reply({}, 'refusal'))
    await expect(generateMesocyclePlan(input({ constraints: NONE }))).rejects.toBeInstanceOf(AgentRefusalError)
  })
})
