import type { Sex } from './nutrition'

export interface UserTrainingProfile {
  goal?: string | null
  level?: 'iniciante' | 'intermediario' | 'avancado' | null
  trainingTime?: string | null
  timeOff?: string | null
  currentInjury?: string | null
  /** Spec 018: dados fixos para TMB e % de gordura (Marinha). */
  heightCm?: number | null
  birthDate?: string | null
  sex?: Sex | null
  updatedAt: string
}

export interface UserTrainingProfileInput {
  goal?: string
  level?: 'iniciante' | 'intermediario' | 'avancado'
  trainingTime?: string
  timeOff?: string
  currentInjury?: string
  heightCm?: number
  birthDate?: string
  sex?: Sex
}
