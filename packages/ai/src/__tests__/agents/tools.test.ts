import { describe, it, expect } from 'vitest'
import { AGENT_TOOLS, validateToolInput } from '../../agents/tools'

describe('AGENT_TOOLS (022 T020, R5)', () => {
  it('ordem fixa por agente; ajuste de sessão só no treino', () => {
    expect(AGENT_TOOLS.treino.map(t => t.name)).toEqual(['record_conversation_fact', 'propose_shared_guidance', 'propose_session_adjustment', 'suggest_specialist'])
    expect(AGENT_TOOLS.medicina.map(t => t.name)).toEqual(['record_conversation_fact', 'propose_shared_guidance', 'suggest_specialist'])
    expect(AGENT_TOOLS.nutricao.map(t => t.name)).toEqual(['record_conversation_fact', 'propose_shared_guidance', 'suggest_specialist'])
  })

  it('strict, eager_input_streaming e schemas fechados', () => {
    for (const t of AGENT_TOOLS.treino) {
      expect(t.strict).toBe(true)
      expect(t.eager_input_streaming).toBe(true)
      const schema = t.input_schema as unknown as { additionalProperties: boolean; required: string[]; properties: object }
      expect(schema.additionalProperties).toBe(false)
      expect([...schema.required].sort()).toEqual(Object.keys(schema.properties).sort())
    }
  })
})

describe('validateToolInput', () => {
  it('relato: categoria e texto 3–280', () => {
    expect(validateToolInput('record_conversation_fact', { category: 'sintoma', text: 'dor no ombro' })).toEqual({ ok: true, value: { category: 'sintoma', text: 'dor no ombro' } })
    expect(validateToolInput('record_conversation_fact', { category: 'xx', text: 'dor' }).ok).toBe(false)
    expect(validateToolInput('record_conversation_fact', { category: 'sintoma', text: 'a' }).ok).toBe(false)
  })

  it('orientação: padrões do enum, ids do banco, duração 1–90 ou null', () => {
    const ok = { kind: 'restricao-seguranca', text: 'Evitar supino', reason: 'dor', durationDays: 14, blockedPatterns: ['empurrar-horizontal'], blockedExercises: ['supino-reto-barra'] }
    expect(validateToolInput('propose_shared_guidance', ok).ok).toBe(true)
    expect(validateToolInput('propose_shared_guidance', { ...ok, durationDays: null }).ok).toBe(true)
    expect(validateToolInput('propose_shared_guidance', { ...ok, durationDays: 120 }).ok).toBe(false)
    expect(validateToolInput('propose_shared_guidance', { ...ok, blockedExercises: ['inventado'] })).toMatchObject({ ok: false, error: expect.stringMatching(/banco/) })
    expect(validateToolInput('propose_shared_guidance', { ...ok, blockedPatterns: ['voar'] }).ok).toBe(false)
  })

  it('ajuste e encaminhamento', () => {
    expect(validateToolInput('propose_session_adjustment', { request: 'só 30 min', scope: 'hoje' }).ok).toBe(true)
    expect(validateToolInput('propose_session_adjustment', { request: 'x', scope: 'semana' }).ok).toBe(false)
    expect(validateToolInput('suggest_specialist', { to: 'medicina', reason: 'dor' }).ok).toBe(true)
    expect(validateToolInput('suggest_specialist', { to: 'dentista', reason: 'x' }).ok).toBe(false)
    expect(validateToolInput('ferramenta_x', {}).ok).toBe(false)
  })

  it('entrada truncada (não objeto) é inválida', () => {
    expect(validateToolInput('suggest_specialist', 'abc').ok).toBe(false)
    expect(validateToolInput('suggest_specialist', { to: 'medicina' }).ok).toBe(false)
  })
})
