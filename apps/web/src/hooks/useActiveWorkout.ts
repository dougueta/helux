'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/services/api-client'
import type { PlannedExercise } from '@helux/types'

const STORAGE_KEY = 'helux:active-workout'

export interface SetState {
  weight: number
  reps: number
  done: boolean
}

export interface ActiveWorkoutState {
  planExercises: PlannedExercise[]
  exerciseStates: SetState[][]
  currentExerciseIndex: number
  startedAt: string
  restUntil?: string
  variantByExerciseIndex: Record<number, string>
}

function parseWeight(weight: string): number {
  return parseInt(weight) || 0
}

function parseReps(reps: string): number {
  return parseInt(reps) || 8
}

function save(state: ActiveWorkoutState | null) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function useActiveWorkout() {
  const [session, setSession] = useState<ActiveWorkoutState | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveWorkoutState
        setSession({ ...parsed, variantByExerciseIndex: parsed.variantByExerciseIndex ?? {} })
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoaded(true)
  }, [])

  const startWorkout = useCallback((planExercises: PlannedExercise[]) => {
    const exerciseStates: SetState[][] = planExercises.map(ex => {
      const count = typeof ex.sets === 'number' ? ex.sets : (parseInt(String(ex.sets)) || 3)
      return Array.from({ length: count }, () => ({
        weight: parseWeight(ex.weight),
        reps: parseReps(ex.reps),
        done: false,
      }))
    })

    const state: ActiveWorkoutState = {
      planExercises,
      exerciseStates,
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      variantByExerciseIndex: {},
    }
    save(state)
    setSession(state)
  }, [])

  const setExercise = useCallback((index: number) => {
    setSession(prev => {
      if (!prev) return prev
      const next = { ...prev, currentExerciseIndex: index }
      save(next)
      return next
    })
  }, [])

  const toggleSetDone = useCallback((exerciseIndex: number, setIndex: number) => {
    setSession(prev => {
      if (!prev) return prev
      const newExerciseStates = prev.exerciseStates.map((sets, ei) =>
        ei === exerciseIndex
          ? sets.map((s, si) => si === setIndex ? { ...s, done: !s.done } : s)
          : sets
      )
      const next: ActiveWorkoutState = {
        ...prev,
        exerciseStates: newExerciseStates,
      }
      save(next)
      return next
    })
  }, [])

  const updateSet = useCallback((exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setSession(prev => {
      if (!prev) return prev
      const newExerciseStates = prev.exerciseStates.map((sets, ei) =>
        ei === exerciseIndex
          ? sets.map((s, si) => si === setIndex ? { ...s, [field]: value } : s)
          : sets
      )
      const next: ActiveWorkoutState = { ...prev, exerciseStates: newExerciseStates }
      save(next)
      return next
    })
  }, [])

  const addSet = useCallback((exerciseIndex: number) => {
    setSession(prev => {
      if (!prev) return prev
      const newExerciseStates = prev.exerciseStates.map((sets, ei) => {
        if (ei !== exerciseIndex) return sets
        const last = sets[sets.length - 1]
        const newSet: SetState = last
          ? { weight: last.weight, reps: last.reps, done: false }
          : { weight: 0, reps: 8, done: false }
        return [...sets, newSet]
      })
      const next: ActiveWorkoutState = { ...prev, exerciseStates: newExerciseStates }
      save(next)
      return next
    })
  }, [])

  const selectVariant = useCallback((exerciseIndex: number, variantId: string) => {
    setSession(prev => {
      if (!prev) return prev
      const next: ActiveWorkoutState = {
        ...prev,
        variantByExerciseIndex: { ...prev.variantByExerciseIndex, [exerciseIndex]: variantId },
      }
      save(next)
      return next
    })
  }, [])

  const finishWorkout = useCallback(async () => {
    if (!session) return
    const durationS = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000
    )

    const exercises = session.planExercises
      .map((ex, ei) => ({
        name: ex.name,
        sets: (session.exerciseStates[ei] ?? [])
          .filter(s => s.done)
          .map(s => ({ reps: s.reps, weight: s.weight, effort: 8 })),
      }))
      .filter(e => e.sets.length > 0)

    await apiFetch('/api/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify({
        date: session.startedAt.split('T')[0],
        duration_s: durationS,
        exercises,
      }),
    })

    save(null)
    setSession(null)
  }, [session])

  return {
    session,
    loaded,
    isActive: session !== null,
    startWorkout,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    selectVariant,
    finishWorkout,
  }
}
