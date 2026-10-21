import { describe, it, expect } from 'vitest'
import type { NutritionContext } from '../services/nutrition-context.service'
import { createPhase, endPhase, recalibrateOnCheckin } from '../services/diet-phase.service'
import { fakeSupabase } from './helpers/fake-supabase'

const NOW = new Date('2026-10-13T15:00:00Z')

const C1 = { id: 'c1', user_id: 'u1', month: '2026-09-01', weight_kg: 80, waist_cm: 90, neck_cm: 40, created_at: '2026-09-01T09:00:00Z' }

function ctx(over: Partial<NutritionContext> = {}): NutritionContext {
  return {
    today: '2026-10-13',
    profile: { heightCm: 180, birthDate: '1991-01-10', sex: 'masculino' },
    checkins: [C1 as never],
    phase: null,
    lastCalibration: null,
    tiredness: null,
    daysPerWeek: 4,
    workoutToday: null,
    genetics: { active: false, markers: [], flags: {} as never },
    missing: [],
    ...over,
  }
}

const ACTIVE = {
  id: 'phase-1', user_id: 'u1', goal: 'perder_gordura', started_on: '2026-09-01', duration_weeks: 8, status: 'ativa',
  base_targets: { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }, start_checkin_id: 'c1', created_at: '2026-09-01T10:00:00Z',
}

describe('createPhase (spec 018, US0)', () => {
  it('calcula as metas com o último check-in e grava a fase e a calibração inicial', async () => {
    const { client, db } = fakeSupabase({ diet_phases: [], diet_phase_calibrations: [] })

    const out = await createPhase('u1', client as never, { goal: 'perder_gordura', durationWeeks: 8 }, ctx(), NOW)

    // 80 kg, 180 cm, 35 anos, 4×/semana → mesmas metas do teste do motor
    expect(out).toMatchObject({
      phase: { goal: 'perder_gordura', startedOn: '2026-10-13', durationWeeks: 8, status: 'ativa', baseTargets: { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 } },
      calibration: { action: 'inicial', before: null, after: { kcal: 2180 } },
    })
    expect(db.diet_phases[0]).toMatchObject({ user_id: 'u1', start_checkin_id: 'c1', status: 'ativa' })
    expect(db.diet_phase_calibrations[0]).toMatchObject({ user_id: 'u1', checkin_id: 'c1', action: 'inicial' })
    if ('error' in out) throw new Error('fase não criada')
    expect(out.calibration.metrics).toMatchObject({ weightFromKg: 80, weightToKg: 80, bodyFatPct: 18.4 })
    expect(out.calibration.reason).toMatch(/perder gordura/)
  })

  it('encerra a fase ativa antes de criar a nova', async () => {
    const { client, db } = fakeSupabase({ diet_phases: [{ ...ACTIVE }], diet_phase_calibrations: [] })

    await createPhase('u1', client as never, { goal: 'ganhar_massa', durationWeeks: 12 }, ctx({ phase: { id: 'phase-1' } as never }), NOW)

    expect(db.diet_phases.find((p) => p.id === 'phase-1')).toMatchObject({ status: 'encerrada', ended_at: NOW.toISOString() })
    expect(db.diet_phases.filter((p) => p.status === 'ativa')).toHaveLength(1)
  })

  it('pré-requisito faltando → needs-profile, nada gravado', async () => {
    const { client, calls } = fakeSupabase({})
    const out = await createPhase('u1', client as never, { goal: 'perder_gordura', durationWeeks: 8 }, ctx({ missing: ['sex'] }), NOW)
    expect(out).toEqual({ error: 'needs-profile', missing: ['sex'] })
    expect(calls).toHaveLength(0)
  })
})

describe('endPhase', () => {
  it('encerra a fase ativa e devolve ela', async () => {
    const { client } = fakeSupabase({ diet_phases: [{ ...ACTIVE }] })
    expect(await endPhase('u1', client as never, NOW)).toMatchObject({ id: 'phase-1', status: 'encerrada' })
  })

  it('sem fase ativa → null', async () => {
    const { client } = fakeSupabase({ diet_phases: [] })
    expect(await endPhase('u1', client as never, NOW)).toBeNull()
  })
})

describe('recalibrateOnCheckin (spec 018, FR-015)', () => {
  const C2 = { id: 'c2', user_id: 'u1', month: '2026-10-01', weight_kg: 79.6, waist_cm: 90, neck_cm: 40, created_at: '2026-10-01T09:00:00Z' }
  const withPhase = () => ctx({
    phase: { id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-09-01', durationWeeks: 8, status: 'ativa', baseTargets: ACTIVE.base_targets },
    lastCalibration: { checkinId: 'c1', createdAt: '2026-09-01T10:00:00Z' },
    checkins: [C2 as never, C1 as never],
  })

  it('compara com o check-in da última calibração, grava a calibração e atualiza as metas', async () => {
    const { client, db } = fakeSupabase({ diet_phases: [{ ...ACTIVE }], diet_phase_calibrations: [], body_checkins: [C1, C2] })

    const cal = await recalibrateOnCheckin('u1', client as never, C2 as never, withPhase())

    expect(cal).toMatchObject({ action: 'reduzir', before: { kcal: 2180 }, after: { kcal: 2030 } })
    expect(db.diet_phase_calibrations[0]).toMatchObject({ phase_id: 'phase-1', checkin_id: 'c2', action: 'reduzir' })
    expect(db.diet_phases[0].base_targets).toMatchObject({ kcal: 2030 })
  })

  it('intervalo curto: registra, mas não muda as metas', async () => {
    const early = { ...C2, created_at: '2026-09-08T09:00:00Z' }
    const { client, db } = fakeSupabase({ diet_phases: [{ ...ACTIVE }], diet_phase_calibrations: [], body_checkins: [C1, early] })

    const cal = await recalibrateOnCheckin('u1', client as never, early as never, withPhase())

    expect(cal?.action).toBe('intervalo-curto')
    expect(db.diet_phases[0].base_targets).toEqual(ACTIVE.base_targets)
  })

  it('sem fase ativa, sem peso ou mesmo check-in da última calibração → null', async () => {
    const { client, calls } = fakeSupabase({ diet_phases: [{ ...ACTIVE }], body_checkins: [C1, C2] })
    expect(await recalibrateOnCheckin('u1', client as never, C2 as never, ctx())).toBeNull()
    expect(await recalibrateOnCheckin('u1', client as never, { ...C2, weight_kg: null } as never, withPhase())).toBeNull()
    expect(await recalibrateOnCheckin('u1', client as never, C1 as never, withPhase())).toBeNull()
    expect(calls).toHaveLength(0)
  })
})
