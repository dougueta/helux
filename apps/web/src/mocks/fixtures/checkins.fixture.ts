import type { BodyMeasurement, BodyWeight } from '@helux/types'
import { navyBodyFat } from '@helux/nutrition'
import { dateDaysAgo, isoDaysAgo } from './clock'

// Spec 029: registros de medidas (a cada ~30 dias) e pesagens diárias.

/** Três registros de medidas (o mais recente há 6 dias), mais recentes primeiro. */
export function checkinsFixture(): BodyMeasurement[] {
  return [
    { daysAgo: 6, waist: 86, neck: 39, squat: 120, bench: 90, deadlift: 150 },
    { daysAgo: 36, waist: 87.5, neck: 39, squat: 115, bench: 87.5, deadlift: 145 },
    { daysAgo: 66, waist: 89, neck: 39.5, squat: 110, bench: 85, deadlift: 140 },
  ].map((c, i) => ({
    id: `mock-checkin-${3 - i}`,
    measured_on: dateDaysAgo(c.daysAgo),
    waist_cm: c.waist,
    neck_cm: c.neck,
    hip_cm: null,
    shoulders_cm: 118,
    chest_cm: 102,
    arm_left_cm: 37.5,
    arm_right_cm: 38,
    leg_left_cm: 59.5,
    leg_right_cm: 60,
    calf_left_cm: 38,
    calf_right_cm: 38.5,
    // Mesmo perfil do profileFixture (180 cm, masculino).
    body_fat_navy_pct: navyBodyFat({ sex: 'masculino', heightCm: 180, waistCm: c.waist, neckCm: c.neck }),
    body_fat_device_pct: i === 1 ? 14.2 : null,
    body_fat_device_source: i === 1 ? 'bioimpedancia' : null,
    squat_kg: c.squat,
    bench_kg: c.bench,
    deadlift_kg: c.deadlift,
    notes: null,
    created_at: isoDaysAgo(c.daysAgo, 9),
  }))
}

/**
 * Pesagens dos últimos 70 dias: tendência de 83,4 → 81,2 kg com oscilação
 * diária de até ±1,5 kg (água, sal) e alguns dias sem pesagem.
 */
export function weightsFixture(days = 70): BodyWeight[] {
  const out: BodyWeight[] = []
  for (let ago = days - 1; ago >= 0; ago--) {
    if (ago % 9 === 4 || ago % 13 === 7) continue // dias sem pesagem
    const trend = 81.2 + (2.2 * ago) / (days - 1)
    const noise = 1.5 * Math.sin(ago * 1.7) * Math.cos(ago * 0.6)
    const date = dateDaysAgo(ago)
    out.push({ id: `mock-weight-${date}`, date, weight_kg: Math.round((trend + noise) * 10) / 10 })
  }
  return out
}
