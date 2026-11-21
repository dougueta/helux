import { describe, it, expect } from 'vitest'
import { EMPTY_HARD_CONSTRAINTS, type HealthCondition, type MesocycleSession, type MethodPrescription, type PlannedExercise } from '@helux/types'
import { constraintsFromConditions, modifiersFromFindings, prescribeMethod } from '@helux/workouts'
import { resolvePlannedItem } from '@helux/exercises'
import { allowedCardio, allowedExercises, allowedPreparation, estimateSessionMinutes, repairPreparationItems, validatePlanAgainstConstraints } from '../../agents/constraints'
import { ensureFeasible } from '../../agents/feasibility'
import { fitPlanToMethod } from '../../agents/method-repair'
import { validateAgainstMethod } from '../../agents/method-validation'
import { APPROACH_PREFIX, buildExerciseItemSchema, buildMesocycleSchema, rawToPlanned, type RawExercise } from '../../agents/mesocycle-schema'
import { EXERCISE_BANK } from '../../exercise-bank'
import { withRealSources } from '../../mesocycle-planner'
import { EVAL_PROFILES } from '../../agents/__evals__/treino-profiles'

// Spec 024 (R17, T113–T116, T119): zerar as falhas de geração.

const METHOD: MethodPrescription = {
  goal: 'hipertrofia',
  weeks: 5,
  deloadWeek: 5,
  strengthDays: 2,
  cardioSessions: 1,
  mobilitySessions: 1,
  allowedSplits: ['full-body'],
  minFrequencyPerGroup: 2,
  weeklySetsPerGroup: { min: 6, max: 8 },
  weekly: [],
  repRanges: { basicos: [6, 10], acessorios: [10, 15] },
  cardio: { minutes: 20, zone: 'leve', maxImpact: 2, allowed: ['bike', 'corrida'] },
  modifiers: [],
  daysAvailable: 2,
}

const ex = (name: string, sets: number): PlannedExercise => ({ name, sets, reps: '8-10', weight: '20 kg', phase: 'principal' })
const day = (letter: string, sets: number, extra: PlannedExercise[] = []): MesocycleSession => ({
  letter,
  focus: 'Corpo todo',
  kind: 'forca',
  completedAt: null,
  exercises: [
    ex('Supino Reto (Halteres)', sets),
    ex('Remada Unilateral (Halteres)', sets),
    ex('Desenvolvimento com Halteres', sets),
    ex('Agachamento Goblet (Halteres)', sets),
    ex('Levantamento Terra Romeno (Halteres)', sets),
    ex('Elevação Pélvica (Peso Corporal)', sets),
    ...extra,
  ],
})
const total = (sessions: MesocycleSession[], name: string) => sessions.flatMap(s => s.exercises).filter(e => e.name === name).reduce((n, e) => n + e.sets, 0)

