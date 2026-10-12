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

describe('buildMesocycleSystemPrompt — 3 fases (spec 014, US1)', () => {
  const prompt = buildMesocycleSystemPrompt(PROFILE, CONSTRAINTS)

  it('pede o campo phase com os três valores', () => {
    expect(prompt).toContain('"phase"')
    expect(prompt).toContain('"aquecimento"')
    expect(prompt).toContain('"principal"')
    expect(prompt).toContain('"volta-calma"')
  })

  it('explica aquecimento e volta à calma com 2 a 4 itens de nome livre', () => {
    expect(prompt).toContain('Estrutura da Sessão em 3 Fases')
    expect(prompt).toMatch(/Aquecimento.*2 a 4 itens/)
    expect(prompt).toMatch(/Volta à calma.*2 a 4 itens/)
    expect(prompt).toContain('catálogo vale apenas para os itens com `"phase": "principal"`')
  })

  it('amarra o cardio das fases ao limite de intensidade do atleta', () => {
    const intense = buildMesocycleSystemPrompt(PROFILE, { ...CONSTRAINTS, cardioIntensityLimit: 'leve' })
    expect(intense).toContain('cardio das fases de aquecimento e volta à calma não pode passar de: leve')
  })

  it('mostra o exemplo de JSON com as três fases', () => {
    const json = prompt.slice(prompt.indexOf('## Formato de Resposta'))
    expect(json.indexOf('"phase": "aquecimento"')).toBeGreaterThan(-1)
    expect(json.indexOf('"phase": "aquecimento"')).toBeLessThan(json.indexOf('"phase": "principal"'))
    expect(json.indexOf('"phase": "principal"')).toBeLessThan(json.indexOf('"phase": "volta-calma"'))
  })
})

describe('buildMesocycleSystemPrompt — biset (spec 014, US2)', () => {
  const prompt = buildMesocycleSystemPrompt(PROFILE, CONSTRAINTS)

  it('explica o campo supersetGroup e os limites do biset', () => {
    expect(prompt).toContain('## Biset (opcional)')
    expect(prompt).toContain('"supersetGroup"')
    expect(prompt).toContain('no máximo 2 bisets por sessão')
    expect(prompt).toMatch(/exatamente 2 exercícios consecutivos do treino principal/)
    expect(prompt).toContain('mesmo número de séries')
  })
})

describe('buildMesocycleUserPrompt — progressão de carga (spec 014, US3, FR-018)', () => {
  const decisions = [
    { name: 'Supino Reto', action: 'aumentar' as const, previousWeightKg: 40, nextWeightKg: 42, reason: 'Topo da faixa: +2 kg.' },
    { name: 'Remada Curvada', action: 'reduzir' as const, previousWeightKg: 50, nextWeightKg: 46, reason: 'Abaixo da faixa no limite: −4 kg.' },
    { name: 'Agachamento', action: 'sem-dados' as const, previousWeightKg: null, nextWeightKg: null, reason: 'Pulado.' },
  ]

  it('lista as decisões com carga (ignora sem-dados) na seção obrigatória', () => {
    const prompt = buildMesocycleUserPrompt([], [], 'Hipertrofia', 'intermediario', 4, undefined, undefined, undefined, decisions)
    expect(prompt).toContain('## Progressão de carga calculada — OBRIGATÓRIO')
    expect(prompt).toContain('- Supino Reto: 40 kg → 42 kg (aumentar) — Topo da faixa: +2 kg.')
    expect(prompt).toContain('- Remada Curvada: 50 kg → 46 kg (reduzir) — Abaixo da faixa no limite: −4 kg.')
    expect(prompt).not.toContain('Agachamento:')
  })

  it('sem decisões com carga, a seção não aparece', () => {
    const none = buildMesocycleUserPrompt([], [], 'Hipertrofia', 'intermediario', 4, undefined, undefined, undefined, [decisions[2]])
    expect(none).not.toContain('Progressão de carga calculada')
    expect(buildMesocycleUserPrompt([], [], 'Hipertrofia', 'intermediario', 4)).not.toContain('Progressão de carga calculada')
  })
})
