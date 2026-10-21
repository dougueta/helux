import { apiFetch } from '@/services/api-client'
import type {
  BudgetStatus,
  ConversationFact,
  Equipment,
  IntegratedProfile,
  SourceKey,
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

// ---- Perfil Integrado (US2) ----

export type IntegratedProfileResponse = IntegratedProfile & { budget: BudgetStatus }

export async function getIntegratedProfile(): Promise<IntegratedProfileResponse> {
  return (await apiFetch('/api/agents/profile')) as IntegratedProfileResponse
}

export async function setSourceEnabled(source: SourceKey, enabled: boolean): Promise<void> {
  await apiFetch(`/api/agents/sources/${source}`, { method: 'PUT', body: JSON.stringify({ enabled }) })
}

export async function setBudgetCap(monthlyCapUsd: number): Promise<BudgetStatus> {
  return (await apiFetch('/api/agents/budget', { method: 'PUT', body: JSON.stringify({ monthlyCapUsd }) })) as BudgetStatus
}

export async function updateFact(id: string, text: string): Promise<ConversationFact> {
  return (await apiFetch(`/api/agents/facts/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) })) as ConversationFact
}

export async function deleteFact(id: string): Promise<void> {
  await apiFetch(`/api/agents/facts/${id}`, { method: 'DELETE' })
}

export async function removeGuidance(id: string): Promise<void> {
  await apiFetch(`/api/agents/guidance/${id}`, { method: 'DELETE' })
}
