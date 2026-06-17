import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRestTimer } from '@/hooks/useRestTimer'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useRestTimer', () => {
  it('starts inactive', () => {
    const { result } = renderHook(() => useRestTimer())
    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(0)
  })

  it('counts down from given seconds', () => {
    const { result } = renderHook(() => useRestTimer())
    act(() => result.current.start(60))
    expect(result.current.isActive).toBe(true)
    expect(result.current.secondsLeft).toBe(60)
    act(() => vi.advanceTimersByTime(10000))
    expect(result.current.secondsLeft).toBe(50)
  })

  it('fires onComplete and stops at zero', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useRestTimer(onComplete))
    act(() => result.current.start(5))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(0)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('reset stops the timer', () => {
    const { result } = renderHook(() => useRestTimer())
    act(() => result.current.start(30))
    act(() => result.current.reset())
    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(0)
  })
})