describe('allowedExercises / allowedCardio (A)', () => {
  it('sem restrições, o banco inteiro; com joelho ≤ 1, nenhum exercício acima disso', () => {
    const all = allowedExercises(EMPTY_HARD_CONSTRAINTS)
    const knee = allowedExercises({ ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 1 } })
    expect(knee.length).toBeLessThan(all.length)
    expect(knee.every(e => e.stress.joelho <= 1)).toBe(true)
    expect(knee.map(e => e.name)).not.toContain('Agachamento Livre (Barra)')
  })

  it('equipamento, bloqueios e lista a evitar saem', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['halteres' as const], blockedPatterns: ['empurrar-vertical'], exercisesToAvoid: ['Supino Reto (Halteres)'] }
    const names = allowedExercises(c).map(e => e.name)
    expect(names).not.toContain('Supino Reto (Barra)')
    expect(names).not.toContain('Supino Reto (Halteres)')
    expect(allowedExercises(c).every(e => e.equipment === 'halteres' && e.pattern !== 'empurrar-vertical')).toBe(true)
  })

  it('o que o filtro deixa passar, o validador aceita (mesmas regras)', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 1 as const, lombar: 1 as const }, availableEquipment: ['halteres' as const, 'peso-corporal' as const] }
    const session: MesocycleSession = { letter: 'A', focus: 'x', completedAt: null, exercises: allowedExercises(c).map(e => ex(e.name, 1)) }
    expect(validatePlanAgainstConstraints([session], c)).toEqual([])
  })

  it('cardio: impacto e carga articular', () => {
    const ids = allowedCardio({ ...EMPTY_HARD_CONSTRAINTS, maxCardioImpact: 0, maxJointStress: { joelho: 1 } }).map(k => k.id)
    expect(ids).toContain('bike')
    expect(ids).not.toContain('corrida')
  })

  it('schema por pedido: enum só com os permitidos; sem cardio permitido, sem item de cardio', () => {
    const schema = JSON.stringify(buildMesocycleSchema({ exercises: ['Supino Reto (Halteres)'], cardio: ['bike'], preparation: [] }))
    expect(schema).toContain('"enum":["Supino Reto (Halteres)"]')
    expect(schema).toContain('"enum":["bike"]')
    expect(buildExerciseItemSchema({ exercises: ['Supino Reto (Halteres)'], cardio: [], preparation: [] }).anyOf).toHaveLength(2)
  })
})

describe('fitPlanToMethod (B)', () => {
  it('sobe as séries até o mínimo do grupo', () => {
    const out = fitPlanToMethod([day('A', 2), day('B', 2)], METHOD, EMPTY_HARD_CONSTRAINTS)
    expect(total(out, 'Supino Reto (Halteres)')).toBe(6)
    expect(validateAgainstMethod(out, { ...METHOD, cardioSessions: 0, mobilitySessions: 0 })).toEqual([])
  })

  it('desce as séries até o máximo do grupo, sem passar de 2 por exercício', () => {
    const out = fitPlanToMethod([day('A', 5), day('B', 5)], METHOD, EMPTY_HARD_CONSTRAINTS)
    expect(total(out, 'Supino Reto (Halteres)')).toBe(8)
    expect(out.flatMap(s => s.exercises).every(e => e.sets >= 2)).toBe(true)
  })

  it('corta acessórios primeiro para caber no tempo', () => {
    const plan = [day('A', 3, [ex('Rosca Direta (Halteres)', 4), ex('Tríceps Francês (Halteres)', 4)]), day('B', 3)]
    const c = { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 55 }
    expect(estimateSessionMinutes(plan[0])).toBeGreaterThan(55)
    const out = fitPlanToMethod(plan, METHOD, c)
    expect(estimateSessionMinutes(out[0])).toBeLessThanOrEqual(55)
    expect(total(out, 'Rosca Direta (Halteres)')).toBe(2)
    expect(total(out, 'Supino Reto (Halteres)')).toBe(6)
  })

  it('não sobe séries se a sessão estourar o tempo', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 32 }
    const out = fitPlanToMethod([day('A', 2), day('B', 2)], METHOD, c)
    expect(out.every(s => estimateSessionMinutes(s) <= 32)).toBe(true)
  })

  it('não mexe no plano recebido', () => {
    const plan = [day('A', 2), day('B', 2)]
    fitPlanToMethod(plan, METHOD, EMPTY_HARD_CONSTRAINTS)
    expect(plan[0].exercises[0].sets).toBe(2)
  })
})

