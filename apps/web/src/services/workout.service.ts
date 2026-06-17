import { apiFetch } from '@/services/api-client'
import type { NextWorkoutPlan, WorkoutSession, WorkoutAnalytics } from '@helux/types'

export async function getLatestPlan(): Promise<NextWorkoutPlan | null> {
  try {
    return (await apiFetch('/workout/latest-plan')) as NextWorkoutPlan
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

export async function generatePlan(
  geneticProfile: unknown,
  recoveryData: unknown | null,
  workoutHistory: WorkoutSession[] = [],
): Promise<NextWorkoutPlan> {
  const body = {
    geneticProfile: geneticProfile ?? {},
    constraints: {},
    workoutHistory,
    recoveryData: recoveryData ? [recoveryData] : [],
    userGoals: 'Hipertrofia e condicionamento geral',
    userLevel: 'intermediario',
    availableDaysPerWeek: 4,
  }
  return (await apiFetch('/workout/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as NextWorkoutPlan
}

export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics | null> {
  try {
    return (await apiFetch('/api/workouts/analytics')) as WorkoutAnalytics
  } catch {
    return null
  }
}
