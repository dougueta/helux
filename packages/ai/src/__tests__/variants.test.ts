import { describe, it, expect } from 'vitest'
import type { GeneticProfile } from '@helux/types'
import { EXERCISE_BANK } from '../exercise-bank'
import { buildVariants, flaggedJoints } from '../variants'

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
    const variants = buildVariants('Agachamento Livre (Barra)', profile).filter((v) => !v.crossPattern)

    // 1 barra (rec) + halteres + maquina-cabo + peso-corporal = 4, deduped by equipment
    // (spec 013: equivalentes de outro padrão vêm à parte, marcados com crossPattern)
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
    // 92 pela regra de equipamento + 4 (spec 013: 1 nível a menos de carga no joelho sinalizado)
    expect(betterFit[0].match).toBe(96)
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

  // spec 013 (FR-003): a animação vem do próprio exercício, não do padrão genérico
  it('cada variante traz a animação do seu movimento e o implemento do equipamento', () => {
    const profile: GeneticProfile = {
      metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio',
      predisposicao: 'misto', alertas: [],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    expect(variants.find((v) => v.name === 'Agachamento Livre (Barra)')?.motion).toBe('squat')
    expect(variants.find((v) => v.name === 'Leg Press 45°')?.motion).toBe('leg-press')
    const bodyweight = variants.find((v) => v.equip === 'Peso corporal')
    expect(bodyweight?.implement).toBe('bodyweight')
  })

})

// ---- spec 013: equivalência genética entre padrões ----
describe('buildVariants — equivalência genética entre padrões (spec 013)', () => {
  const base: GeneticProfile = {
    metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: [],
  }
  const withAlert = (alerta: string): GeneticProfile => ({ ...base, alertas: [alerta] })
  const bank = (name: string) => EXERCISE_BANK.find((e) => e.name === name)!
  const cross = (name: string, profile: GeneticProfile) => buildVariants(name, profile).filter((v) => v.crossPattern)

  it('detecta as articulações sinalizadas nos alertas genéticos', () => {
    expect(flaggedJoints(['Tendinite no joelho'])).toEqual(['joelho'])
    expect(flaggedJoints(['Predisposição a lesão do manguito rotador'])).toEqual(['ombro'])
    expect(flaggedJoints(['Risco de hérnia de disco'])).toEqual(['lombar'])
    expect(flaggedJoints(['Menor resistência do colágeno em tendões'])).toEqual(['joelho', 'ombro', 'lombar'])
    expect(flaggedJoints(['Metabolismo lento de cafeína'])).toEqual([])
  })

  it('sem alerta articular não sugere equivalentes de outro padrão', () => {
    for (const name of ['Agachamento Livre (Barra)', 'Puxada Alta (Cabo)', 'Levantamento Terra (Barra)', 'Desenvolvimento Militar (Barra)']) {
      expect(cross(name, base), name).toEqual([])
      expect(cross(name, withAlert('Metabolismo lento de cafeína')), name).toEqual([])
    }
  })

  it('agachamento + alerta de joelho → equivalentes de dobrar quadril com menos carga no joelho e justificativa genética', () => {
    const original = bank('Agachamento Livre (Barra)')
    const equivalents = cross(original.name, withAlert('Tendinite no joelho'))
    expect(equivalents.length).toBeGreaterThanOrEqual(1)
    expect(equivalents.length).toBeLessThanOrEqual(2)
    for (const v of equivalents) {
      const entry = bank(v.name)
      expect(entry.pattern).toBe('dobrar-quadril')
      expect(entry.stress.joelho).toBeLessThan(original.stress.joelho)
      expect(v.why).toMatch(/joelho/)
      expect(v.why).toMatch(/gen[ée]tic/)
      expect(v.rec).toBeUndefined()
    }
    expect(new Set(equivalents.map((v) => v.equip)).size).toBe(equivalents.length)
  })

  it('puxada vertical + alerta de ombro → equivalentes de puxar horizontal com menos carga no ombro', () => {
    const original = bank('Puxada Alta (Cabo)')
    const equivalents = cross(original.name, withAlert('Instabilidade no ombro'))
    expect(equivalents.length).toBeGreaterThanOrEqual(1)
    for (const v of equivalents) {
      expect(bank(v.name).pattern).toBe('puxar-horizontal')
      expect(bank(v.name).stress.ombro).toBeLessThan(original.stress.ombro)
      expect(v.why).toMatch(/ombro/)
    }
  })

  it('levantamento terra + alerta lombar → equivalentes de agachar com menos carga lombar', () => {
    const original = bank('Levantamento Terra (Barra)')
    const equivalents = cross(original.name, withAlert('Risco aumentado de hérnia lombar'))
    expect(equivalents.length).toBeGreaterThanOrEqual(1)
    for (const v of equivalents) {
      expect(bank(v.name).pattern).toBe('agachar')
      expect(bank(v.name).stress.lombar).toBeLessThan(original.stress.lombar)
      expect(v.why).toMatch(/lombar/)
    }
  })

  it('desenvolvimento + alerta de ombro → equivalentes de empurrar horizontal', () => {
    const equivalents = cross('Desenvolvimento Militar (Barra)', withAlert('Lesão prévia no ombro'))
    expect(equivalents.length).toBeGreaterThanOrEqual(1)
    for (const v of equivalents) expect(bank(v.name).pattern).toBe('empurrar-horizontal')
  })

  it('não sugere equivalente que aumente a carga: supino + alerta de ombro não vira desenvolvimento', () => {
    expect(cross('Supino Reto (Barra)', withAlert('Lesão prévia no ombro'))).toEqual([])
  })

  it('isolamentos e core não recebem equivalentes de outro padrão', () => {
    const profile = withAlert('Menor resistência do colágeno em tendões')
    expect(cross('Cadeira Extensora', profile)).toEqual([])
    expect(cross('Prancha Abdominal (Peso Corporal)', profile)).toEqual([])
  })

  it('com várias articulações sinalizadas, o equivalente não aumenta a carga em nenhuma delas', () => {
    const original = bank('Agachamento Livre (Barra)')
    const profile: GeneticProfile = { ...base, alertas: ['Tendinite no joelho', 'Lesão no ombro'] }
    for (const v of cross(original.name, profile)) {
      const entry = bank(v.name)
      expect(entry.stress.joelho).toBeLessThanOrEqual(original.stress.joelho)
      expect(entry.stress.ombro).toBeLessThanOrEqual(original.stress.ombro)
    }
  })

  it('cenário de referência: lista completa ordenada, original com 74, equivalentes dentro de 50–99', () => {
    const profile: GeneticProfile = {
      metabolismo: 'rapido', recuperacaoMuscular: 'baixa', riscoCardiovascular: 'medio',
      predisposicao: 'forca', alertas: ['tendinite no joelho'],
    }
    const variants = buildVariants('Agachamento Livre (Barra)', profile)
    expect(variants.map((v) => [v.name, v.match, !!v.crossPattern])).toEqual([
      ['Leg Press 45°', 96, false],
      ['Levantamento Terra Romeno (Halteres)', 90, true],
      ['Elevação Pélvica (Peso Corporal)', 88, true],
      ['Agachamento Livre (Peso Corporal)', 84, false],
      ['Agachamento Búlgaro (Halteres)', 82, false],
      ['Agachamento Livre (Barra)', 74, false],
    ])
  })
})
