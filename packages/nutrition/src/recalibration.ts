import type { BodyMeasurement, BodyWeight, DietPhase, RecalibrationEvaluation, Sex } from '@helux/types'
import { ageOn } from './biometrics'
import { recalibrate } from './phase'
import { addDays, daysBetween, effectiveBodyFat, trendAt } from './weight-trend'

// Spec 029 (US3, FR-019/FR-020): avaliação de "Recalibrar dieta" — pura, usada
// pela API (preview e apply) e pelo modo mock da web.

/** Intervalo mínimo entre calibrações (spec 018). */
export const MIN_DAYS_BETWEEN_CALIBRATIONS = 14

export interface RecalibrationInput {
  today: string
  phase: DietPhase | null
  profile: { heightCm: number | null; birthDate: string | null; sex: Sex | null }
  /** Data/hora da última calibração efetiva (ou null: base = início da fase). */
  lastCalibrationAt: string | null
  weights: BodyWeight[]
  measurements: BodyMeasurement[]
  daysPerWeek: number | null
}

/** Cintura do registro de medidas mais recente até a data (inclusive). */
function waistUntil(measurements: BodyMeasurement[], date: string): number | null {
  const m = [...measurements]
    .filter(x => x.measured_on <= date && x.waist_cm != null)
    .sort((a, b) => b.measured_on.localeCompare(a.measured_on) || b.created_at.localeCompare(a.created_at))[0]
  return m ? Number(m.waist_cm) : null
}

/**
 * Compara o peso de tendência na base (última calibração ou início da fase)
 * com o de hoje; a cintura desempata como antes. Não grava nada.
 */
export function evaluateRecalibration(input: RecalibrationInput): RecalibrationEvaluation {
  const { phase, profile, today } = input
  if (!phase) return { status: 'indisponivel', missing: ['sem-fase'] }
  const { heightCm, birthDate, sex } = profile
  if (heightCm == null || !birthDate || !sex) {
    const missing = [heightCm == null && 'heightCm', !birthDate && 'birthDate', !sex && 'sex'].filter(Boolean) as string[]
    return { status: 'indisponivel', missing }
  }

  const base = input.lastCalibrationAt ? input.lastCalibrationAt.slice(0, 10) : phase.startedOn
  if (daysBetween(base, today) < MIN_DAYS_BETWEEN_CALIBRATIONS) {
    return { status: 'intervalo-curto', availableOn: addDays(base, MIN_DAYS_BETWEEN_CALIBRATIONS) }
  }

  const fromKg = trendAt(input.weights, base)
  const toKg = trendAt(input.weights, today)
  if (fromKg == null || toKg == null) {
    return { status: 'faltam-pesagens', at: [...(fromKg == null ? ['inicio' as const] : []), ...(toKg == null ? ['atual' as const] : [])] }
  }

  const result = recalibrate({
    goal: phase.goal,
    current: phase.baseTargets,
    from: { weightKg: fromKg, waistCm: waistUntil(input.measurements, base), at: base },
    to: { weightKg: toKg, waistCm: waistUntil(input.measurements, today), at: today, bodyFatPct: effectiveBodyFat(input.measurements)?.pct ?? null },
    profile: { heightCm, age: ageOn(birthDate, today), sex, daysPerWeek: input.daysPerWeek },
  })
  return {
    status: 'proposta',
    action: result.action,
    before: phase.baseTargets,
    after: result.after,
    reason: result.reason,
    metrics: { ...result.metrics, trendFrom: { date: base, weightKg: fromKg }, trendTo: { date: today, weightKg: toKg } },
  }
}
