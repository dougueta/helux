import { describe, it, expect } from 'vitest'
import type { PlannedExercise } from '@helux/types'
import { compareEffort, effortAdvice, effortLevelLabel, effortTarget, summarizeEffort } from '../index'

const main = (rirTarget?: number): PlannedExercise => ({
  name: 'Supino',
  sets: 3,
  reps: '8-10',
  weight: '60kg',
  notes: '',
  phase: 'principal',
  ...(rirTarget !== undefined ? { rirTarget } : {}),
})

describe('effortTarget (spec 027, R2/R3)', () => {
  it('sem alvo → null', () => {
    expect(effortTarget(undefined)).toBeNull()
  })

  it.each([
    [0, ['limite'], 'No limite', 'até a falha'],
    [1, ['dificil'], 'Difícil', 'sobrar 1 repetição'],
    [2, ['moderado', 'dificil'], 'Moderado a difícil', 'sobrar 2 repetições'],
    [3, ['moderado'], 'Moderado', 'sobrar 3 repetições'],
    [4, ['facil'], 'Fácil', 'sobrar 4 repetições'],
    [5, ['facil'], 'Fácil', 'sobrar 5 repetições'],
  ])('RIR %i → níveis, rótulo e repetições', (rir, levels, label, remaining) => {
    const t = effortTarget(rir)!
    expect(t.rir).toBe(rir)
    expect(t.levels).toEqual(levels)
    expect(t.label).toBe(label)
    expect(t.remaining).toBe(remaining)
  })

  it('RIR negativo vira 0 e fracionário é arredondado', () => {
    expect(effortTarget(-1)!.rir).toBe(0)
    expect(effortTarget(2.4)!.rir).toBe(2)
  })

  it('explicação de como sentir o esforço', () => {
    const two = effortTarget(2)!.explanation
    const zero = effortTarget(0)!.explanation
    expect(two).toContain('conseguiria fazer mais 2 com boa técnica')
    expect(zero).toContain('nenhuma repetição')
    for (const text of [two, zero]) expect(text).toContain('Se sobrar mais, aumente a carga; se sobrar menos, reduza.')
  })
})

describe('compareEffort (FR-008)', () => {
  it('RIR 2: moderado e difícil no alvo', () => {
    const t = effortTarget(2)!
    expect(compareEffort(t, 'moderado')).toBe('no-alvo')
    expect(compareEffort(t, 'dificil')).toBe('no-alvo')
    expect(compareEffort(t, 'facil')).toBe('abaixo')
    expect(compareEffort(t, 'limite')).toBe('acima')
  })

  it('RIR 0: só no limite está no alvo', () => {
    const t = effortTarget(0)!
    expect(compareEffort(t, 'limite')).toBe('no-alvo')
    expect(compareEffort(t, 'dificil')).toBe('abaixo')
  })

  it('RIR 4: fácil está no alvo', () => {
    const t = effortTarget(4)!
    expect(compareEffort(t, 'facil')).toBe('no-alvo')
    expect(compareEffort(t, 'moderado')).toBe('acima')
  })
})

describe('effortAdvice (FR-009)', () => {
  it('no alvo não tem sugestão', () => {
    expect(effortAdvice('no-alvo', true)).toBeNull()
  })

  it('fala da próxima série ou do próximo treino', () => {
    expect(effortAdvice('abaixo', true)).toBe('Aumente a carga na próxima série.')
    expect(effortAdvice('abaixo', false)).toBe('Aumente a carga no próximo treino.')
    expect(effortAdvice('acima', true)).toBe('Reduza a carga ou pare antes da falha na próxima série.')
    expect(effortAdvice('acima', false)).toBe('Reduza a carga ou pare antes da falha no próximo treino.')
  })
})

describe('effortLevelLabel', () => {
  it('rótulos da escala do registro', () => {
    expect(effortLevelLabel('facil')).toBe('Fácil')
    expect(effortLevelLabel('moderado')).toBe('Moderado')
    expect(effortLevelLabel('dificil')).toBe('Difícil')
    expect(effortLevelLabel('limite')).toBe('No limite')
  })
})

describe('summarizeEffort (US3)', () => {
  it('lista vazia → null', () => {
    expect(summarizeEffort([])).toBeNull()
  })

  it('ignora itens sem esforço, sem alvo e que não são principais', () => {
    expect(
      summarizeEffort([
        { exercise: main(2), name: 'Supino' },
        { exercise: main(), name: 'Remada', level: 'facil' },
        { exercise: { ...main(2), phase: 'aquecimento' }, name: 'Polichinelo', level: 'facil' },
        { exercise: { ...main(2), cardio: { modality: 'bike', minutes: 10, zone: 'Z2' } }, name: 'Bike', level: 'facil' },
        { exercise: { ...main(2), region: 'quadril' as PlannedExercise['region'] }, name: 'Mobilidade', level: 'facil' },
      ]),
    ).toBeNull()
  })

  it('conta os no alvo e lista os fora, na ordem do treino', () => {
    const summary = summarizeEffort([
      { exercise: main(2), name: 'Supino', level: 'dificil' },
      { exercise: main(1), name: 'Remada', level: 'facil' },
      { exercise: main(), name: 'Rosca', level: 'facil' },
      { exercise: main(3), name: 'Agachamento', level: 'limite' },
    ])!
    expect(summary.onTarget).toBe(1)
    expect(summary.total).toBe(3)
    expect(summary.offTarget.map(i => [i.exerciseIndex, i.name, i.level, i.result, i.target.label])).toEqual([
      [1, 'Remada', 'facil', 'abaixo', 'Difícil'],
      [3, 'Agachamento', 'limite', 'acima', 'Moderado'],
    ])
  })
})
