import type { Sex } from './nutrition'
import type { Goal } from './conditions'

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
  /** Spec 024: objetivo estruturado e onboarding. */
  goalPrimary?: Goal | null
  goalSecondary?: Goal | null
  goalTarget?: string | null
  cardioLikes?: string[]
  cardioAvoid?: string[]
  onboardingStep?: number | null
  onboardingCompletedAt?: string | null
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
  goalPrimary?: Goal | null
  goalSecondary?: Goal | null
  goalTarget?: string | null
  cardioLikes?: string[]
  cardioAvoid?: string[]
}
