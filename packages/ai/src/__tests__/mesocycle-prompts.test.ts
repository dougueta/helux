import { describe, it, expect } from 'vitest'
import type { HardConstraints } from '@helux/types'
import { buildMesocycleMethod, buildMesocycleRequest } from '../mesocycle-prompts'
import { buildContextBody, buildUserPrompt } from '../prompts'

const NONE: HardConstraints = { availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null }

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

describe('buildUserPrompt (fluxo legado) propaga trainingTime/timeOff sem quebrar (Nota de Escopo)', () => {
  it('inclui os valores no prompt final quando fornecidos', () => {
    const prompt = buildUserPrompt([], [], 'Hipertrofia', 'intermediario', 4, undefined, '3 anos', '6 meses parado')
    expect(prompt).toContain('3 anos')
    expect(prompt).toContain('6 meses parado')
  })
})

describe('buildMesocycleMethod (022 T011)', () => {
  const method = buildMesocycleMethod('leve')

  it('é o Agente de Treino, usa o Perfil Integrado e prioriza a segurança em conflitos (FR-010)', () => {
    expect(method).toContain('Agente de Treino')
    expect(method).toContain('Perfil Integrado')
    expect(method).toMatch(/priorize a segurança, explique o conflito/)
    expect(method).toMatch(/fontes não foram usadas/)
  })

  it('pede decisões com fontes (FR-008)', () => {
    expect(method).toContain('`decisions`')
    expect(method).toMatch(/perfil, preferencias, historico/)
  })

  it('mantém as 3 fases, o biset e o catálogo (spec 014)', () => {
    expect(method).toContain('"phase": "aquecimento"')
    expect(method).toContain('"phase": "volta-calma"')
    expect(method).toContain('supersetGroup')
    expect(method).toContain('Catálogo de Exercícios')
    expect(method).toContain('não pode passar de: leve')
  })

  it('é estável (sem data/hora), para o cache', () => {
    expect(buildMesocycleMethod('leve')).toBe(method)
    expect(method).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})

describe('buildMesocycleRequest (022 T011)', () => {
  it('lista as restrições rígidas com nomes do banco', () => {
    const text = buildMesocycleRequest({
      daysPerWeek: 3,
      constraints: {
        availableEquipment: ['halteres', 'peso-corporal'],
        exercisesToAvoid: ['agachamento-livre-barra'],
        maxSessionMinutes: 45,
        blockedPatterns: ['empurrar-vertical'],
        blockedExercises: ['Remada Unilateral (Halteres)'],
        maxJointStress: {},
        maxCardioImpact: null,
        minRir: null,
      },
    })
    expect(text).toContain('Dias de treino por semana: 3')
    expect(text).toContain('Equipamentos disponíveis: halteres, peso-corporal')
    expect(text).toContain('Duração máxima por sessão: 45 min')
    expect(text).toContain('Exercícios a evitar: Agachamento Livre (Barra)')
    expect(text).toContain('Padrões de movimento bloqueados por restrição de segurança: empurrar-vertical')
    expect(text).toContain('Remada Unilateral (Halteres)')
  })

  it('sem restrições: equipamentos "todos" e nada de duração', () => {
    const text = buildMesocycleRequest({ daysPerWeek: 4, constraints: NONE })
    expect(text).toContain('Equipamentos disponíveis: todos')
    expect(text).not.toContain('Duração máxima')
  })

  it('no retry, inclui as violações a corrigir', () => {
    const text = buildMesocycleRequest({
      daysPerWeek: 4,
      constraints: NONE,
      violations: [{ sessionIndex: 1, exercise: 'Leg Press 45°', rule: 'equipamento', message: 'Leg Press 45° usa equipamento indisponível' }],
    })
    expect(text).toContain('## Correção obrigatória')
    expect(text).toContain('- Sessão 2: Leg Press 45° usa equipamento indisponível')
  })

  describe('progressão de carga (spec 014, US3, FR-018)', () => {
    const decisions = [
      { name: 'Supino Reto', action: 'aumentar' as const, previousWeightKg: 40, nextWeightKg: 42, reason: 'Topo da faixa: +2 kg.' },
      { name: 'Remada Curvada', action: 'reduzir' as const, previousWeightKg: 50, nextWeightKg: 46, reason: 'Abaixo da faixa no limite: −4 kg.' },
      { name: 'Agachamento', action: 'sem-dados' as const, previousWeightKg: null, nextWeightKg: null, reason: 'Pulado.' },
    ]

    it('lista as decisões com carga (ignora sem-dados) na seção obrigatória', () => {
      const prompt = buildMesocycleRequest({ daysPerWeek: 4, constraints: NONE, loadProgression: decisions })
      expect(prompt).toContain('## Progressão de carga calculada — OBRIGATÓRIO')
      expect(prompt).toContain('- Supino Reto: 40 kg → 42 kg (aumentar) — Topo da faixa: +2 kg.')
      expect(prompt).toContain('- Remada Curvada: 50 kg → 46 kg (reduzir) — Abaixo da faixa no limite: −4 kg.')
      expect(prompt).not.toContain('Agachamento:')
    })

    it('sem decisões com carga, a seção não aparece', () => {
      expect(buildMesocycleRequest({ daysPerWeek: 4, constraints: NONE, loadProgression: [decisions[2]] })).not.toContain('Progressão de carga calculada')
    })
  })
})
