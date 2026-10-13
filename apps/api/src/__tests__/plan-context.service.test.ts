import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

const PARSED_PROFILE = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'medio',
  predisposicao: 'misto',
  alertas: [],
}

vi.mock('@helux/genetics', () => ({
  parseGeneraJson: vi.fn(() => PARSED_PROFILE),
}))

function mockTable(rows: Record<string, unknown[]>, profileRow: Record<string, unknown> | null = null) {
  return vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: rows[table] ?? [], error: null }),
        })),
        order: vi.fn(() => ({
          range: vi.fn().mockResolvedValue({ data: rows[table] ?? [], error: null }),
        })),
        maybeSingle: vi.fn().mockResolvedValue({
          data: table === 'user_training_profile' ? profileRow : null,
          error: null,
        }),
      })),
    })),
  }))
}

describe('gatherPlanInput', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('{}')
    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValue({ from: mockTable({}) } as never)
  })

  it('retorna null quando o perfil genético não existe', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { gatherPlanInput } = await import('../services/plan-context.service')

    const result = await gatherPlanInput('user-123', 'token-abc')

    expect(result).toBeNull()
  })

  it('monta PlanInput completo a partir do perfil genético + dados do Supabase', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValue({
      from: mockTable({
        health_samples: [{ type: 'hrv', value: 70, unit: 'ms', start_at: '2026-07-02T08:00:00.000Z' }],
        workout_sessions: [{ id: 's1', date: '2026-07-01', duration_s: 3000, exercises: [] }],
        body_checkins: [{ user_id: 'user-123', month: '2026-06-01' }],
      }),
    } as never)

    const { gatherPlanInput } = await import('../services/plan-context.service')
    const result = await gatherPlanInput('user-123', 'token-abc')

    expect(result).not.toBeNull()
    expect(result?.geneticProfile).toEqual(PARSED_PROFILE)
    expect(result?.recoveryData).toHaveLength(1)
    expect(result?.recoveryData[0].hrv).toBe(70)
    expect(result?.workoutHistory).toHaveLength(1)
    expect(result?.bodyCheckins).toHaveLength(1)
    expect(result?.userLevel).toBe('intermediario')
  })

  it('não quebra quando recovery/history/checkins estão vazios', async () => {
    const { gatherPlanInput } = await import('../services/plan-context.service')
    const result = await gatherPlanInput('user-123', 'token-abc')

    expect(result).not.toBeNull()
    expect(result?.recoveryData).toEqual([])
    expect(result?.workoutHistory).toEqual([])
    expect(result?.bodyCheckins).toEqual([])
  })

  it('usa os defaults atuais quando o usuário nunca preencheu o perfil (FR-005)', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValue({ from: mockTable({}, null) } as never)

    const { gatherPlanInput } = await import('../services/plan-context.service')
    const result = await gatherPlanInput('user-123', 'token-abc')

    expect(result?.userGoals).toBe('Hipertrofia e condicionamento geral')
    expect(result?.userLevel).toBe('intermediario')
    expect(result?.trainingTime).toBeUndefined()
    expect(result?.timeOff).toBeUndefined()
    expect(result?.currentInjury).toBeUndefined()
  })

  it('usa os dados reais do user_training_profile quando existem', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValue({
      from: mockTable({}, {
        goal: 'Resistência para maratona',
        level: 'avancado',
        training_time: '5 anos',
        time_off: null,
        current_injury: 'Dor no joelho direito',
      }),
    } as never)

    const { gatherPlanInput } = await import('../services/plan-context.service')
    const result = await gatherPlanInput('user-123', 'token-abc')

    expect(result?.userGoals).toBe('Resistência para maratona')
    expect(result?.userLevel).toBe('avancado')
    expect(result?.trainingTime).toBe('5 anos')
    expect(result?.currentInjury).toBe('Dor no joelho direito')
  })
})

describe('fetchSessionsSince (spec 014, US3)', () => {
  it('busca as sessões do usuário a partir da data, mais recentes primeiro', async () => {
    const rows = [{ id: 's2', date: '2026-10-08', exercises: [] }, { id: 's1', date: '2026-10-01', exercises: [] }]
    const order = vi.fn().mockResolvedValue({ data: rows, error: null })
    const gte = vi.fn(() => ({ order }))
    const eq = vi.fn(() => ({ gte }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    const { fetchSessionsSince } = await import('../services/plan-context.service')

    const result = await fetchSessionsSince('user-123', { from } as never, '2026-09-30')

    expect(from).toHaveBeenCalledWith('workout_sessions')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(gte).toHaveBeenCalledWith('date', '2026-09-30')
    expect(order).toHaveBeenCalledWith('date', { ascending: false })
    expect(result).toEqual(rows)
  })

  it('erro na consulta → lista vazia (a geração segue sem progressão)', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const from = vi.fn(() => ({ select: () => ({ eq: () => ({ gte: () => ({ order }) }) }) }))
    const { fetchSessionsSince } = await import('../services/plan-context.service')
    expect(await fetchSessionsSince('user-123', { from } as never, '2026-09-30')).toEqual([])
  })
})
