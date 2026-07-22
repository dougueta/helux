import type { MesocycleSession, RecoveryData, AdjustedSession, PlannedExercise } from '@helux/types'

const MIN_SETS = 2

function reduceSets(exercises: PlannedExercise[], note?: string): PlannedExercise[] {
  return exercises.map((exercise) => {
    const sets = Math.max(MIN_SETS, exercise.sets - 1)
    if (sets === exercise.sets) return exercise
    return {
      ...exercise,
      sets,
      notes: note ? [exercise.notes, note].filter(Boolean).join(' ') : exercise.notes,
    }
  })
}

export function applyRecoveryAdjustment(session: MesocycleSession, recovery: RecoveryData[]): AdjustedSession {
  const latestHrv = recovery.length > 0 ? recovery[recovery.length - 1].hrv : undefined

  if (latestHrv === undefined) {
    return { letter: session.letter, focus: session.focus, exercises: session.exercises, adjusted: false }
  }

  if (latestHrv >= 60) {
    return { letter: session.letter, focus: session.focus, exercises: session.exercises, adjusted: false }
  }

  if (latestHrv >= 40) {
    return {
      letter: session.letter,
      focus: session.focus,
      exercises: reduceSets(session.exercises),
      adjusted: true,
      adjustmentReason: `HRV moderado (${latestHrv}ms)`,
    }
  }

  return {
    letter: session.letter,
    focus: session.focus,
    exercises: reduceSets(session.exercises, 'Carga reduzida hoje por recovery comprometido.'),
    adjusted: true,
    adjustmentReason: `HRV baixo (${latestHrv}ms) — recuperação comprometida`,
  }
}
