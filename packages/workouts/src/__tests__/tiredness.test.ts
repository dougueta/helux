import { describe, it, expect } from 'vitest'
import type { PlannedExercise, TirednessAssessment } from '@helux/types'
import {
  hrvToTirednessLevel,
  tirednessTier,
  assessTiredness,
  adjustExercisesForLevel,
  diffExercises,
  buildAdjustedSession,
  previewTirednessChoice,
  TIREDNESS_LEVELS,
  TIREDNESS_LABELS,
} from '../tiredness'

const DATE = '2026-09-22'

const planned: PlannedExercise[] = [
  { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' },
  { name: 'Crucifixo', sets: 3, reps: '10-12', weight: '15kg' },
  { name: 'Flexão', sets: 2, reps: '15', weight: 'peso corporal' },
]

describe('níveis e rótulos', () => {
  it('lista os quatro níveis em ordem', () => {
    expect(TIREDNESS_LEVELS).toEqual(['otimo', 'normal', 'cansado', 'exausto'])
    expect(TIREDNESS_LABELS.otimo).toBe('ótimo')
  })
})

describe('hrvToTirednessLevel', () => {
  it('mapeia os limiares 40/60', () => {
    expect(hrvToTirednessLevel(75)).toBe('normal')
    expect(hrvToTirednessLevel(60)).toBe('normal')
    expect(hrvToTirednessLevel(59)).toBe('cansado')
    expect(hrvToTirednessLevel(40)).toBe('cansado')
    expect(hrvToTirednessLevel(39)).toBe('exausto')
  })
})

describe('tirednessTier', () => {
  it('ótimo e normal não ajustam; cansado moderado; exausto alto', () => {
    expect(tirednessTier('otimo')).toBe('none')
    expect(tirednessTier('normal')).toBe('none')
    expect(tirednessTier('cansado')).toBe('moderate')
    expect(tirednessTier('exausto')).toBe('high')
    expect(tirednessTier(null)).toBe('none')
  })
})

describe('assessTiredness', () => {
  it('sem manual e sem automático → nenhum', () => {
    expect(assessTiredness({ date: DATE, manualLevel: null, overrideAutomatic: false, hrv: null })).toEqual({
      date: DATE,
      manualLevel: null,
      overrideAutomatic: false,
      automaticLevel: null,
      automaticHrv: null,
      effectiveLevel: null,
      source: 'none',
      conflict: false,
    })
  })

  it('sem automático → vale o manual', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'exausto', overrideAutomatic: false, hrv: null })
    expect(a.effectiveLevel).toBe('exausto')
    expect(a.source).toBe('manual')
    expect(a.conflict).toBe(false)
  })

  it('com automático e sem override → automático prevalece e sinaliza conflito', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'otimo', overrideAutomatic: false, hrv: 45 })
    expect(a.automaticLevel).toBe('cansado')
    expect(a.automaticHrv).toBe(45)
    expect(a.effectiveLevel).toBe('cansado')
    expect(a.source).toBe('automatic')
    expect(a.conflict).toBe(true)
  })

  it('com override confirmado → manual prevalece', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'otimo', overrideAutomatic: true, hrv: 45 })
    expect(a.effectiveLevel).toBe('otimo')
    expect(a.source).toBe('manual')
    expect(a.conflict).toBe(true)
  })

  it('ótimo × normal não é conflito', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'otimo', overrideAutomatic: false, hrv: 70 })
    expect(a.conflict).toBe(false)
  })
})

describe('adjustExercisesForLevel', () => {
  it('ótimo/normal/null não alteram', () => {
    expect(adjustExercisesForLevel(planned, 'otimo')).toEqual(planned)
    expect(adjustExercisesForLevel(planned, 'normal')).toEqual(planned)
    expect(adjustExercisesForLevel(planned, null)).toEqual(planned)
  })

  it('cansado tira 1 série (mínimo 2) sem mexer na carga', () => {
    const r = adjustExercisesForLevel(planned, 'cansado')
    expect(r.map((e) => e.sets)).toEqual([3, 2, 2])
    expect(r.map((e) => e.weight)).toEqual(['80kg', '15kg', 'peso corporal'])
  })

  it('exausto tira 1 série e reduz 10% da carga numérica, arredondando a 0,5 kg', () => {
    const r = adjustExercisesForLevel(planned, 'exausto')
    expect(r.map((e) => e.sets)).toEqual([3, 2, 2])
    expect(r.map((e) => e.weight)).toEqual(['72kg', '13.5kg', 'peso corporal'])
  })

  it('aceita vírgula decimal e ignora cargas relativas', () => {
    const r = adjustExercisesForLevel(
      [
        { name: 'A', sets: 3, reps: '10', weight: '62,5kg' },
        { name: 'B', sets: 3, reps: '10', weight: '+2.5kg' },
      ],
      'exausto',
    )
    expect(r.map((e) => e.weight)).toEqual(['56.5kg', '+2.5kg'])
  })

  it('não altera o array de entrada', () => {
    adjustExercisesForLevel(planned, 'exausto')
    expect(planned[0]).toEqual({ name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' })
  })
})

describe('diffExercises', () => {
  it('lista só os exercícios que mudam', () => {
    const after = adjustExercisesForLevel(planned, 'exausto')
    expect(diffExercises(planned, after)).toEqual([
      { name: 'Supino Reto', setsBefore: 4, setsAfter: 3, weightBefore: '80kg', weightAfter: '72kg' },
      { name: 'Crucifixo', setsBefore: 3, setsAfter: 2, weightBefore: '15kg', weightAfter: '13.5kg' },
    ])
  })

  it('vazio quando nada muda', () => {
    expect(diffExercises(planned, planned)).toEqual([])
  })
})

describe('buildAdjustedSession', () => {
  const session = { letter: 'A', focus: 'Peito', exercises: planned, completedAt: null }

  it('sem ajuste', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'normal', overrideAutomatic: false, hrv: null })
    const r = buildAdjustedSession(session, a)
    expect(r.adjusted).toBe(false)
    expect(r.adjustmentReason).toBeUndefined()
    expect(r.exercises).toEqual(planned)
    expect(r.plannedExercises).toEqual(planned)
    expect(r.changes).toEqual([])
    expect(r.tiredness).toEqual(a)
    expect(r).not.toHaveProperty('completedAt')
  })

  it('manual exausto', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'exausto', overrideAutomatic: false, hrv: null })
    const r = buildAdjustedSession(session, a)
    expect(r.adjusted).toBe(true)
    expect(r.adjustmentReason).toBe('Você marcou "exausto" hoje')
    expect(r.changes).toHaveLength(2)
    expect(r.exercises[0].weight).toBe('72kg')
  })

  it('automático', () => {
    const a = assessTiredness({ date: DATE, manualLevel: null, overrideAutomatic: false, hrv: 45 })
    const r = buildAdjustedSession(session, a)
    expect(r.adjustmentReason).toBe('Relógio indica "cansado" (HRV 45 ms)')
  })

  it('manual sobrepondo o relógio', () => {
    const a = assessTiredness({ date: DATE, manualLevel: 'exausto', overrideAutomatic: true, hrv: 45 })
    const r = buildAdjustedSession(session, a)
    expect(r.adjustmentReason).toBe('Você marcou "exausto" hoje — relógio indicava "cansado"')
  })
})

