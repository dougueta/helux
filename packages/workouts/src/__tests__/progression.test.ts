import { describe, it, expect } from 'vitest'
import type { ExerciseSet, PlannedExercise, WorkoutSession } from '@helux/types'
import {
  EFFORT_LEVELS,
  EFFORT_VALUE,
  applyProgression,
  computeMesocycleProgression,
  decideProgression,
  effortBand,
  loadIncrement,
  parseKg,
  parseRepRange,
} from '../progression'

const sets = (n: number, reps: number, weight: number, effort = 7) =>
  Array.from({ length: n }, () => ({ reps, weight, effort }))

const performed = (s: ExerciseSet['sets'], extra: Partial<ExerciseSet> = {}): ExerciseSet => ({
  name: 'Supino Reto',
  sets: s,
  ...extra,
})

const base = {
  name: 'Supino Reto',
  prescribedSets: 3,
  prescribedReps: '8-10',
  userLevel: 'intermediario' as const,
}

describe('esforço percebido (spec 014, R6)', () => {
  it('4 níveis com valores 6/7/9/10', () => {
    expect(EFFORT_LEVELS).toEqual(['facil', 'moderado', 'dificil', 'limite'])
    expect(EFFORT_VALUE).toEqual({ facil: 6, moderado: 7, dificil: 9, limite: 10 })
  })

  it('faixas: ≤6 fácil, 7–8 moderado, ≥9 difícil', () => {
    expect(effortBand(6)).toBe('facil')
    expect(effortBand(7)).toBe('moderado')
    expect(effortBand(8)).toBe('moderado')
    expect(effortBand(9)).toBe('dificil')
    expect(effortBand(10)).toBe('dificil')
  })
})

describe('parsers e incremento', () => {
  it('parseRepRange aceita faixa e número; texto → null', () => {
    expect(parseRepRange('8-10')).toEqual({ min: 8, max: 10 })
    expect(parseRepRange('8–10')).toEqual({ min: 8, max: 10 })
    expect(parseRepRange('12')).toEqual({ min: 12, max: 12 })
    expect(parseRepRange('5 min')).toBeNull()
    expect(parseRepRange('até a falha')).toBeNull()
  })

  it('parseKg lê "60kg", "22,5 kg"; sem número → null', () => {
    expect(parseKg('60kg')).toBe(60)
    expect(parseKg('22,5 kg')).toBe(22.5)
    expect(parseKg('—')).toBeNull()
    expect(parseKg('peso corporal')).toBeNull()
  })

  it('incremento: 1 kg < 20; 2 kg < 60; 2,5 kg ≥ 60', () => {
    expect(loadIncrement(10)).toBe(1)
    expect(loadIncrement(40)).toBe(2)
    expect(loadIncrement(60)).toBe(2.5)
  })
})

