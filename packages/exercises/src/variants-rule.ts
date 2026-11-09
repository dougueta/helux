/**
 * Regra de variantes coerentes (028 R9, FR-012): o candidato tem o mesmo padrão de movimento
 * e ao menos um músculo principal em comum, ou forma um par da tabela de afinidades.
 */
import type { MuscleKey, StrengthExercise } from './types'

/** Grupos afins, válidos só no padrão indicado. */
const AFFINITIES: { pattern: string; pair: [MuscleKey, MuscleKey] }[] = [{ pattern: 'dobrar-quadril', pair: ['gluteo', 'posterior'] }]

function affine(pattern: string, a: MuscleKey[], b: MuscleKey[]): boolean {
  return AFFINITIES.some(
    ({ pattern: p, pair: [x, y] }) => p === pattern && ((a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))),
  )
}

export function isCoherentVariant(base: StrengthExercise, candidate: StrengthExercise): boolean {
  if (base.id === candidate.id) return false
  if (base.pattern !== candidate.pattern) return false
  const a = base.muscles.primary
  const b = candidate.muscles.primary
  return a.some((m) => b.includes(m)) || affine(base.pattern, a, b)
}
