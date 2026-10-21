import { apiFetch } from '@/services/api-client'
import type { DayPlan, DayType, DietCalibration, DietGoal, DietPhase, DietTargets, FoodItem, MealSwap, NutriMarker, TirednessLevel } from '@helux/types'

// Spec 018 — cliente das rotas de nutrição (contracts/nutrition-api.md).

export type MissingField = 'heightCm' | 'birthDate' | 'sex' | 'checkinWeight' | 'checkinStale'

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

// ---- o dia (US1) ----

export type TodayResponse =
  | { status: 'no-phase' | 'needs-profile'; missing: MissingField[] }
  | {
      status: 'ok'
      missing: MissingField[]
      plan: DayPlan
      phase: DietPhase
      tiredness: TirednessLevel | null
      dayTypeOverride: 'descanso' | null
      workoutToday: { finishedAt: string } | null
    }

export interface SwapOption {
  food: FoodItem
  portions: number
  macros: DietTargets
}

export interface HistoryDay {
  date: string
  dayType: DayType
  status: 'ativo' | 'treino-nao-realizado' | 'concluido'
  targets: DietTargets
}

export async function getToday(): Promise<TodayResponse> {
  return (await apiFetch('/api/nutrition/today')) as TodayResponse
}

export async function setDayType(dayType: DayType): Promise<TodayResponse> {
  return (await apiFetch('/api/nutrition/today', { method: 'PUT', body: JSON.stringify({ dayType }) })) as TodayResponse
}

export async function getSwapOptions(mealId: string, foodId: string): Promise<SwapOption[]> {
  const q = new URLSearchParams({ mealId, foodId })
  return ((await apiFetch(`/api/nutrition/today/swap-options?${q}`)) as { options: SwapOption[] }).options
}

export async function applySwap(swap: MealSwap): Promise<TodayResponse> {
  return (await apiFetch('/api/nutrition/today/swap', { method: 'POST', body: JSON.stringify(swap) })) as TodayResponse
}

export async function getHistory(limit = 14): Promise<HistoryDay[]> {
  return ((await apiFetch(`/api/nutrition/history?limit=${limit}`)) as { days: HistoryDay[] }).days
}

export interface GeneticProfileResponse {
  active: boolean
  markers: NutriMarker[]
}

export async function getGeneticProfile(): Promise<GeneticProfileResponse> {
  return (await apiFetch('/api/nutrition/genetic-profile')) as GeneticProfileResponse
}
