import { describe, it, expect, beforeEach } from 'vitest'
import {
  startSession,
  logSet,
  completeSet,
  swapVariant,
  addSet,
  finishSession,
} from '../session'
import type { ActiveExercise, ActiveSession } from '../types'

// Fixture mínima para testes
const makeExercise = (id: string): ActiveExercise => ({
  id,
  name: `Exercise ${id}`,
  muscle: 'Peito',
  scheme: '3 × 8-10',
  rest: 90,
  match: 85,
  muscles: { primary: ['peito'], secondary: [] },
  cues: ['Step 1', 'Step 2'],
  variants: [
    { id: `${id}-v1`, name: 'Variant A', equip: 'Barra', level: 'Intermediário', match: 85, rec: true, motion: 'press-flat', implement: 'barbell', why: 'Best fit' },
    { id: `${id}-v2`, name: 'Variant B', equip: 'Halteres', level: 'Iniciante', match: 78, motion: 'press-flat', implement: 'dumbbell', why: 'Alternative' },
  ],
  suggestedSets: [
    { prev: '60 kg × 8', w: 62.5, r: 8 },
    { prev: '60 kg × 7', w: 60, r: 8 },
    { prev: '60 kg × 7', w: 60, r: 7 },
  ],
})

const exercises = [makeExercise('e1'), makeExercise('e2')]

describe('startSession', () => {
  it('initializes sets from suggestedSets for each exercise', () => {
    const session = startSession('push-a', 'Push A', exercises)
    expect(session.sets['e1']).toHaveLength(3)
    expect(session.sets['e2']).toHaveLength(3)
    expect(session.sets['e1'][0]).toEqual({ w: 62.5, r: 8, prev: '60 kg × 8', done: false })
  })

  it('starts with empty variantById', () => {
    const session = startSession('push-a', 'Push A', exercises)
    expect(session.variantById).toEqual({})
  })

  it('sets startedAt close to Date.now()', () => {
    const before = Date.now()
    const session = startSession('push-a', 'Push A', exercises)
    const after = Date.now()
    expect(session.startedAt).toBeGreaterThanOrEqual(before)
    expect(session.startedAt).toBeLessThanOrEqual(after)
  })
})

describe('logSet', () => {
  let session: ActiveSession

  beforeEach(() => {
    session = startSession('push-a', 'Push A', exercises)
  })

  it('updates w and r for the specified set', () => {
    const updated = logSet(session, 'e1', 0, 65, 6)
    expect(updated.sets['e1'][0].w).toBe(65)
    expect(updated.sets['e1'][0].r).toBe(6)
  })

  it('does not mark set as done', () => {
    const updated = logSet(session, 'e1', 0, 65, 6)
    expect(updated.sets['e1'][0].done).toBe(false)
  })

  it('does not mutate the original session', () => {
    logSet(session, 'e1', 0, 65, 6)
    expect(session.sets['e1'][0].w).toBe(62.5)
  })

  it('does not affect other exercises', () => {
    const updated = logSet(session, 'e1', 0, 65, 6)
    expect(updated.sets['e2'][0].w).toBe(62.5)
  })
})

describe('completeSet', () => {
  let session: ActiveSession

  beforeEach(() => {
    session = startSession('push-a', 'Push A', exercises)
  })

  it('marks the specified set as done', () => {
    const updated = completeSet(session, 'e1', 1)
    expect(updated.sets['e1'][1].done).toBe(true)
  })

  it('does not affect other sets in the same exercise', () => {
    const updated = completeSet(session, 'e1', 1)
    expect(updated.sets['e1'][0].done).toBe(false)
    expect(updated.sets['e1'][2].done).toBe(false)
  })

  it('does not mutate the original session', () => {
    completeSet(session, 'e1', 1)
    expect(session.sets['e1'][1].done).toBe(false)
  })
})

describe('swapVariant', () => {
  let session: ActiveSession

  beforeEach(() => {
    session = startSession('push-a', 'Push A', exercises)
  })

  it('sets the active variant for an exercise', () => {
    const updated = swapVariant(session, 'e1', 'e1-v2')
    expect(updated.variantById['e1']).toBe('e1-v2')
  })

  it('preserves all sets for the exercise', () => {
    const logged = logSet(session, 'e1', 0, 70, 5)
    const updated = swapVariant(logged, 'e1', 'e1-v2')
    expect(updated.sets['e1'][0].w).toBe(70)
    expect(updated.sets['e1']).toHaveLength(3)
  })

  it('does not affect other exercises variantById', () => {
    const updated = swapVariant(session, 'e1', 'e1-v2')
    expect(updated.variantById['e2']).toBeUndefined()
  })

  it('reverting to rec variant removes entry from variantById', () => {
    const swapped = swapVariant(session, 'e1', 'e1-v2')
    const reverted = swapVariant(swapped, 'e1', 'e1-v1')
    expect(reverted.variantById['e1']).toBeUndefined()
  })
})

describe('addSet', () => {
  let session: ActiveSession

  beforeEach(() => {
    session = startSession('push-a', 'Push A', exercises)
  })

  it('adds a set to the end of the exercise sets', () => {
    const updated = addSet(session, 'e1')
    expect(updated.sets['e1']).toHaveLength(4)
  })

  it('clones the last set with done:false and prev:""', () => {
    const updated = addSet(session, 'e1')
    const newSet = updated.sets['e1'][3]
    expect(newSet.done).toBe(false)
    expect(newSet.prev).toBe('')
    expect(newSet.w).toBe(session.sets['e1'][2].w)
    expect(newSet.r).toBe(session.sets['e1'][2].r)
  })
})

describe('finishSession', () => {
  it('calculates duration in minutes', () => {
    const session = startSession('push-a', 'Push A', exercises)
    // Fake 30 minutes ago
    const fakeSession = { ...session, startedAt: Date.now() - 30 * 60 * 1000 }
    const summary = finishSession(fakeSession)
    expect(summary.durationMinutes).toBeGreaterThanOrEqual(29)
    expect(summary.durationMinutes).toBeLessThanOrEqual(31)
  })

  it('counts only done sets in totalSets', () => {
    let session = startSession('push-a', 'Push A', exercises)
    session = completeSet(session, 'e1', 0)
    session = completeSet(session, 'e1', 1)
    const summary = finishSession(session)
    expect(summary.totalSets).toBe(2)
  })

  it('calculates totalVolumeKg from done sets (w * r)', () => {
    let session = startSession('push-a', 'Push A', exercises)
    // e1[0]: w=62.5, r=8 → 500kg
    session = completeSet(session, 'e1', 0)
    const summary = finishSession(session)
    expect(summary.totalVolumeKg).toBe(500)
  })

  it('returns correct workoutId and workoutName', () => {
    const session = startSession('push-a', 'Push A', exercises)
    const summary = finishSession(session)
    expect(summary.workoutId).toBe('push-a')
    expect(summary.workoutName).toBe('Push A')
  })
})
