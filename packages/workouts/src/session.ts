import type { ActiveExercise, ActiveSession, SetState, WorkoutSummary } from './types'

export function startSession(
  workoutId: string,
  workoutName: string,
  exercises: ActiveExercise[],
): ActiveSession {
  const sets: Record<string, SetState[]> = {}
  for (const ex of exercises) {
    sets[ex.id] = ex.suggestedSets.map((s) => ({
      w: s.w,
      r: s.r,
      prev: s.prev,
      done: false,
    }))
  }
  return {
    workoutId,
    workoutName,
    exercises,
    sets,
    variantById: {},
    startedAt: Date.now(),
  }
}

export function logSet(
  session: ActiveSession,
  exerciseId: string,
  setIndex: number,
  w: number,
  r: number,
): ActiveSession {
  const exerciseSets = session.sets[exerciseId].map((s, i) =>
    i === setIndex ? { ...s, w, r } : s,
  )
  return {
    ...session,
    sets: {
      ...session.sets,
      [exerciseId]: exerciseSets,
    },
  }
}

export function completeSet(
  session: ActiveSession,
  exerciseId: string,
  setIndex: number,
): ActiveSession {
  const exerciseSets = session.sets[exerciseId].map((s, i) =>
    i === setIndex ? { ...s, done: true } : s,
  )
  return {
    ...session,
    sets: {
      ...session.sets,
      [exerciseId]: exerciseSets,
    },
  }
}

export function swapVariant(
  session: ActiveSession,
  exerciseId: string,
  variantId: string,
): ActiveSession {
  // Find the exercise and check if the target variant is the rec one
  const exercise = session.exercises.find((ex) => ex.id === exerciseId)
  const recVariant = exercise?.variants.find((v) => v.rec === true)
  const isRec = recVariant?.id === variantId

  const newVariantById = { ...session.variantById }
  if (isRec) {
    delete newVariantById[exerciseId]
  } else {
    newVariantById[exerciseId] = variantId
  }

  return {
    ...session,
    variantById: newVariantById,
  }
}

export function addSet(session: ActiveSession, exerciseId: string): ActiveSession {
  const currentSets = session.sets[exerciseId]
  const lastSet = currentSets[currentSets.length - 1]
  const newSet: SetState = {
    w: lastSet.w,
    r: lastSet.r,
    prev: '',
    done: false,
  }
  return {
    ...session,
    sets: {
      ...session.sets,
      [exerciseId]: [...currentSets, newSet],
    },
  }
}

export function finishSession(session: ActiveSession): WorkoutSummary {
  const finishedAt = Date.now()
  const durationMinutes = Math.round((finishedAt - session.startedAt) / 60_000)

  let totalSets = 0
  let totalVolumeKg = 0

  for (const exerciseSets of Object.values(session.sets)) {
    for (const s of exerciseSets) {
      if (s.done) {
        totalSets++
        totalVolumeKg += s.w * s.r
      }
    }
  }

  return {
    workoutId: session.workoutId,
    workoutName: session.workoutName,
    startedAt: session.startedAt,
    finishedAt,
    durationMinutes,
    totalSets,
    totalVolumeKg,
    newRecords: [],
  }
}
