import { describe, it, expect } from 'vitest'
import type { GeneticProfile } from '@helux/types'
import { buildVariants } from '../variants'

describe('buildVariants', () => {
  it('retorna array vazio quando o exercício não existe no banco', () => {
    expect(buildVariants('Exercício Inexistente', {
      metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [],
    })).toEqual([])
  })

  it('gera 1 variante recomendada + 1 por equipamento distinto disponível no mesmo padrão de movimento', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)

    // 1 barra (rec) + halteres + maquina-cabo + peso-corporal = 4, deduped by equipment
    expect(variants).toHaveLength(4)
    expect(new Set(variants.map((v) => v.equip)).size).toBe(4)
  })

  it('marca exatamente a variante original como rec:true, com o match correto', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const recs = variants.filter((v) => v.rec)
    expect(recs).toHaveLength(1)
    expect(recs[0].name).toBe('Agachamento Livre (Barra)')
    expect(recs[0].match).toBe(74)
  })

  it('marca a Leg Press 45° como betterFit quando alertas de joelho favorecem máquina', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const betterFit = variants.filter((v) => v.betterFit)
    expect(betterFit).toHaveLength(1)
    expect(betterFit[0].name).toBe('Leg Press 45°')
    expect(betterFit[0].match).toBe(92)
  })

  it('ordena a lista por match decrescente', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    const matches = variants.map((v) => v.match)
    expect(matches).toEqual([...matches].sort((a, b) => b - a))
    expect(variants[0].name).toBe('Leg Press 45°')
  })

  it('não marca nenhuma variante como betterFit quando a recomendada já é a de maior fit', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'alta', riscoCardiovascular: 'baixo',
      predisposicao: 'forca', alertas: [],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    expect(variants.filter((v) => v.betterFit)).toHaveLength(0)
    expect(variants.find((v) => v.rec)?.match).toBe(92)
  })

  it('todo match fica entre 50 e 99', () => {
    const profile: GeneticProfile = {
      metabolismo: 'lento', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'alto',
      predisposicao: 'endurance', alertas: ['risco articular generalizado'],
    }
    for (const name of ['Agachamento Livre (Barra)', 'Supino Reto (Barra)', 'Levantamento Terra (Barra)']) {
      for (const v of buildVariants(name, profile)) {
        expect(v.match).toBeGreaterThanOrEqual(50)
        expect(v.match).toBeLessThanOrEqual(99)
      }
    }
  })

  it('why nunca é uma string vazia', () => {
    const profile: GeneticProfile = {
      metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio',
      predisposicao: 'misto', alertas: [],
    }
    for (const v of buildVariants('Agachamento Livre (Barra)', profile)) {
      expect(v.why.length).toBeGreaterThan(0)
    }
  })
})
