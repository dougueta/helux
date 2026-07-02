import { describe, it, expect } from 'vitest'
import { EXERCISE_BANK } from '../exercise-bank'

describe('EXERCISE_BANK', () => {
  it('tem pelo menos 100 exercícios', () => {
    expect(EXERCISE_BANK.length).toBeGreaterThanOrEqual(100)
  })

  it('todos os ids são únicos', () => {
    const ids = EXERCISE_BANK.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos os names são únicos', () => {
    const names = EXERCISE_BANK.map((e) => e.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('toda entrada tem entre 3 e 5 cues não vazias', () => {
    for (const entry of EXERCISE_BANK) {
      expect(entry.cues.length).toBeGreaterThanOrEqual(3)
      expect(entry.cues.length).toBeLessThanOrEqual(5)
      for (const cue of entry.cues) {
        expect(cue.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('equipment é sempre um dos valores válidos', () => {
    const valid = ['barra', 'halteres', 'maquina-cabo', 'peso-corporal']
    for (const entry of EXERCISE_BANK) {
      expect(valid).toContain(entry.equipment)
    }
  })

  it('cobre todos os padrões de movimento principais', () => {
    const patterns = new Set(EXERCISE_BANK.map((e) => e.pattern))
    for (const p of ['agachar', 'dobrar-quadril', 'empurrar-horizontal', 'empurrar-vertical', 'puxar-horizontal', 'puxar-vertical', 'core', 'isolamento']) {
      expect(patterns).toContain(p)
    }
  })
})
