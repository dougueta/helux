import type { BodyFatSource, BodyMeasurement, BodySnapshot, BodyWeight } from '@helux/types'

// Spec 029 — peso de tendência, composição corporal e % de gordura efetivo.
// Datas são `YYYY-MM-DD`; as contas de dias usam UTC para não sofrer com fuso.

const DAY_MS = 24 * 60 * 60 * 1000
/** Janela da tendência: a data e os 6 dias anteriores. */
const TREND_WINDOW_DAYS = 7
const TREND_MIN_WEIGHINGS = 3
/** Sem tendência, aceita a pesagem mais próxima até esta distância. */
const REFERENCE_MAX_DAYS = 3
const CONFIRM_DELTA_KG = 3
const MEASUREMENTS_DUE_DAYS = 28

const round = (n: number, decimals: number) => {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS)

export function addDays(date: string, days: number): string {
  return new Date((dayNumber(date) + days) * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

/** Média das pesagens de `[date − 6, date]`, se houver pelo menos 3 (FR-003). */
export function trendAt(weights: BodyWeight[], date: string): number | null {
  const end = dayNumber(date)
  const inWindow = weights.filter(w => {
    const d = dayNumber(w.date)
    return d <= end && d > end - TREND_WINDOW_DAYS
  })
  if (inWindow.length < TREND_MIN_WEIGHINGS) return null
  return round(inWindow.reduce((s, w) => s + Number(w.weight_kg), 0) / inWindow.length, 2)
}

export interface TrendPoint {
  date: string
  weightKg: number
  trendKg: number | null
}

/** Um ponto por pesagem (ordem crescente), com a tendência naquele dia. */
export function trendSeries(weights: BodyWeight[]): TrendPoint[] {
  return [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({ date: w.date, weightKg: Number(w.weight_kg), trendKg: trendAt(weights, w.date) }))
}

/** Variação da tendência nos últimos 7 dias (FR-004). */
export function weeklyChange(weights: BodyWeight[], today: string): { kg: number; pct: number } | null {
  const now = trendAt(weights, today)
  const before = trendAt(weights, addDays(today, -7))
  if (now == null || before == null) return null
  return { kg: round(now - before, 1), pct: round(((now - before) / before) * 100, 1) }
}

/** Peso de referência numa data: tendência ou a pesagem mais próxima em até 3 dias (FR-016). */
export function referenceWeight(weights: BodyWeight[], date: string): number | null {
  const trend = trendAt(weights, date)
  if (trend != null) return trend
  let best: { dist: number; day: number; kg: number } | null = null
  for (const w of weights) {
    const day = dayNumber(w.date)
    const dist = Math.abs(day - dayNumber(date))
    if (dist > REFERENCE_MAX_DAYS) continue
    if (!best || dist < best.dist || (dist === best.dist && day < best.day)) best = { dist, day, kg: Number(w.weight_kg) }
  }
  return best ? best.kg : null
}

/** Pesagem muito longe da tendência: provável erro de digitação (FR-005). */
export function needsConfirmation(weights: BodyWeight[], weightKg: number, date: string): boolean {
  const trend = trendAt(weights.filter(w => w.date !== date), date)
  return trend != null && Math.abs(weightKg - trend) > CONFIRM_DELTA_KG
}

export interface EffectiveBodyFat {
  pct: number
  source: BodyFatSource
  measuredOn: string
}

const byRecent = (a: BodyMeasurement, b: BodyMeasurement) =>
  b.measured_on.localeCompare(a.measured_on) || b.created_at.localeCompare(a.created_at)

/** % de gordura do registro mais recente que tiver um; no mesmo registro, a fita vence (FR-022). */
export function effectiveBodyFat(measurements: BodyMeasurement[]): EffectiveBodyFat | null {
  for (const m of [...measurements].sort(byRecent)) {
    if (m.body_fat_navy_pct != null) return { pct: Number(m.body_fat_navy_pct), source: 'navy', measuredOn: m.measured_on }
    if (m.body_fat_device_pct != null) {
      return { pct: Number(m.body_fat_device_pct), source: m.body_fat_device_source ?? 'outro', measuredOn: m.measured_on }
    }
  }
  return null
}

/** Massa gorda e massa magra em kg (US5-1). */
export function bodyComposition(weightKg: number, bodyFatPct: number): { fatKg: number; leanKg: number } {
  const fat = (weightKg * bodyFatPct) / 100
  return { fatKg: round(fat, 1), leanKg: round(weightKg - fat, 1) }
}

/** Relação cintura/altura (FR-017). */
export function waistHeightRatio(waistCm: number, heightCm: number): number {
  return round(waistCm / heightCm, 2)
}

/** Hora de refazer as medidas: nenhum registro ou o último com mais de 28 dias (FR-018). */
export function measurementsDue(measurements: BodyMeasurement[], today: string): boolean {
  if (measurements.length === 0) return true
  const latest = [...measurements].sort(byRecent)[0]
  return daysBetween(latest.measured_on, today) > MEASUREMENTS_DUE_DAYS
}

export const BODY_FAT_SOURCE_LABEL: Record<BodyFatSource, string> = {
  navy: 'fita',
  bioimpedancia: 'bioimpedância',
  adipometro: 'adipômetro',
  dexa: 'DEXA',
  outro: 'outro',
}

/**
 * Foto do corpo numa data, para comparar dois registros de medidas (análise de
 * ciclo da 024): medidas + peso de referência + % efetivo do registro com a origem.
 */
export function bodySnapshot(m: BodyMeasurement, weights: BodyWeight[]): BodySnapshot {
  const n = (v: number | null | undefined) => (v != null ? Number(v) : null)
  const fat = effectiveBodyFat([m])
  return {
    date: m.measured_on,
    weight_kg: referenceWeight(weights, m.measured_on),
    body_fat_pct: fat?.pct ?? null,
    body_fat_source: fat?.source ?? null,
    waist_cm: n(m.waist_cm),
    squat_kg: n(m.squat_kg),
    bench_kg: n(m.bench_kg),
    deadlift_kg: n(m.deadlift_kg),
  }
}
