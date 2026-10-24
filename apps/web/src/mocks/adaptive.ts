import type { HealthCondition, Joint, PainReport, Region } from '@helux/types'
import { CONDITION_CATALOG, rulesFor, sessionValidity } from '@helux/workouts'
import type { MockRouter } from './mock-router'
import type { MockDataset } from './types'
import { agentsOf } from './agents'

// Spec 024 no modo mock: condições de saúde e onboarding.

const conditionsOf = (d: MockDataset): HealthCondition[] => d.conditions ?? []

const catalogView = () =>
  CONDITION_CATALOG.map(c => ({
    key: c.key,
    label: c.label,
    regions: c.regions,
    rules: rulesFor({ id: c.key, catalogKey: c.key, customLabel: null, region: c.regions[0], side: null, since: null, count: 1, status: 'controlada', notes: null, flare: null }),
  }))

function onboardingView(d: MockDataset) {
  return {
    step: d.profile?.onboardingStep ?? null,
    completedAt: d.profile?.onboardingCompletedAt ?? null,
    profile: d.profile,
    preferences: agentsOf(d).preferences,
    conditions: conditionsOf(d),
    suggestions: { goalText: d.profile?.goal ?? null, injuryText: d.profile?.currentInjury ?? null },
  }
}

let checkinSeq = 0

const MOCK_CYCLE_ANALYSIS = {
  summary: {
    mesocycleId: 'mock-mesocycle-0',
    weeks: 4,
    adherence: { forca: { done: 11, planned: 12 }, cardio: { done: 2, planned: 4 }, mobilidade: { done: 3, planned: 4 } },
    exercises: [
      { name: 'Agachamento Livre (Barra)', firstE1rm: 126.7, lastE1rm: 127.9, avgRpe: 8.7, painReports: 0 },
      { name: 'Supino Reto (Barra)', firstE1rm: 80, lastE1rm: 90.7, avgRpe: 7.5, painReports: 0 },
      { name: 'Leg Press 45°', firstE1rm: 240, lastE1rm: 253.3, avgRpe: 7.8, painReports: 2 },
    ],
    avgRpeByWeek: [7, 7.8, 8.4, 6.2],
    pains: [{ region: 'joelho', count: 2 }],
    tirednessAvg: 2.4,
    checkinTrend: { from: '2026-09', to: '2026-10', deltas: { weight_kg: -0.8, waist_cm: -1.5 }, implausible: [], modifiers: [], suggestGoalChange: null },
    findings: [
      { kind: 'estagnacao', subject: 'Agachamento Livre (Barra)', evidence: '1RM estimado 126.7 → 127.9 kg (+1%), esforço médio 8.7' },
      { kind: 'dor-recorrente', subject: 'Leg Press 45°', evidence: '2 relatos de dor neste exercício' },
      { kind: 'baixa-aderencia', subject: 'cardio', evidence: '2 de 4 sessões de cardio feitas' },
    ],
    missingData: [],
  },
  changes: [
    { topic: 'ciclo', choice: 'Agachamento livre trocado pelo agachamento hack', sources: ['historico'], reason: 'O agachamento parou de subir com esforço alto; a variação muda o estímulo.' },
    { topic: 'ciclo', choice: 'Leg press fora do ciclo', sources: ['historico', 'condicoes'], reason: 'Dois relatos de dor no joelho nesse exercício.' },
    { topic: 'ciclo', choice: 'Cardio em sessões de 20 min na bike', sources: ['historico', 'preferencias'], reason: 'Metade das sessões de cardio ficou de fora; sessões mais curtas cabem melhor na semana.' },
  ],
}
const JOINTS: readonly string[] = ['joelho', 'ombro', 'lombar']

