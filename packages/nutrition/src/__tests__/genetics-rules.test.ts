import { describe, it, expect } from 'vitest'
import type { GeneraNutritionEntry } from '@helux/types'
import { classifyMarkers, nutritionFlags } from '../genetics-rules'

const e = (gene: string, genotype: string, label: string, result: string, section: GeneraNutritionEntry['section'] = 'achados_adicionais', source: 'nutri' | 'fit' = 'nutri'): GeneraNutritionEntry => ({
  gene, snp: `rs-${gene}-${label}`, genotype, label, result, section, source,
})

// Marcadores reais do genera.json do usuário (spec 018, US4 cenário 1).
const DOUG: GeneraNutritionEntry[] = [
  e('MCM6', 'G,G', 'Intolerância à lactose', 'Predisposição para desenvolver intolerância à lactose', 'pontos_de_atencao'),
  e('GC', 'A,C', 'Vitamina D', 'Predisposição para níveis reduzidos de vitamina D', 'pontos_de_atencao'),
  e('ALPL', 'A,G', 'Vitamina B6', 'Predisposição para níveis reduzidos de vitamina B6', 'cuidados_relevantes'),
  e('PPARG', 'C,C', 'Eficácia da dieta mediterrânea', 'Sem predisposição para perda de peso com a dieta mediterrânea', 'curiosidades'),
  e('FTO', 'T,T', 'Eficácia da dieta low carb', 'Sem predisposição para IMC elevado ao consumir dieta low carb (dieta low carb mais eficaz)', 'curiosidades'),
  e('ADORA2A', 'C,G', 'Sensibilidade à cafeína', 'Sem predisposição para aumento da ansiedade após consumo de cafeína'),
  e('FTO', 'T,T', 'Sensação de saciedade', 'Predisposição para maior sensação de saciedade'),
  e('MTHFR', 'G,A', 'Folato / Vitamina B9 (variante C677T)', 'Sem predisposição para níveis reduzidos de folato'),
  e('WNT16', 'C,T', 'Densidade óssea (força dos ossos)', 'Predisposição para menor densidade óssea', 'pontos_de_atencao', 'fit'),
  e('ACTN3', 'C,C', 'Performance atlética', 'Predisposição para performance em esportes de potência', 'curiosidades', 'fit'),
]

const byLabel = (label: string) => classifyMarkers(DOUG).find((m) => m.label === label)!

describe('classifyMarkers (spec 018, US4)', () => {
  it('classifica os marcadores do usuário nas categorias e status do spec', () => {
    expect(byLabel('Intolerância à lactose')).toMatchObject({ gene: 'MCM6', category: 'metabolismo-sensibilidades', status: 'atencao' })
    expect(byLabel('Sensibilidade à cafeína')).toMatchObject({ gene: 'ADORA2A', category: 'metabolismo-sensibilidades', status: 'favoravel' })
    expect(byLabel('Sensação de saciedade')).toMatchObject({ gene: 'FTO', category: 'metabolismo-sensibilidades', status: 'favoravel' })
    expect(byLabel('Vitamina D')).toMatchObject({ category: 'micronutrientes-vitaminas', status: 'atencao' })
    expect(byLabel('Vitamina B6')).toMatchObject({ category: 'micronutrientes-vitaminas', status: 'atencao' })
    expect(byLabel('Densidade óssea (força dos ossos)')).toMatchObject({ category: 'micronutrientes-vitaminas', status: 'atencao' })
    expect(byLabel('Eficácia da dieta low carb')).toMatchObject({ category: 'perfil-muscular-dieta', status: 'favoravel' })
    expect(byLabel('Performance atlética')).toMatchObject({ gene: 'ACTN3', category: 'perfil-muscular-dieta', status: 'favoravel' })
  })

  it('pontos de atenção têm conduta prática (recomendar e evitar)', () => {
    const lactose = byLabel('Intolerância à lactose')
    expect(lactose.conduct?.recommend.length).toBeGreaterThan(0)
    expect(lactose.conduct?.avoid.join(' ')).toMatch(/leite/i)
    expect(byLabel('Densidade óssea (força dos ossos)').conduct?.recommend.join(' ')).toMatch(/cálcio/i)
  })

  it('marcador sem regra própria fica neutro, sem conduta, na categoria pelo tema', () => {
    expect(byLabel('Eficácia da dieta mediterrânea')).toMatchObject({ status: 'neutro', category: 'perfil-muscular-dieta' })
    expect(byLabel('Eficácia da dieta mediterrânea').conduct).toBeUndefined()
    expect(byLabel('Folato / Vitamina B9 (variante C677T)')).toMatchObject({ status: 'neutro', category: 'micronutrientes-vitaminas' })
  })

  it('genótipo sem a predisposição não vira ponto de atenção', () => {
    const [m] = classifyMarkers([e('MCM6', 'A,A', 'Intolerância à lactose', 'Sem predisposição para desenvolver intolerância à lactose')])
    expect(m.status).not.toBe('atencao')
  })

  it('FTO com maior predisposição à obesidade é ponto de atenção, com conduta', () => {
    const [m] = classifyMarkers([e('FTO', 'T,C', 'Risco de obesidade', 'Maior predisposição para obesidade', 'cuidados_relevantes', 'fit')])
    expect(m).toMatchObject({ category: 'metabolismo-sensibilidades', status: 'atencao' })
    expect(m.conduct?.recommend.length).toBeGreaterThan(0)
  })

  it('mantém gene, genótipo e textos originais', () => {
    expect(byLabel('Vitamina D')).toMatchObject({ gene: 'GC', genotype: 'A,C', result: 'Predisposição para níveis reduzidos de vitamina D' })
  })
})

describe('nutritionFlags (spec 018)', () => {
  it('flags do perfil do usuário', () => {
    expect(nutritionFlags(classifyMarkers(DOUG))).toEqual({
      intoleranciaLactose: true,
      vitaminaDBaixa: true,
      b6Baixa: true,
      densidadeOsseaBaixa: true,
      lowCarbEficaz: true,
      cafeinaTolerada: true,
      perfilPotencia: true,
    })
  })

  it('sem marcadores → nenhuma flag', () => {
    expect(Object.values(nutritionFlags([])).every((v) => v === false)).toBe(true)
  })

  it('sem predisposição à intolerância → sem filtro de lactose', () => {
    const flags = nutritionFlags(classifyMarkers([e('MCM6', 'A,A', 'Intolerância à lactose', 'Sem predisposição para desenvolver intolerância à lactose')]))
    expect(flags.intoleranciaLactose).toBe(false)
  })
})
