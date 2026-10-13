import type { PlannedExercise } from '@helux/types'
import { isMainExercise, supersetPartnerIndex } from './plan-structure'

// Spec 014 — o que acontece depois de concluir uma série: quanto descansar e
// para qual exercício ir. Ponto único de extensão para o descanso
// personalizado da spec 015 (substituir/estender `restSecondsAfterSet`).

export const DEFAULT_REST_SECONDS = 90

export interface RestContext {
  exercises: PlannedExercise[]
  /** Exercício cuja série acabou de ser concluída. */
  exerciseIndex: number
  /** hasPendingSets[i] = o exercício i ainda tem série não concluída (já contando a conclusão atual). */
  hasPendingSets: boolean[]
}

export interface NextStep {
  restSeconds: number
  goToExerciseIndex: number | null
}

/** Parceiro de biset que ainda tem série pendente, ou null. */
function pendingPartner({ exercises, exerciseIndex, hasPendingSets }: RestContext): number | null {
  const partner = supersetPartnerIndex(exercises, exerciseIndex)
  return partner !== null && hasPendingSets[partner] ? partner : null
}

/**
 * Tempo de descanso após a série (FR-013): 0 em aquecimento/volta à calma e
 * no 1º exercício de um biset cujo parceiro ainda tem série pendente; senão o
 * descanso padrão.
 */
export function restSecondsAfterSet(ctx: RestContext): number {
  const exercise = ctx.exercises[ctx.exerciseIndex]
  if (!exercise || !isMainExercise(exercise)) return 0
  const partner = pendingPartner(ctx)
  if (partner !== null && partner > ctx.exerciseIndex) return 0
  return DEFAULT_REST_SECONDS
}

/** Descanso + navegação automática do biset (FR-011). */
export function nextStepAfterSet(ctx: RestContext): NextStep {
  const exercise = ctx.exercises[ctx.exerciseIndex]
  const restSeconds = restSecondsAfterSet(ctx)
  if (!exercise || !isMainExercise(exercise)) return { restSeconds, goToExerciseIndex: null }
  return { restSeconds, goToExerciseIndex: pendingPartner(ctx) }
}
