import { describe, it, expect } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'
import { getCycleAnalysis, linkNextMesocycle, runCycleAnalysis } from '../services/cycle-analysis.service'

// Spec 024 T103 — análise do ciclo concluído: lê os dados do ciclo, grava e liga ao próximo.

const sets = (weight: number, n = 3) => Array.from({ length: n }, () => ({ weight, reps: 8, effort: 9 }))
const PREVIOUS = {
  id: 'm1',
  generated_at: '2026-09-01T10:00:00Z',
  sessions: [
    { letter: 'A', focus: 'Pernas', week: 1, kind: 'forca' as const, completedAt: '2026-09-01T20:00:00Z', exercises: [] },
    { letter: 'B', focus: 'Cardio', week: 1, kind: 'cardio' as const, completedAt: null, exercises: [] },
    { letter: 'A', focus: 'Pernas', week: 2, kind: 'forca' as const, completedAt: '2026-09-09T20:00:00Z', exercises: [] },
    { letter: 'B', focus: 'Cardio', week: 2, kind: 'cardio' as const, completedAt: null, exercises: [] },
  ],
}

function db() {
  return fakeSupabase({
    workout_sessions: [
      { id: 'w1', user_id: 'u1', date: '2026-09-01', duration_s: 3600, review_status: null, exercises: [{ name: 'Agachamento Livre (Barra)', sets: sets(100) }] },
      { id: 'w2', user_id: 'u1', date: '2026-09-09', duration_s: 3600, review_status: null, exercises: [{ name: 'Agachamento Livre (Barra)', sets: sets(100) }] },
      { id: 'antigo', user_id: 'u1', date: '2026-08-20', duration_s: 3600, review_status: null, exercises: [{ name: 'Agachamento Livre (Barra)', sets: sets(60) }] },
      { id: 'outro', user_id: 'u2', date: '2026-09-02', duration_s: 3600, review_status: null, exercises: [{ name: 'Supino', sets: sets(50) }] },
    ],
    session_checkins: [{ id: 'c1', user_id: 'u1', date: '2026-09-09', phase: 'depois', rpe: 9, pains: [] }],
    daily_tiredness_signals: [{ user_id: 'u1', date: '2026-09-05', level: 'exausto' }],
    // Spec 029: dois registros de medidas + pesagens em volta de cada um.
    body_checkins: [
      { id: 'b1', user_id: 'u1', measured_on: '2026-08-01', waist_cm: 100, created_at: '2026-08-01T09:00:00Z' },
      { id: 'b2', user_id: 'u1', measured_on: '2026-09-01', waist_cm: 100, created_at: '2026-09-01T09:00:00Z' },
      { id: 'bx', user_id: 'u2', measured_on: '2026-09-05', waist_cm: 70, created_at: '2026-09-05T09:00:00Z' },
    ],
    body_weights: [
      { id: 'p1', user_id: 'u1', date: '2026-07-30', weight_kg: 90 },
      { id: 'p2', user_id: 'u1', date: '2026-07-31', weight_kg: 90 },
      { id: 'p3', user_id: 'u1', date: '2026-08-01', weight_kg: 90 },
      { id: 'p4', user_id: 'u1', date: '2026-08-31', weight_kg: '90.1' },
    ],
    cycle_analyses: [],
    complementary_routine_logs: [
      { id: 'r1', user_id: 'u1', category: 'alongamento-mobilidade', performed_on: '2026-09-02', duration_minutes: 10, items: [] },
      { id: 'r2', user_id: 'u1', category: 'cardio', performed_on: '2026-09-03', duration_minutes: 25, items: [] },
    ],
  })
}

describe('cycle-analysis.service (024)', () => {
  it('analisa só os dados do ciclo e do usuário, grava e devolve a tendência', async () => {
    const fake = db()
    const { summary, trend } = await runCycleAnalysis('u1', fake.client as never, PREVIOUS, 'emagrecimento', null)
    expect(summary.mesocycleId).toBe('m1')
    expect(summary.adherence.cardio).toEqual({ done: 0, planned: 2 })
    expect(summary.complementaryAdherence?.['alongamento-mobilidade'].done).toBe(1)
    expect(summary.complementaryAdherence?.cardio.done).toBe(1)
    expect(summary.exercises.map(e => e.name)).toEqual(['Agachamento Livre (Barra)'])
    expect(summary.findings.map(f => f.kind)).toEqual(expect.arrayContaining(['estagnacao', 'baixa-aderencia', 'cansaco-alto']))
    expect(trend?.methodModifiers.map(m => m.cardioSessionsDelta)).toEqual([1])
    expect(summary.checkinTrend).not.toHaveProperty('methodModifiers')
    // compara os dois registros por data, com o peso de referência de cada lado
    expect(trend).toMatchObject({ from: '2026-08-01', to: '2026-09-01', deltas: { weight_kg: 0.1, waist_cm: 0 } })
    expect(fake.db.cycle_analyses).toEqual([expect.objectContaining({ user_id: 'u1', mesocycle_id: 'm1', next_mesocycle_id: null })])
  })

  it('rodar de novo substitui a análise do mesmo ciclo', async () => {
    const fake = db()
    await runCycleAnalysis('u1', fake.client as never, PREVIOUS, 'emagrecimento', null)
    await runCycleAnalysis('u1', fake.client as never, PREVIOUS, 'emagrecimento', null)
    expect(fake.db.cycle_analyses).toHaveLength(1)
  })

  it('liga ao próximo mesociclo e lê de volta', async () => {
    const fake = db()
    await runCycleAnalysis('u1', fake.client as never, PREVIOUS, 'emagrecimento', null)
    await linkNextMesocycle('u1', fake.client as never, 'm1', 'm2')
    expect(fake.db.cycle_analyses[0].next_mesocycle_id).toBe('m2')
    expect((await getCycleAnalysis('u1', fake.client as never, 'm2'))?.mesocycleId).toBe('m1')
    expect((await getCycleAnalysis('u1', fake.client as never, 'm1'))?.mesocycleId).toBe('m1')
    expect(await getCycleAnalysis('u2', fake.client as never, 'm1')).toBeNull()
  })
})
