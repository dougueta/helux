import { describe, it, expect } from 'vitest'
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from '../exercise-bank'

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

describe('EXERCISE_BANK — músculos e tempo derivados', () => {
  it('toda entrada tem muscles.primary com pelo menos 1 chave válida do MuscleMap', () => {
    const validKeys = ['peito', 'ombro', 'triceps', 'biceps', 'core', 'dorsal', 'quadriceps']
    for (const entry of EXERCISE_BANK) {
      expect(entry.muscles.primary.length).toBeGreaterThanOrEqual(1)
      for (const key of entry.muscles.primary) expect(validKeys).toContain(key)
      for (const key of entry.muscles.secondary) expect(validKeys).toContain(key)
    }
  })

  it('toda entrada tem tempo no formato "N · N · N"', () => {
    for (const entry of EXERCISE_BANK) {
      expect(entry.tempo).toMatch(/^\d+ · \d+ · \d+$/)
    }
  })

  it('Agachamento Livre (Barra): quadriceps primário, core secundário, tempo 2·0·1', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Agachamento Livre (Barra)')!
    expect(entry.muscles.primary).toEqual(['quadriceps'])
    expect(entry.muscles.secondary).toEqual(['core'])
    expect(entry.tempo).toBe('2 · 0 · 1')
  })

  it('Cadeira Extensora (isolamento): sem secundário, tempo 3·1·1', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Cadeira Extensora')!
    expect(entry.muscles.secondary).toEqual([])
    expect(entry.tempo).toBe('3 · 1 · 1')
  })

  it('Cadeira Abdutora (gluteo): mapeia para a região quadriceps do MuscleMap', () => {
    const entry = EXERCISE_BANK.find((e) => e.name === 'Cadeira Abdutora')!
    expect(entry.muscles.primary).toEqual(['quadriceps'])
  })
})

describe('MUSCLE_GROUP_LABEL', () => {
  it('tem um rótulo em português para cada muscleGroup usado no banco', () => {
    const groups = new Set(EXERCISE_BANK.map((e) => e.muscleGroup))
    for (const g of groups) expect(MUSCLE_GROUP_LABEL[g]).toBeTruthy()
    expect(MUSCLE_GROUP_LABEL.quadriceps).toBe('Quadríceps')
  })
})
