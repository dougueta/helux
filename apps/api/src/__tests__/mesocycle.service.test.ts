import { describe, it, expect, vi } from 'vitest'
import type { MesocycleSession } from '@helux/types'
import { getActiveMesocycle, findPendingSessionIndex } from '../services/mesocycle.service'

function buildSupabaseMock(row: unknown) {
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
  const mockOrder = vi.fn(() => ({ limit: mockLimit }))
  const mockEq = vi.fn(() => ({ order: mockOrder }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { from: mockFrom } as any
}

const SESSION_PENDING: MesocycleSession = {
  letter: 'B',
  focus: 'Costas + Bíceps',
  completedAt: null,
  exercises: [{ name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '60kg' }],
}

const SESSION_DONE: MesocycleSession = {
  letter: 'A',
  focus: 'Peito + Tríceps',
  completedAt: '2026-07-20T10:00:00.000Z',
  exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' }],
}

describe('getActiveMesocycle', () => {
  it('retorna null quando o usuário não tem nenhum mesocycle_plans', async () => {
    const supabase = buildSupabaseMock(null)

    const result = await getActiveMesocycle('user-123', supabase)

    expect(result).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('mesocycle_plans')
  })

  it('retorna a linha mais recente quando existe', async () => {
    const row = {
      id: 'meso-001',
      generated_at: '2026-07-21T10:00:00.000Z',
      days_per_week: 4,
      split_type: 'ABCD',
      sessions: [SESSION_DONE, SESSION_PENDING],
      rationale: 'Ciclo de hipertrofia.',
    }
    const supabase = buildSupabaseMock(row)

    const result = await getActiveMesocycle('user-123', supabase)

    expect(result?.id).toBe('meso-001')
    expect(result?.sessions).toHaveLength(2)
  })
})

describe('findPendingSessionIndex', () => {
  it('retorna o índice da primeira sessão sem completedAt', () => {
    const index = findPendingSessionIndex([SESSION_DONE, SESSION_PENDING])
    expect(index).toBe(1)
  })

  it('retorna -1 quando todas as sessões têm completedAt preenchido', () => {
    const index = findPendingSessionIndex([SESSION_DONE, { ...SESSION_PENDING, completedAt: '2026-07-21T10:00:00.000Z' }])
    expect(index).toBe(-1)
  })

  it('retorna -1 quando o array está vazio', () => {
    expect(findPendingSessionIndex([])).toBe(-1)
  })
})
