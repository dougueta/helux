import { describe, it, expect } from 'vitest'
import type { GeneticProfile, WorkoutConstraints } from '@helux/types'
import { buildMesocycleSystemPrompt, buildMesocycleUserPrompt } from '../mesocycle-prompts'
import { buildContextBody, buildUserPrompt } from '../prompts'

const PROFILE: GeneticProfile = {
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'baixo',
  predisposicao: 'misto',
  alertas: [],
}

const CONSTRAINTS: WorkoutConstraints = {
  maxWeeklyFrequency: 4,
  preferredVolume: 'medio',
  restBetweenSets: '90-120s',
  forbiddenExerciseTypes: [],
  cardioIntensityLimit: 'moderado',
}

describe('buildMesocycleSystemPrompt — Alertas Situacionais (US1)', () => {
  it('inclui o bloco de Alertas Situacionais quando currentInjury está preenchido', () => {
    const prompt = buildMesocycleSystemPrompt(PROFILE, CONSTRAINTS, 'Dor no ombro direito ao levantar acima da cabeça')
    expect(prompt).toContain('Alertas Situacionais')
    expect(prompt).toContain('OBRIGATÓRIO RESPEITAR')
    expect(prompt).toContain('Dor no ombro direito ao levantar acima da cabeça')
  })

  it('não inclui o bloco quando currentInjury está ausente', () => {
    const prompt = buildMesocycleSystemPrompt(PROFILE, CONSTRAINTS)
    expect(prompt).not.toContain('Alertas Situacionais')
  })

  it('não inclui o bloco quando currentInjury é string vazia', () => {
    const prompt = buildMesocycleSystemPrompt(PROFILE, CONSTRAINTS, '')
    expect(prompt).not.toContain('Alertas Situacionais')
  })
})

describe('buildContextBody — tempo treinando / tempo parado (US1)', () => {
  it('inclui linhas de tempo treinando e tempo parado quando fornecidos', () => {
    const body = buildContextBody([], [], 'Hipertrofia', 'intermediario', 4, undefined, '3 anos', '6 meses parado')
    expect(body).toContain('3 anos')
    expect(body).toContain('6 meses parado')
  })

  it('não quebra quando tempo treinando/parado não são fornecidos', () => {
    const body = buildContextBody([], [], 'Hipertrofia', 'intermediario', 4)
    expect(body).toContain('Hipertrofia')
  })
})

describe('buildMesocycleUserPrompt propaga trainingTime/timeOff', () => {
  it('inclui os valores no prompt final', () => {
    const prompt = buildMesocycleUserPrompt([], [], 'Hipertrofia', 'intermediario', 4, undefined, '3 anos', '6 meses parado')
    expect(prompt).toContain('3 anos')
    expect(prompt).toContain('6 meses parado')
  })
})

describe('buildUserPrompt (fluxo legado) propaga trainingTime/timeOff sem quebrar (Nota de Escopo)', () => {
  it('inclui os valores no prompt final quando fornecidos', () => {
    const prompt = buildUserPrompt([], [], 'Hipertrofia', 'intermediario', 4, undefined, '3 anos', '6 meses parado')
    expect(prompt).toContain('3 anos')
    expect(prompt).toContain('6 meses parado')
  })
})
