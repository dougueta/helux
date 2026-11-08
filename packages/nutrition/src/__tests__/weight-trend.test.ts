import { describe, expect, it } from 'vitest'
import type { BodyMeasurement, BodyWeight } from '@helux/types'
import {
  bodyComposition,
  bodySnapshot,
  effectiveBodyFat,
  measurementsDue,
  needsConfirmation,
  referenceWeight,
  trendAt,
  trendSeries,
  waistHeightRatio,
  weeklyChange,
} from '../weight-trend'

const w = (date: string, weight_kg: number): BodyWeight => ({ id: date, date, weight_kg })
const m = (measured_on: string, extra: Partial<BodyMeasurement> = {}): BodyMeasurement => ({
  id: `${measured_on}-${extra.created_at ?? ''}`,
  measured_on,
  created_at: `${measured_on}T10:00:00Z`,
  ...extra,
})

describe('trendAt (FR-003)', () => {
  it('menos de 3 pesagens na janela → null', () => {
    expect(trendAt([w('2026-11-01', 80), w('2026-11-02', 81)], '2026-11-02')).toBeNull()
  })

  it('3 pesagens → média', () => {
    expect(trendAt([w('2026-11-01', 80), w('2026-11-02', 81), w('2026-11-03', 82)], '2026-11-03')).toBe(81)
  })

  it('janela de 7 dias corridos [d−6, d]: fora dela não entra', () => {
    const weights = [w('2026-10-26', 90), w('2026-10-27', 80), w('2026-10-30', 81), w('2026-11-02', 82)]
    // 2026-11-02 − 6 = 2026-10-27 → entram 80, 81, 82
    expect(trendAt(weights, '2026-11-02')).toBe(81)
  })

  it('pesagens depois da data não entram', () => {
    const weights = [w('2026-11-01', 80), w('2026-11-02', 80), w('2026-11-03', 80), w('2026-11-04', 90)]
    expect(trendAt(weights, '2026-11-03')).toBe(80)
  })

  it('arredonda a 0,01 kg', () => {
    expect(trendAt([w('2026-11-01', 80), w('2026-11-02', 80), w('2026-11-03', 80.1)], '2026-11-03')).toBe(80.03)
  })
})

describe('trendSeries', () => {
  it('um ponto por pesagem, em ordem, com null onde não há tendência', () => {
    const series = trendSeries([w('2026-11-03', 82), w('2026-11-01', 80), w('2026-11-02', 81)])
    expect(series).toEqual([
      { date: '2026-11-01', weightKg: 80, trendKg: null },
      { date: '2026-11-02', weightKg: 81, trendKg: null },
      { date: '2026-11-03', weightKg: 82, trendKg: 81 },
    ])
  })

  it('gap longo: a tendência recomeça (null) depois do vazio', () => {
    const series = trendSeries([w('2026-10-01', 80), w('2026-10-02', 80), w('2026-10-03', 80), w('2026-10-25', 79)])
    expect(series[3].trendKg).toBeNull()
  })
})

describe('weeklyChange (FR-004)', () => {
  const weights = [
    w('2026-10-26', 82), w('2026-10-27', 82), w('2026-10-28', 82),
    w('2026-11-02', 81), w('2026-11-03', 81), w('2026-11-04', 81),
  ]

  it('tendência de hoje − tendência de 7 dias atrás, em kg e %', () => {
    expect(weeklyChange(weights, '2026-11-04')).toEqual({ kg: -1, pct: -1.2 })
  })

  it('sem tendência em uma das pontas → null', () => {
    expect(weeklyChange(weights.slice(3), '2026-11-04')).toBeNull()
  })
})

describe('referenceWeight (FR-016)', () => {
  it('usa a tendência quando existe', () => {
    expect(referenceWeight([w('2026-11-01', 80), w('2026-11-02', 81), w('2026-11-03', 82)], '2026-11-03')).toBe(81)
  })

  it('sem tendência: a pesagem mais próxima em até 3 dias', () => {
    expect(referenceWeight([w('2026-11-01', 80), w('2026-11-06', 83)], '2026-11-04')).toBe(83)
  })

  it('empate de distância: a pesagem anterior', () => {
    expect(referenceWeight([w('2026-11-02', 80), w('2026-11-06', 83)], '2026-11-04')).toBe(80)
  })

  it('nada em 3 dias → null', () => {
    expect(referenceWeight([w('2026-10-20', 80)], '2026-11-04')).toBeNull()
  })
})

