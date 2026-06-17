'use client'

import { useState, useEffect } from 'react'
import { getWorkoutAnalytics } from '@/services/workout.service'
import type { WorkoutAnalytics } from '@helux/types'

export function useWorkoutAnalytics() {
  const [data, setData] = useState<WorkoutAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkoutAnalytics()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
