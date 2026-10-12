import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { parseGeneraTraits } from '../traits'

const entry = (over: Record<string, unknown>) => ({
  caracteristica: 'Traço',
  snp: 'rs1',
  gene: 'GENE',
  genotipo: 'A,G',
  resultado: 'Predisposição para algo',
  ...over,
})

describe('parseGeneraTraits', () => {
  it('lê só fit e painel de saúde esportiva, com os textos originais', () => {
    const traits = parseGeneraTraits({
      fit: {
        curiosidades: [
          entry({ caracteristica: 'Performance atlética', snp: 'rs1815739', gene: 'ACTN3', genotipo: 'C,C', resultado: 'Predisposição para melhor desempenho em atividades de força e explosão', categoria: 'curiosidade' }),
        ],
      },
      painel_saude_esportiva: { resultados: [entry({ snp: 'rs6265', gene: 'BDNF', categoria: 'performance' })] },
      nutri: { pontos_de_atencao: [entry({ snp: 'rs4988235', gene: 'MCM6' })] },
      farma: { pontos_de_atencao: [entry({ snp: 'rs4149056', gene: 'SLCO1B1' })] },
      aging: { pontos_de_atencao: [entry({ snp: 'rs9652490', gene: 'LINGO1' })] },
    })
    expect(traits.map(t => t.gene)).toEqual(['ACTN3', 'BDNF'])
    expect(traits[0]).toEqual({
      key: 'rs1815739:performance-atletica',
      gene: 'ACTN3',
      genotype: 'C,C',
      label: 'Performance atlética',
      level: 0.5,
      note: 'Predisposição para melhor desempenho em atividades de força e explosão',
      warn: false,
    })
  })

  it('deriva o nível do texto e da seção (FR-005)', () => {
    const traits = parseGeneraTraits({
      fit: {
        pontos_de_atencao: [entry({ snp: 'a', resultado: 'Predisposição para menor densidade óssea' })],
        achados_adicionais: [
          entry({ snp: 'b', resultado: 'Maior predisposição para obesidade' }),
          entry({ snp: 'c', resultado: 'Maior suscetibilidade de sofrer lesões' }),
          entry({ snp: 'd', resultado: 'Sem predisposição para IMC elevado' }),
          entry({ snp: 'e', resultado: 'Menor predisposição para fotoenvelhecimento' }),
          entry({ snp: 'f', resultado: 'Predisposição para maior força muscular' }),
        ],
      },
    })
    expect(Object.fromEntries(traits.map(t => [t.key.split(':')[0], t.level]))).toEqual({
      a: 0.9, b: 0.9, c: 0.9, d: 0.2, e: 0.2, f: 0.5,
    })
  })

  it('marca risco por seção ou categoria, inclusive lesão (FR-004)', () => {
    const traits = parseGeneraTraits({
      fit: {
        pontos_de_atencao: [entry({ snp: 'pa' })],
        cuidados_relevantes: [entry({ snp: 'cr' })],
        curiosidades: [entry({ snp: 'cu', categoria: 'curiosidade' })],
        achados_adicionais: [entry({ snp: 'aa' })],
      },
      painel_saude_esportiva: {
        resultados: [entry({ snp: 'le', categoria: 'lesao' }), entry({ snp: 'pf', categoria: 'performance' })],
      },
    })
    const warn = Object.fromEntries(traits.map(t => [t.key.split(':')[0], t.warn]))
    expect(warn).toEqual({ pa: true, cr: true, le: true, cu: false, pf: false, aa: false })
  })

  it('põe risco primeiro e mantém a ordem do teste no resto (FR-007)', () => {
    const traits = parseGeneraTraits({
      fit: {
        pontos_de_atencao: [entry({ snp: 'pa' })],
        cuidados_relevantes: [entry({ snp: 'cr' })],
        curiosidades: [entry({ snp: 'cu' })],
        achados_adicionais: [entry({ snp: 'aa' })],
      },
      painel_saude_esportiva: { resultados: [entry({ snp: 'pf', categoria: 'performance' }), entry({ snp: 'le', categoria: 'lesao' })] },
    })
    expect(traits.map(t => t.key.split(':')[0])).toEqual(['pa', 'cr', 'le', 'cu', 'pf', 'aa'])
  })

  it('deduplica por SNP + traço, mas mantém traços diferentes do mesmo SNP (FR-006)', () => {
    const ombro = entry({ snp: 'rs1800012', gene: 'COL1A1', caracteristica: 'Lesões de ombro', categoria: 'lesao' })
    const lca = entry({ snp: 'rs1800012', gene: 'COL1A1', caracteristica: 'Lesões no ligamento cruzado', categoria: 'lesao' })
    const traits = parseGeneraTraits({
      fit: { cuidados_relevantes: [ombro] },
      painel_saude_esportiva: { resultados: [ombro, lca] },
    })
    expect(traits.map(t => t.label)).toEqual(['Lesões de ombro', 'Lesões no ligamento cruzado'])
    expect(new Set(traits.map(t => t.key)).size).toBe(2)
  })

  it('omite genótipo vazio e mantém gene descritivo como veio', () => {
    const [t] = parseGeneraTraits({ fit: { curiosidades: [entry({ gene: 'Próximo ao gene RTEL1', genotipo: '' })] } })
    expect(t.gene).toBe('Próximo ao gene RTEL1')
    expect(t).not.toHaveProperty('genotype')
  })

  it('devolve lista vazia sem as seções ou com entrada inválida', () => {
    expect(parseGeneraTraits({})).toEqual([])
    expect(parseGeneraTraits(null)).toEqual([])
    expect(parseGeneraTraits({ fit: { curiosidades: [{ snp: 'x' }] } })).toEqual([])
  })

  it('com o teste Genera real, gera 21 marcadores e WNT16 em primeiro (SC-001)', () => {
    const file = path.resolve(__dirname, '../../../../apps/api/data/genetics/genera.json')
    const traits = parseGeneraTraits(JSON.parse(readFileSync(file, 'utf-8')))
    expect(traits).toHaveLength(21)
    expect(traits[0]).toMatchObject({ gene: 'WNT16', genotype: 'C,T', warn: true, level: 0.9 })
    expect(traits.filter(t => t.gene === 'COL1A1')).toHaveLength(2)
    expect(traits.every(t => t.key && t.label && t.note)).toBe(true)
  })
})
