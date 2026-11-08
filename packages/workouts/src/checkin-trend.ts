import type { BodySnapshot, CheckinTrend, Goal } from '@helux/types'
import type { MethodModifier } from './method'

// Spec 024 (R10): a evolução entre check-ins corporais muda o método de forma
// previsível; variações implausíveis (erro de medida) não mudam nada.
// Spec 029: compara fotos do corpo datadas (registro de medidas + peso de
// referência); % de gordura só é comparado quando a origem é a mesma.

type Metric = 'weight_kg' | 'body_fat_pct' | 'waist_cm' | 'squat_kg' | 'bench_kg' | 'deadlift_kg'
const METRICS: Metric[] = ['weight_kg', 'body_fat_pct', 'waist_cm', 'squat_kg', 'bench_kg', 'deadlift_kg']
const LOADS: Metric[] = ['squat_kg', 'bench_kg', 'deadlift_kg']
/** Limite plausível de variação por mês. */
const IMPLAUSIBLE: Partial<Record<Metric, number>> = { weight_kg: 6, waist_cm: 8, body_fat_pct: 4 }
const NEXT_GOAL: Partial<Record<Goal, Goal>> = { emagrecimento: 'hipertrofia', hipertrofia: 'forca' }

export interface GoalTarget {
  weightKg?: number
  waistCm?: number
}

export interface CheckinTrendResult extends CheckinTrend {
  /** O que a tendência muda no método (entra em `prescribeMethod`). */
  methodModifiers: MethodModifier[]
}

/** Peso e cintura da meta em texto livre ("chegar a 80 kg", "cintura de 90 cm"). */
export function parseGoalTarget(text: string | null | undefined): GoalTarget | null {
  if (!text) return null
  const kg = text.match(/(\d+(?:[.,]\d+)?)\s*kg/i)
  const cm = text.match(/(\d+(?:[.,]\d+)?)\s*cm/i)
  const target: GoalTarget = {
    ...(kg ? { weightKg: Number(kg[1].replace(',', '.')) } : {}),
    ...(cm ? { waistCm: Number(cm[1].replace(',', '.')) } : {}),
  }
  return Object.keys(target).length > 0 ? target : null
}

const DAY_MS = 24 * 60 * 60 * 1000
const DAYS_PER_MONTH = 30.4

function monthsBetween(from: string, to: string): number {
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS
  return Math.max(1, days / DAYS_PER_MONTH)
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function checkinTrend(prev: BodySnapshot, curr: BodySnapshot, goal: Goal, target: GoalTarget | null = null): CheckinTrendResult {
  const months = monthsBetween(prev.date, curr.date)
  const sameFatSource = (prev.body_fat_source ?? null) === (curr.body_fat_source ?? null)
  const deltas: Record<string, number> = {}
  const implausible: string[] = []
  for (const m of METRICS) {
    if (m === 'body_fat_pct' && !sameFatSource) continue
    const a = prev[m]
    const b = curr[m]
    if (typeof a !== 'number' || typeof b !== 'number') continue
    const perMonth = round1((b - a) / months)
    deltas[m] = perMonth
    const limit = IMPLAUSIBLE[m]
    if (limit !== undefined && Math.abs(perMonth) > limit) implausible.push(m)
  }
  const ok = (m: Metric) => deltas[m] !== undefined && !implausible.includes(m)

  // Meta atingida: sugere um novo objetivo e não mexe no método (o aceite é do usuário).
  const reached =
    (target?.weightKg !== undefined && typeof curr.weight_kg === 'number' && (goal === 'hipertrofia' ? curr.weight_kg >= target.weightKg : curr.weight_kg <= target.weightKg)) ||
    (target?.waistCm !== undefined && typeof curr.waist_cm === 'number' && curr.waist_cm <= target.waistCm)
  const suggestGoalChange = reached ? NEXT_GOAL[goal] ?? null : null

  const methodModifiers: MethodModifier[] = []
  if (!reached) {
    const loads = LOADS.filter(ok)
    const loadsStalled = loads.length > 0 && loads.every(m => deltas[m] <= 1)
    if (goal === 'emagrecimento') {
      const signals = (['weight_kg', 'waist_cm'] as Metric[]).filter(ok)
      if (signals.length > 0 && signals.every(m => deltas[m] >= -0.2)) {
        methodModifiers.push({ source: 'checkin', cardioSessionsDelta: 1, description: 'Peso e cintura não caíram desde o último check-in: +1 sessão de cardio por semana.' })
      }
    } else if (goal === 'hipertrofia') {
      if (ok('weight_kg') && deltas.weight_kg < -0.5 && loadsStalled) {
        methodModifiers.push({ source: 'checkin', volumeFactor: 0.85, description: 'Peso caindo com cargas paradas: volume no piso da faixa; vale revisar a nutrição com a agente de Nutrição.' })
      }
    } else if (goal === 'forca') {
      if (loadsStalled) methodModifiers.push({ source: 'checkin', description: 'Cargas de referência paradas desde o último check-in: troca de variação nos exercícios básicos.' })
    }
  }

  return { from: prev.date, to: curr.date, deltas, implausible, modifiers: methodModifiers.map(m => m.description), suggestGoalChange, methodModifiers }
}
