import { describe, it, expect, vi } from 'vitest'

// gatherPlanInput saiu na spec 022: a geração lê o Perfil Integrado (integrated-profile.service).

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
