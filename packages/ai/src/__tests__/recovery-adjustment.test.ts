import { describe, it, expect } from 'vitest'
import type { MesocycleSession, RecoveryData } from '@helux/types'
import { applyRecoveryAdjustment } from '../recovery-adjustment'

const BASE_SESSION: MesocycleSession = {
  letter: 'B',
  focus: 'Costas + Bíceps',
  completedAt: null,
  exercises: [
    { name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '60kg' },
    { name: 'Puxada Alta', sets: 3, reps: '10-12', weight: '50kg' },
  ],
}

function recoveryWithHrv(hrv: number): RecoveryData[] {
  return [{ date: '2026-07-21', hrv, restingHR: 58, activeCalories: 300, source: 'healthkit' }]
}

describe('applyRecoveryAdjustment', () => {
  it('HRV >= 60 (boa recuperação): não aplica ajuste', () => {
    const result = applyRecoveryAdjustment(BASE_SESSION, recoveryWithHrv(65))

    expect(result.adjusted).toBe(false)
    expect(result.adjustmentReason).toBeUndefined()
    expect(result.exercises[0].sets).toBe(4)
    expect(result.exercises[1].sets).toBe(3)
  })

  it('HRV 40-59 (moderada): reduz 1 série por exercício, respeitando o mínimo de 2', () => {
    const result = applyRecoveryAdjustment(BASE_SESSION, recoveryWithHrv(52))

    expect(result.adjusted).toBe(true)
    expect(result.adjustmentReason).toMatch(/HRV moderado/i)
    expect(result.exercises[0].sets).toBe(3)
    expect(result.exercises[1].sets).toBe(2)
  })

  it('HRV < 40 (comprometida): reduz série (mínimo 2) e anota redução de carga', () => {
    const result = applyRecoveryAdjustment(BASE_SESSION, recoveryWithHrv(30))

    expect(result.adjusted).toBe(true)
    expect(result.adjustmentReason).toMatch(/HRV/i)
    expect(result.exercises[0].sets).toBe(3)
    expect(result.exercises[0].notes ?? '').toMatch(/carga/i)
  })

  it('nunca reduz série abaixo de 2, mesmo com HRV muito baixo e sets originais baixos', () => {
    const lowSetSession: MesocycleSession = {
      ...BASE_SESSION,
      exercises: [{ name: 'Face Pull', sets: 2, reps: '15', weight: '15kg' }],
    }
    const result = applyRecoveryAdjustment(lowSetSession, recoveryWithHrv(25))

    expect(result.exercises[0].sets).toBe(2)
  })

  it('sem dado de HRV disponível: não aplica ajuste', () => {
    const result = applyRecoveryAdjustment(BASE_SESSION, [])

    expect(result.adjusted).toBe(false)
    expect(result.adjustmentReason).toBeUndefined()
    expect(result.exercises[0].sets).toBe(4)
  })

  it('não muta a sessão original', () => {
    applyRecoveryAdjustment(BASE_SESSION, recoveryWithHrv(30))

    expect(BASE_SESSION.exercises[0].sets).toBe(4)
  })
})
