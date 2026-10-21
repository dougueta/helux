import type { AdjustedWorkoutPlanView, DayType } from '@helux/types'
import { buildDayPlan, swapOptions } from '@helux/nutrition'
import { ApiError } from '@/services/api-client'
import type { MockRouter } from './mock-router'
import type { MockDataset } from './types'
import { today } from './fixtures/clock'

/** Mesma resposta da API para quem ainda não tem mesociclo. */
const GENERATING: AdjustedWorkoutPlanView = {
  mesocycleId: null,
  generatedAt: null,
  today: null,
  upcoming: [],
  progress: null,
  status: 'generating',
}

const intParam = (q: URLSearchParams, name: string, fallback: number) => {
  const n = Number(q.get(name))
  return Number.isFinite(n) && q.get(name) !== null ? n : fallback
}

function missingFields(d: MockDataset) {
  const missing: string[] = []
  if (d.profile?.heightCm == null) missing.push('heightCm')
  if (!d.profile?.birthDate) missing.push('birthDate')
  if (!d.profile?.sex) missing.push('sex')
  if (d.bodyCheckins[0]?.weight_kg == null) missing.push('checkinWeight')
  return missing
}

/** Treino salvo hoje (`workoutToday` da API). */
function workoutToday(d: MockDataset) {
  const row = d.workoutHistory.find(s => s.date === today())
  return row ? { finishedAt: row.created_at } : null
}

/** `GET /api/nutrition/today` (mesmas regras de `computeToday` + `resolveDayType` da API). */
export function nutritionToday(d: MockDataset) {
  const missing = missingFields(d)
  const n = d.nutrition
  if (!n.phase) return { status: 'no-phase' as const, missing }
  const weight = d.bodyCheckins[0]?.weight_kg
  if (weight == null) return { status: 'needs-profile' as const, missing }
  const trained = workoutToday(d)
  const dayType: DayType = trained ? 'treino' : n.dayTypeOverride === 'descanso' ? 'descanso' : d.latestPlan?.today ? 'treino' : 'descanso'
  const plan = buildDayPlan({
    date: today(),
    dayType,
    base: n.phase.baseTargets,
    weightKg: Number(weight),
    flags: n.genetics.flags,
    geneticsActive: n.genetics.active,
    tiredness: d.tirednessToday.effectiveLevel,
    swaps: n.swaps,
  })
  return {
    status: 'ok' as const,
    missing,
    plan,
    phase: n.phase,
    tiredness: d.tirednessToday.effectiveLevel,
    dayTypeOverride: n.dayTypeOverride,
    workoutToday: trained,
  }
}

/** Leituras (T010) no formato das rotas reais da API. */
function registerReads(router: MockRouter) {
  router.register('GET', '/workout/latest-plan', ({ data }) => data.latestPlan ?? GENERATING)

  router.register('GET', '/api/workouts/history', ({ data, query }) => {
    const limit = Math.min(intParam(query, 'limit', 20), 100)
    const offset = intParam(query, 'offset', 0)
    const sorted = [...data.workoutHistory].sort((a, b) => b.date.localeCompare(a.date))
    return { sessions: sorted.slice(offset, offset + limit), total: sorted.length }
  })

  router.register('GET', '/api/workouts/analytics', ({ data }) => data.workoutAnalytics)
  router.register('GET', '/api/tiredness-today', ({ data }) => data.tirednessToday)

  router.register('GET', '/api/recovery/latest', ({ data }) => {
    if (!data.recovery) throw new ApiError('HTTP 404')
    return data.recovery
  })

  router.register('GET', '/api/profile', ({ data }) => ({ profile: data.profile }))

  router.register('GET', '/api/checkins', ({ data, query }) => ({
    checkins: [...data.bodyCheckins].sort((a, b) => b.month.localeCompare(a.month)).slice(0, intParam(query, 'limit', 13)),
  }))

  router.register('GET', '/genetic-profile', ({ data }) => {
    if (!data.genetics) throw new ApiError('HTTP 404')
    return data.genetics
  })

  router.register('GET', '/api/nutrition/phase', ({ data }) => ({
    phase: data.nutrition.phase,
    calibrations: data.nutrition.calibrations,
    bodyFatPct: null,
    missing: missingFields(data),
  }))

  router.register('GET', '/api/nutrition/today', ({ data }) => nutritionToday(data))

  router.register('GET', '/api/nutrition/today/swap-options', ({ data, query }) => {
    const day = nutritionToday(data)
    if (day.status !== 'ok') throw new ApiError('HTTP 409')
    const mealId = query.get('mealId') ?? ''
    const foodId = query.get('foodId') ?? ''
    if (!day.plan.meals.find(m => m.id === mealId)?.items.some(i => i.foodId === foodId)) throw new ApiError('HTTP 404')
    return { options: swapOptions(day.plan, mealId, foodId, data.nutrition.genetics.flags) }
  })

  router.register('GET', '/api/nutrition/history', ({ data, query }) => ({
    days: data.nutrition.history.slice(0, intParam(query, 'limit', 14)),
  }))

  router.register('GET', '/api/nutrition/genetic-profile', ({ data }) => ({
    active: data.nutrition.genetics.active,
    markers: data.nutrition.genetics.markers,
  }))
}

/** Rotas de leitura (T010) e escrita (T014) do modo mock, no formato da API real. */
export function registerMockRoutes(router: MockRouter): void {
  registerReads(router)
}
