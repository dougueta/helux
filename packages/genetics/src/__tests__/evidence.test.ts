import { describe, it, expect } from 'vitest'
import { evidenceFor } from '../evidence'
import { parseGeneraTraits } from '../traits'

// Spec 024 T015 — força da evidência por gene, para uso proporcional no treino (R14).

describe('evidenceFor', () => {
  it('genes com evidência moderada para treino e lesão', () => {
    expect(evidenceFor('ACTN3')).toBe('moderada')
    expect(evidenceFor('COL1A1')).toBe('moderada')
    expect(evidenceFor('COL5A1')).toBe('moderada')
    expect(evidenceFor('MMP3')).toBe('moderada')
  })

  it('genes sem evidência relevante para prescrever treino → fraca', () => {
    expect(evidenceFor('WNT16')).toBe('fraca')
    expect(evidenceFor('PPARD')).toBe('fraca')
    expect(evidenceFor('GENE-DESCONHECIDO')).toBe('fraca')
  })
})

describe('parseGeneraTraits com evidência', () => {
  it('cada traço recebe a força da evidência do gene', () => {
    const traits = parseGeneraTraits({
      fit: {
        curiosidades: [
          { caracteristica: 'Performance atlética', snp: 'rs1815739', gene: 'ACTN3', genotipo: 'C,C', resultado: 'Predisposição para força' },
          { caracteristica: 'Densidade óssea', snp: 'rs2707466', gene: 'WNT16', genotipo: 'C,T', resultado: 'Menor densidade óssea' },
        ],
      },
    })
    expect(traits.map(t => [t.gene, t.evidence])).toEqual([
      ['ACTN3', 'moderada'],
      ['WNT16', 'fraca'],
    ])
  })
})
