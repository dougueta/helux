import { apiFetch } from '@/services/api-client'
import type {
  CardioZone,
  ComplementaryCategory,
  ComplementaryPreferences,
  ComplementaryRoutineLog,
  ComplementaryRoutineLogItem,
  ComplementaryRoutinesView,
} from '@helux/types'

export interface CreateRoutineLogPayload {
  category: ComplementaryCategory
  performed_on: string
  duration_minutes: number
  modality?: string | null
  zone?: CardioZone | null
  effort?: number | null
  items: ComplementaryRoutineLogItem[]
  notes?: string | null
}

export async function getRoutines(days = 30): Promise<ComplementaryRoutinesView> {
  return (await apiFetch(`/api/routines?days=${days}`)) as ComplementaryRoutinesView
}

export async function updateRoutinePreferences(
  preferences: ComplementaryPreferences,
): Promise<ComplementaryRoutinesView> {
  return (await apiFetch('/api/routines/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  })) as ComplementaryRoutinesView
}

export async function createRoutineLog(
  payload: CreateRoutineLogPayload,
): Promise<{ log: ComplementaryRoutineLog; view: ComplementaryRoutinesView }> {
  return (await apiFetch('/api/routines/logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as { log: ComplementaryRoutineLog; view: ComplementaryRoutinesView }
}

export async function deleteRoutineLog(id: string): Promise<void> {
  await apiFetch(`/api/routines/logs/${id}`, { method: 'DELETE' })
}