describe('previewTirednessChoice', () => {
  function assessment(partial: Partial<Parameters<typeof assessTiredness>[0]>): TirednessAssessment {
    return assessTiredness({ date: DATE, manualLevel: null, overrideAutomatic: false, hrv: null, ...partial })
  }

  it('sem automático: sem conflito, mudanças vs. exibido e necessidade de salvar', () => {
    const p = previewTirednessChoice({
      assessment: assessment({}),
      plannedExercises: planned,
      currentExercises: planned,
      candidate: 'cansado',
    })
    expect(p.conflict).toBe(false)
    expect(p.overrideAutomatic).toBe(false)
    expect(p.needsSave).toBe(true)
    expect(p.nextAssessment.effectiveLevel).toBe('cansado')
    expect(p.changesFromCurrent).toHaveLength(2)
    expect(p.changesFromPlanned).toHaveLength(2)
  })

  it('mesmo nível já salvo: nada a salvar', () => {
    const a = assessment({ manualLevel: 'normal' })
    const p = previewTirednessChoice({ assessment: a, plannedExercises: planned, currentExercises: planned, candidate: 'normal' })
    expect(p.needsSave).toBe(false)
    expect(p.changesFromCurrent).toEqual([])
  })

  it('discordante do automático: conflito; sem confirmação o relógio continua valendo', () => {
    const a = assessment({ hrv: 45 })
    const current = adjustExercisesForLevel(planned, 'cansado')
    const p = previewTirednessChoice({ assessment: a, plannedExercises: planned, currentExercises: current, candidate: 'otimo' })
    expect(p.conflict).toBe(true)
    expect(p.overrideAutomatic).toBe(false)
    expect(p.nextAssessment.effectiveLevel).toBe('cansado')
  })

  it('discordante confirmado: override e treino volta ao planejado', () => {
    const a = assessment({ hrv: 45 })
    const current = adjustExercisesForLevel(planned, 'cansado')
    const p = previewTirednessChoice({
      assessment: a,
      plannedExercises: planned,
      currentExercises: current,
      candidate: 'otimo',
      confirmOverride: true,
    })
    expect(p.overrideAutomatic).toBe(true)
    expect(p.nextAssessment.effectiveLevel).toBe('otimo')
    expect(p.nextExercises).toEqual(planned)
    expect(p.changesFromCurrent.map((c) => [c.setsBefore, c.setsAfter])).toEqual([[3, 4], [2, 3]])
    expect(p.changesFromPlanned).toEqual([])
    expect(p.needsSave).toBe(true)
  })

  it('concordante com o automático: sem conflito', () => {
    const a = assessment({ hrv: 45 })
    const current = adjustExercisesForLevel(planned, 'cansado')
    const p = previewTirednessChoice({ assessment: a, plannedExercises: planned, currentExercises: current, candidate: 'cansado' })
    expect(p.conflict).toBe(false)
    expect(p.changesFromCurrent).toEqual([])
    expect(p.changesFromPlanned).toHaveLength(2)
  })

  it('não pergunta de novo se o mesmo nível já sobrepôs o relógio hoje', () => {
    const a = assessment({ hrv: 45, manualLevel: 'otimo', overrideAutomatic: true })
    const p = previewTirednessChoice({ assessment: a, plannedExercises: planned, currentExercises: planned, candidate: 'otimo' })
    expect(p.conflict).toBe(false)
    expect(p.overrideAutomatic).toBe(true)
    expect(p.needsSave).toBe(false)
  })
})
