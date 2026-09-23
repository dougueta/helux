import { describe, it, expect } from 'vitest'
import type { PlannedExercise } from '@helux/types'
import { recommendedVariant, resolveExerciseDisplay } from '@/lib/exerciseDisplay'

const EXERCISE: PlannedExercise = {
  name: 'Supino reto com barra',
  sets: 4,
  reps: '6-8',
  weight: '80kg',
  notes: 'Cargas altas — seu forte',
  cues: ['Escápulas retraídas e pés firmes no chão'],
  match: 70,
  variants: [
    { id: 'e1', rec: true, name: 'Supino reto com barra', equip: 'Barra', level: 'Avançado', match: 96, motion: 'press-flat', implement: 'barbell', why: 'Cargas altas casam com seu perfil de força.' },
    { id: 'e1b', name: 'Supino reto com halteres', equip: 'Halteres', level: 'Intermediário', match: 90, motion: 'press-flat', implement: 'dumbbell', why: 'Maior amplitude e estabilização; corrige assimetrias.' },
    { id: 'e1c', name: 'Supino na máquina', equip: 'Máquina', level: 'Iniciante', match: 84, motion: 'press-flat', implement: 'machine', why: '' },
  ],
}

const PLANNED_DISPLAY = {
  title: 'Supino reto com barra',
  plannedName: null,
  fit: 96,
  tip: 'Cargas altas — seu forte',
  tipKind: 'notes',
  showPlannedCues: true,
}

describe('resolveExerciseDisplay', () => {
  it('shows the planned exercise with the recommended variant fit when no variant was chosen', () => {
    expect(resolveExerciseDisplay(EXERCISE, undefined)).toEqual(PLANNED_DISPLAY)
  })

  it('treats the recommended variant as the planned exercise', () => {
    expect(resolveExerciseDisplay(EXERCISE, 'e1')).toEqual(PLANNED_DISPLAY)
  })

  it('shows the alternative variant with the planned exercise as secondary reference and its genetic reason as tip', () => {
    expect(resolveExerciseDisplay(EXERCISE, 'e1b')).toEqual({
      title: 'Supino reto com halteres',
      plannedName: 'Supino reto com barra',
      fit: 90,
      tip: 'Maior amplitude e estabilização; corrige assimetrias.',
      tipKind: 'variant-why',
      showPlannedCues: false,
    })
  })

  it('falls back to the planned exercise when the variant id no longer exists', () => {
    expect(resolveExerciseDisplay(EXERCISE, 'gone')).toEqual(PLANNED_DISPLAY)
  })

  it('uses the exercise own match and notes when it has no variants', () => {
    const { variants: _v, ...noVariants } = EXERCISE
    expect(resolveExerciseDisplay(noVariants, undefined)).toEqual({
      title: 'Supino reto com barra',
      plannedName: null,
      fit: 70,
      tip: 'Cargas altas — seu forte',
      tipKind: 'notes',
      showPlannedCues: true,
    })
  })

  it('has no tip when the exercise has no variants and no notes', () => {
    const { variants: _v, notes: _n, ...bare } = EXERCISE
    const display = resolveExerciseDisplay(bare, undefined)
    expect(display.tip).toBeNull()
    expect(display.tipKind).toBeNull()
  })

  it('never falls back to the planned tips when the alternative variant has an empty reason', () => {
    const display = resolveExerciseDisplay(EXERCISE, 'e1c')
    expect(display.title).toBe('Supino na máquina')
    expect(display.tip).toBeNull()
    expect(display.tipKind).toBeNull()
    expect(display.showPlannedCues).toBe(false)
  })

  describe('when no variant is marked rec', () => {
    const NO_REC: PlannedExercise = {
      ...EXERCISE,
      variants: EXERCISE.variants!.map(({ rec: _rec, ...v }) => v),
    }

    it('treats the first variant as the recommended one when nothing was chosen', () => {
      const display = resolveExerciseDisplay(NO_REC, undefined)
      expect(display.plannedName).toBeNull()
      expect(display.showPlannedCues).toBe(true)
      expect(display.fit).toBe(96)
    })

    it('treats choosing the first variant as the planned exercise', () => {
      expect(resolveExerciseDisplay(NO_REC, 'e1').plannedName).toBeNull()
    })

    it('treats any other variant as an alternative', () => {
      const display = resolveExerciseDisplay(NO_REC, 'e1b')
      expect(display.plannedName).toBe('Supino reto com barra')
      expect(display.tipKind).toBe('variant-why')
    })
  })

  describe('recommendedVariant', () => {
    it('returns the variant marked rec', () => {
      expect(recommendedVariant(EXERCISE)?.id).toBe('e1')
    })

    it('falls back to the first variant when none is marked rec', () => {
      const reordered = { ...EXERCISE, variants: [EXERCISE.variants![1], EXERCISE.variants![2]] }
      expect(recommendedVariant(reordered)?.id).toBe('e1b')
    })

    it('returns undefined when the exercise has no variants', () => {
      expect(recommendedVariant({ ...EXERCISE, variants: [] })).toBeUndefined()
    })
  })
})
