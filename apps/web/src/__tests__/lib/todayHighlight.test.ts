import { describe, it, expect } from 'vitest'
import type { PlannedExercise } from '@helux/types'
import { todayHighlight } from '@/lib/todayHighlight'

const ex = (name: string, phase?: PlannedExercise['phase']): PlannedExercise => ({ name, sets: 3, reps: '10', weight: '10kg', phase })

describe('todayHighlight (spec 014, FR-023)', () => {
  it('destaca o 1º exercício do principal e conta só o principal', () => {
    const h = todayHighlight([
      ex('Esteira', 'aquecimento'),
      ex('Supino', 'principal'),
      ex('Remada'),
      ex('Rosca'),
      ex('Tríceps'),
      ex('Alongamento', 'volta-calma'),
    ])
    expect(h.first?.name).toBe('Supino')
    expect(h.next.map(e => e.name)).toEqual(['Remada', 'Rosca'])
    expect(h.more).toBe(1)
    expect(h.count).toBe(4)
    expect(h.hasExtraPhases).toBe(true)
  })

  it('plano antigo: igual ao comportamento anterior e sem fases extras', () => {
    const h = todayHighlight([ex('A'), ex('B')])
    expect(h.first?.name).toBe('A')
    expect(h.next.map(e => e.name)).toEqual(['B'])
    expect(h.more).toBe(0)
    expect(h.count).toBe(2)
    expect(h.hasExtraPhases).toBe(false)
  })

  it('lista vazia', () => {
    expect(todayHighlight([])).toEqual({ first: undefined, next: [], more: 0, count: 0, hasExtraPhases: false })
  })
})
