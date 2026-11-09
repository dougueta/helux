'use client'

import { useState, useEffect, useCallback } from 'react'
import { CARDIO_BANK, type ComplementaryRoutine, type ComplementaryRoutineLogItem } from '@helux/types'
import { createRoutineLog } from '@/services/routines.service'

export const ACTIVE_ROUTINE_STORAGE_KEY = 'helux:active-routine'

export interface ActiveRoutineState {
  routine: ComplementaryRoutine
  currentItemIndex: number
  /** Por item, estado concluído de cada série. */
  completedSets: boolean[][]
  startedAt: string
  /** Para cardio: modalidade escolhida na execução. */
  selectedModality?: string
  /** Para cardio: minutos efetivos. */
  cardioMinutes?: number
  /** Esforço percebido (1–10). */
  effort?: number
}

function save(state: ActiveRoutineState | null) {
  if (state) {
    localStorage.setItem(ACTIVE_ROUTINE_STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(ACTIVE_ROUTINE_STORAGE_KEY)
  }
}

export function useActiveRoutine() {
  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutineState | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(ACTIVE_ROUTINE_STORAGE_KEY)
    if (raw) {
      try {
        setActiveRoutine(JSON.parse(raw) as ActiveRoutineState)
      } catch {
        localStorage.removeItem(ACTIVE_ROUTINE_STORAGE_KEY)
      }
    }
    setLoaded(true)
  }, [])

  const startRoutine = useCallback((routine: ComplementaryRoutine) => {
    const firstCardio = routine.items[0]?.cardio
    const state: ActiveRoutineState = {
      routine,
      currentItemIndex: 0,
      completedSets: routine.items.map(item => Array.from({ length: Math.max(1, item.sets) }, () => false)),
      startedAt: new Date().toISOString(),
      selectedModality: firstCardio?.modality,
      cardioMinutes: firstCardio?.minutes ?? routine.estimatedMinutes,
      effort: routine.category === 'cardio' ? 6 : undefined,
    }
    save(state)
    setActiveRoutine(state)
  }, [])

  const update = useCallback((fn: (prev: ActiveRoutineState) => ActiveRoutineState) => {
    setActiveRoutine(prev => {
      if (!prev) return prev
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  const toggleSet = useCallback(
    (itemIndex: number, setIndex: number) => {
      update(prev => {
        const completedSets = prev.completedSets.map((sets, idx) =>
          idx === itemIndex ? sets.map((done, sIdx) => (sIdx === setIndex ? !done : done)) : sets,
        )
        return { ...prev, completedSets }
      })
    },
    [update],
  )

  const setCurrentItemIndex = useCallback(
    (index: number) => {
      update(prev => ({
        ...prev,
        currentItemIndex: Math.max(0, Math.min(prev.routine.items.length - 1, index)),
      }))
    },
    [update],
  )

  const setCardioModality = useCallback(
    (modalityId: string) => {
      update(prev => ({ ...prev, selectedModality: modalityId }))
    },
    [update],
  )

  const setCardioMinutes = useCallback(
    (minutes: number) => {
      update(prev => ({ ...prev, cardioMinutes: Math.max(1, Math.min(240, minutes)) }))
    },
    [update],
  )

  const setEffort = useCallback(
    (effort: number) => {
      update(prev => ({ ...prev, effort: Math.max(1, Math.min(10, effort)) }))
    },
    [update],
  )

  const discardRoutine = useCallback(() => {
    save(null)
    setActiveRoutine(null)
  }, [])

  const finishRoutine = useCallback(
    async (notes?: string) => {
      if (!activeRoutine) return null
      const { routine, completedSets, startedAt, selectedModality, cardioMinutes, effort } = activeRoutine
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - Date.parse(startedAt)) / 60_000))
      const duration_minutes =
        routine.category === 'cardio'
          ? cardioMinutes ?? routine.estimatedMinutes
          : Math.max(1, routine.estimatedMinutes || elapsedMinutes)

      const items: ComplementaryRoutineLogItem[] =
        routine.category === 'cardio'
          ? [
              {
                id: selectedModality ?? routine.items[0]?.id ?? 'bike',
                name:
                  CARDIO_BANK.find(c => c.id === selectedModality)?.name ??
                  routine.items[0]?.name ??
                  'Cardio',
                setsCompleted: 1,
                secondsOrReps: `${duration_minutes} min`,
              },
            ]
          : routine.items.map((item, idx) => {
              const setsDone = (completedSets[idx] ?? []).filter(Boolean).length
              return {
                id: item.id,
                name: item.name,
                setsCompleted: setsDone > 0 ? setsDone : item.sets,
                secondsOrReps: item.seconds ? `${item.seconds}s` : item.reps,
              }
            })

      const today = new Date().toISOString().slice(0, 10)
      const result = await createRoutineLog({
        category: routine.category,
        performed_on: today,
        duration_minutes,
        modality: routine.category === 'cardio' ? (selectedModality ?? routine.items[0]?.id ?? null) : null,
        zone: routine.category === 'cardio' ? (routine.items[0]?.cardio?.zone ?? 'leve') : null,
        effort: effort ?? null,
        items,
        notes: notes?.trim() || null,
      })

      save(null)
      setActiveRoutine(null)
      return result
    },
    [activeRoutine],
  )

  return {
    activeRoutine,
    loaded,
    startRoutine,
    toggleSet,
    setCurrentItemIndex,
    setCardioModality,
    setCardioMinutes,
    setEffort,
    discardRoutine,
    finishRoutine,
  }
}
