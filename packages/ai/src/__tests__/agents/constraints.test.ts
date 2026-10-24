import { describe, it, expect } from 'vitest'
import type { HardConstraints, MesocycleSession, PlannedExercise } from '@helux/types'
import { compatibleAlternatives, estimateSessionMinutes, validatePlanAgainstConstraints } from '../../agents/constraints'

const NONE: HardConstraints = { availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null }
const ex = (name: string, sets = 3, over: Partial<PlannedExercise> = {}): PlannedExercise => ({ name, sets, reps: '10', weight: '20 kg', ...over })
const session = (exercises: PlannedExercise[], letter = 'A'): MesocycleSession => ({ letter, focus: 'x', exercises, completedAt: null })

describe('estimateSessionMinutes (R7)', () => {
  it('5 min de aquecimento + séries × (40 s + 90 s de descanso)', () => {
    // 6 séries × 130 s = 780 s = 13 min → 18
    expect(estimateSessionMinutes(session([ex('Supino Reto (Barra)', 3), ex('Remada Curvada (Barra)', 3)]))).toBe(18)
  })
  it('aquecimento e volta à calma não contam séries', () => {
    expect(estimateSessionMinutes(session([ex('Mobilidade de quadril', 2, { phase: 'aquecimento' })]))).toBe(5)
  })
})

describe('validatePlanAgainstConstraints (R7)', () => {
  it('sem restrições e exercícios do banco → sem violação', () => {
    expect(validatePlanAgainstConstraints([session([ex('Supino Reto (Barra)')])], NONE)).toEqual([])
  })

  it('exercício fora do banco é violação (exceto aquecimento/volta à calma)', () => {
    const v = validatePlanAgainstConstraints([session([ex('Exercício Inventado'), ex('Corrida leve', 1, { phase: 'aquecimento' })])], NONE)
    expect(v.map(x => x.rule)).toEqual(['fora-do-banco'])
  })

  it('evitar, equipamento, padrão e exercício bloqueados — por nome ou id', () => {
    const c: HardConstraints = {
      availableEquipment: ['halteres'],
      exercisesToAvoid: ['agachamento-livre-barra'],
      maxSessionMinutes: null,
      blockedPatterns: ['empurrar-vertical'],
      blockedExercises: ['Remada Unilateral (Halteres)'],
      maxJointStress: {},
      maxCardioImpact: null,
      minRir: null,
    }
    const v = validatePlanAgainstConstraints(
      [session([ex('Agachamento Livre (Barra)'), ex('Desenvolvimento com Halteres'), ex('Remada Unilateral (Halteres)'), ex('Supino Reto (Halteres)')])],
      c,
    )
    expect(v.map(x => `${x.exercise}:${x.rule}`)).toEqual([
      'Agachamento Livre (Barra):evitar',
      'Agachamento Livre (Barra):equipamento',
      'Desenvolvimento com Halteres:padrao-bloqueado',
      'Remada Unilateral (Halteres):exercicio-bloqueado',
    ])
  })

  it('duração acima do máximo → violação por sessão', () => {
    const long = session(Array.from({ length: 6 }, () => ex('Supino Reto (Halteres)', 4)), 'B')
    const v = validatePlanAgainstConstraints([long], { ...NONE, maxSessionMinutes: 45 })
    expect(v).toEqual([expect.objectContaining({ sessionIndex: 0, exercise: null, rule: 'duracao' })])
  })
})

describe('compatibleAlternatives (FR-009a)', () => {
  it('mesmo grupo e padrão, sem o próprio exercício, respeitando equipamento e evitar', () => {
    const alts = compatibleAlternatives('supino-reto-barra', { ...NONE, availableEquipment: ['halteres', 'peso-corporal'], exercisesToAvoid: ['flexao-braco-corporal'] })
    expect(alts.length).toBeGreaterThan(0)
    expect(alts.every(a => a.exerciseId !== 'supino-reto-barra')).toBe(true)
    expect(alts.every(a => a.equipment === 'halteres' || a.equipment === 'peso-corporal')).toBe(true)
    expect(alts.map(a => a.exerciseId)).not.toContain('flexao-braco-corporal')
  })

  it('aceita o nome do exercício e marca violação de segurança com o motivo', () => {
    const alts = compatibleAlternatives('Supino Reto (Barra)', { ...NONE, blockedPatterns: ['empurrar-horizontal'] })
    expect(alts.length).toBeGreaterThan(0)
    expect(alts.every(a => a.violatesSafety && a.reason)).toBe(true)
  })

  it('exercício desconhecido → lista vazia', () => {
    expect(compatibleAlternatives('nao-existe', NONE)).toEqual([])
  })
})
