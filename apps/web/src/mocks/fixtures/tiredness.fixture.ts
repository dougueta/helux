import type { RecoveryData, TirednessAssessment, TirednessLevel } from '@helux/types'
import { assessTiredness } from '@helux/workouts'
import { today } from './clock'

/** Cansaço do dia pelas regras reais da 011 (`assessTiredness`). */
export function tirednessFixture(manualLevel: TirednessLevel | null, hrv: number | null = 62, overrideAutomatic = false): TirednessAssessment {
  return assessTiredness({ date: today(), manualLevel, overrideAutomatic, hrv })
}

export function recoveryFixture(hrv: number, sleepHours: number): RecoveryData {
  return { date: today(), hrv, restingHR: hrv < 40 ? 64 : 54, activeCalories: 520, sleepHours, source: 'healthkit' }
}
