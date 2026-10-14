import { describe, it, expect } from 'vitest'
import { buildDayPlan } from '../day'
import { nutritionFlags } from '../genetics-rules'
import { anchorMealTimes, clock } from '../timing'

const BASE = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
const plan = (dayType: 'treino' | 'descanso' = 'treino') =>
  buildDayPlan({ date: '2026-10-14', dayType, base: BASE, weightKg: 80, flags: nutritionFlags([]), geneticsActive: false, tiredness: null, swaps: [] })
const meal = (p: ReturnType<typeof plan>, slot: string) => p.meals.find((m) => m.slot === slot)!

const STARTED = '2026-10-14T21:00:00.000Z'
const FINISHED = '2026-10-14T22:10:00.000Z'

describe('anchorMealTimes (FR-004, R8)', () => {
  it('sem treino iniciado: pré e pós ficam relativos', () => {
    const p = anchorMealTimes(plan(), { now: '2026-10-14T15:00:00.000Z' })
    expect(meal(p, 'pre-treino').timing).toEqual({ kind: 'relativo', label: '60–90 min antes de treinar' })
    expect(meal(p, 'pos-treino').timing).toEqual({ kind: 'relativo', label: 'Logo após o treino' })
  })

  it('treino em andamento: pós-treino "até 60 min após terminar"', () => {
    const p = anchorMealTimes(plan(), { startedAt: STARTED, now: '2026-10-14T21:30:00.000Z' })
    expect(meal(p, 'pos-treino').timing).toEqual({ kind: 'relativo', label: 'Até 60 min após terminar o treino' })
    expect(meal(p, 'pre-treino').timing.label).toMatch(/já começou/i)
  })

  it('treino concluído: pós-treino com hora no relógio e destaque enquanto a janela está aberta', () => {
    const open = anchorMealTimes(plan(), { startedAt: STARTED, finishedAt: FINISHED, now: '2026-10-14T22:30:00.000Z' })
    const from = clock(FINISHED)
    const to = clock('2026-10-14T23:10:00.000Z')
    expect(meal(open, 'pos-treino').timing).toEqual({ kind: 'relogio', label: `${from}–${to}`, from, to, highlight: true })

    const late = anchorMealTimes(plan(), { finishedAt: FINISHED, now: '2026-10-14T23:30:00.000Z' })
    expect(meal(late, 'pos-treino').timing).toMatchObject({ kind: 'relogio', highlight: false })
  })

  it('não muda o resto do plano nem o dia de descanso', () => {
    const base = plan()
    const anchored = anchorMealTimes(base, { finishedAt: FINISHED, now: FINISHED })
    expect(anchored.meals.filter((m) => m.slot !== 'pre-treino' && m.slot !== 'pos-treino')).toEqual(base.meals.filter((m) => m.slot !== 'pre-treino' && m.slot !== 'pos-treino'))
    const rest = plan('descanso')
    expect(anchorMealTimes(rest, { finishedAt: FINISHED, now: FINISHED })).toEqual(rest)
  })

  it('clock formata HH:MM', () => {
    expect(clock(FINISHED)).toMatch(/^\d{2}:\d{2}$/)
  })
})
