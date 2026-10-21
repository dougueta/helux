import { apiFetch } from '@/services/api-client'
import type {
  Equipment,
  ExerciseAlternative,
  MesocycleSession,
  TrainingPreferences,
  TrainingPreferencesInput,
  WorkoutAdjustmentProposal,
} from '@helux/types'

// Spec 022 — cliente das rotas dos agentes especialistas (contracts/agents-api.md).

export interface CatalogExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: Equipment
  pattern: string
}

export interface SavePreferencesResult {
  preferences: TrainingPreferences
  appliesFrom: 'proximo-mesociclo' | 'imediato'
  proposal: WorkoutAdjustmentProposal | null
  budgetBlocked?: boolean
}

export async function getPreferences(): Promise<TrainingPreferences> {
  return (await apiFetch('/api/training-preferences')) as TrainingPreferences
}

export async function savePreferences(input: TrainingPreferencesInput): Promise<SavePreferencesResult> {
  return (await apiFetch('/api/training-preferences', { method: 'PUT', body: JSON.stringify(input) })) as SavePreferencesResult
}

export async function getExerciseCatalog(): Promise<CatalogExercise[]> {
  return ((await apiFetch('/api/exercises')) as { exercises: CatalogExercise[] }).exercises
}

// ---- treino: ajuste, propostas e edição manual ----

export async function requestAdjustment(request: string): Promise<WorkoutAdjustmentProposal> {
  return ((await apiFetch('/api/workout/adjust', { method: 'POST', body: JSON.stringify({ request }) })) as { proposal: WorkoutAdjustmentProposal }).proposal
}

export async function resolveProposal(id: string, action: 'accept' | 'reject'): Promise<void> {
  await apiFetch(`/api/workout/proposals/${id}/${action}`, { method: 'POST' })
}

export async function getAlternatives(sessionIndex: number, exerciseIndex: number): Promise<ExerciseAlternative[]> {
  return ((await apiFetch(`/api/workout/sessions/${sessionIndex}/exercises/${exerciseIndex}/alternatives`)) as { alternatives: ExerciseAlternative[] }).alternatives
}

export interface ExerciseEditInput {
  exerciseId?: string
  sets?: number
  reps?: string
  load?: string
  confirmSafetyOverride?: boolean
}

export async function editSessionExercise(sessionIndex: number, exerciseIndex: number, edit: ExerciseEditInput): Promise<MesocycleSession> {
  return ((await apiFetch(`/api/workout/sessions/${sessionIndex}/exercises/${exerciseIndex}`, { method: 'PATCH', body: JSON.stringify(edit) })) as { session: MesocycleSession }).session
}
