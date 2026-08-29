export interface UserTrainingProfile {
  goal?: string | null
  level?: 'iniciante' | 'intermediario' | 'avancado' | null
  trainingTime?: string | null
  timeOff?: string | null
  currentInjury?: string | null
  updatedAt: string
}

export interface UserTrainingProfileInput {
  goal?: string
  level?: 'iniciante' | 'intermediario' | 'avancado'
  trainingTime?: string
  timeOff?: string
  currentInjury?: string
}

export interface DailyTirednessSignal {
  active: boolean
}
