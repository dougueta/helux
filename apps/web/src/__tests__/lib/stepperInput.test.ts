import { describe, it, expect } from 'vitest'
import { parseStepperInput, roundTo } from '@/lib/stepperInput'

const KG = { min: 0, max: 500, decimals: 2 }
const REPS = { min: 0, max: 100, decimals: 0 }

describe('parseStepperInput (spec 026, FR-003/FR-004/FR-008)', () => {
  it('aceita vírgula ou ponto como separador decimal', () => {
    expect(parseStepperInput('10,25', KG)).toBe(10.25)
    expect(parseStepperInput('10.25', KG)).toBe(10.25)
    expect(parseStepperInput('42,5', KG)).toBe(42.5)
    expect(parseStepperInput(' 60 ', KG)).toBe(60)
  })

  it('arredonda para as casas do campo', () => {
    expect(parseStepperInput('10,257', KG)).toBe(10.26)
    expect(parseStepperInput('11,6', REPS)).toBe(12)
  })

  it('vazio ou não numérico vira null', () => {
    for (const raw of ['', '  ', 'abc', ',', '.', '1,2,3']) expect(parseStepperInput(raw, KG)).toBeNull()
  })

  it('corrige para a faixa', () => {
    expect(parseStepperInput('-3', KG)).toBe(0)
    expect(parseStepperInput('900', KG)).toBe(500)
    expect(parseStepperInput('150', REPS)).toBe(100)
  })
})

describe('roundTo', () => {
  it('sem erro de ponto flutuante', () => {
    expect(roundTo(10.25 + 2.5, 2)).toBe(12.75)
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3)
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(11.5, 0)).toBe(12)
  })
})
