import { apiFetch } from '@/services/api-client'
import type { Goal, HealthCondition, TrainingLocation, TrainingPreferences, UserTrainingProfile, Equipment } from '@helux/types'

// Spec 024 (FR-001..004): onboarding antes do primeiro mesociclo.

export interface OnboardingState {
  step: number | null
  completedAt: string | null
  profile: UserTrainingProfile | null
  preferences: TrainingPreferences
  conditions: HealthCondition[]
  suggestions: { goalText: string | null; injuryText: string | null }
}

export interface OnboardingStepInput {
  step: number
  goal?: { primary: Goal; secondary?: Goal | null; target?: string | null; text?: string }
  experience?: { level: 'iniciante' | 'intermediario' | 'avancado'; trainingTime?: string; timeOff?: string }
  cardio?: { likes: string[]; avoid: string[] }
  availability?: { availableDays?: number[]; maxSessionMinutes?: number | null; location?: TrainingLocation | null; availableEquipment?: Equipment[] }
}

export async function getOnboarding(): Promise<OnboardingState> {
  return (await apiFetch('/api/onboarding')) as OnboardingState
}

export async function saveOnboardingStep(input: OnboardingStepInput): Promise<OnboardingState> {
  return (await apiFetch('/api/onboarding', { method: 'PUT', body: JSON.stringify(input) })) as OnboardingState
}

export async function completeOnboarding(): Promise<{ completedAt: string }> {
  return (await apiFetch('/api/onboarding/complete', { method: 'POST' })) as { completedAt: string }
}
