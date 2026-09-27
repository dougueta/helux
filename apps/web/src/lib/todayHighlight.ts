import type { PlannedExercise } from '@helux/types'
import { isMainExercise } from '@helux/workouts'

export interface TodayHighlight {
  first: PlannedExercise | undefined
  next: PlannedExercise[]
  more: number
  /** Número de exercícios do treino principal. */
  count: number
  /** O treino inclui aquecimento e/ou volta à calma. */
  hasExtraPhases: boolean
}

/** Destaque do treino de hoje na Home (spec 014, FR-023): só o treino principal. */
export function todayHighlight(exercises: PlannedExercise[]): TodayHighlight {
  const main = exercises.filter(e => isMainExercise(e))
  return {
    first: main[0],
    next: main.slice(1, 3),
    more: Math.max(0, main.length - 3),
    count: main.length,
    hasExtraPhases: main.length < exercises.length,
  }
}
