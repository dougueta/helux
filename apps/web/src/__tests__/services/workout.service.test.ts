import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('workout.service', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('getLatestPlan calls GET /workout/latest-plan and returns an AdjustedWorkoutPlanView', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const mockView = {
      mesocycleId: 'meso-001',
      generatedAt: '2026-07-21T10:00:00Z',
      today: {
        letter: 'B',
        focus: 'Costas + Bíceps',
        exercises: [],
        adjusted: true,
        adjustmentReason: 'HRV moderado (52ms)',
      },
      upcoming: [{ letter: 'C', focus: 'Pernas' }],
      progress: { completed: 1, total: 4 },
    }
    vi.mocked(apiFetch).mockResolvedValueOnce(mockView)

    const { getLatestPlan } = await import('@/services/workout.service')
    const result = await getLatestPlan()

    expect(apiFetch).toHaveBeenCalledWith('/workout/latest-plan')
    expect(result).toEqual(mockView)
    expect(result?.today?.adjusted).toBe(true)
    expect(result?.upcoming).toHaveLength(1)
  })

  it('getLatestPlan returns null on 404', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 404'))

    const { getLatestPlan } = await import('@/services/workout.service')
    const result = await getLatestPlan()
    expect(result).toBeNull()
  })

  it('024: regeneratePlan chama POST /workout/mesocycle/regenerate', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ status: 'gerando' })
    const { regeneratePlan } = await import('@/services/workout.service')
    await regeneratePlan()
    expect(apiFetch).toHaveBeenCalledWith('/workout/mesocycle/regenerate', { method: 'POST' })
  })

  it('024: repeatLastWeek chama POST /workout/mesocycle/repeat-week e propaga o erro', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ mesocycleId: 'm9' }).mockRejectedValueOnce(new Error('HTTP 409'))
    const { repeatLastWeek } = await import('@/services/workout.service')
    await repeatLastWeek()
    expect(apiFetch).toHaveBeenCalledWith('/workout/mesocycle/repeat-week', { method: 'POST' })
    await expect(repeatLastWeek()).rejects.toThrow()
  })
})
