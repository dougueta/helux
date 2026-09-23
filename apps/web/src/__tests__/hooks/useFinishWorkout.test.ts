import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFinishWorkout } from '@/hooks/useFinishWorkout'

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('useFinishWorkout', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useFinishWorkout(vi.fn()))
    expect(result.current.status).toBe('idle')
  })

  it('goes saving → saved when finish resolves', async () => {
    const d = deferred()
    const finish = vi.fn(() => d.promise)
    const { result } = renderHook(() => useFinishWorkout(finish))

    let submitted!: Promise<void>
    act(() => { submitted = result.current.submit() })
    expect(result.current.status).toBe('saving')
    expect(finish).toHaveBeenCalledTimes(1)

    await act(async () => { d.resolve(); await submitted })
    expect(result.current.status).toBe('saved')
  })

  it('goes to error when finish rejects, without rejecting submit', async () => {
    const finish = vi.fn().mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useFinishWorkout(finish))

    await act(async () => { await expect(result.current.submit()).resolves.toBeUndefined() })
    expect(result.current.status).toBe('error')
  })

  it('retries from error', async () => {
    const finish = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useFinishWorkout(finish))

    await act(async () => { await result.current.submit() })
    expect(result.current.status).toBe('error')

    await act(async () => { await result.current.submit() })
    expect(finish).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('saved')
  })

  // US3 — no duplicate saves
  it('two submit() calls in the same tick call finish only once', async () => {
    const d = deferred()
    const finish = vi.fn(() => d.promise)
    const { result } = renderHook(() => useFinishWorkout(finish))

    let a!: Promise<void>, b!: Promise<void>
    act(() => {
      a = result.current.submit()
      b = result.current.submit()
    })
    await act(async () => { d.resolve(); await a; await b })
    expect(finish).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('saved')
  })

  it('submit() after saved does not call finish again', async () => {
    const finish = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useFinishWorkout(finish))

    await act(async () => { await result.current.submit() })
    await act(async () => { await result.current.submit() })
    expect(finish).toHaveBeenCalledTimes(1)
  })

  it('reset() is a no-op while saving or after saved', async () => {
    const d = deferred()
    const finish = vi.fn(() => d.promise)
    const { result } = renderHook(() => useFinishWorkout(finish))

    let p!: Promise<void>
    act(() => { p = result.current.submit() })
    act(() => { result.current.reset() })
    expect(result.current.status).toBe('saving')

    await act(async () => { d.resolve(); await p })
    act(() => { result.current.reset() })
    expect(result.current.status).toBe('saved')
  })

  it('reset() from error goes back to idle', async () => {
    const finish = vi.fn().mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useFinishWorkout(finish))

    await act(async () => { await result.current.submit() })
    act(() => { result.current.reset() })
    expect(result.current.status).toBe('idle')
  })
})
