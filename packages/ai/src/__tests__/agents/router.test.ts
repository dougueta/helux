import { describe, it, expect } from 'vitest'
import { matchesMedicalRedFlag } from '../../agents/router'

describe('matchesMedicalRedFlag (022 T026, R10)', () => {
  it.each([
    'Senti uma dor no peito durante a corrida',
    'estou com APERTO NO PEITO depois do treino',
    'tive falta de ar muito forte, desproporcional ao esforço',
    'quase desmaiei no agachamento',
    'Desmaiei ontem na academia',
    'palpitação e tontura no fim do treino',
    'perdi a força do braço de repente',
    'perda súbita de sensibilidade na perna',
    'dormência no braço esquerdo que não passa',
    'formigamento de um lado do corpo',
    'dor de cabeça súbita e muito intensa no supino',
    'o tornozelo inchou muito e ficou deformado depois da torção',
    'ouvi um estalo e não consigo apoiar o pé',
    'minha urina ficou escura depois do treino pesado',
    'urina cor de coca-cola após o crossfit',
    'febre e dor muscular intensa no corpo todo',
  ])('alerta: %s', msg => {
    expect(matchesMedicalRedFlag(msg)).toBe(true)
  })

  it.each([
    'qual o melhor pré-treino para hoje?',
    'dor muscular leve no dia seguinte ao treino de perna',
    'quero treinar peito com mais volume',
    'posso tomar café antes do treino?',
    'tive uma leve dor no ombro ao fazer supino',
    'falta de ar normal depois de um sprint',
  ])('sem alerta: %s', msg => {
    expect(matchesMedicalRedFlag(msg)).toBe(false)
  })
})
