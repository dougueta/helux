'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/services/api-client'
import type { ExerciseSet } from '@helux/types'
import type { SessionCheckinsView } from '@/components/progress/SessionFeelings'

export interface WorkoutSessionRow {
  id: string
  date: string
  duration_s: number | null
  exercises: ExerciseSet[]
  created_at: string
  /** Spec 024: sensações de antes e depois ligadas à sessão. */
  checkins?: SessionCheckinsView
}

export function useWorkoutHistory(limit = 20, offset = 0) {
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch(`/api/workouts/history?limit=${limit}&offset=${offset}`)
      .then(data => {
        const d = data as { sessions: WorkoutSessionRow[]; total: number }
        setSessions(d.sessions)
        setTotal(d.total)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [limit, offset])

  return { sessions, total, loading, error }
}
