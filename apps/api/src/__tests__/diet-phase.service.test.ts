import { describe, it, expect } from 'vitest'
import type { NutritionContext } from '../services/nutrition-context.service'
import { applyRecalibration, createPhase, endPhase, evaluateRecalibration } from '../services/diet-phase.service'
import { fakeSupabase } from './helpers/fake-supabase'

const NOW = new Date('2026-10-13T15:00:00Z')

// Spec 029: peso pelas pesagens (tendência) e % pelo registro de medidas.
const M1 = { id: 'c1', user_id: 'u1', measured_on: '2026-08-31', waist_cm: 90, neck_cm: 40, body_fat_navy_pct: 18.4, created_at: '2026-08-31T09:00:00Z' }
const w = (date: string, weight_kg: number) => ({ id: date, date, weight_kg })

function ctx(over: Partial<NutritionContext> = {}): NutritionContext {
  return {
    today: '2026-10-13',
    profile: { heightCm: 180, birthDate: '1991-01-10', sex: 'masculino' },
    weights: [w('2026-10-11', 80), w('2026-10-12', 80), w('2026-10-13', 80)],
    measurements: [M1 as never],
    currentWeightKg: 80,
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

describe('createPhase (spec 018, US0 + spec 029)', () => {
  it('calcula as metas com o peso atual (tendência) e grava a fase e a calibração inicial', async () => {
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

  it('sem registro de medidas: fase criada sem % e sem start_checkin_id', async () => {
    const { client, db } = fakeSupabase({ diet_phases: [], diet_phase_calibrations: [] })
    const out = await createPhase('u1', client as never, { goal: 'perder_gordura', durationWeeks: 8 }, ctx({ measurements: [] }), NOW)
    expect(db.diet_phases[0]).toMatchObject({ start_checkin_id: null })
    if ('error' in out) throw new Error('fase não criada')
    expect(out.calibration.metrics).not.toHaveProperty('bodyFatPct')
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

describe('recalibração sob demanda (spec 029, US3)', () => {
  const PHASE = { id: 'phase-1', goal: 'perder_gordura' as const, startedOn: '2026-09-01', durationWeeks: 8, status: 'ativa' as const, baseTargets: ACTIVE.base_targets }
  const M2 = { id: 'c2', user_id: 'u1', measured_on: '2026-09-30', waist_cm: 90, neck_cm: 40, body_fat_navy_pct: 18.4, created_at: '2026-09-30T09:00:00Z' }
  const START = [w('2026-08-29', 80), w('2026-08-30', 80), w('2026-08-31', 80), w('2026-09-01', 80)]
  const END = [w('2026-09-29', 79.6), w('2026-09-30', 79.6), w('2026-10-01', 79.6)]
  const withPhase = (over: Partial<NutritionContext> = {}) =>
    ctx({
      today: '2026-10-01',
      phase: PHASE,
      lastCalibration: { checkinId: 'c1', createdAt: '2026-09-01T10:00:00Z' },
      weights: [...START, ...END],
      measurements: [M2 as never, M1 as never],
      ...over,
    })

  it('sem fase → indisponivel; perfil incompleto → indisponivel com o que falta', () => {
    expect(evaluateRecalibration(ctx())).toEqual({ status: 'indisponivel', missing: ['sem-fase'] })
    expect(evaluateRecalibration(withPhase({ profile: { heightCm: null, birthDate: '1991-01-10', sex: 'masculino' } }))).toEqual({ status: 'indisponivel', missing: ['heightCm'] })
  })

  it('menos de 2 semanas desde a última calibração → intervalo-curto com a data em que poderá recalibrar', () => {
    expect(evaluateRecalibration(withPhase({ today: '2026-09-10' }))).toEqual({ status: 'intervalo-curto', availableOn: '2026-09-15' })
  })

  it('sem calibração anterior, a base é o início da fase', () => {
    expect(evaluateRecalibration(withPhase({ today: '2026-09-10', lastCalibration: null }))).toEqual({ status: 'intervalo-curto', availableOn: '2026-09-15' })
  })

  it('sem tendência numa das pontas → faltam-pesagens, dizendo qual', () => {
    expect(evaluateRecalibration(withPhase({ weights: END }))).toEqual({ status: 'faltam-pesagens', at: ['inicio'] })
    expect(evaluateRecalibration(withPhase({ weights: START }))).toEqual({ status: 'faltam-pesagens', at: ['atual'] })
  })

  it('proposta pelos pesos de tendência nas duas pontas, com a cintura de cada lado', () => {
    const ev = evaluateRecalibration(withPhase())
    expect(ev).toMatchObject({
      status: 'proposta',
      action: 'reduzir',
      before: { kcal: 2180 },
      after: { kcal: 2030 },
      metrics: {
        weightFromKg: 80,
        weightToKg: 79.6,
        weeklyRatePct: -0.12,
        waistDeltaCm: 0,
        bodyFatPct: 18.4,
        trendFrom: { date: '2026-09-01', weightKg: 80 },
        trendTo: { date: '2026-10-01', weightKg: 79.6 },
      },
    })
    if (ev.status === 'proposta') expect(ev.reason).toMatch(/^Peso de tendência/)
  })

  it('pesagens oscilando até ±2 kg em torno de um peso estável → manter (SC-002)', () => {
    // período de 7 dias: toda janela de 7 dias tem a mesma média (80 kg)
    const cycle = [78, 82, 80, 81, 79, 82, 78]
    const weights = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 7, 28 + i)).toISOString().slice(0, 10)
      return w(d, cycle[i % 7])
    })
    const ev = evaluateRecalibration(withPhase({ weights, phase: { ...PHASE, goal: 'manutencao' } }))
    expect(ev).toMatchObject({ status: 'proposta', action: 'manter', after: { kcal: 2180 } })
  })

  it('aplicar grava a calibração com as tendências e atualiza as metas', async () => {
    const { client, db } = fakeSupabase({ diet_phases: [{ ...ACTIVE }], diet_phase_calibrations: [] })
    const out = await applyRecalibration('u1', client as never, withPhase())
    expect(out).toMatchObject({ calibration: { action: 'reduzir', before: { kcal: 2180 }, after: { kcal: 2030 } } })
    expect(db.diet_phase_calibrations[0]).toMatchObject({
      phase_id: 'phase-1',
      checkin_id: 'c2',
      action: 'reduzir',
      metrics: { trendFrom: { weightKg: 80 }, trendTo: { weightKg: 79.6 } },
    })
    expect(db.diet_phases[0].base_targets).toMatchObject({ kcal: 2030 })
  })

  it('aplicar "manter" também grava (reinicia a janela de 2 semanas) sem mudar as calorias', async () => {
    const flat = [...START, w('2026-09-29', 80), w('2026-09-30', 80), w('2026-10-01', 80)]
    const { client, db } = fakeSupabase({ diet_phases: [{ ...ACTIVE, goal: 'manutencao' }], diet_phase_calibrations: [] })
    const out = await applyRecalibration('u1', client as never, withPhase({ weights: flat, phase: { ...PHASE, goal: 'manutencao' } }))
    expect(out).toMatchObject({ calibration: { action: 'manter' } })
    expect(db.diet_phase_calibrations).toHaveLength(1)
    expect(db.diet_phases[0].base_targets).toMatchObject({ kcal: 2180 })
  })

  it('aplicar fora de proposta não grava nada e devolve a avaliação', async () => {
    const { client, calls } = fakeSupabase({ diet_phases: [{ ...ACTIVE }] })
    const out = await applyRecalibration('u1', client as never, withPhase({ today: '2026-09-10' }))
    expect(out).toEqual({ evaluation: { status: 'intervalo-curto', availableOn: '2026-09-15' } })
    expect(calls).toHaveLength(0)
  })
})