export function registerAdaptiveRoutes(router: MockRouter): void {
  // Check-ins de sensação (024 F4): no modo mock só respondem; dor forte numa articulação devolve o aviso.
  router.register('POST', '/api/session-checkins', ({ body }) => {
    const { phase, pains } = body as { phase: 'antes' | 'depois'; pains: PainReport[] }
    const regions = [...new Set(pains.filter(p => p.intensity >= 2 && JOINTS.includes(p.region)).map(p => p.region as Joint))]
    return {
      checkin: { id: `mock-checkin-${++checkinSeq}` },
      ...(phase === 'antes' && regions.length > 0
        ? { adjustment: { regions, reason: `Hoje o treino poupa ${regions.join(' e ')}: os exercícios que carregam essa região foram trocados.` } }
        : {}),
    }
  })

  // Análise do ciclo anterior (024 F5): exemplo fixo no modo mock.
  router.register('GET', '/workout/mesocycle/:id/analysis', () => MOCK_CYCLE_ANALYSIS)

  router.register('GET', '/api/workouts/review', ({ data }) => ({
    sessions: data.workoutHistory
      .map(s => ({ s, v: sessionValidity(s) }))
      .filter(({ v }) => !v.valid)
      .map(({ s, v }) => ({ id: s.id, date: s.date, durationS: s.duration_s, exercises: s.exercises.map(e => e.name), reasons: v.reasons })),
  }))

  router.register('POST', '/api/workouts/:id/confirm', ({ store, params }) => {
    store.updateDataset(d => ({ workoutHistory: d.workoutHistory.map(s => (s.id === params.id ? { ...s, review_status: 'confirmada' as const } : s)) }))
    return { id: params.id, reviewStatus: 'confirmada' }
  })

  router.register('DELETE', '/api/workouts/:id', ({ store, params }) => {
    store.updateDataset(d => ({ workoutHistory: d.workoutHistory.filter(s => s.id !== params.id) }))
    return null
  })

  router.register('GET', '/api/conditions', ({ data }) => ({ conditions: conditionsOf(data).map(c => ({ ...c, rules: rulesFor(c) })), catalog: catalogView() }))

  router.register('POST', '/api/conditions', ({ store, body }) => {
    const input = body as Omit<HealthCondition, 'id' | 'flare'>
    const condition: HealthCondition = {
      id: `mock-cond-${Date.now()}`,
      catalogKey: input.catalogKey ?? null,
      customLabel: input.customLabel ?? null,
      region: input.region,
      side: input.side ?? null,
      since: input.since ?? null,
      count: input.count ?? 1,
      status: input.status,
      notes: input.notes ?? null,
      flare: null,
    }
    store.updateDataset(d => ({ conditions: [...conditionsOf(d), condition] }))
    return condition.catalogKey
      ? { condition, rules: rulesFor(condition) }
      : { condition, proposedGuidance: [], notice: 'Modo mock: as regras desta condição seriam propostas pela Medicina.' }
  })

  const patchCondition = (id: string, patch: Partial<HealthCondition>) => (d: MockDataset) => ({ conditions: conditionsOf(d).map(c => (c.id === id ? { ...c, ...patch } : c)) })

  router.register('PATCH', '/api/conditions/:id', ({ store, params, body }) => {
    const d = store.updateDataset(patchCondition(params.id, body as Partial<HealthCondition>))
    const condition = conditionsOf(d).find(c => c.id === params.id)!
    return { condition, rules: rulesFor(condition) }
  })

  router.register('DELETE', '/api/conditions/:id', ({ store, params }) => {
    store.updateDataset(d => ({ conditions: conditionsOf(d).filter(c => c.id !== params.id) }))
    return null
  })

  router.register('POST', '/api/conditions/:id/flare', ({ store, params, body }) => {
    const { region, until } = body as { region: Region; until?: string }
    const d = store.updateDataset(patchCondition(params.id, { flare: { region, until: until ?? new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10) } }))
    const condition = conditionsOf(d).find(c => c.id === params.id)!
    return { condition, rules: rulesFor(condition) }
  })

  router.register('DELETE', '/api/conditions/:id/flare', ({ store, params }) => {
    const d = store.updateDataset(patchCondition(params.id, { flare: null }))
    const condition = conditionsOf(d).find(c => c.id === params.id)!
    return { condition, rules: rulesFor(condition) }
  })

  router.register('GET', '/api/onboarding', ({ data }) => onboardingView(data))

  router.register('PUT', '/api/onboarding', ({ store, body }) => {
    const input = body as {
      step: number
      goal?: { primary: string; secondary?: string | null; target?: string | null }
      experience?: { level: 'iniciante' | 'intermediario' | 'avancado'; trainingTime?: string; timeOff?: string }
      cardio?: { likes: string[]; avoid: string[] }
      availability?: Record<string, unknown>
    }
    const d = store.updateDataset(cur => ({
      profile: {
        ...cur.profile,
        onboardingStep: input.step,
        ...(input.goal ? { goalPrimary: input.goal.primary as never, goalSecondary: (input.goal.secondary ?? null) as never, goalTarget: input.goal.target ?? null } : {}),
        ...(input.experience ? { level: input.experience.level, trainingTime: input.experience.trainingTime ?? null, timeOff: input.experience.timeOff ?? null } : {}),
        ...(input.cardio ? { cardioLikes: input.cardio.likes, cardioAvoid: input.cardio.avoid } : {}),
        updatedAt: new Date().toISOString(),
      },
      ...(input.availability ? { agents: { ...agentsOf(cur), preferences: { ...agentsOf(cur).preferences, ...input.availability } } } : {}),
    }))
    return onboardingView(d)
  })

  router.register('POST', '/api/onboarding/complete', ({ store }) => {
    const completedAt = new Date().toISOString()
    store.updateDataset(cur => ({ profile: { ...cur.profile, onboardingCompletedAt: completedAt, updatedAt: completedAt } }))
    return { completedAt }
  })
}
