import { describe, it, expect } from 'vitest'
import type { MotionKey } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry } from '../exercise-bank'
import { matchMotionRule, measureMotionCoverage, resolveMotion } from '../motions'

/** Resolvedor anterior à spec 013 (cópia de `motionFor` em variants.ts), usado como linha de base. */
function legacyMotionFor(entry: ExerciseBankEntry): MotionKey {
  if (entry.pattern === 'empurrar-vertical') return 'press-overhead'
  if (entry.pattern === 'isolamento') return 'pushdown'
  return 'press-flat'
}

/** As 102 entradas que existiam antes da spec 013 (os exercícios novos são acrescentados no fim do banco). */
const ORIGINAL_BANK = EXERCISE_BANK.slice(0, 102)

describe('medição de animação genérica — spec 013 (FR-005, SC-001..003)', () => {
  it('linha de base (antes): 63/102 (61,8%) em supino e 81/102 (79,4%) genérico/incorreto', () => {
    const before = measureMotionCoverage(ORIGINAL_BANK, legacyMotionFor)
    expect(before.total).toBe(102)
    expect(before.pressFlat).toBe(63)
    expect(before.pressFlatPct).toBeCloseTo(61.8, 1)
    expect(before.generic).toBe(81)
    expect(before.genericPct).toBeCloseTo(79.4, 1)
  })

  it('depois: supino ≤ 12%, genérico/incorreto ≤ 10%, nenhuma animação > 20% do banco', () => {
    const after = measureMotionCoverage(EXERCISE_BANK, resolveMotion)
    // imprime o antes/depois para o relatório da spec
    const before = measureMotionCoverage(ORIGINAL_BANK, legacyMotionFor)
    console.info(
      `[spec 013] supino: ${before.pressFlatPct.toFixed(1)}% → ${after.pressFlatPct.toFixed(1)}% · ` +
        `genérico/incorreto: ${before.genericPct.toFixed(1)}% → ${after.genericPct.toFixed(1)}% · ` +
        `maior fatia: ${after.maxShare.motion} ${after.maxSharePct.toFixed(1)}% (n=${after.total})`,
    )
    expect(after.pressFlatPct).toBeLessThanOrEqual(12)
    expect(after.genericPct).toBeLessThanOrEqual(10)
    expect(after.maxSharePct).toBeLessThanOrEqual(20)
  })

  it('só exercícios de empurrar horizontal usam o supino reto', () => {
    for (const entry of EXERCISE_BANK) {
      if (resolveMotion(entry) === 'press-flat') expect(entry.pattern, entry.name).toBe('empurrar-horizontal')
    }
  })

  it('nenhum exercício do banco depende do último recurso', () => {
    const semRegra = EXERCISE_BANK.filter((e) => matchMotionRule(e) === undefined).map((e) => e.name)
    expect(semRegra).toEqual([])
  })

  it('exercício desconhecido (fora das regras) cai no supino reto', () => {
    const fake: ExerciseBankEntry = {
      ...EXERCISE_BANK[0],
      name: 'Movimento Inventado',
      pattern: 'padrao-inexistente',
      muscleGroup: 'nenhum',
    }
    expect(matchMotionRule(fake)).toBeUndefined()
    expect(resolveMotion(fake)).toBe('press-flat')
  })

  it.each<[string, MotionKey]>([
    ['Agachamento Livre (Barra)', 'squat'],
    ['Leg Press 45°', 'leg-press'],
    ['Afundo (Halteres)', 'lunge'],
    ['Agachamento Búlgaro (Halteres)', 'lunge'],
    ['Levantamento Terra (Barra)', 'hinge'],
    ['Elevação Pélvica (Barra)', 'hip-thrust'],
    ['Remada Curvada (Barra)', 'row'],
    ['Remada Alta (Barra)', 'upright-row'],
    ['Barra Fixa (Peso Corporal)', 'pull-vertical'],
    ['Puxada Alta (Cabo)', 'pull-vertical'],
    ['Prancha Abdominal (Peso Corporal)', 'plank'],
    ['Abdominal Supra (Peso Corporal)', 'crunch'],
    ['Elevação de Pernas na Barra', 'leg-raise'],
    ['Roda Abdominal (Ab Wheel)', 'rollout'],
    ['Pallof Press (Cabo)', 'cable-rotation'],
    ['Rosca Direta (Barra)', 'curl'],
    ['Supino Reto (Barra)', 'press-flat'],
    ['Supino Inclinado (Halteres)', 'press-incline'],
    ['Flexão de Braço (Peso Corporal)', 'push-up'],
    ['Desenvolvimento Militar (Barra)', 'press-overhead'],
    ['Elevação Lateral (Halteres)', 'raise-lateral'],
    ['Elevação Frontal (Halteres)', 'raise-front'],
    ['Tríceps Testa (Barra)', 'ext-lying'],
    ['Tríceps Corda (Cabo)', 'pushdown'],
    ['Tríceps Francês (Halteres)', 'ext-overhead'],
    ['Paralelas (Peso Corporal)', 'dip'],
    ['Crucifixo (Halteres)', 'fly'],
    ['Encolhimento com Barra', 'shrug'],
    ['Cadeira Extensora', 'leg-ext'],
    ['Mesa Flexora', 'leg-curl'],
    ['Cadeira Abdutora', 'hip-abduction'],
    ['Elevação de Panturrilha em Pé (Máquina)', 'calf-raise'],
  ])('%s → %s', (name, motion) => {
    const entry = EXERCISE_BANK.find((e) => e.name === name)
    expect(entry, name).toBeDefined()
    expect(resolveMotion(entry!)).toBe(motion)
  })
})
