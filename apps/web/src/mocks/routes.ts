import type { AdjustedWorkoutPlanView, BodyMeasurement, BodyWeight, DayType, DietCalibration, DietGoal, DietPhase, MealSwap, TirednessLevel, UserTrainingProfileInput } from '@helux/types'
import { addDays, ageOn, buildDayPlan, effectiveBodyFat, evaluateRecalibration, navyEstimate, phaseTargets, swapOptions } from '@helux/nutrition'
import { currentWeight } from './body'
import type { MeasurementInput } from '@helux/types'
import { ApiError } from '@/services/api-client'
import type { MockRouter } from './mock-router'
import type { MockDataset } from './types'
import { today } from './fixtures/clock'
import { registerAgentRoutes } from './agents'
import { registerAdaptiveRoutes } from './adaptive'
import { tirednessFixture } from './fixtures/tiredness.fixture'
import { analyticsFixture, latestPlanFixture, MESOCYCLE_SESSIONS } from './fixtures/workouts.fixture'

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
  const weights = d.bodyWeights ?? []
  if (weights.length === 0) missing.push('checkinWeight')
  else if (currentWeight(d) == null) missing.push('checkinStale')
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
  const weight = currentWeight(d)
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

  // Spec 029: pesagens e registros de medidas.
  router.register('GET', '/api/weights', ({ data, query }) => {
    const since = addDays(today(), -(intParam(query, 'days', 90) - 1))
    return { weights: (data.bodyWeights ?? []).filter(w => w.date >= since && w.date <= today()).sort((a, b) => a.date.localeCompare(b.date)) }
  })

  router.register('GET', '/api/measurements', ({ data, query }) => ({
    measurements: [...data.bodyCheckins]
      .sort((a, b) => b.measured_on.localeCompare(a.measured_on) || b.created_at.localeCompare(a.created_at))
      .slice(0, intParam(query, 'limit', 24)),
  }))

  router.register('GET', '/genetic-profile', ({ data }) => {
    if (!data.genetics) throw new ApiError('HTTP 404')
    return data.genetics
  })

  // Spec 024: envio e remoção do laudo genético (o mock só confirma; a persona continua com a genética dela).
  router.register('POST', '/api/genetics/report', ({ data }) => ({ uploadedAt: new Date().toISOString(), traits: data.genetics?.traits.length ?? 0 }))
  router.register('DELETE', '/api/genetics/report', () => null)

  router.register('GET', '/api/nutrition/phase', ({ data }) => ({
    phase: data.nutrition.phase,
    calibrations: data.nutrition.calibrations,
    bodyFatPct: effectiveBodyFat(data.bodyCheckins)?.pct ?? null,
    missing: missingFields(data),
  }))

  // Spec 029 (US3): mesma regra da API (@helux/nutrition), sobre os dados da persona.
  const recalibration = (data: MockDataset) =>
    evaluateRecalibration({
      today: today(),
      phase: data.nutrition.phase,
      profile: { heightCm: data.profile?.heightCm ?? null, birthDate: data.profile?.birthDate ?? null, sex: data.profile?.sex ?? null },
      lastCalibrationAt: data.nutrition.calibrations.find(c => c.action !== 'intervalo-curto')?.createdAt ?? null,
      weights: data.bodyWeights ?? [],
      measurements: data.bodyCheckins,
      daysPerWeek: 4,
    })

  router.register('POST', '/api/nutrition/phase/recalibration/preview', ({ data }) => recalibration(data))

  router.register('POST', '/api/nutrition/phase/recalibration', ({ store, data }) => {
    const ev = recalibration(data)
    if (ev.status !== 'proposta') throw new ApiError(ev.status)
    const calibration: DietCalibration = {
      id: newId('mock-calibration'),
      action: ev.action,
      before: ev.before,
      after: ev.after,
      reason: ev.reason,
      metrics: ev.metrics,
      createdAt: new Date().toISOString(),
    }
    store.updateDataset(cur => ({
      nutrition: {
        ...cur.nutrition,
        phase: cur.nutrition.phase ? { ...cur.nutrition.phase, baseTargets: ev.after } : null,
        calibrations: [calibration, ...cur.nutrition.calibrations],
      },
    }))
    return { calibration }
  })

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

const GOAL_LABEL: Record<DietGoal, string> = {
  perder_gordura: 'perder gordura',
  ganhar_massa: 'ganhar massa',
  recomposicao: 'recomposição corporal',
  manutencao: 'manutenção',
}

