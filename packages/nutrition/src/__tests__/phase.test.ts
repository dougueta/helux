import { describe, it, expect } from 'vitest'
import { phaseTargets, recalibrate } from '../phase'

// Homem, 80 kg, 180 cm, 35 anos, 4 treinos/semana:
// TMB 1755 × 1,55 = GET 2720,25.
const DOUG = { weightKg: 80, heightCm: 180, age: 35, sex: 'masculino' as const, daysPerWeek: 4 }

describe('phaseTargets (R2)', () => {
  it('perder gordura: −20%, proteína 2,2 g/kg, gordura 25% com mínimo 0,8 g/kg, carboidrato no restante', () => {
    // 2720,25 × 0,8 = 2176,2 → 2180 kcal; P 176 g; G max(60,6; 64) = 64 g; C (2180 − 704 − 576)/4 = 225 g
    expect(phaseTargets({ ...DOUG, goal: 'perder_gordura' })).toEqual({ kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 })
  })

  it('ganhar massa: +10%, proteína 1,8 g/kg', () => {
    // 2992,3 → 2990 kcal; P 144 g; G 747,5/9 = 83 g; C (2990 − 576 − 747)/4 = 417 g
    expect(phaseTargets({ ...DOUG, goal: 'ganhar_massa' })).toEqual({ kcal: 2990, proteinG: 144, carbsG: 417, fatG: 83 })
  })

  it('recomposição: −10%, proteína 2,0 g/kg', () => {
    // 2448,2 → 2450 kcal; P 160 g; G 612,5/9 = 68 g; C (2450 − 640 − 612)/4 = 299,5 → 300 g
    expect(phaseTargets({ ...DOUG, goal: 'recomposicao' })).toEqual({ kcal: 2450, proteinG: 160, carbsG: 300, fatG: 68 })
  })

  it('manutenção: GET, proteína 1,8 g/kg', () => {
    expect(phaseTargets({ ...DOUG, goal: 'manutencao' })).toMatchObject({ kcal: 2720, proteinG: 144 })
  })

  it('déficit limitado a 600 kcal', () => {
    // TMB 2342,5 × 1,725 = 4040,8; 20% = 808 > 600 → 3440,8 → 3440
    const big = { weightKg: 130, heightCm: 190, age: 30, sex: 'masculino' as const, daysPerWeek: 6 }
    expect(phaseTargets({ ...big, goal: 'perder_gordura' }).kcal).toBe(3440)
  })

  it('piso de calorias: nunca abaixo de max(TMB, 1200)', () => {
    // TMB 926,5 × 1,375 = 1273,9; −20% = 1019 → piso 1200
    const small = { weightKg: 45, heightCm: 150, age: 60, sex: 'feminino' as const, daysPerWeek: null }
    expect(phaseTargets({ ...small, goal: 'perder_gordura' })).toEqual({ kcal: 1200, proteinG: 99, carbsG: 120, fatG: 36 })
  })

  it('macros somam as calorias da meta (±5 kcal de arredondamento)', () => {
    for (const goal of ['perder_gordura', 'ganhar_massa', 'recomposicao', 'manutencao'] as const) {
      const t = phaseTargets({ ...DOUG, goal })
      expect(Math.abs(4 * t.proteinG + 4 * t.carbsG + 9 * t.fatG - t.kcal), goal).toBeLessThanOrEqual(5)
    }
  })
})

