import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('@/services/profile.service', () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
}))

describe('useProfile', () => {
  it('loads the profile on mount', async () => {
    const { getProfile } = await import('@/services/profile.service')
    const profile = { goal: 'Hipertrofia', level: 'intermediario' as const, updatedAt: '2026-08-27T00:00:00Z' }
    vi.mocked(getProfile).mockResolvedValueOnce(profile)
    const { useProfile } = await import('@/hooks/useProfile')
    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toEqual(profile)
  })

  it('save() calls upsertProfile and updates local state', async () => {
    const { getProfile, upsertProfile } = await import('@/services/profile.service')
    vi.mocked(getProfile).mockResolvedValueOnce(null)
    const saved = { goal: 'Resistência', level: 'avancado' as const, updatedAt: '2026-08-27T01:00:00Z' }
    vi.mocked(upsertProfile).mockResolvedValueOnce(saved)
    const { useProfile } = await import('@/hooks/useProfile')
    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.save({ goal: 'Resistência', level: 'avancado' })
    })

    expect(upsertProfile).toHaveBeenCalledWith({ goal: 'Resistência', level: 'avancado' })
    expect(result.current.profile).toEqual(saved)
  })

  it('toggles saving while save() is in flight', async () => {
    const { getProfile, upsertProfile } = await import('@/services/profile.service')
    vi.mocked(getProfile).mockResolvedValueOnce(null)
    let resolveSave: (v: typeof saved) => void
    const saved = { goal: 'X', level: 'iniciante' as const, updatedAt: '2026-08-27T00:00:00Z' }
    vi.mocked(upsertProfile).mockReturnValueOnce(new Promise((r) => { resolveSave = r }))
    const { useProfile } = await import('@/hooks/useProfile')
    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let savePromise!: Promise<unknown>
    act(() => {
      savePromise = result.current.save({ goal: 'X' })
    })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      resolveSave(saved)
      await savePromise
    })
    expect(result.current.saving).toBe(false)
  })
})
