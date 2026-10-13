import { describe, it, expect } from 'vitest'
import type { PlannedExercise } from '@helux/types'
import { DEFAULT_REST_SECONDS, nextStepAfterSet, restSecondsAfterSet } from '../workout-flow'

const ex = (name: string, extra: Partial<PlannedExercise> = {}): PlannedExercise => ({
  name,
  sets: 3,
  reps: '10',
  weight: '20kg',
  ...extra,
})

const plan = [
  ex('Esteira', { phase: 'aquecimento' }),
  ex('Supino', { supersetGroup: 'b1' }),
  ex('Remada', { supersetGroup: 'b1' }),
  ex('Rosca'),
  ex('Alongamento', { phase: 'volta-calma' }),
]

describe('workout-flow (spec 014, contracts/workout-flow.md)', () => {
  it('descanso padrão é 90 s', () => {
    expect(DEFAULT_REST_SECONDS).toBe(90)
  })

  it('aquecimento e volta à calma: sem descanso, sem navegação', () => {
    const pending = [true, true, true, true, true]
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 0, hasPendingSets: pending })).toEqual({ restSeconds: 0, goToExerciseIndex: null })
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 4, hasPendingSets: pending })).toEqual({ restSeconds: 0, goToExerciseIndex: null })
  })

  it('exercício comum: descanso padrão e permanece', () => {
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 3, hasPendingSets: [true, true, true, true, true] })).toEqual({
      restSeconds: DEFAULT_REST_SECONDS,
      goToExerciseIndex: null,
    })
  })

  it('1º do biset com parceiro pendente: sem descanso, vai ao parceiro', () => {
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 1, hasPendingSets: [false, true, true, true, true] })).toEqual({
      restSeconds: 0,
      goToExerciseIndex: 2,
    })
  })

  it('2º do biset com o 1º pendente: descansa e volta ao 1º', () => {
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 2, hasPendingSets: [false, true, true, true, true] })).toEqual({
      restSeconds: DEFAULT_REST_SECONDS,
      goToExerciseIndex: 1,
    })
  })

  it('biset com parceiro sem séries pendentes: comportamento de exercício comum', () => {
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 1, hasPendingSets: [false, true, false, true, true] })).toEqual({
      restSeconds: DEFAULT_REST_SECONDS,
      goToExerciseIndex: null,
    })
    expect(nextStepAfterSet({ exercises: plan, exerciseIndex: 2, hasPendingSets: [false, false, true, true, true] })).toEqual({
      restSeconds: DEFAULT_REST_SECONDS,
      goToExerciseIndex: null,
    })
  })

  it('plano antigo sem fases/biset: sempre descanso padrão', () => {
    const legacy = [ex('A'), ex('B')]
    expect(nextStepAfterSet({ exercises: legacy, exerciseIndex: 0, hasPendingSets: [true, true] })).toEqual({
      restSeconds: DEFAULT_REST_SECONDS,
      goToExerciseIndex: null,
    })
  })

  it('restSecondsAfterSet é o ponto único do tempo de descanso', () => {
    expect(restSecondsAfterSet({ exercises: plan, exerciseIndex: 1, hasPendingSets: [false, true, true, true, true] })).toBe(0)
    expect(restSecondsAfterSet({ exercises: plan, exerciseIndex: 3, hasPendingSets: [false, true, true, true, true] })).toBe(DEFAULT_REST_SECONDS)
  })
})
