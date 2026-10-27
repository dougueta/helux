import { apiFetch } from '@/services/api-client'
import type { WorkoutSession, WorkoutAnalytics, AdjustedWorkoutPlanView } from '@helux/types'

export async function getLatestPlan(): Promise<AdjustedWorkoutPlanView | null> {
  try {
    return (await apiFetch('/workout/latest-plan')) as AdjustedWorkoutPlanView
  } catch {
    return null
  }
}

export async function getWorkoutHistory(limit = 5): Promise<WorkoutSession[]> {
  try {
    const data = (await apiFetch(`/api/workouts/history?limit=${limit}`)) as { sessions: WorkoutSession[] }
    return data.sessions ?? []
  } catch {
    return []
  }
}

/** Pede um novo mesociclo ao Agente de Treino (spec 024; substitui o antigo POST /workout/generate). */
export async function regeneratePlan(): Promise<void> {
  await apiFetch('/workout/mesocycle/regenerate', { method: 'POST' })
}

/** Repete a última semana do ciclo concluído enquanto o próximo é gerado (spec 024). */
export async function repeatLastWeek(): Promise<void> {
  await apiFetch('/workout/mesocycle/repeat-week', { method: 'POST' })
}

export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics | null> {
  try {
    return (await apiFetch('/api/workouts/analytics')) as WorkoutAnalytics
  } catch {
    return null
  }
}
