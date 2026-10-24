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
    body_checkins: [
      { id: 'b1', user_id: 'u1', month: '2026-08', weight_kg: 90, waist_cm: 100, created_at: '2026-08-01' },
      { id: 'b2', user_id: 'u1', month: '2026-09', weight_kg: 90, waist_cm: 100, created_at: '2026-09-01' },
    ],
    cycle_analyses: [],
  })
}

describe('cycle-analysis.service (024)', () => {
  it('analisa só os dados do ciclo e do usuário, grava e devolve a tendência', async () => {
    const fake = db()
    const { summary, trend } = await runCycleAnalysis('u1', fake.client as never, PREVIOUS, 'emagrecimento', null)
    expect(summary.mesocycleId).toBe('m1')
    expect(summary.adherence.cardio).toEqual({ done: 0, planned: 2 })
    expect(summary.exercises.map(e => e.name)).toEqual(['Agachamento Livre (Barra)'])
    expect(summary.findings.map(f => f.kind)).toEqual(expect.arrayContaining(['estagnacao', 'baixa-aderencia', 'cansaco-alto']))
    expect(trend?.methodModifiers.map(m => m.cardioSessionsDelta)).toEqual([1])
    expect(summary.checkinTrend).not.toHaveProperty('methodModifiers')
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
