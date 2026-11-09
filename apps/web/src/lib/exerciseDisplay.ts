import { findStrengthExercise, GEAR_LABEL, resolvePlannedItem, type ResolvedItem } from '@helux/exercises'
import type { PlannedExercise, Variant } from '@helux/types'

/** The variant marked `rec`, or the first one when none is — the single rule for "recommended". */
export function recommendedVariant(exercise: PlannedExercise): Variant | undefined {
  const variants = exercise.variants ?? []
  return variants.find(v => v.rec) ?? variants[0]
}

/** Variante ativa; `offList` quando ela não está mais na lista do plano (028, FR-035). */
export type ActiveVariant = Variant & { offList?: boolean }

/**
 * A variante em uso: a escolhida na lista, a escolhida que saiu da lista (montada a partir do
 * catálogo, para continuar valendo) ou, sem escolha válida, a recomendada.
 */
export function activeVariant(exercise: PlannedExercise, variantId: string | undefined): ActiveVariant | undefined {
  const listed = exercise.variants?.find(v => v.id === variantId)
  if (listed) return listed
  const entry = variantId ? findStrengthExercise(variantId) : undefined
  if (entry) {
    return {
      id: entry.id,
      name: entry.name,
      equip: GEAR_LABEL[entry.gear] ?? '',
      level: '',
      match: 0,
      motion: '',
      implement: '',
      why: '',
      offList: true,
    }
  }
  return recommendedVariant(exercise)
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
  /** Item do catálogo para a variante ativa (028): demonstração, orientação e músculos. */
  resolved: ResolvedItem
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
  const active = activeVariant(exercise, variantId)

  if (active && active.id !== recommended?.id) {
    const tip = active.why || null
    return {
      resolved: resolvePlannedItem(exercise, active.id),
      title: active.name,
      plannedName: exercise.name,
      fit: active.offList ? undefined : active.match,
      tip,
      tipKind: tip ? 'variant-why' : null,
      showPlannedCues: false,
    }
  }

  const tip = exercise.notes || null
  return {
    resolved: resolvePlannedItem(exercise),
    title: exercise.name,
    plannedName: null,
    fit: active?.match ?? exercise.match,
    tip,
    tipKind: tip ? 'notes' : null,
    showPlannedCues: true,
  }
}
