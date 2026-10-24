import { apiFetch } from '@/services/api-client'
import type { Joint, PainReport } from '@helux/types'

// Spec 024: check-ins de sensação antes e depois do treino (contracts/api.md).

export interface SessionCheckinInput {
  phase: 'antes' | 'depois'
  date: string
  energy?: number
  sleep?: number
  motivation?: number
  rpe?: number
  feeling?: number
  pains: PainReport[]
}

export interface SessionCheckinResult {
  checkin: { id: string }
  adjustment?: { regions: Joint[]; reason: string }
}

export async function saveSessionCheckin(input: SessionCheckinInput): Promise<SessionCheckinResult> {
  return (await apiFetch('/api/session-checkins', { method: 'POST', body: JSON.stringify(input) })) as SessionCheckinResult
}

export interface ReviewSession {
  id: string
  date: string
  durationS: number | null
  exercises: string[]
  reasons: string[]
}

export async function getSessionsToReview(): Promise<ReviewSession[]> {
  return ((await apiFetch('/api/workouts/review')) as { sessions: ReviewSession[] }).sessions
}

export async function confirmSession(id: string): Promise<void> {
  await apiFetch(`/api/workouts/${id}/confirm`, { method: 'POST' })
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' })
}
