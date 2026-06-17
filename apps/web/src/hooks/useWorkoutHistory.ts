'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/services/api-client'

export interface WorkoutSessionRow {
  id: string
  date: string
  duration_s: number | null
  exercises: Array<{ name: string; sets: Array<{ reps: number; weight: number; effort: number }> }>
  created_at: string
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
