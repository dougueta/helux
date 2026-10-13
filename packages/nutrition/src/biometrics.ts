import type { Sex } from '@helux/types'

// Spec 018 (R2, R3) — biometria para as metas da fase.

/** Idade completa em `today` (datas `YYYY-MM-DD`). */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  const hadBirthday = tm > bm || (tm === bm && td >= bd)
  return ty - by - (hadBirthday ? 0 : 1)
}

/** Taxa metabólica basal por Mifflin-St Jeor (kg, cm, anos). */
export function bmrMifflin({ weightKg, heightCm, age, sex }: { weightKg: number; heightCm: number; age: number; sex: Sex }): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'masculino' ? base + 5 : base - 161
}

/**
 * % de gordura pelo método da Marinha dos EUA (fita métrica, cm). Medida
 * faltando, cintura que não supera o pescoço ou resultado fora de 3–60% →
 * null (sem bloquear nada).
 */
export function navyBodyFat({
  sex,
  heightCm,
  waistCm,
  neckCm,
  hipCm,
}: {
  sex: Sex
  heightCm: number
  waistCm?: number | null
  neckCm?: number | null
  hipCm?: number | null
}): number | null {
  if (!waistCm || !neckCm || !heightCm) return null
  let pct: number
  if (sex === 'masculino') {
    if (waistCm <= neckCm) return null
    pct = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
  } else {
    if (!hipCm || waistCm + hipCm <= neckCm) return null
    pct = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450
  }
  if (!Number.isFinite(pct) || pct < 3 || pct > 60) return null
  return Math.round(pct * 10) / 10
}

/** Fator de atividade pela frequência semanal do mesociclo ativo. */
export function activityFactor(daysPerWeek: number | null): number {
  if (daysPerWeek == null || daysPerWeek <= 2) return 1.375
  if (daysPerWeek <= 4) return 1.55
  return 1.725
}
