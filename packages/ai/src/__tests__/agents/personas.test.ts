import { describe, it, expect } from 'vitest'
import { PERSONA, MEDICAL_RED_FLAGS } from '../../agents/personas'

describe('personas dos especialistas (022 T021)', () => {
  it('todas: time Helux, escopos dos outros, fontes citadas (FR-004), encaminhamento (FR-020) e emergência', () => {
    for (const text of Object.values(PERSONA)) {
      expect(text).toContain('Helux')
      expect(text).toMatch(/Agente de Treino/)
      expect(text).toMatch(/Medicina Esportiva/)
      expect(text).toMatch(/Nutrição Genética/)
      expect(text).toMatch(/fontes/i)
      expect(text).toContain('suggest_specialist')
      expect(text).toMatch(/emergência/i)
      expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    }
  })

  it('treino: ajuste só com confirmação (FR-009) e segurança acima do pedido', () => {
    expect(PERSONA.treino).toContain('propose_session_adjustment')
    expect(PERSONA.treino).toMatch(/confirm/i)
  })

  it('medicina: sem diagnóstico nem medicamento, triagem, aviso e sinais de alerta (FR-013–015)', () => {
    expect(PERSONA.medicina).toMatch(/não substitui avaliação médica/i)
    expect(PERSONA.medicina).toMatch(/diagnóstico/i)
    expect(PERSONA.medicina).toMatch(/medicamento/i)
    expect(PERSONA.medicina).toMatch(/triagem/i)
    for (const flag of MEDICAL_RED_FLAGS) expect(PERSONA.medicina).toContain(flag)
    expect(PERSONA.medicina).toContain('restricao-seguranca')
  })

  it('nutrição: restrições genéticas (lactose) e profissional para dosagem (FR-017)', () => {
    expect(PERSONA.nutricao).toMatch(/lactose/i)
    expect(PERSONA.nutricao).toMatch(/dosagem/i)
    expect(PERSONA.nutricao).toMatch(/médico ou nutricionista/i)
  })
})
