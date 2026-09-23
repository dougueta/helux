'use client'

import { useCallback, useRef, useState } from 'react'

export type FinishStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Drives the save that happens when a workout is finished (spec 016).
 * `submit` never rejects and is a no-op while saving or after success,
 * so repeated taps never record the same workout twice.
 */
export function useFinishWorkout(finish: () => Promise<void>) {
  const [status, setStatusState] = useState<FinishStatus>('idle')
  const statusRef = useRef<FinishStatus>('idle')

  const setStatus = useCallback((next: FinishStatus) => {
    statusRef.current = next
    setStatusState(next)
  }, [])

  const submit = useCallback(async () => {
    if (statusRef.current === 'saving' || statusRef.current === 'saved') return
    setStatus('saving')
    try {
      await finish()
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [finish, setStatus])

  const reset = useCallback(() => {
    if (statusRef.current === 'error') setStatus('idle')
  }, [setStatus])

  return { status, submit, reset }
}
