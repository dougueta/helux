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

  it('generatePlan calls POST /workout/generate with PlanInput', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const mockPlan = { generatedAt: new Date().toISOString(), exercises: [], rationale: 'ok' }
    vi.mocked(apiFetch).mockResolvedValueOnce(mockPlan)

    const { generatePlan } = await import('@/services/workout.service')
    const mockProfile = { traits: [] }
    const result = await generatePlan(mockProfile as any, null)

    expect(apiFetch).toHaveBeenCalledWith('/workout/generate', expect.objectContaining({ method: 'POST' }))
    expect(result).toEqual(mockPlan)
  })

  it('generatePlan handles AI unavailable (500)', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 500'))
    const { generatePlan } = await import('@/services/workout.service')
    await expect(generatePlan({} as any, null)).rejects.toThrow()
  })
})
