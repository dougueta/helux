import { describe, it, expect } from 'vitest'
import type { GeneticProfile } from '@helux/types'
import { getWorkoutConstraints } from '../rules'

const DOUG_PROFILE: GeneticProfile = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'medio',
  predisposicao: 'misto',
  alertas: [
    'Predisposição para menor densidade óssea (WNT16) — manter cálcio e vitamina D',
    'Ganho de massa muscular com menos facilidade (PPARD) — treino e dieta hipercalórica são essenciais',
    'Recuperação da frequência cardíaca mais lenta após exercício',
    'Maior suscetibilidade de sofrer lesões no ligamento cruzado (COL1A1 C,C)',
    'Predisposição para lesões de ombro (COL1A1 C,C)',
    'Maior predisposição para obesidade (FTO T,C) — monitorar alimentação',
    'Predisposição para menor duração do sono — impacta recuperação muscular',
  ],
}

describe('getWorkoutConstraints', () => {
  it('maxWeeklyFrequency é 4 para recuperacaoMuscular media', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.maxWeeklyFrequency).toBe(4)
  })

  it('preferredVolume é medio para recuperacaoMuscular media', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.preferredVolume).toBe('medio')
  })

  it('restBetweenSets é 90-120s para recuperacaoMuscular media', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.restBetweenSets).toBe('90-120s')
  })

  it('cardioIntensityLimit é moderado para riscoCardiovascular medio', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.cardioIntensityLimit).toBe('moderado')
  })

  it('forbiddenExerciseTypes inclui pliometria quando alertas contém ligamento', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.forbiddenExerciseTypes).toContain('pliometria de alto impacto')
  })

  it('forbiddenExerciseTypes inclui arremessos quando alertas contém ombro', () => {
    const constraints = getWorkoutConstraints(DOUG_PROFILE)
    expect(constraints.forbiddenExerciseTypes).toContain('arremessos de alta intensidade')
  })

  it('recuperacaoMuscular baixa → frequência 3, volume baixo, descanso 120-180s', () => {
    const baixaProfile: GeneticProfile = { ...DOUG_PROFILE, recuperacaoMuscular: 'baixa', alertas: [] }
    const constraints = getWorkoutConstraints(baixaProfile)
    expect(constraints.maxWeeklyFrequency).toBe(3)
    expect(constraints.preferredVolume).toBe('baixo')
    expect(constraints.restBetweenSets).toBe('120-180s')
  })

  it('recuperacaoMuscular alta → frequência 5, volume alto, descanso 60-90s', () => {
    const altaProfile: GeneticProfile = { ...DOUG_PROFILE, recuperacaoMuscular: 'alta', alertas: [] }
    const constraints = getWorkoutConstraints(altaProfile)
    expect(constraints.maxWeeklyFrequency).toBe(5)
    expect(constraints.preferredVolume).toBe('alto')
    expect(constraints.restBetweenSets).toBe('60-90s')
  })

  it('riscoCardiovascular alto → cardioIntensityLimit leve', () => {
    const altoRiscoProfile: GeneticProfile = { ...DOUG_PROFILE, riscoCardiovascular: 'alto' }
    const constraints = getWorkoutConstraints(altoRiscoProfile)
    expect(constraints.cardioIntensityLimit).toBe('leve')
  })

  it('riscoCardiovascular baixo → cardioIntensityLimit alto', () => {
    const baixoRiscoProfile: GeneticProfile = { ...DOUG_PROFILE, riscoCardiovascular: 'baixo' }
    const constraints = getWorkoutConstraints(baixoRiscoProfile)
    expect(constraints.cardioIntensityLimit).toBe('alto')
  })

  it('sem alertas de lesão → forbiddenExerciseTypes vazio', () => {
    const semAlertas: GeneticProfile = { ...DOUG_PROFILE, alertas: [] }
    const constraints = getWorkoutConstraints(semAlertas)
    expect(constraints.forbiddenExerciseTypes).toHaveLength(0)
  })
})
