import { describe, it, expect } from 'vitest'
import type { PlannedExercise } from '@helux/types'
import {
  exercisePhase,
  isMainExercise,
  groupByPhase,
  normalizeSessionExercises,
  supersetPartnerIndex,
} from '../plan-structure'

function ex(name: string, extra: Partial<PlannedExercise> = {}): PlannedExercise {
  return { name, sets: 3, reps: '8-10', weight: '40kg', ...extra }
}

describe('exercisePhase / isMainExercise', () => {
  it('trata item sem fase (plano antigo) como principal', () => {
    expect(exercisePhase(ex('Supino'))).toBe('principal')
    expect(isMainExercise(ex('Supino'))).toBe(true)
  })

  it('devolve a fase declarada', () => {
    expect(exercisePhase(ex('Esteira', { phase: 'aquecimento' }))).toBe('aquecimento')
    expect(isMainExercise(ex('Alongamento', { phase: 'volta-calma' }))).toBe(false)
  })

  it('trata fase desconhecida como principal', () => {
    expect(exercisePhase(ex('X', { phase: 'bla' as never }))).toBe('principal')
  })
})

describe('groupByPhase', () => {
  it('agrupa na ordem aquecimento, principal, volta-calma preservando índices originais', () => {
    const list = [ex('A', { phase: 'aquecimento' }), ex('B'), ex('C', { phase: 'volta-calma' }), ex('D')]
    const groups = groupByPhase(list)
    expect(groups.map((g) => g.phase)).toEqual(['aquecimento', 'principal', 'volta-calma'])
    expect(groups[1].items.map((i) => [i.exercise.name, i.index])).toEqual([
      ['B', 1],
      ['D', 3],
    ])
  })

  it('omite fases vazias', () => {
    expect(groupByPhase([ex('A'), ex('B')]).map((g) => g.phase)).toEqual(['principal'])
  })
})

describe('normalizeSessionExercises — fases', () => {
  it('reordena aquecimento → principal → volta-calma com ordem estável', () => {
    const out = normalizeSessionExercises([
      ex('Along', { phase: 'volta-calma' }),
      ex('Supino', { phase: 'principal' }),
      ex('Esteira', { phase: 'aquecimento' }),
      ex('Remada', { phase: 'principal' }),
      ex('Mobilidade', { phase: 'aquecimento' }),
    ])
    expect(out.map((e) => e.name)).toEqual(['Esteira', 'Mobilidade', 'Supino', 'Remada', 'Along'])
  })

  it('converte fase ausente ou desconhecida em principal', () => {
    const out = normalizeSessionExercises([ex('A'), ex('B', { phase: 'xyz' as never })])
    expect(out.map((e) => e.phase)).toEqual(['principal', 'principal'])
  })

  it('não altera os demais campos', () => {
    const out = normalizeSessionExercises([ex('A', { notes: 'n', phase: 'aquecimento' })])
    expect(out[0]).toMatchObject({ name: 'A', notes: 'n', sets: 3, phase: 'aquecimento' })
  })
})

describe('normalizeSessionExercises — biset', () => {
  it('mantém biset válido: 2 consecutivos do principal', () => {
    const out = normalizeSessionExercises([
      ex('Supino', { supersetGroup: 'b1' }),
      ex('Remada', { supersetGroup: 'b1' }),
      ex('Rosca'),
    ])
    expect(out.map((e) => e.supersetGroup)).toEqual(['b1', 'b1', undefined])
  })

  it('remove grupo com um só membro', () => {
    const out = normalizeSessionExercises([ex('Supino', { supersetGroup: 'b1' }), ex('Remada')])
    expect(out.every((e) => e.supersetGroup === undefined)).toBe(true)
    expect('supersetGroup' in out[0]).toBe(false)
  })

  it('remove grupo com mais de dois membros', () => {
    const out = normalizeSessionExercises([
      ex('A', { supersetGroup: 'b1' }),
      ex('B', { supersetGroup: 'b1' }),
      ex('C', { supersetGroup: 'b1' }),
    ])
    expect(out.every((e) => e.supersetGroup === undefined)).toBe(true)
  })

  it('remove grupo não consecutivo', () => {
    const out = normalizeSessionExercises([
      ex('A', { supersetGroup: 'b1' }),
      ex('B'),
      ex('C', { supersetGroup: 'b1' }),
    ])
    expect(out.every((e) => e.supersetGroup === undefined)).toBe(true)
  })

  it('remove grupo fora do principal', () => {
    const out = normalizeSessionExercises([
      ex('A', { phase: 'aquecimento', supersetGroup: 'b1' }),
      ex('B', { phase: 'aquecimento', supersetGroup: 'b1' }),
      ex('C'),
    ])
    expect(out.every((e) => e.supersetGroup === undefined)).toBe(true)
  })

  it('valida biset depois da reordenação por fase', () => {
    const out = normalizeSessionExercises([
      ex('A', { supersetGroup: 'b1' }),
      ex('Esteira', { phase: 'aquecimento' }),
      ex('B', { supersetGroup: 'b1' }),
    ])
    expect(out.map((e) => [e.name, e.supersetGroup])).toEqual([
      ['Esteira', undefined],
      ['A', 'b1'],
      ['B', 'b1'],
    ])
  })
})

describe('supersetPartnerIndex', () => {
  const list = [ex('Esteira', { phase: 'aquecimento' }), ex('A', { supersetGroup: 'b1' }), ex('B', { supersetGroup: 'b1' }), ex('C')]

  it('devolve o índice do parceiro', () => {
    expect(supersetPartnerIndex(list, 1)).toBe(2)
    expect(supersetPartnerIndex(list, 2)).toBe(1)
  })

  it('devolve null para exercício comum ou índice inválido', () => {
    expect(supersetPartnerIndex(list, 3)).toBeNull()
    expect(supersetPartnerIndex(list, 0)).toBeNull()
    expect(supersetPartnerIndex(list, 9)).toBeNull()
  })

  it('devolve null quando o grupo é inválido (plano não normalizado)', () => {
    const bad = [ex('A', { supersetGroup: 'b1' }), ex('B'), ex('C', { supersetGroup: 'b1' })]
    expect(supersetPartnerIndex(bad, 0)).toBeNull()
  })
})
