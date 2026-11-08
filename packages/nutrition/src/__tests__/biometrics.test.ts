import { describe, it, expect } from 'vitest'
import { activityFactor, ageOn, bmrMifflin, navyBodyFat, navyEstimate } from '../biometrics'

describe('ageOn', () => {
  it('idade completa na data', () => {
    expect(ageOn('1990-05-10', '2026-10-13')).toBe(36)
    expect(ageOn('1990-10-14', '2026-10-13')).toBe(35)
    expect(ageOn('1990-10-13', '2026-10-13')).toBe(36)
  })
})

describe('bmrMifflin (R2)', () => {
  it('homem: 10·peso + 6,25·altura − 5·idade + 5', () => {
    expect(bmrMifflin({ weightKg: 80, heightCm: 180, age: 35, sex: 'masculino' })).toBeCloseTo(1755, 5)
  })

  it('mulher: … − 161', () => {
    expect(bmrMifflin({ weightKg: 60, heightCm: 165, age: 30, sex: 'feminino' })).toBeCloseTo(1320.25, 5)
  })
})

describe('navyBodyFat (R3)', () => {
  it('homem: cintura, pescoço e altura (180 cm, 90/40 → 18,4%)', () => {
    expect(navyBodyFat({ sex: 'masculino', heightCm: 180, waistCm: 90, neckCm: 40 })).toBe(18.4)
  })

  it('mulher: cintura + quadril − pescoço (165 cm, 75/100/33 → 29,4%)', () => {
    expect(navyBodyFat({ sex: 'feminino', heightCm: 165, waistCm: 75, hipCm: 100, neckCm: 33 })).toBe(29.4)
  })

  it('medida faltando → null', () => {
    expect(navyBodyFat({ sex: 'masculino', heightCm: 180, waistCm: 90 })).toBeNull()
    expect(navyBodyFat({ sex: 'masculino', heightCm: 180, neckCm: 40 })).toBeNull()
    expect(navyBodyFat({ sex: 'feminino', heightCm: 165, waistCm: 75, neckCm: 33 })).toBeNull()
  })

  it('cintura menor ou igual ao pescoço → null', () => {
    expect(navyBodyFat({ sex: 'masculino', heightCm: 180, waistCm: 40, neckCm: 40 })).toBeNull()
  })

  it('resultado fora de 3–60% → null', () => {
    expect(navyBodyFat({ sex: 'masculino', heightCm: 180, waistCm: 45, neckCm: 40 })).toBeNull()
    expect(navyBodyFat({ sex: 'masculino', heightCm: 150, waistCm: 200, neckCm: 30 })).toBeNull()
  })
})

describe('activityFactor (R2)', () => {
  it('pela frequência do mesociclo', () => {
    expect(activityFactor(2)).toBe(1.375)
    expect(activityFactor(3)).toBe(1.55)
    expect(activityFactor(4)).toBe(1.55)
    expect(activityFactor(5)).toBe(1.725)
    expect(activityFactor(6)).toBe(1.725)
    expect(activityFactor(null)).toBe(1.375)
  })
})

describe('navyEstimate (spec 029, FR-008/FR-009)', () => {
  it('com perfil e medidas → ok e o %', () => {
    expect(navyEstimate({ heightCm: 180, sex: 'masculino' }, { waistCm: 90, neckCm: 40 })).toEqual({ pct: 18.4, status: 'ok' })
  })

  it('sem altura ou sexo → sem-perfil', () => {
    expect(navyEstimate({ heightCm: null, sex: 'masculino' }, { waistCm: 90, neckCm: 40 })).toEqual({ pct: null, status: 'sem-perfil' })
    expect(navyEstimate({ heightCm: 180, sex: null }, { waistCm: 90, neckCm: 40 })).toEqual({ pct: null, status: 'sem-perfil' })
  })

  it('sem cintura ou pescoço (mulher: sem quadril) → sem-medidas', () => {
    expect(navyEstimate({ heightCm: 180, sex: 'masculino' }, { waistCm: 90 })).toEqual({ pct: null, status: 'sem-medidas' })
    expect(navyEstimate({ heightCm: 165, sex: 'feminino' }, { waistCm: 75, neckCm: 33 })).toEqual({ pct: null, status: 'sem-medidas' })
  })

  it('medidas que não fecham o cálculo → inconsistente', () => {
    expect(navyEstimate({ heightCm: 180, sex: 'masculino' }, { waistCm: 40, neckCm: 41 })).toEqual({ pct: null, status: 'inconsistente' })
  })
})
