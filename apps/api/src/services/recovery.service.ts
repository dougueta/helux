import type { RecoveryData } from '@helux/types'

export interface HealthSample {
  type: string
  value: number | string
  unit: string
  start_at: string
}

export function computeRecoveryFromSamples(samples: HealthSample[]): RecoveryData {
  const avg = (arr: number[]): number | undefined =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const hrv = avg(samples.filter(s => s.type === 'hrv').map(s => Number(s.value)))
  const restingHR = avg(samples.filter(s => s.type === 'heart_rate').map(s => Number(s.value)))
  const activeCalories = sum(samples.filter(s => s.type === 'active_energy').map(s => Number(s.value)))
  const sleepSample = samples.find(s => s.type === 'sleep_duration')
  const sleepHours = sleepSample ? Number(sleepSample.value) : undefined
  const cardioRecovery = avg(samples.filter(s => s.type === 'cardio_recovery').map(s => Number(s.value)))

  const latestDate = samples[0]?.start_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]

  return {
    date: latestDate,
    hrv: hrv !== undefined ? Math.round(hrv) : undefined,
    restingHR: restingHR !== undefined ? Math.round(restingHR) : undefined,
    activeCalories: Math.round(activeCalories),
    sleepHours,
    cardioRecovery: cardioRecovery !== undefined ? Math.round(cardioRecovery) : undefined,
    source: 'healthkit',
  }
}
