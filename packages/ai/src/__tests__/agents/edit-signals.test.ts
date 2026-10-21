import { describe, it, expect } from 'vitest'
import type { SessionEdit } from '@helux/types'
import { preferenceSignalsFromEdits } from '../../agents/edit-signals'

const NOW = new Date('2026-10-20T12:00:00Z')
let n = 0
const swap = (from: string, to: string, daysAgo = 1): SessionEdit => ({
  id: `e${n++}`,
  sessionIndex: 0,
  exerciseIndex: 0,
  kind: 'troca-exercicio',
  before: { exercise: from },
  after: { exercise: to },
  safetyOverride: false,
  createdAt: new Date(NOW.getTime() - daysAgo * 86400000).toISOString(),
})

describe('preferenceSignalsFromEdits (FR-009b)', () => {
  it('trocado ≥ 2× em 60 dias → evitar-tendencia; escolhido ≥ 2× → preferencia', () => {
    const signals = preferenceSignalsFromEdits(
      [swap('Agachamento Livre (Barra)', 'Leg Press 45°'), swap('Agachamento Livre (Barra)', 'Leg Press 45°', 10), swap('Supino Reto (Barra)', 'Crossover no Cabo')],
      NOW,
    )
    expect(signals).toEqual([
      { exercise: 'Agachamento Livre (Barra)', kind: 'evitar-tendencia', count: 2 },
      { exercise: 'Leg Press 45°', kind: 'preferencia', count: 2 },
    ])
  })

  it('ignora edições com mais de 60 dias e as de séries/reps/carga', () => {
    const old = [swap('A', 'B', 61), swap('A', 'B', 70)]
    const load: SessionEdit = { ...swap('A', 'A'), kind: 'series-reps-carga', before: { sets: 3 }, after: { sets: 4 } }
    expect(preferenceSignalsFromEdits([...old, load, load], NOW)).toEqual([])
  })
})