/** Índice da sessão pendente hoje no mesociclo (null = sem treino hoje). */
function pendingIndex(d: MockDataset): number | null {
  const letter = d.latestPlan?.today?.letter
  const i = MESOCYCLE_SESSIONS.findIndex(s => s.letter === letter)
  return i === -1 ? null : i
}

let seq = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`

/** Escritas (T014): gravam no `mock-store` (localStorage) e respondem como a API. */
function registerWrites(router: MockRouter) {
  router.register('POST', '/api/workouts/sessions', ({ store, body }) => {
    const input = body as { date: string; duration_s: number | null; exercises: MockDataset['workoutHistory'][number]['exercises'] }
    const row = { id: newId('mock-session'), date: input.date, duration_s: input.duration_s ?? null, exercises: input.exercises, created_at: new Date().toISOString() }
    store.updateDataset(d => {
      const workoutHistory = [row, ...d.workoutHistory]
      const i = pendingIndex(d)
      const next = i === null || i + 1 >= MESOCYCLE_SESSIONS.length ? null : i + 1
      return {
        workoutHistory,
        workoutAnalytics: analyticsFixture(workoutHistory),
        latestPlan: d.latestPlan?.mesocycleId ? latestPlanFixture(d.tirednessToday, next) : d.latestPlan,
      }
    })
    return row
  })

  router.register('PUT', '/api/tiredness-today', ({ store, body }) => {
    const { level, overrideAutomatic = false } = body as { level: TirednessLevel; overrideAutomatic?: boolean }
    const d = store.updateDataset(cur => {
      const tirednessToday = tirednessFixture(level, cur.tirednessToday.automaticHrv, overrideAutomatic)
      const i = pendingIndex(cur)
      return { tirednessToday, latestPlan: i === null ? cur.latestPlan : latestPlanFixture(tirednessToday, i) }
    })
    return d.tirednessToday
  })

  router.register('POST', '/api/profile', ({ store, body }) => {
    const input = body as UserTrainingProfileInput
    const d = store.updateDataset(cur => ({ profile: { ...cur.profile, ...input, updatedAt: new Date().toISOString() } }))
    return { profile: d.profile }
  })

  router.register('PUT', '/api/weights/:date', ({ store, body, params }) => {
    if (params.date > today()) throw new ApiError('future-date')
    const { weight_kg } = body as { weight_kg: number }
    let replaced = false
    let saved!: BodyWeight
    store.updateDataset(cur => {
      const list = cur.bodyWeights ?? []
      const existing = list.find(w => w.date === params.date)
      replaced = existing != null
      saved = { id: existing?.id ?? newId('mock-weight'), date: params.date, weight_kg }
      return { bodyWeights: [...list.filter(w => w.date !== params.date), saved].sort((a, b) => a.date.localeCompare(b.date)) }
    })
    return { weight: saved, replaced }
  })

  router.register('DELETE', '/api/weights/:date', ({ store, data, params }) => {
    if (!(data.bodyWeights ?? []).some(w => w.date === params.date)) throw new ApiError('HTTP 404')
    store.updateDataset(cur => ({ bodyWeights: (cur.bodyWeights ?? []).filter(w => w.date !== params.date) }))
    return null
  })

  /** Mesma regra da API: o % pela fita sai do perfil no momento do registro. */
  const withNavy = (data: MockDataset, input: MeasurementInput) => {
    const { pct, status } = navyEstimate(
      { heightCm: data.profile?.heightCm, sex: data.profile?.sex },
      { waistCm: input.waist_cm, neckCm: input.neck_cm, hipCm: input.hip_cm },
    )
    return { values: { ...input, body_fat_navy_pct: pct }, navy_status: status }
  }

  router.register('POST', '/api/measurements', ({ store, data, body }) => {
    const input = body as MeasurementInput
    if (input.measured_on > today()) throw new ApiError('future-date')
    const { values, navy_status } = withNavy(data, input)
    const measurement: BodyMeasurement = { ...values, id: newId('mock-checkin'), created_at: new Date().toISOString() }
    store.updateDataset(cur => ({ bodyCheckins: [measurement, ...cur.bodyCheckins] }))
    return { measurement, navy_status }
  })

  router.register('PUT', '/api/measurements/:id', ({ store, data, body, params }) => {
    const existing = data.bodyCheckins.find(m => m.id === params.id)
    if (!existing) throw new ApiError('HTTP 404')
    const { values, navy_status } = withNavy(data, body as MeasurementInput)
    const measurement: BodyMeasurement = { ...values, id: existing.id, created_at: existing.created_at }
    store.updateDataset(cur => ({ bodyCheckins: cur.bodyCheckins.map(m => (m.id === params.id ? measurement : m)) }))
    return { measurement, navy_status }
  })

  router.register('DELETE', '/api/measurements/:id', ({ store, data, params }) => {
    if (!data.bodyCheckins.some(m => m.id === params.id)) throw new ApiError('HTTP 404')
    store.updateDataset(cur => ({ bodyCheckins: cur.bodyCheckins.filter(m => m.id !== params.id) }))
    return null
  })

  // Spec 024: o botão Gerar novo plano pede um novo mesociclo; no mock, o plano da persona continua.
  router.register('POST', '/workout/mesocycle/regenerate', () => ({ status: 'gerando' }))
  router.register('POST', '/workout/mesocycle/repeat-week', ({ data }) => ({ mesocycleId: data.latestPlan?.mesocycleId ?? 'mock-repeat' }))

  router.register('POST', '/api/nutrition/phase', ({ store, data, body }) => {
    const { goal, durationWeeks } = body as { goal: DietGoal; durationWeeks: number }
    const p = data.profile
    const weightKg = currentWeight(data)
    if (missingFields(data).length > 0 || !p?.heightCm || !p.birthDate || !p.sex || weightKg == null) throw new ApiError('needs-profile')
    const baseTargets = phaseTargets({ goal, weightKg, heightCm: p.heightCm, age: ageOn(p.birthDate, today()), sex: p.sex, daysPerWeek: 4 })
    const phase: DietPhase = { id: newId('mock-phase'), goal, startedOn: today(), durationWeeks, status: 'ativa', baseTargets }
    const calibration: DietCalibration = {
      id: newId('mock-calibration'),
      action: 'inicial',
      before: null,
      after: baseTargets,
      reason: `Fase iniciada: ${GOAL_LABEL[goal]} por ${durationWeeks} semanas, a partir de ${String(weightKg).replace('.', ',')} kg.`,
      metrics: { weeks: 0, weightFromKg: weightKg, weightToKg: weightKg, weeklyRatePct: 0 },
      createdAt: new Date().toISOString(),
    }
    store.updateDataset(cur => ({ nutrition: { ...cur.nutrition, phase, calibrations: [calibration], dayTypeOverride: null, swaps: [] } }))
    return { phase, calibration }
  })

  router.register('POST', '/api/nutrition/phase/end', ({ store, data }) => {
    if (!data.nutrition.phase || data.nutrition.phase.status !== 'ativa') throw new ApiError('HTTP 404')
    const phase: DietPhase = { ...data.nutrition.phase, status: 'encerrada' }
    store.updateDataset(cur => ({ nutrition: { ...cur.nutrition, phase: null, calibrations: [] } }))
    return { phase }
  })

  router.register('PUT', '/api/nutrition/today', ({ store, body }) => {
    const { dayType } = body as { dayType: DayType }
    const d = store.updateDataset(cur => ({ nutrition: { ...cur.nutrition, dayTypeOverride: dayType === 'descanso' ? 'descanso' : null } }))
    return nutritionToday(d)
  })

  router.register('POST', '/api/nutrition/today/swap', ({ store, data, body }) => {
    const swap = body as MealSwap
    const day = nutritionToday(data)
    if (day.status !== 'ok') throw new ApiError('HTTP 409')
    const allowed = swapOptions(day.plan, swap.mealId, swap.fromFoodId, data.nutrition.genetics.flags).some(o => o.food.id === swap.toFoodId)
    if (!allowed) throw new ApiError('Bad Request')
    const d = store.updateDataset(cur => ({ nutrition: { ...cur.nutrition, swaps: [...cur.nutrition.swaps, swap] } }))
    return nutritionToday(d)
  })
}

/** Rotas de leitura (T010) e escrita (T014) do modo mock, no formato da API real. */
export function registerMockRoutes(router: MockRouter): void {
  registerReads(router)
  registerWrites(router)
  registerAgentRoutes(router)
  registerAdaptiveRoutes(router)
}
