import { describe, it, expect } from 'vitest'
import type { MesocycleSession } from '@helux/types'
import { analyzeCycle, type CycleAnalysisInput } from '../cycle-analysis'

// Spec 024 T100 — análise do ciclo concluído (R11): números e achados reproduzíveis.

const strength = (week: number, done = true): MesocycleSession => ({ letter: 'A', focus: 'Pernas', week, kind: 'forca', completedAt: done ? `2026-09-0${week}T20:00:00Z` : null, exercises: [] })
const cardio = (week: number, done: boolean): MesocycleSession => ({ letter: 'B', focus: 'Cardio', week, kind: 'cardio', completedAt: done ? `2026-09-0${week}T20:00:00Z` : null, exercises: [] })
const sets = (weight: number, reps: number, effort: number, n = 3) => Array.from({ length: n }, () => ({ weight, reps, effort }))
const workout = (id: string, date: string, exercises: CycleAnalysisInput['workouts'][number]['exercises'], duration_s = 3600) => ({ id, date, duration_s, review_status: null, exercises })

function input(over: Partial<CycleAnalysisInput> = {}): CycleAnalysisInput {
  return {
    mesocycleId: 'm1',
    startDate: '2026-09-01',
    sessions: [strength(1), strength(2), strength(3), strength(4), cardio(1, true), cardio(2, false), cardio(3, false), cardio(4, false)],
    workouts: [
      workout('w1', '2026-09-01', [{ name: 'Agachamento Livre (Barra)', sets: sets(100, 8, 8) }, { name: 'Leg Press 45°', sets: sets(200, 10, 7) }, { name: 'Supino Reto (Barra)', sets: sets(60, 10, 7) }]),
      workout('w2', '2026-09-09', [{ name: 'Agachamento Livre (Barra)', sets: sets(100, 8, 9) }, { name: 'Leg Press 45°', sets: sets(200, 10, 7) }]),
      workout('w3', '2026-09-17', [{ name: 'Agachamento Livre (Barra)', sets: sets(101, 8, 9) }, { name: 'Supino Reto (Barra)', sets: sets(70, 10, 7) }]),
      // Sessão de teste: fica fora.
      workout('teste', '2026-09-18', [{ name: 'Agachamento Livre (Barra)', sets: sets(200, 8, 5, 1) }], 120),
    ],
    checkins: [
      { phase: 'depois', date: '2026-09-01', rpe: 7, pains: [] },
      { phase: 'depois', date: '2026-09-09', rpe: 9, pains: [{ region: 'joelho', intensity: 2, exercise: 'Leg Press 45°' }] },
      { phase: 'antes', date: '2026-09-17', pains: [{ region: 'joelho', intensity: 1, exercise: 'Leg Press 45°' }] },
    ],
    tiredness: ['cansado', 'exausto', 'cansado'],
    trend: null,
    ...over,
  }
}

describe('analyzeCycle', () => {
  it('aderência por tipo de sessão', () => {
    const s = analyzeCycle(input())
    expect(s.mesocycleId).toBe('m1')
    expect(s.weeks).toBe(4)
    expect(s.adherence.forca).toEqual({ done: 4, planned: 4 })
    expect(s.adherence.cardio).toEqual({ done: 1, planned: 4 })
    expect(s.adherence.mobilidade).toEqual({ done: 0, planned: 0 })
  })

  it('e1RM inicial e final por exercício, sem a sessão suspeita', () => {
    const squat = analyzeCycle(input()).exercises.find(e => e.name === 'Agachamento Livre (Barra)')!
    // Epley: 100 × (1 + 8/30) = 126,7; 101 → 127,9.
    expect(squat.firstE1rm).toBeCloseTo(126.7, 1)
    expect(squat.lastE1rm).toBeCloseTo(127.9, 1)
    expect(squat.avgRpe).toBeCloseTo(8.7, 1)
  })

  it('RPE médio por semana (check-in de depois; sem check-in, o esforço das séries)', () => {
    expect(analyzeCycle(input()).avgRpeByWeek).toEqual([7, 9, 8, 0])
  })

  it('dores por região e por exercício; cansaço médio', () => {
    const s = analyzeCycle(input())
    expect(s.pains).toEqual([{ region: 'joelho', count: 2 }])
    expect(s.exercises.find(e => e.name === 'Leg Press 45°')!.painReports).toBe(2)
    expect(s.tirednessAvg).toBeCloseTo(3.3, 1)
  })

  it('achados: estagnação, dor recorrente, baixa aderência, progresso e cansaço alto', () => {
    const kinds = analyzeCycle(input()).findings.map(f => `${f.kind}:${f.subject}`)
    expect(kinds).toEqual(
      expect.arrayContaining(['estagnacao:Agachamento Livre (Barra)', 'dor-recorrente:Leg Press 45°', 'baixa-aderencia:cardio', 'progresso:Supino Reto (Barra)', 'cansaco-alto:cansaço']),
    )
    expect(kinds).not.toContain('estagnacao:Supino Reto (Barra)')
  })

  it('cada achado traz a evidência em números', () => {
    const stall = analyzeCycle(input()).findings.find(f => f.kind === 'estagnacao')!
    expect(stall.evidence).toMatch(/1RM estimado/)
  })

  it('dados que faltaram ficam listados', () => {
    const s = analyzeCycle(input({ checkins: [], tiredness: [] }))
    expect(s.missingData).toEqual(expect.arrayContaining(['check-ins de depois do treino', 'cansaço do dia', 'check-in corporal do mês']))
    expect(s.tirednessAvg).toBeNull()
  })
})
