export interface RecoveryData {
  date: string
  hrv?: number
  restingHR?: number
  activeCalories: number
  sleepHours?: number
  source: 'healthkit'
}
