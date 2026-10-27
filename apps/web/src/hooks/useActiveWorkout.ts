'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/services/api-client'
import { clearCachedPlan } from './useWorkoutPlan'
import { recommendedVariant } from '@/lib/exerciseDisplay'
import { EFFORT_VALUE, isConditioningItem, isMainExercise, type EffortLevel } from '@helux/workouts'
import type { PlannedExercise, Variant } from '@helux/types'

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
  /** Variant locked at the first done set; `null` = planned exercise (survives JSON, unlike `undefined`). */
  executedVariantByExerciseIndex: Record<number, string | null>
  /** Esforço percebido relatado por exercício (spec 014, FR-014); ausente em estados antigos. */
  effortByExerciseIndex: Record<number, EffortLevel>
  /** Spec 024: check-ins de sensação a ligar à sessão salva. */
  checkinIds?: string[]
  /** Spec 024: o check-in de antes já foi respondido ou pulado. */
  preCheckinDone?: boolean
}

/** Sem relato, o histórico continua gravando 8 (tratado como moderado). */
const DEFAULT_EFFORT = 8

function parseWeight(weight: string): number {
  // parseFloat: cargas da progressão podem ter casa decimal ("102.5kg").
  return parseFloat(weight.replace(',', '.')) || 0
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

function setStatesFor(planExercises: PlannedExercise[]): SetState[][] {
  return planExercises.map(ex => {
    const count = typeof ex.sets === 'number' ? ex.sets : (parseInt(String(ex.sets)) || 3)
    return Array.from({ length: count }, () => ({
      weight: parseWeight(ex.weight),
      reps: parseReps(ex.reps),
      done: false,
    }))
  })
}

export function useActiveWorkout() {
  const [session, setSession] = useState<ActiveWorkoutState | null>(null)
  const [loaded, setLoaded] = useState(false)
  // Lido no salvamento: o check-in de depois é gravado logo antes, no mesmo tick.
  const checkinIdsRef = useRef<string[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveWorkoutState
        checkinIdsRef.current = parsed.checkinIds ?? []
        setSession({
          ...parsed,
          variantByExerciseIndex: parsed.variantByExerciseIndex ?? {},
          executedVariantByExerciseIndex: parsed.executedVariantByExerciseIndex ?? {},
          effortByExerciseIndex: parsed.effortByExerciseIndex ?? {},
        })
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoaded(true)
  }, [])

  const startWorkout = useCallback((planExercises: PlannedExercise[]) => {
    checkinIdsRef.current = []
    const state: ActiveWorkoutState = {
      planExercises,
      exerciseStates: setStatesFor(planExercises),
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      variantByExerciseIndex: {},
      executedVariantByExerciseIndex: {},
      effortByExerciseIndex: {},
    }
    save(state)
    setSession(state)
  }, [])

  const update = useCallback((fn: (s: ActiveWorkoutState) => ActiveWorkoutState) => {
    setSession(prev => {
      if (!prev) return prev
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  const addCheckinId = useCallback((id: string) => {
    checkinIdsRef.current = [...checkinIdsRef.current, id]
    const ids = checkinIdsRef.current
    update(s => ({ ...s, checkinIds: ids }))
  }, [update])

  const markPreCheckinDone = useCallback(() => update(s => ({ ...s, preCheckinDone: true })), [update])

  /** Treino do dia ajustado depois do check-in de antes (spec 024): só antes da primeira série. */
  const replaceExercises = useCallback((planExercises: PlannedExercise[]) => {
    update(s => (s.exerciseStates.some(sets => sets.some(x => x.done)) ? s : { ...s, planExercises, exerciseStates: setStatesFor(planExercises), currentExerciseIndex: 0 }))
  }, [update])

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
      const wasDone = prev.exerciseStates[exerciseIndex]?.[setIndex]?.done ?? false
      const newExerciseStates = prev.exerciseStates.map((sets, ei) =>
        ei === exerciseIndex
          ? sets.map((s, si) => si === setIndex ? { ...s, done: !s.done } : s)
          : sets
      )
      const executedVariantByExerciseIndex = { ...prev.executedVariantByExerciseIndex }
      if (!wasDone && !(exerciseIndex in executedVariantByExerciseIndex)) {
        executedVariantByExerciseIndex[exerciseIndex] = prev.variantByExerciseIndex[exerciseIndex] ?? null
      } else if (wasDone && !newExerciseStates[exerciseIndex].some(s => s.done)) {
        delete executedVariantByExerciseIndex[exerciseIndex]
      }
      const next: ActiveWorkoutState = {
        ...prev,
        exerciseStates: newExerciseStates,
        executedVariantByExerciseIndex,
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

  const setEffort = useCallback((exerciseIndex: number, level: EffortLevel) => {
    setSession(prev => {
      if (!prev) return prev
      const next: ActiveWorkoutState = {
        ...prev,
        effortByExerciseIndex: { ...prev.effortByExerciseIndex, [exerciseIndex]: level },
      }
      save(next)
      return next
    })
  }, [])

  const getSkippedExercises = useCallback((): PlannedExercise[] => {
    if (!session) return []
    // Spec 014: aquecimento e volta à calma não contam como exercício pulado.
    return session.planExercises.filter(
      (ex, ei) => isMainExercise(ex) && (session.exerciseStates[ei] ?? []).every(s => !s.done)
    )
  }, [session])

  const finishWorkout = useCallback(async () => {
    if (!session) return
    const durationS = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000
    )

    // Spec 014: o histórico guarda só o treino principal.
    const exercises = session.planExercises.flatMap((ex, ei) => (isMainExercise(ex) ? [{ ex, ei }] : [])).map(({ ex, ei }) => {
      const level = session.effortByExerciseIndex[ei]
      const effort = level ? EFFORT_VALUE[level] : DEFAULT_EFFORT
      const doneSets = (session.exerciseStates[ei] ?? [])
        .filter(s => s.done)
        .map(s => ({ reps: s.reps, weight: s.weight, effort }))

      if (doneSets.length === 0) {
        return { name: ex.name, sets: doneSets, skipped: true }
      }

      const lockedVariantId = session.executedVariantByExerciseIndex[ei]
      const recommendedVariantId = recommendedVariant(ex)?.id
      const executedVariant = lockedVariantId && lockedVariantId !== recommendedVariantId
        ? ex.variants?.find((v: Variant) => v.id === lockedVariantId)
        : undefined

      return executedVariant
        ? { name: ex.name, sets: doneSets, executedVariant: { name: executedVariant.name, match: executedVariant.match } }
        : { name: ex.name, sets: doneSets }
    })

    // Spec 024: cardio e mobilidade concluídos entram com a duração (minutos em reps, carga 0).
    const conditioning = session.planExercises.flatMap((ex, ei) =>
      isConditioningItem(ex) && (session.exerciseStates[ei] ?? []).some(s => s.done)
        ? [{ name: ex.name, sets: [{ reps: ex.cardio?.minutes ?? (parseInt(String(ex.reps), 10) || 1), weight: 0, effort: 5 }] }]
        : [],
    )
    exercises.push(...(conditioning as typeof exercises))

    await apiFetch('/api/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify({
        date: session.startedAt.split('T')[0],
        duration_s: durationS,
        exercises,
        ...(checkinIdsRef.current.length > 0 ? { checkinIds: checkinIdsRef.current } : {}),
      }),
    })

    save(null)
    clearCachedPlan()
    setSession(null)
  }, [session])

  return {
    session,
    loaded,
    isActive: session !== null,
    startWorkout,
    addCheckinId,
    markPreCheckinDone,
    replaceExercises,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    selectVariant,
    setEffort,
    getSkippedExercises,
    finishWorkout,
  }
}
