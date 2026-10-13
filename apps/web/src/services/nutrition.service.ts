import { apiFetch } from '@/services/api-client'
import type { DietCalibration, DietGoal, DietPhase } from '@helux/types'

// Spec 018 — cliente das rotas de nutrição (contracts/nutrition-api.md).

export type MissingField = 'heightCm' | 'birthDate' | 'sex' | 'checkinWeight'

export interface PhaseResponse {
  phase: DietPhase | null
  calibrations: DietCalibration[]
  bodyFatPct: number | null
  missing: MissingField[]
}

export async function getPhase(): Promise<PhaseResponse> {
  return (await apiFetch('/api/nutrition/phase')) as PhaseResponse
}

export async function startPhase(goal: DietGoal, durationWeeks: number): Promise<{ phase: DietPhase; calibration: DietCalibration }> {
  return (await apiFetch('/api/nutrition/phase', {
    method: 'POST',
    body: JSON.stringify({ goal, durationWeeks }),
  })) as { phase: DietPhase; calibration: DietCalibration }
}

export async function endPhase(): Promise<{ phase: DietPhase }> {
  return (await apiFetch('/api/nutrition/phase/end', { method: 'POST' })) as { phase: DietPhase }
}
