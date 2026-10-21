import type { BodyCheckin } from '@helux/types'
import { dateDaysAgo, isoDaysAgo } from './clock'

/** Três check-ins mensais (o mais recente há 6 dias), mais recentes primeiro. */
export function checkinsFixture(): BodyCheckin[] {
  return [
    { daysAgo: 6, weight: 81.2, waist: 86, neck: 39, squat: 120, bench: 90, deadlift: 150 },
    { daysAgo: 36, weight: 82.4, waist: 87.5, neck: 39, squat: 115, bench: 87.5, deadlift: 145 },
    { daysAgo: 66, weight: 83.1, waist: 89, neck: 39.5, squat: 110, bench: 85, deadlift: 140 },
  ].map((c, i) => ({
    id: `mock-checkin-${3 - i}`,
    month: dateDaysAgo(c.daysAgo).slice(0, 7),
    weight_kg: c.weight,
    body_fat_pct: null,
    waist_cm: c.waist,
    hip_cm: null,
    neck_cm: c.neck,
    arm_cm: 38,
    leg_cm: 60,
    squat_kg: c.squat,
    bench_kg: c.bench,
    deadlift_kg: c.deadlift,
    notes: null,
    created_at: isoDaysAgo(c.daysAgo, 9),
  }))
}
