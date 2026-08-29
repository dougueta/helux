import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('@/services/tiredness.service', () => ({
  markTiredToday: vi.fn(),
  clearTiredToday: vi.fn(),
}))

describe('useTiredness', () => {
  it('starts inactive by default', async () => {
    const { useTiredness } = await import('@/hooks/useTiredness')
    const { result } = renderHook(() => useTiredness())
    expect(result.current.active).toBe(false)
  })

  it('toggle() marks tired when currently inactive', async () => {
    const { markTiredToday } = await import('@/services/tiredness.service')
    vi.mocked(markTiredToday).mockResolvedValueOnce({ active: true })
    const { useTiredness } = await import('@/hooks/useTiredness')
    const { result } = renderHook(() => useTiredness())

    await act(async () => {
      await result.current.toggle()
    })

    expect(markTiredToday).toHaveBeenCalled()
    expect(result.current.active).toBe(true)
  })

  it('toggle() clears tired when currently active (FR-008a)', async () => {
    const { markTiredToday, clearTiredToday } = await import('@/services/tiredness.service')
    vi.mocked(markTiredToday).mockResolvedValueOnce({ active: true })
    vi.mocked(clearTiredToday).mockResolvedValueOnce({ active: false })
    const { useTiredness } = await import('@/hooks/useTiredness')
    const { result } = renderHook(() => useTiredness())

    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.active).toBe(true)

    await act(async () => {
      await result.current.toggle()
    })
    expect(clearTiredToday).toHaveBeenCalled()
    expect(result.current.active).toBe(false)
  })
})
