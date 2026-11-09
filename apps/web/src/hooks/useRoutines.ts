'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ComplementaryPreferences, ComplementaryRoutinesView } from '@helux/types'
import {
  createRoutineLog,
  deleteRoutineLog,
  getRoutines,
  updateRoutinePreferences,
  type CreateRoutineLogPayload,
} from '@/services/routines.service'

export function useRoutines(initialView?: ComplementaryRoutinesView | null) {
  const [view, setView] = useState<ComplementaryRoutinesView | null>(initialView ?? null)
  const [loading, setLoading] = useState(!initialView)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getRoutines()
      setView(next)
      return next
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar rotinas complementares.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialView) {
      void refresh()
    }
  }, [initialView, refresh])

  const savePreferences = useCallback(async (prefs: ComplementaryPreferences) => {
    const next = await updateRoutinePreferences(prefs)
    setView(next)
    return next
  }, [])

  const logRoutine = useCallback(async (payload: CreateRoutineLogPayload) => {
    const result = await createRoutineLog(payload)
    setView(result.view)
    return result
  }, [])

  const removeLog = useCallback(
    async (id: string) => {
      await deleteRoutineLog(id)
      await refresh()
    },
    [refresh],
  )

  return {
    view,
    loading,
    error,
    refresh,
    savePreferences,
    logRoutine,
    removeLog,
  }
}
