import type { PlannedExercise, Variant } from '@helux/types'

/** The variant marked `rec`, or the first one when none is — the single rule for "recommended". */
export function recommendedVariant(exercise: PlannedExercise): Variant | undefined {
  const variants = exercise.variants ?? []
  return variants.find(v => v.rec) ?? variants[0]
}

export interface ExerciseDisplay {
  title: string
  /** Planned exercise name, only when an alternative variant is active. */
  plannedName: string | null
  fit: number | undefined
  tip: string | null
  tipKind: 'variant-why' | 'notes' | null
  /** Personalized cues/notes are written for the planned exercise, not for alternative variants. */
  showPlannedCues: boolean
}

/**
 * What the active-workout screen should show for an exercise given the chosen variant.
 * The recommended variant is the planned exercise itself, so only a non-recommended
 * variant replaces title, tip and fit.
 */
export function resolveExerciseDisplay(
  exercise: PlannedExercise,
  variantId: string | undefined,
): ExerciseDisplay {
  const recommended = recommendedVariant(exercise)
  const active = exercise.variants?.find(v => v.id === variantId) ?? recommended

  if (active && active.id !== recommended?.id) {
    const tip = active.why || null
    return {
      title: active.name,
      plannedName: exercise.name,
      fit: active.match,
      tip,
      tipKind: tip ? 'variant-why' : null,
      showPlannedCues: false,
    }
  }

  const tip = exercise.notes || null
  return {
    title: exercise.name,
    plannedName: null,
    fit: active?.match ?? exercise.match,
    tip,
    tipKind: tip ? 'notes' : null,
    showPlannedCues: true,
  }
}
