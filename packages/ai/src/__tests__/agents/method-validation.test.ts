import { describe, it, expect } from 'vitest'
import type { MesocycleSession, MethodPrescription, PlannedExercise } from '@helux/types'
import { validateAgainstMethod } from '../../agents/method-validation'

// Spec 024 T069 + Spec 030 (FR-002a): a fila weekTemplate contém apenas as sessões
// de academia (força); cardio e mobilidade dedicados vivem nas Rotinas Complementares.

const ex = (name: string, sets = 4, over: Partial<PlannedExercise> = {}): PlannedExercise => ({ name, sets, reps: '8-10', weight: '60kg', ...over })
const s = (letter: string, kind: MesocycleSession['kind'], exercises: PlannedExercise[]): MesocycleSession => ({ letter, focus: letter, completedAt: null, kind, exercises })

const METHOD: MethodPrescription = {
  goal: 'hipertrofia',
  weeks: 5,
  deloadWeek: 5,
  strengthDays: 2,
  cardioSessions: 1,
  mobilitySessions: 1,
  allowedSplits: ['full-body'],
  minFrequencyPerGroup: 2,
  weeklySetsPerGroup: { min: 6, max: 12 },
  weekly: [],
  repRanges: { basicos: [6, 10], acessorios: [10, 15] },
  cardio: { minutes: 20, zone: 'leve', maxImpact: 2, allowed: ['bike'] },
  modifiers: [],
}

const FULL = [ex('Supino Reto (Barra)', 3), ex('Remada Curvada (Barra)', 3), ex('Desenvolvimento com Halteres', 3), ex('Agachamento Livre (Barra)', 3), ex('Levantamento Terra Romeno (Barra)', 3), ex('Elevação Pélvica (Barra)', 3)]
const bike = ex('Bike ergométrica', 1, { reps: '20 min', weight: '—', cardio: { modality: 'bike', minutes: 20, zone: 'leve' } })
const mob = ex('Mobilidade de quadril', 1, { reps: '10 min', weight: '—', region: 'quadril' })

describe('validateAgainstMethod', () => {
  it('full body 2× apenas com sessões de força na fila → sem violações (cardio/mobilidade ficam nas Rotinas Complementares, FR-002a)', () => {
    expect(validateAgainstMethod([s('A', 'forca', FULL), s('B', 'forca', FULL)], METHOD)).toEqual([])
  })

  it('número de dias de força diferente → metodo-estrutura', () => {
    const v = validateAgainstMethod([s('A', 'forca', FULL)], METHOD)
    expect(v.map(x => x.rule)).toContain('metodo-estrutura')
  })

  it('sessão avulsa de cardio ou mobilidade ocupando letra na fila → metodo-estrutura (FR-002a)', () => {
    const v = validateAgainstMethod([s('A', 'forca', FULL), s('B', 'forca', FULL), s('C', 'cardio', [bike]), s('D', 'mobilidade', [mob])], METHOD)
    expect(v.map(x => x.rule)).toContain('metodo-estrutura')
  })

  it('grupo principal 1×/semana → metodo-frequencia com o grupo', () => {
    const upperOnly = FULL.slice(0, 3)
    const v = validateAgainstMethod([s('A', 'forca', FULL), s('B', 'forca', upperOnly)], METHOD)
    expect(v.filter(x => x.rule === 'metodo-frequencia').map(x => x.exercise).sort()).toEqual(['gluteo', 'posterior', 'quadriceps'])
  })

  it('séries semanais fora da faixa → metodo-volume', () => {
    const heavy = [ex('Supino Reto (Barra)', 8), ...FULL.slice(1)]
    const v = validateAgainstMethod([s('A', 'forca', heavy), s('B', 'forca', heavy)], METHOD)
    expect(v).toEqual([expect.objectContaining({ rule: 'metodo-volume', exercise: 'peito' })])
  })
})