describe('decideProgression (FR-016, FR-017)', () => {
  it('topo da faixa em todas as séries, moderado → aumenta (cenário do quickstart: 3×10 @40 kg)', () => {
    const d = decideProgression({ ...base, performed: performed(sets(3, 10, 40)) })
    // 40 × 2,5% × 1 = 1 → arredonda para 0 no incremento de 2 → mínimo 1 incremento = +2
    expect(d).toMatchObject({ name: 'Supino Reto', action: 'aumentar', previousWeightKg: 40, nextWeightKg: 42 })
    expect(d.reason).toMatch(/topo/i)
  })

  it('topo com esforço fácil e iniciante: 100 kg × 5% × 1,5 = 7,5 (dentro do teto de 10%)', () => {
    const d = decideProgression({ ...base, userLevel: 'iniciante', performed: performed(sets(3, 10, 100, 6)) })
    expect(d).toMatchObject({ action: 'aumentar', nextWeightKg: 107.5 })
  })

  it('aumento limitado a 10% da carga anterior', () => {
    // 60 × 5% × 1,5 = 4,5 → 5 (2 incrementos de 2,5); teto 6 → 65
    expect(decideProgression({ ...base, userLevel: 'iniciante', performed: performed(sets(3, 10, 60, 6)) }).nextWeightKg).toBe(65)
    // 30 × 5% × 1,5 = 2,25 → 2; teto 3 → 32
    expect(decideProgression({ ...base, userLevel: 'iniciante', performed: performed(sets(3, 10, 30, 6)) }).nextWeightKg).toBe(32)
  })

  it('quando 1 incremento passa de 10%, aplica 1 incremento', () => {
    // 8 kg: incremento 1 kg (12,5%) → 9
    expect(decideProgression({ ...base, performed: performed(sets(3, 10, 8)) }).nextWeightKg).toBe(9)
  })

  it('avançado progride menos: 100 × 2,5% × 0,5 = 1,25 → 1 incremento (2,5)', () => {
    expect(decideProgression({ ...base, userLevel: 'avancado', performed: performed(sets(3, 10, 100)) }).nextWeightKg).toBe(102.5)
  })

  it('topo com esforço difícil/no limite → mantém', () => {
    for (const effort of [9, 10]) {
      expect(decideProgression({ ...base, performed: performed(sets(3, 10, 40, effort)) })).toMatchObject({
        action: 'manter',
        nextWeightKg: 40,
      })
    }
  })

  it('dentro da faixa: fácil → +1 incremento; moderado/difícil → mantém', () => {
    expect(decideProgression({ ...base, performed: performed(sets(3, 9, 40, 6)) })).toMatchObject({ action: 'aumentar', nextWeightKg: 42 })
    expect(decideProgression({ ...base, performed: performed(sets(3, 9, 40, 7)) })).toMatchObject({ action: 'manter', nextWeightKg: 40 })
    expect(decideProgression({ ...base, performed: performed(sets(3, 9, 40, 9)) })).toMatchObject({ action: 'manter', nextWeightKg: 40 })
  })

  it('topo só conta se TODAS as séries na carga de referência chegaram ao topo', () => {
    const d = decideProgression({ ...base, performed: performed([...sets(2, 10, 40), { reps: 8, weight: 40, effort: 7 }]) })
    expect(d.action).toBe('manter')
  })

  it('abaixo da faixa ou incompleto no limite → reduz 10% (cenário do quickstart: 3×6 no limite)', () => {
    expect(decideProgression({ ...base, performed: performed(sets(3, 6, 40, 10)) })).toMatchObject({
      action: 'reduzir',
      previousWeightKg: 40,
      nextWeightKg: 36,
    })
    // incompleto: 2 de 3 séries
    expect(decideProgression({ ...base, performed: performed(sets(2, 10, 40, 9)) })).toMatchObject({ action: 'reduzir', nextWeightKg: 36 })
  })

  it('redução mínima de 1 incremento e nunca abaixo de 0', () => {
    expect(decideProgression({ ...base, performed: performed(sets(3, 6, 5, 10)) }).nextWeightKg).toBe(4)
    expect(decideProgression({ ...base, performed: performed(sets(3, 6, 0.5, 10)) }).nextWeightKg).toBe(0)
  })

  it('abaixo da faixa sem esforço alto → mantém', () => {
    expect(decideProgression({ ...base, performed: performed(sets(3, 6, 40, 7)) })).toMatchObject({ action: 'manter', nextWeightKg: 40 })
  })

  it('a referência é a maior carga concluída', () => {
    const d = decideProgression({
      ...base,
      performed: performed([{ reps: 10, weight: 30, effort: 7 }, { reps: 10, weight: 40, effort: 7 }, { reps: 10, weight: 40, effort: 7 }]),
    })
    expect(d).toMatchObject({ previousWeightKg: 40, action: 'aumentar', nextWeightKg: 42 })
  })

  it('sem dados: não executado, pulado, variante, sem carga, faixa não numérica', () => {
    const cases = [
      { ...base, performed: null },
      { ...base, performed: performed(sets(3, 10, 40), { skipped: true }) },
      { ...base, performed: performed(sets(3, 10, 40), { executedVariant: { name: 'Supino (Halteres)', match: 80 } }) },
      { ...base, performed: performed(sets(3, 10, 0)) },
      { ...base, prescribedReps: 'até a falha', performed: performed(sets(3, 10, 40)) },
    ]
    for (const input of cases) {
      expect(decideProgression(input)).toMatchObject({ action: 'sem-dados', nextWeightKg: null })
    }
  })
})

