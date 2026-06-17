import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('workout.service', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('getLatestPlan calls GET /workout/latest-plan', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const mockPlan = { generatedAt: '2026-06-15T10:00:00Z', exercises: [], rationale: 'test' }
    vi.mocked(apiFetch).mockResolvedValueOnce(mockPlan)

    const { getLatestPlan } = await import('@/services/workout.service')
    const result = await getLatestPlan()

    expect(apiFetch).toHaveBeenCalledWith('/workout/latest-plan')
    expect(result).toEqual(mockPlan)
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
