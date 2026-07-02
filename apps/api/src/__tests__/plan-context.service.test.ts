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

function mockTable(rows: Record<string, unknown[]>) {
  return vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: rows[table] ?? [], error: null }),
        })),
        order: vi.fn(() => ({
          range: vi.fn().mockResolvedValue({ data: rows[table] ?? [], error: null }),
        })),
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
})
