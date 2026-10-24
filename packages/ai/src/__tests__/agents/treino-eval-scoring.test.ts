import { describe, it, expect } from 'vitest'
import { EMPTY_HARD_CONSTRAINTS, type MesocycleSession, type PlannedExercise, type UsageRecord } from '@helux/types'
import { scorePlan, weeklyStats, noteLeaks, aggregate, type EvalExpectations } from '../../agents/__evals__/treino-scoring'

// Spec 024 T008 — pontuação determinística do eval do Agente de Treino.

const ex = (name: string, sets = 3, extra: Partial<PlannedExercise> = {}): PlannedExercise => ({ name, sets, reps: '8-12', weight: '20kg', ...extra })
const session = (letter: string, exercises: PlannedExercise[], extra: Partial<MesocycleSession> = {}): MesocycleSession => ({ letter, focus: letter, exercises, completedAt: null, ...extra })

const EXPECT: EvalExpectations = { daysPerWeek: 4, minFrequency: 2, setsRange: { min: 6, max: 20 }, cardioPerWeek: 1, mobilityPerWeek: 1 }

const upper = session('A', [ex('Supino Reto (Barra)', 4), ex('Remada Curvada (Barra)', 4), ex('Desenvolvimento com Halteres', 3)])
const lower = session('B', [ex('Agachamento Livre (Barra)', 4), ex('Levantamento Terra Romeno (Barra)', 4), ex('Elevação Pélvica (Barra)', 3)])

describe('weeklyStats', () => {
  it('rotação: frequência e séries por grupo escaladas pelos dias da semana', () => {
    const stats = weeklyStats([upper, lower], 4)
    // 2 sessões em rotação com 4 dias/semana → cada sessão 2×/semana
    expect(stats.frequency.peito).toBe(2)
    expect(stats.sets.peito).toBe(8)
    expect(stats.frequency.quadriceps).toBe(2)
  })

  it('formato semanal: usa só a semana 1 e conta cardio e mobilidade', () => {
    const w1 = [
      session('A', upper.exercises, { week: 1, kind: 'forca' }),
      session('B', lower.exercises, { week: 1, kind: 'forca' }),
      session('C', [ex('Bike', 1, { cardio: { modality: 'bike', minutes: 25, zone: 'leve' } })], { week: 1, kind: 'cardio' }),
      session('D', [ex('Mobilidade de quadril', 1, { region: 'quadril', phase: 'volta-calma' })], { week: 1, kind: 'mobilidade' }),
    ]
    const w2 = w1.map(s => ({ ...s, week: 2 }))
    const stats = weeklyStats([...w1, ...w2], 4)
    expect(stats.frequency.peito).toBe(1)
    expect(stats.cardio).toBe(1)
    expect(stats.mobility).toBe(1)
  })
})

describe('noteLeaks', () => {
  it('acusa datas, menção a uso anterior e regras do sistema', () => {
    expect(noteLeaks('Evite Tríceps Corda nesta sessão (usados recentemente em 2026-07-02).')).toBe(true)
    expect(noteLeaks('Variação em relação ao Supino usado em sessões anteriores.')).toBe(true)
    expect(noteLeaks('Desça controlado em 3 s e mantenha os cotovelos a 45°.')).toBe(false)
  })
})

describe('scorePlan', () => {
  it('segurança 0 com qualquer violação das restrições', () => {
    const result = scorePlan({ sessions: [upper, lower], constraints: { ...EMPTY_HARD_CONSTRAINTS, exercisesToAvoid: ['Supino Reto (Barra)'] }, expectations: EXPECT })
    expect(result.violations.length).toBeGreaterThan(0)
    expect(result.scores.seguranca).toBe(0)
  })

  it('pontua frequência/volume pela fração de grupos principais dentro do esperado', () => {
    const result = scorePlan({ sessions: [upper, lower], constraints: EMPTY_HARD_CONSTRAINTS, expectations: EXPECT })
    expect(result.scores.seguranca).toBe(5)
    expect(result.scores['frequencia-volume']).toBe(5)
    const sparse = scorePlan({ sessions: [upper, lower, session('C', [ex('Rosca Direta (Barra)')]), session('D', [ex('Prancha Abdominal (Peso Corporal)')])], constraints: EMPTY_HARD_CONSTRAINTS, expectations: EXPECT })
    expect(sparse.scores['frequencia-volume']).toBeLessThan(5)
  })

  it('cardio e mobilidade valem metade cada', () => {
    const result = scorePlan({ sessions: [upper, lower], constraints: EMPTY_HARD_CONSTRAINTS, expectations: EXPECT })
    expect(result.scores['cardio-mobilidade']).toBe(0)
    const none = scorePlan({ sessions: [upper, lower], constraints: EMPTY_HARD_CONSTRAINTS, expectations: { ...EXPECT, cardioPerWeek: 0, mobilityPerWeek: 0 } })
    expect(none.scores['cardio-mobilidade']).toBe(5)
  })

  it('notas honestas: fração de notas sem vazamento', () => {
    const leaky = session('A', [ex('Supino Reto (Barra)', 4, { notes: 'Usado em 2026-07-02.' }), ex('Remada Curvada (Barra)', 4, { notes: 'Costas retas.' })])
    const result = scorePlan({ sessions: [leaky, lower], constraints: EMPTY_HARD_CONSTRAINTS, expectations: EXPECT })
    expect(result.scores['notas-honestas']).toBe(2.5)
  })
})

describe('aggregate', () => {
  it('média por critério, total e custo pela tabela de preços', () => {
    const usage: UsageRecord = { model: 'claude-opus-5-5', input_tokens: 1_000_000, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cacheTtl: '5m', operation: 'mesociclo', agent: 'treino' }
    const out = aggregate([
      { profile: 'a', scores: { seguranca: 5, objetivo: 4 }, usages: [usage] },
      { profile: 'b', scores: { seguranca: 3, objetivo: 2 }, usages: [usage] },
    ])
    expect(out.byCriterion.seguranca).toBe(4)
    expect(out.byCriterion.objetivo).toBe(3)
    expect(out.total).toBe(3.5)
    expect(out.costUsd).toBeCloseTo(8)
  })
})
