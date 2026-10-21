import type { CalibrationAction, DietCalibrationMetrics, DietGoal, DietTargets, Sex } from '@helux/types'
import { activityFactor, bmrMifflin } from './biometrics'

// Spec 018 (R2, R4) — metas-base da fase de dieta e recalibração por check-in.

const GOAL_ADJUST: Record<DietGoal, number> = {
  perder_gordura: -0.2,
  ganhar_massa: 0.1,
  recomposicao: -0.1,
  manutencao: 0,
}

const MAX_DEFICIT_KCAL = 600

/** Proteína em g/kg de peso por objetivo. */
export const PROTEIN_PER_KG: Record<DietGoal, number> = {
  perder_gordura: 2.2,
  recomposicao: 2.0,
  ganhar_massa: 1.8,
  manutencao: 1.8,
}

const FAT_SHARE = 0.25
const FAT_MIN_PER_KG = 0.8
const KCAL_FLOOR = 1200

export interface BodyProfile {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  daysPerWeek: number | null
}

const roundTo10 = (kcal: number) => Math.round(kcal / 10) * 10

/** Piso de calorias: nunca abaixo da TMB nem de 1.200 kcal. */
export function kcalFloor(body: BodyProfile): number {
  return Math.max(bmrMifflin(body), KCAL_FLOOR)
}

/** Divide as calorias em macros: proteína por kg, gordura 25% (mín. 0,8 g/kg), carboidrato no restante. */
export function splitMacros(kcal: number, weightKg: number, goal: DietGoal): DietTargets {
  const proteinG = Math.round(PROTEIN_PER_KG[goal] * weightKg)
  const fatG = Math.round(Math.max((kcal * FAT_SHARE) / 9, FAT_MIN_PER_KG * weightKg))
  const carbsG = Math.max(0, Math.round((kcal - 4 * proteinG - 9 * fatG) / 4))
  return { kcal, proteinG, carbsG, fatG }
}

/** Metas-base de uma fase nova (FR-014). */
export function phaseTargets({ goal, ...body }: BodyProfile & { goal: DietGoal }): DietTargets {
  const tdee = bmrMifflin(body) * activityFactor(body.daysPerWeek)
  const adjust = Math.max(tdee * GOAL_ADJUST[goal], -MAX_DEFICIT_KCAL)
  const kcal = roundTo10(Math.max(tdee + adjust, kcalFloor(body)))
  return splitMacros(kcal, body.weightKg, goal)
}

// ---- recalibração a cada check-in (R4) ----

const STEP_KCAL = 150
const MIN_WEEKS = 2
const DAY_MS = 24 * 60 * 60 * 1000

/** Faixa esperada de variação semanal do peso (% do peso inicial por semana). */
const WEEKLY_BAND: Record<DietGoal, [number, number]> = {
  perder_gordura: [-1.0, -0.25],
  ganhar_massa: [0.1, 0.5],
  recomposicao: [-0.25, 0.25],
  manutencao: [-0.25, 0.25],
}

export interface CalibrationPoint {
  weightKg: number
  waistCm?: number | null
  at: string
}

export interface RecalibrationResult {
  action: CalibrationAction
  after: DietTargets
  reason: string
  metrics: DietCalibrationMetrics
}

const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${String(Math.abs(n)).replace('.', ',')}%/sem`
const num = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${String(Math.abs(n)).replace('.', ',')}`
const band = ([lo, hi]: [number, number]) => `${num(lo)} a ${num(hi)}%/sem`

/**
 * Compara o check-in novo com o da última calibração e ajusta as metas em
 * degraus de 150 kcal (só no carboidrato; proteína pelo peso novo, gordura
 * 25%). A cintura desempata quando o peso não conta a história toda.
 */
export function recalibrate({
  goal,
  current,
  from,
  to,
  profile,
}: {
  goal: DietGoal
  current: DietTargets
  from: CalibrationPoint
  to: CalibrationPoint & { bodyFatPct?: number | null }
  profile: Omit<BodyProfile, 'weightKg'>
}): RecalibrationResult {
  const rawWeeks = (Date.parse(to.at) - Date.parse(from.at)) / (7 * DAY_MS)
  const weeklyRatePct = rawWeeks > 0 ? Math.round((((to.weightKg - from.weightKg) / from.weightKg) * 100 * 100) / rawWeeks) / 100 : 0
  const waistDeltaCm = from.waistCm != null && to.waistCm != null ? Math.round((to.waistCm - from.waistCm) * 10) / 10 : undefined
  const metrics: DietCalibrationMetrics = {
    weeks: Math.round(rawWeeks * 10) / 10,
    weightFromKg: from.weightKg,
    weightToKg: to.weightKg,
    weeklyRatePct,
    ...(waistDeltaCm !== undefined ? { waistDeltaCm } : {}),
    ...(to.bodyFatPct != null ? { bodyFatPct: to.bodyFatPct } : {}),
  }

  if (rawWeeks < MIN_WEEKS) {
    return {
      action: 'intervalo-curto',
      after: current,
      reason: `Intervalo curto (${String(metrics.weeks).replace('.', ',')} semanas): metas mantidas — a recalibração precisa de pelo menos 2 semanas entre check-ins.`,
      metrics,
    }
  }

  const [lo, hi] = WEEKLY_BAND[goal]
  const waistDown = waistDeltaCm !== undefined && waistDeltaCm <= -1
  const waistUp = waistDeltaCm !== undefined && waistDeltaCm > 2
  const rate = pct(weeklyRatePct)
  const expected = band(WEEKLY_BAND[goal])

  let delta = 0
  let reason: string
  if (weeklyRatePct > hi) {
    if (goal !== 'ganhar_massa' && waistDown) {
      reason = `Peso ${rate}, mas a cintura caiu ${String(Math.abs(waistDeltaCm!)).replace('.', ',')} cm: recomposição em curso, metas mantidas.`
    } else {
      delta = -STEP_KCAL
      reason = `Peso ${rate}, acima do esperado (${expected}): −${STEP_KCAL} kcal no carboidrato.`
    }
  } else if (weeklyRatePct < lo) {
    if (goal === 'ganhar_massa' && waistUp) {
      reason = `Peso ${rate}, abaixo do esperado (${expected}), mas a cintura subiu ${String(waistDeltaCm).replace('.', ',')} cm: metas mantidas.`
    } else {
      delta = STEP_KCAL
      reason = `Peso ${rate}, abaixo do esperado (${expected}): +${STEP_KCAL} kcal no carboidrato.`
    }
  } else {
    reason = waistDown
      ? `Peso ${rate}, dentro do esperado (${expected}), e cintura menor: recomposição em curso, metas mantidas.`
      : `Peso ${rate}, dentro do esperado (${expected}): metas mantidas.`
  }

  const body: BodyProfile = { ...profile, weightKg: to.weightKg }
  const kcal = Math.max(current.kcal + delta, roundTo10(kcalFloor(body)))
  if (delta < 0 && kcal >= current.kcal) {
    return { action: 'manter', after: splitMacros(current.kcal, to.weightKg, goal), reason: `${reason.replace(/: −.*$/, '')}: no piso de calorias, metas mantidas.`, metrics }
  }
  const action: CalibrationAction = kcal > current.kcal ? 'aumentar' : kcal < current.kcal ? 'reduzir' : 'manter'
  return { action, after: splitMacros(kcal, to.weightKg, goal), reason, metrics }
}