describe('ensureFeasible (C)', () => {
  it('pedido viável fica igual', () => {
    const { method, infeasible } = ensureFeasible(METHOD, EMPTY_HARD_CONSTRAINTS)
    expect(infeasible).toBeNull()
    expect(method.weeklySetsPerGroup).toEqual(METHOD.weeklySetsPerGroup)
    expect(method.modifiers).toEqual([])
  })

  it('cardio só com modalidades permitidas; nenhuma → sem sessões de cardio, com o motivo', () => {
    expect(ensureFeasible(METHOD, { ...EMPTY_HARD_CONSTRAINTS, maxCardioImpact: 0 }).method.cardio.allowed).toEqual(['bike'])
    const none = ensureFeasible({ ...METHOD, cardio: { ...METHOD.cardio, allowed: ['corrida'] } }, { ...EMPTY_HARD_CONSTRAINTS, maxCardioImpact: 0 }).method
    expect(none.cardioSessions).toBe(0)
    expect(none.modifiers.map(m => m.source)).toContain('condicao')
  })

  it('grupo sem exercício permitido fica fora da conta de volume', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, exercisesToAvoid: EXERCISE_BANK.filter(e => e.muscleGroup === 'quadriceps').map(e => e.name) }
    const { method, infeasible } = ensureFeasible(METHOD, c)
    expect(infeasible).toBeNull()
    expect(method.exemptGroups).toEqual(['quadriceps'])
    expect(method.modifiers[0].description).toMatch(/Quadríceps/)
    const noQuads = [day('A', 3), day('B', 3)].map(s => ({ ...s, exercises: s.exercises.filter(e => e.name !== 'Agachamento Goblet (Halteres)') }))
    expect(validateAgainstMethod(noQuads, { ...method, cardioSessions: 0, mobilitySessions: 0 })).toEqual([])
  })

  it('cardio no dia de força reduz a faixa de séries para caber no tempo', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 45 }
    const { method } = ensureFeasible({ ...METHOD, cardioSessions: 2, daysAvailable: 2 }, c)
    expect(method.weeklySetsPerGroup.min).toBeLessThan(METHOD.weeklySetsPerGroup.min)
    expect(method.modifiers.map(m => m.source)).toContain('tempo')
  })

  it('nenhum exercício permitido → inviável, com o motivo', () => {
    expect(ensureFeasible(METHOD, { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['inexistente' as never] }).infeasible).toMatch(/nenhum exercício/)
  })
})

describe('perfis do eval têm solução (T119, sem API)', () => {
  for (const p of EVAL_PROFILES) {
    it(p.id, () => {
      const conditions: HealthCondition[] = p.structured.conditions.map((c, i) => ({ ...c, id: `c${i}`, flare: null }))
      const fc = constraintsFromConditions(conditions)
      const fy = p.cycle ? modifiersFromFindings(p.cycle.findings) : { modifiers: [], blockedExercises: [] }
      const c = { ...p.agentConstraints, ...fc, blockedPatterns: [...p.agentConstraints.blockedPatterns, ...fc.blockedPatterns], blockedExercises: [...p.agentConstraints.blockedExercises, ...fc.blockedExercises, ...fy.blockedExercises] }
      // O agente recebe o mesmo limite de tempo que a nota cobra.
      expect(c.maxSessionMinutes).toBe(p.expectedConstraints.maxSessionMinutes)
      const method = prescribeMethod({ goal: p.structured.goal, level: p.structured.level, timeOffMonths: p.structured.timeOffMonths, daysAvailable: p.daysPerWeek, maxCardioImpact: c.maxCardioImpact, minRir: c.minRir, cardioLikes: [], cardioAvoid: [], maxSessionMinutes: c.maxSessionMinutes, modifiers: fy.modifiers })
      const out = ensureFeasible(method, c)
      expect(out.infeasible).toBeNull()
      expect(out.method.exemptGroups ?? []).toEqual([])
      expect(out.method.cardio.allowed.length).toBeGreaterThan(0)
      const perGroup = new Set(allowedExercises(c).map(e => e.muscleGroup))
      for (const g of ['peito', 'costas', 'ombro', 'quadriceps', 'posterior', 'gluteo']) expect(perGroup.has(g)).toBe(true)
    })
  }
})

