import type { HealthCondition, Region } from '@helux/types'
import { CONDITION_CATALOG, rulesFor } from '@helux/workouts'
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

export function registerAdaptiveRoutes(router: MockRouter): void {
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