describe('needsConfirmation (FR-005)', () => {
  const weights = [w('2026-11-01', 82), w('2026-11-02', 82), w('2026-11-03', 82)]

  it('mais de 3 kg da tendência mais recente → true', () => {
    expect(needsConfirmation(weights, 85.5, '2026-11-04')).toBe(true)
    expect(needsConfirmation(weights, 78.5, '2026-11-04')).toBe(true)
  })

  it('até 3 kg → false', () => {
    expect(needsConfirmation(weights, 85, '2026-11-04')).toBe(false)
  })

  it('sem tendência → false', () => {
    expect(needsConfirmation(weights.slice(0, 2), 95, '2026-11-04')).toBe(false)
  })

  it('ignora a pesagem do próprio dia (ela é a que está sendo substituída)', () => {
    expect(needsConfirmation([...weights, w('2026-11-04', 120)], 82, '2026-11-04')).toBe(false)
  })
})

describe('effectiveBodyFat (FR-022)', () => {
  it('nenhum registro com % → null', () => {
    expect(effectiveBodyFat([m('2026-11-01', { waist_cm: 90 })])).toBeNull()
  })

  it('o mais recente de qualquer origem', () => {
    const list = [
      m('2026-10-01', { body_fat_navy_pct: 20 }),
      m('2026-10-20', { body_fat_device_pct: 17, body_fat_device_source: 'bioimpedancia' }),
    ]
    expect(effectiveBodyFat(list)).toEqual({ pct: 17, source: 'bioimpedancia', measuredOn: '2026-10-20' })
  })

  it('fita e aparelho no mesmo registro → fita', () => {
    const list = [m('2026-10-20', { body_fat_navy_pct: 19, body_fat_device_pct: 17, body_fat_device_source: 'dexa' })]
    expect(effectiveBodyFat(list)).toEqual({ pct: 19, source: 'navy', measuredOn: '2026-10-20' })
  })

  it('pula registros sem %', () => {
    const list = [m('2026-11-01', { waist_cm: 90 }), m('2026-10-01', { body_fat_navy_pct: 20 })]
    expect(effectiveBodyFat(list)?.measuredOn).toBe('2026-10-01')
  })
})

describe('bodyComposition (US5-1)', () => {
  it('massa gorda = peso × %; massa magra = peso − gorda, 1 casa', () => {
    expect(bodyComposition(82.4, 18.3)).toEqual({ fatKg: 15.1, leanKg: 67.3 })
  })
})

describe('waistHeightRatio (FR-017)', () => {
  it('cintura / altura com 2 casas', () => {
    expect(waistHeightRatio(88, 178)).toBe(0.49)
  })
})

describe('measurementsDue (FR-018)', () => {
  it('nenhum registro → true', () => {
    expect(measurementsDue([], '2026-11-08')).toBe(true)
  })

  it('último com mais de 28 dias → true', () => {
    expect(measurementsDue([m('2026-10-10')], '2026-11-08')).toBe(true)
  })

  it('28 dias ou menos → false', () => {
    expect(measurementsDue([m('2026-10-11')], '2026-11-08')).toBe(false)
    expect(measurementsDue([m('2026-10-29'), m('2026-09-01')], '2026-11-08')).toBe(false)
  })
})

describe('bodySnapshot (spec 024 R10 + 029)', () => {
  it('junta o registro de medidas com o peso de referência e o % (fita vence), numérico', () => {
    const weights = [w('2026-10-30', 82), w('2026-10-31', 82), w('2026-11-01', 82.3)]
    const snap = bodySnapshot(
      m('2026-11-01', { waist_cm: '88' as never, body_fat_navy_pct: 18.3, body_fat_device_pct: 16, body_fat_device_source: 'dexa', squat_kg: 120 }),
      weights,
    )
    expect(snap).toEqual({ date: '2026-11-01', weight_kg: 82.1, body_fat_pct: 18.3, body_fat_source: 'navy', waist_cm: 88, squat_kg: 120, bench_kg: null, deadlift_kg: null })
  })

  it('sem peso de referência e sem % → nulos', () => {
    expect(bodySnapshot(m('2026-11-01'), [])).toMatchObject({ weight_kg: null, body_fat_pct: null, body_fat_source: null })
  })
})