describe('R17b: viabilidade não desce abaixo do útil; fontes reais', () => {
  it('pouco tempo com cardio no dia de força: encurta o cardio antes de cortar séries; nunca menos de 4 por grupo', () => {
    const c = { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 40 }
    const { method } = ensureFeasible({ ...METHOD, weeklySetsPerGroup: { min: 5, max: 7 }, cardioSessions: 2, daysAvailable: 3, cardio: { ...METHOD.cardio, minutes: 25 } }, c)
    expect(method.cardio.minutes).toBeLessThan(25)
    expect(method.cardio.minutes).toBeGreaterThanOrEqual(10)
    expect(method.weeklySetsPerGroup.min).toBeGreaterThanOrEqual(4)
  })

  it('withRealSources tira das decisões as fontes sem dados', async () => {
    const profile = { generatedAt: '', sources: { perfil: { status: 'ativa' }, restricoes: { status: 'vazia' } } } as never
    const out = withRealSources([{ topic: 'condicao', choice: 'x', sources: ['perfil', 'restricoes'], reason: 'y' }] as never, profile)
    expect(out[0].sources).toEqual(['perfil'])
  })
})

describe('028 T090: todo item do plano novo resolve com demonstração (SC-010)', () => {
  /** IA simulada: escolhe cada opção que o schema do pedido oferece, item por item. */
  function everyChoice(c: typeof EMPTY_HARD_CONSTRAINTS): RawExercise[] {
    const schema = buildExerciseItemSchema({
      exercises: allowedExercises(c).map(e => e.name),
      cardio: allowedCardio(c).map(k => k.id),
      preparation: allowedPreparation(c).map(p => p.name),
    }) as unknown as { anyOf: { properties: Record<string, { enum?: string[] }> }[] }
    return schema.anyOf.flatMap(alt => {
      const phase = alt.properties.phase.enum![0]
      if (phase === 'principal') return alt.properties.name.enum!.map(name => ({ phase, name, sets: 3, reps: '8-10', weight: '20 kg', rirTarget: 2, notes: null, supersetGroup: null }) as RawExercise)
      if (phase === 'cardio') return alt.properties.modality.enum!.map(modality => ({ phase, modality, minutes: 20, zone: 'leve', notes: null }) as RawExercise)
      if (phase === 'aproximacao') return alt.properties.exercise.enum!.map(exercise => ({ phase, exercise, sets: 2, reps: '10, 6', weight: 'leve', notes: null }) as RawExercise)
      return alt.properties.name.enum!.map(name => ({ phase, name, sets: 1, reps: '5 min', weight: '—', notes: null }) as RawExercise)
    })
  }

  it.each([
    ['sem restrições', EMPTY_HARD_CONSTRAINTS],
    ['em casa, só peso corporal', { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['peso-corporal' as const] }],
    ['halteres, joelho e lombar sensíveis', { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['halteres' as const, 'peso-corporal' as const], maxJointStress: { joelho: 1 as const, lombar: 1 as const }, maxCardioImpact: 0 as const }],
  ])('%s: nenhum nome livre, nenhum item sem demonstração', (_label, c) => {
    const raw = everyChoice(c)
    const session: MesocycleSession = { letter: 'A', focus: 'x', completedAt: null, exercises: raw.map(rawToPlanned) }
    const { sessions, repairs } = repairPreparationItems([session], c)
    expect(repairs).toEqual([])
    const unresolved = sessions[0].exercises.map(e => [e.name, resolvePlannedItem(e)] as const).filter(([, r]) => r.id === null || r.demoState === 'indisponivel')
    expect(unresolved.map(([name]) => name)).toEqual([])
    // preparação sempre com catalogId; aproximação sempre com approachOf
    for (const e of sessions[0].exercises) {
      if (e.phase === 'aquecimento' && e.name.startsWith(APPROACH_PREFIX)) expect(e.approachOf, e.name).toBeTruthy()
      else if (e.phase === 'aquecimento' || e.phase === 'volta-calma' || e.region) expect(e.catalogId, e.name).toBeTruthy()
    }
  })
})
