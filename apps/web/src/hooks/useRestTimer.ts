'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useRestTimer(onComplete?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSecondsLeft(seconds)
    setIsActive(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setIsActive(false)
          onCompleteRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsActive(false)
    setSecondsLeft(0)
  }, [])

  return { secondsLeft, isActive, start, reset }
}