describe('recalibrate (R4)', () => {
  const PROFILE = { heightCm: 180, age: 35, sex: 'masculino' as const, daysPerWeek: 4 }
  const CUT = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
  const FROM = { weightKg: 80, waistCm: 90, at: '2026-09-01T09:00:00Z' }
  // 30 dias = 4,29 semanas
  const at = '2026-10-01T09:00:00Z'

  it('perdendo mais devagar que o esperado (−0,12%/sem) → reduz 150 kcal no carboidrato, proteína pelo peso novo', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 79.6, waistCm: 90, at }, profile: PROFILE })
    expect(r.action).toBe('reduzir')
    // 2030 kcal; P 2,2 × 79,6 = 175; G max(56,4; 63,7) = 64; C (2030 − 700 − 576)/4 = 188,5 → 189
    expect(r.after).toEqual({ kcal: 2030, proteinG: 175, carbsG: 189, fatG: 64 })
    expect(r.metrics).toEqual({ weeks: 4.3, weightFromKg: 80, weightToKg: 79.6, weeklyRatePct: -0.12, waistDeltaCm: 0 })
    expect(r.reason).toMatch(/−150 kcal/)
  })

  it('peso parado mas cintura ≥ 1 cm menor → mantém (recomposição em curso)', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 79.6, waistCm: 88.5, at }, profile: PROFILE })
    expect(r.action).toBe('manter')
    expect(r.after.kcal).toBe(2180)
    expect(r.reason).toMatch(/recomposição/i)
  })

  it('perdendo rápido demais (−1,17%/sem) → aumenta 150 kcal', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 76, at }, profile: PROFILE })
    expect(r).toMatchObject({ action: 'aumentar', after: { kcal: 2330 } })
  })

  it('dentro da faixa (−0,35%/sem) → mantém', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 78.5, at }, profile: PROFILE })
    expect(r).toMatchObject({ action: 'manter', after: { kcal: 2180 } })
  })

  it('menos de 2 semanas → intervalo curto, metas iguais', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 79, at: '2026-09-11T09:00:00Z' }, profile: PROFILE })
    expect(r.action).toBe('intervalo-curto')
    expect(r.after).toEqual(CUT)
  })

  it('ganhar massa ganhando pouco → aumenta; com cintura subindo > 2 cm → não aumenta', () => {
    const BULK = { kcal: 2990, proteinG: 144, carbsG: 417, fatG: 83 }
    expect(recalibrate({ goal: 'ganhar_massa', current: BULK, from: FROM, to: { weightKg: 80.1, waistCm: 90.5, at }, profile: PROFILE })).toMatchObject({ action: 'aumentar', after: { kcal: 3140 } })
    expect(recalibrate({ goal: 'ganhar_massa', current: BULK, from: FROM, to: { weightKg: 80.1, waistCm: 92.5, at }, profile: PROFILE }).action).toBe('manter')
  })

  it('ganhar massa rápido demais (+0,58%/sem) → reduz', () => {
    const BULK = { kcal: 2990, proteinG: 144, carbsG: 417, fatG: 83 }
    expect(recalibrate({ goal: 'ganhar_massa', current: BULK, from: FROM, to: { weightKg: 82, at }, profile: PROFILE }).action).toBe('reduzir')
  })

  it('manutenção ganhando peso (+0,35%/sem) → reduz', () => {
    const KEEP = { kcal: 2720, proteinG: 144, carbsG: 437, fatG: 76 }
    expect(recalibrate({ goal: 'manutencao', current: KEEP, from: FROM, to: { weightKg: 81.2, at }, profile: PROFILE }).action).toBe('reduzir')
  })

  it('não desce abaixo do piso: no piso, reduzir vira manter', () => {
    const SMALL = { heightCm: 150, age: 60, sex: 'feminino' as const, daysPerWeek: null }
    const r = recalibrate({ goal: 'perder_gordura', current: { kcal: 1200, proteinG: 99, carbsG: 120, fatG: 36 }, from: { weightKg: 45, at: FROM.at }, to: { weightKg: 45, at }, profile: SMALL })
    expect(r.action).toBe('manter')
    expect(r.after.kcal).toBe(1200)
    expect(r.reason).toMatch(/piso/i)
  })

  it('registra o % de gordura quando houver', () => {
    const r = recalibrate({ goal: 'perder_gordura', current: CUT, from: FROM, to: { weightKg: 78.5, at, bodyFatPct: 17.2 }, profile: PROFILE })
    expect(r.metrics.bodyFatPct).toBe(17.2)
    expect(r.metrics.waistDeltaCm).toBeUndefined()
  })
})
