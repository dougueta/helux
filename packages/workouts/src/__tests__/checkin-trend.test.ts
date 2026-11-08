import { describe, it, expect } from 'vitest'
import type { BodySnapshot } from '@helux/types'
import { checkinTrend, parseGoalTarget } from '../checkin-trend'

// Spec 024 T099 — tendência entre check-ins corporais e o que ela muda no método (R10).

// Spec 029: compara fotos do corpo (registro de medidas + peso de referência) por data.
const ck = (month: string, over: Partial<BodySnapshot> = {}): BodySnapshot => ({ date: `${month}-01`, ...over })

describe('checkinTrend', () => {
  it('deltas por mês entre dois check-ins', () => {
    const t = checkinTrend(ck('2026-08', { weight_kg: 90, waist_cm: 100, squat_kg: 100 }), ck('2026-10', { weight_kg: 88, waist_cm: 97, squat_kg: 110 }), 'emagrecimento')
    expect(t.from).toBe('2026-08-01')
    expect(t.to).toBe('2026-10-01')
    expect(t.deltas).toEqual({ weight_kg: -1, waist_cm: -1.5, squat_kg: 5 })
    expect(t.implausible).toEqual([])
  })

  it('variação implausível (peso > 6 kg/mês) fica marcada e não gera modificador', () => {
    const t = checkinTrend(ck('2026-09', { weight_kg: 90, waist_cm: 100 }), ck('2026-10', { weight_kg: 98, waist_cm: 100 }), 'emagrecimento')
    expect(t.implausible).toEqual(['weight_kg'])
    // Cintura estável sozinha ainda conta para o emagrecimento.
    expect(t.methodModifiers.map(m => m.cardioSessionsDelta)).toEqual([1])
  })

  it('emagrecimento com peso e cintura estáveis → +1 cardio', () => {
    const t = checkinTrend(ck('2026-09', { weight_kg: 90, waist_cm: 100 }), ck('2026-10', { weight_kg: 90.1, waist_cm: 100 }), 'emagrecimento')
    expect(t.methodModifiers).toEqual([expect.objectContaining({ source: 'checkin', cardioSessionsDelta: 1 })])
    expect(t.modifiers[0]).toMatch(/cardio/i)
  })

  it('emagrecimento caindo bem → nada muda', () => {
    const t = checkinTrend(ck('2026-09', { weight_kg: 90, waist_cm: 100 }), ck('2026-10', { weight_kg: 89, waist_cm: 98 }), 'emagrecimento')
    expect(t.methodModifiers).toEqual([])
  })

  it('hipertrofia com peso caindo e cargas paradas → volume no piso e revisar nutrição', () => {
    const t = checkinTrend(ck('2026-09', { weight_kg: 80, bench_kg: 80, squat_kg: 100 }), ck('2026-10', { weight_kg: 79, bench_kg: 80, squat_kg: 100 }), 'hipertrofia')
    expect(t.methodModifiers).toEqual([expect.objectContaining({ volumeFactor: 0.85 })])
    expect(t.modifiers[0]).toMatch(/nutri/i)
  })

  it('força com cargas de referência paradas → troca de variação nos básicos', () => {
    const t = checkinTrend(ck('2026-09', { squat_kg: 140, deadlift_kg: 180 }), ck('2026-10', { squat_kg: 140, deadlift_kg: 180.5 }), 'forca')
    expect(t.modifiers[0]).toMatch(/variação/i)
  })

  it('meta atingida → sugere novo objetivo (sem aplicar)', () => {
    const t = checkinTrend(ck('2026-09', { weight_kg: 82 }), ck('2026-10', { weight_kg: 79.5 }), 'emagrecimento', parseGoalTarget('chegar a 80 kg'))
    expect(t.suggestGoalChange).toBe('hipertrofia')
    expect(t.methodModifiers).toEqual([])
  })

  it('meses entre datas = dias / 30,4 (mínimo 1)', () => {
    const t = checkinTrend({ date: '2026-09-01', weight_kg: 90 }, { date: '2026-09-11', weight_kg: 89.5 }, 'hipertrofia')
    expect(t.deltas.weight_kg).toBe(-0.5)
    const t2 = checkinTrend({ date: '2026-09-01', weight_kg: 90 }, { date: '2026-10-31', weight_kg: 88 }, 'hipertrofia')
    expect(t2.deltas.weight_kg).toBe(-1)
  })

  it('% de gordura de origens diferentes não gera delta (FR-012)', () => {
    const t = checkinTrend(
      ck('2026-09', { body_fat_pct: 20, body_fat_source: 'navy' }),
      ck('2026-10', { body_fat_pct: 16, body_fat_source: 'bioimpedancia' }),
      'emagrecimento',
    )
    expect(t.deltas).not.toHaveProperty('body_fat_pct')
  })

  it('% de gordura da mesma origem gera delta', () => {
    const t = checkinTrend(
      ck('2026-09', { body_fat_pct: 20, body_fat_source: 'navy' }),
      ck('2026-10', { body_fat_pct: 19, body_fat_source: 'navy' }),
      'emagrecimento',
    )
    expect(t.deltas.body_fat_pct).toBe(-1)
  })

  it('parseGoalTarget lê peso e cintura do texto da meta', () => {
    expect(parseGoalTarget('80 kg e cintura de 90 cm')).toEqual({ weightKg: 80, waistCm: 90 })
    expect(parseGoalTarget('entrar em forma')).toBeNull()
    expect(parseGoalTarget(null)).toBeNull()
  })
})
