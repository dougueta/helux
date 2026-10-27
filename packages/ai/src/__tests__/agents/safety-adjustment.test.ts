import { describe, it, expect } from 'vitest'
import { EMPTY_HARD_CONSTRAINTS, type PlannedExercise } from '@helux/types'
import { adaptSessionForSafety } from '../../agents/safety-adjustment'

// Spec 024 T062 — adaptação da sessão do dia por condição, crise ou dor (FR-009, FR-018).

const ex = (name: string, over: Partial<PlannedExercise> = {}): PlannedExercise => ({ name, sets: 3, reps: '8-10', weight: '60kg', ...over })

describe('adaptSessionForSafety', () => {
  it('sem violação → mesma sessão, sem mudanças', () => {
    const exercises = [ex('Supino Reto (Barra)'), ex('Leg Press 45°')]
    const out = adaptSessionForSafety(exercises, { ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 1 } })
    expect(out.exercises).toEqual(exercises)
    expect(out.changes).toEqual([])
    expect(out.reason).toBeNull()
  })

  it('troca o exercício que passa do limite articular por alternativa segura do mesmo grupo, mantendo séries e reps', () => {
    const out = adaptSessionForSafety([ex('Agachamento Livre (Barra)'), ex('Supino Reto (Barra)')], { ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 1 } }, 'crise de gota no joelho')
    expect(out.exercises[0].name).not.toBe('Agachamento Livre (Barra)')
    expect(out.exercises[0]).toMatchObject({ sets: 3, reps: '8-10' })
    expect(out.exercises[0].notes).toMatch(/carga/i)
    // PR #19: o substituto vem com dicas e músculos, como os outros exercícios.
    expect(out.exercises[0].cues?.length).toBeGreaterThan(0)
    expect(out.exercises[0].muscle).toBeTruthy()
    expect(out.exercises[1].name).toBe('Supino Reto (Barra)')
    expect(out.changes).toEqual([expect.objectContaining({ name: 'Agachamento Livre (Barra)', replacedBy: out.exercises[0].name })])
    expect(out.reason).toMatch(/crise de gota no joelho/)
  })

  it('sem alternativa segura → remove o exercício', () => {
    const out = adaptSessionForSafety([ex('Agachamento Livre (Peso Corporal)'), ex('Flexão de Braço (Peso Corporal)')], { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['peso-corporal'], maxJointStress: { joelho: 0 } })
    const names = out.exercises.map(e => e.name)
    expect(names).not.toContain('Agachamento Livre (Peso Corporal)')
    expect(out.changes.find(c => c.name === 'Agachamento Livre (Peso Corporal)')).toMatchObject({ removed: true })
  })

  it('cardio acima do impacto vira a opção sem impacto, com os mesmos minutos', () => {
    const run = ex('Corrida', { sets: 1, reps: '20 min', weight: '—', cardio: { modality: 'corrida', minutes: 20, zone: 'leve' } })
    const out = adaptSessionForSafety([run], { ...EMPTY_HARD_CONSTRAINTS, maxCardioImpact: 0 })
    expect(out.exercises[0].cardio).toMatchObject({ modality: 'bike', minutes: 20 })
    expect(out.exercises[0].name).toBe('Bike ergométrica')
    expect(out.changes[0]).toMatchObject({ name: 'Corrida', replacedBy: 'Bike ergométrica' })
  })

  it('aquecimento, volta à calma e mobilidade não são mexidos', () => {
    const items = [ex('Mobilidade de joelho', { phase: 'aquecimento', sets: 1 }), ex('Alongamento de quadríceps', { phase: 'volta-calma', sets: 1 })]
    expect(adaptSessionForSafety(items, { ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 0 } }).changes).toEqual([])
  })
})
