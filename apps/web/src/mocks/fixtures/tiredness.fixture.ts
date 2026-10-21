import type { RecoveryData, TirednessAssessment, TirednessLevel } from '@helux/types'
import { today } from './clock'

/** Cansaço do dia (011): manual quando há nível, senão automático pelo HRV. */
export function tirednessFixture(level: TirednessLevel | null, hrv: number | null = 62): TirednessAssessment {
  return {
    date: today(),
    manualLevel: level,
    overrideAutomatic: false,
    automaticLevel: hrv == null ? null : hrv < 40 ? 'exausto' : hrv < 50 ? 'cansado' : 'normal',
    automaticHrv: hrv,
    effectiveLevel: level ?? (hrv == null ? null : hrv < 40 ? 'exausto' : hrv < 50 ? 'cansado' : 'normal'),
    source: level ? 'manual' : hrv == null ? 'none' : 'automatic',
    conflict: false,
  }
}

export function recoveryFixture(hrv: number, sleepHours: number): RecoveryData {
  return { date: today(), hrv, restingHR: hrv < 40 ? 64 : 54, activeCalories: 520, sleepHours, source: 'healthkit' }
}
