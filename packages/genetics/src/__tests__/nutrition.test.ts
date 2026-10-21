import { describe, it, expect } from 'vitest'
import { parseGeneraNutrition } from '../nutrition'

// Recorte do genera.json real (módulos nutri e fit).
const RAW = {
  nutri: {
    pontos_de_atencao: [
      { caracteristica: 'Intolerância à lactose', snp: 'rs4988235', gene: 'MCM6', genotipo: 'G,G', resultado: 'Predisposição para desenvolver intolerância à lactose' },
      { caracteristica: 'Vitamina D', snp: 'rs7041', gene: 'GC', genotipo: 'A,C', resultado: 'Predisposição para níveis reduzidos de vitamina D' },
    ],
    cuidados_relevantes: [
      { caracteristica: 'Vitamina B6', snp: 'rs1256335', gene: 'ALPL', genotipo: 'A,G', resultado: 'Predisposição para níveis reduzidos de vitamina B6' },
    ],
    curiosidades: [
      { caracteristica: 'Eficácia da dieta low carb', snp: 'rs9939609', gene: 'FTO', genotipo: 'T,T', resultado: 'Sem predisposição para IMC elevado ao consumir dieta low carb (dieta low carb mais eficaz)' },
    ],
    achados_adicionais: [
      { caracteristica: 'Sensibilidade à cafeína', snp: 'rs4822492', gene: 'ADORA2A', genotipo: 'C,G', resultado: 'Sem predisposição para aumento da ansiedade após consumo de cafeína' },
      { caracteristica: 'Sensibilidade à cafeína', snp: 'rs4822492', gene: 'ADORA2A', genotipo: 'C,G', resultado: 'repetido' },
      { caracteristica: 'Sem gene' },
    ],
  },
  fit: {
    pontos_de_atencao: [
      { caracteristica: 'Densidade óssea (força dos ossos)', snp: 'rs3801387', gene: 'WNT16', genotipo: 'C,T', resultado: 'Predisposição para menor densidade óssea' },
    ],
    curiosidades: [
      { caracteristica: 'Performance atlética', snp: 'rs1815739', gene: 'ACTN3', genotipo: 'C,C', resultado: 'Predisposição para performance em esportes de potência' },
      { caracteristica: 'Tipo de fibra', snp: 'rs1', gene: 'PPARGC1A', genotipo: 'A,A', resultado: 'fora do recorte de nutrição' },
    ],
  },
}

describe('parseGeneraNutrition (spec 018)', () => {
  it('lê os marcadores de nutri e os de fit relevantes para nutrição (WNT16, ACTN3, FTO)', () => {
    const entries = parseGeneraNutrition(RAW)
    expect(entries.map((e) => `${e.source}:${e.gene}`)).toEqual([
      'nutri:MCM6', 'nutri:GC', 'nutri:ALPL', 'nutri:FTO', 'nutri:ADORA2A', 'fit:WNT16', 'fit:ACTN3',
    ])
  })

  it('mantém os textos originais e a seção', () => {
    const [mcm6] = parseGeneraNutrition(RAW)
    expect(mcm6).toEqual({
      gene: 'MCM6', snp: 'rs4988235', genotype: 'G,G', label: 'Intolerância à lactose',
      result: 'Predisposição para desenvolver intolerância à lactose', section: 'pontos_de_atencao', source: 'nutri',
    })
  })

  it('não repete SNP + traço e ignora entradas incompletas', () => {
    const adora = parseGeneraNutrition(RAW).filter((e) => e.gene === 'ADORA2A')
    expect(adora).toHaveLength(1)
  })

  it('entrada inválida → lista vazia', () => {
    expect(parseGeneraNutrition(null)).toEqual([])
    expect(parseGeneraNutrition({})).toEqual([])
    expect(parseGeneraNutrition('x')).toEqual([])
  })
})
