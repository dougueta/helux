import type { ExerciseSet } from '@helux/types'

// Spec 024 (R9): sessões curtas demais ou sem séries são suspeitas (ex.: testes
// de validação) e ficam fora da progressão, da variedade e da análise do ciclo
// até o usuário confirmar ou excluir.

const MIN_SETS = 3
const MIN_DURATION_S = 600

export interface SessionLike {
  duration_s?: number | null
  review_status?: string | null
  exercises: ExerciseSet[]
}

export function sessionValidity(s: SessionLike): { valid: boolean; reasons: string[] } {
  if (s.review_status === 'confirmada') return { valid: true, reasons: [] }
  const sets = s.exercises.reduce((n, e) => n + (e.skipped ? 0 : e.sets.length), 0)
  // Cardio concluído entra com os minutos e carga 0 (spec 024): conta como treino.
  const cardio = s.exercises.some(e => !e.skipped && e.sets.some(x => x.weight === 0 && x.reps >= 10))
  const reasons: string[] = []
  if (sets === 0) reasons.push('sem séries registradas')
  else if (sets < MIN_SETS && !cardio) reasons.push('menos de 3 séries')
  if (typeof s.duration_s === 'number' && s.duration_s < MIN_DURATION_S) reasons.push(`duração de ${Math.round(s.duration_s / 60)} min`)
  return { valid: reasons.length === 0, reasons }
}

export const isValidSession = (s: SessionLike) => sessionValidity(s).valid