describe('computeMesocycleProgression (FR-015)', () => {
  const ex = (name: string, extra: Partial<PlannedExercise> = {}): PlannedExercise => ({
    name,
    sets: 3,
    reps: '8-10',
    weight: '40kg',
    ...extra,
  })
  const previousSessions = [
    { exercises: [ex('Esteira', { phase: 'aquecimento', reps: '5 min', weight: '—' }), ex('Supino Reto'), ex('Remada Curvada')] },
    { exercises: [ex('Supino Reto'), ex('Agachamento Livre (Barra)')] },
  ]
  const session = (date: string, exercises: ExerciseSet[]): WorkoutSession => ({ id: date, date, exercises })

  it('uma decisão por exercício do principal, usando a execução mais recente', () => {
    const history = [
      session('2026-10-01', [{ name: 'Supino Reto', sets: sets(3, 6, 40, 10) }]),
      session('2026-10-08', [{ name: 'Supino Reto', sets: sets(3, 10, 40, 7) }, { name: 'Remada Curvada', sets: sets(3, 9, 40, 7) }]),
    ]
    const decisions = computeMesocycleProgression({ previousSessions, history, userLevel: 'intermediario' })
    expect(decisions.map((d) => [d.name, d.action, d.nextWeightKg])).toEqual([
      ['Supino Reto', 'aumentar', 42],
      ['Remada Curvada', 'manter', 40],
      ['Agachamento Livre (Barra)', 'sem-dados', null],
    ])
  })

  it('a ordem do histórico não importa: vale a data mais recente', () => {
    const history = [
      session('2026-10-08', [{ name: 'Supino Reto', sets: sets(3, 10, 40, 7) }]),
      session('2026-10-01', [{ name: 'Supino Reto', sets: sets(3, 6, 40, 10) }]),
    ]
    const [supino] = computeMesocycleProgression({ previousSessions, history, userLevel: 'intermediario' })
    expect(supino.action).toBe('aumentar')
  })
})

describe('applyProgression (FR-018, FR-019)', () => {
  const decisions = [
    { name: 'Supino Reto', action: 'aumentar' as const, previousWeightKg: 40, nextWeightKg: 42, reason: 'topo' },
    { name: 'Remada Curvada', action: 'sem-dados' as const, previousWeightKg: null, nextWeightKg: null, reason: 'sem dados' },
  ]

  it('sobrescreve a carga do principal e grava a decisão; não mexe no resto', () => {
    const sessions = [
      {
        letter: 'A',
        exercises: [
          { name: 'Supino Reto', sets: 3, reps: '8-10', weight: '45kg', phase: 'aquecimento' as const },
          { name: 'Supino Reto', sets: 3, reps: '8-10', weight: '45kg', phase: 'principal' as const },
          { name: 'Remada Curvada', sets: 3, reps: '8-10', weight: '50kg' },
        ],
      },
    ]
    const [out] = applyProgression(sessions, decisions)
    expect(out.letter).toBe('A')
    expect(out.exercises[0]).toEqual(sessions[0].exercises[0])
    expect(out.exercises[1]).toMatchObject({
      weight: '42kg',
      progression: { action: 'aumentar', previousWeightKg: 40, nextWeightKg: 42, reason: 'topo' },
    })
    expect(out.exercises[2]).toEqual(sessions[0].exercises[2])
    // imutável
    expect(sessions[0].exercises[1].weight).toBe('45kg')
  })

  it('sem decisões, devolve as sessões iguais', () => {
    const sessions = [{ exercises: [{ name: 'Supino Reto', sets: 3, reps: '10', weight: '40kg' }] }]
    expect(applyProgression(sessions, [])).toEqual(sessions)
  })
})
