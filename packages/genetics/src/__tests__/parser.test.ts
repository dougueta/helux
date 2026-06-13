import { describe, it, expect } from 'vitest'
import { parseGeneraJson } from '../parser'

const DOUG_GENERA = {
  fit: {
    pontos_de_atencao: [
      {
        caracteristica: 'Densidade óssea (força dos ossos)',
        snp: 'rs2707466',
        gene: 'WNT16',
        genotipo: 'C,T',
        resultado: 'Predisposição para menor densidade óssea',
        categoria: 'ponto_atencao',
      },
    ],
    cuidados_relevantes: [
      {
        caracteristica: 'Risco de obesidade',
        snp: 'rs1861868',
        gene: 'FTO',
        genotipo: 'T,C',
        resultado: 'Maior predisposição para obesidade',
        categoria: 'cuidado_relevante',
      },
      {
        caracteristica: 'Ganho de massa muscular',
        snp: 'rs2267668',
        gene: 'PPARD',
        genotipo: 'A,G',
        resultado: 'Predisposição para ganhar massa muscular com menos facilidade',
        categoria: 'cuidado_relevante',
      },
      {
        caracteristica: 'Recuperação da frequência cardíaca após exercício',
        snp: 'rs324640',
        gene: 'CHRM2',
        genotipo: 'G,A',
        resultado: 'Predisposição para recuperação mais lenta da frequência cardíaca',
        categoria: 'cuidado_relevante',
      },
    ],
    curiosidades: [
      {
        caracteristica: 'Performance atlética',
        snp: 'rs1815739',
        gene: 'ACTN3',
        genotipo: 'C,C',
        resultado: 'Predisposição para melhor desempenho em atividades de força e explosão',
        categoria: 'curiosidade',
      },
      {
        caracteristica: 'Habilidade esportiva',
        snp: 'rs8192678',
        gene: 'PPARGC1A',
        genotipo: 'C,C',
        resultado: 'Predisposição mais favorável para habilidade esportiva',
        categoria: 'curiosidade',
      },
    ],
    achados_adicionais: [
      {
        caracteristica: 'Resistência física',
        snp: 'rs1572312',
        gene: 'NFIA-AS2',
        genotipo: 'G,G',
        resultado: 'Predisposição para maior captação de oxigênio e maior resistência física',
      },
      {
        caracteristica: 'Dor muscular após exercício físico',
        snp: 'rs7924316',
        gene: 'IGF2-AS',
        genotipo: 'G,T',
        resultado: 'Predisposição para menor dor muscular após a prática de exercícios',
      },
      {
        caracteristica: 'Danos musculares induzidos por atividade física de alta intensidade',
        snp: 'rs4880',
        gene: 'SOD2',
        genotipo: 'G,G',
        resultado: 'Sem predisposição para danos musculares após atividade física de alta intensidade',
      },
      {
        caracteristica: 'Índice de massa corporal (IMC)',
        snp: 'rs9939609',
        gene: 'FTO',
        genotipo: 'T,T',
        resultado: 'Sem predisposição para IMC elevado',
      },
      {
        caracteristica: 'Força muscular',
        snp: 'rs1800169',
        gene: 'CNTF',
        genotipo: 'A,G',
        resultado: 'Predisposição para maior força muscular',
      },
      {
        caracteristica: 'Resistência muscular',
        snp: 'rs4253778',
        gene: 'PPARA',
        genotipo: 'C,G',
        resultado:
          'Predisposição para maior resistência muscular em exercícios de alta intensidade e longa duração',
      },
      {
        caracteristica: 'Capacidade cardiorrespiratória',
        snp: 'rs1042713',
        gene: 'ADRB2',
        genotipo: 'A,G',
        resultado: 'Predisposição para maior capacidade cardiorrespiratória',
      },
    ],
  },
  escala_risco_genetico: {
    risco_aumentado: [
      {
        condicao: 'Fibrilação atrial',
        risco_pct: 27.36,
        intervalo: '25.99-28.73',
        nivel: 'aumentado',
      },
      {
        condicao: 'Diabetes tipo 2',
        risco_pct: 48.88,
        intervalo: '46.43-51.32',
        nivel: 'aumentado',
      },
    ],
    risco_padrao: [
      {
        condicao: 'Doença arterial coronariana',
        risco_pct: 47.75,
        nivel: 'padrao',
      },
    ],
    risco_reduzido: [],
  },
  painel_saude_esportiva: {
    resultados: [
      {
        caracteristica: 'Lesões de ombro',
        snp: 'rs1800012',
        gene: 'COL1A1',
        genotipo: 'C,C',
        resultado: 'Predisposição para sofrer lesões de ombro',
        categoria: 'lesao',
      },
      {
        caracteristica: 'Lesões no ligamento cruzado',
        snp: 'rs1800012',
        gene: 'COL1A1',
        genotipo: 'C,C',
        resultado: 'Maior suscetibilidade de sofrer lesões no ligamento cruzado',
        categoria: 'lesao',
      },
    ],
  },
  resumo_fitness: {
    pontos_fortes: [
      'Performance atlética favorável para força e explosão (ACTN3 C,C)',
      'Predisposição para maior resistência física e captação de oxigênio',
    ],
    pontos_de_atencao: [
      'Predisposição para menor densidade óssea (WNT16) — manter cálcio e vitamina D',
      'Ganho de massa muscular com menos facilidade (PPARD) — treino e dieta hipercalórica são essenciais',
      'Recuperação da frequência cardíaca mais lenta após exercício',
      'Maior suscetibilidade de sofrer lesões no ligamento cruzado (COL1A1 C,C)',
      'Predisposição para lesões de ombro (COL1A1 C,C)',
      'Maior predisposição para obesidade (FTO T,C) — monitorar alimentação',
      'Predisposição para menor duração do sono — impacta recuperação muscular',
    ],
  },
}

describe('parseGeneraJson', () => {
  it('metabolismo é moderado quando FTO T,T (sem IMC elevado) mas com risco de obesidade', () => {
    const profile = parseGeneraJson(DOUG_GENERA)
    expect(profile.metabolismo).toBe('moderado')
  })

  it('recuperacaoMuscular é media quando CHRM2 G,A (recuperação cardíaca mais lenta)', () => {
    const profile = parseGeneraJson(DOUG_GENERA)
    expect(profile.recuperacaoMuscular).toBe('media')
  })

  it('riscoCardiovascular é medio quando fibrilação atrial está em risco aumentado', () => {
    const profile = parseGeneraJson(DOUG_GENERA)
    expect(profile.riscoCardiovascular).toBe('medio')
  })

  it('predisposicao é misto quando ACTN3 C,C (força) E NFIA-AS2 G,G (resistência aeróbica)', () => {
    const profile = parseGeneraJson(DOUG_GENERA)
    expect(profile.predisposicao).toBe('misto')
  })

  it('alertas vêm de resumo_fitness.pontos_de_atencao', () => {
    const profile = parseGeneraJson(DOUG_GENERA)
    expect(profile.alertas).toHaveLength(7)
    expect(profile.alertas).toContain(
      'Maior suscetibilidade de sofrer lesões no ligamento cruzado (COL1A1 C,C)'
    )
    expect(profile.alertas).toContain(
      'Recuperação da frequência cardíaca mais lenta após exercício'
    )
  })

  it('lança erro quando fit section está ausente', () => {
    expect(() => parseGeneraJson({})).toThrow('Dados Genera inválidos: seção "fit" ausente')
  })

  it('lança erro quando escala_risco_genetico está ausente', () => {
    expect(() => parseGeneraJson({ fit: {} })).toThrow(
      'Dados Genera inválidos: seção "escala_risco_genetico" ausente'
    )
  })

  it('predisposicao é forca quando ACTN3 C,C sem marcadores de resistência', () => {
    const forcaOnly = {
      ...DOUG_GENERA,
      fit: {
        ...DOUG_GENERA.fit,
        achados_adicionais: DOUG_GENERA.fit.achados_adicionais.filter(
          (e) => !['rs1572312', 'rs4253778'].includes(e.snp)
        ),
      },
    }
    const profile = parseGeneraJson(forcaOnly)
    expect(profile.predisposicao).toBe('forca')
  })

  it('metabolismo é lento quando FTO rs9939609 é A,A (IMC elevado)', () => {
    const lentoGenera = {
      ...DOUG_GENERA,
      fit: {
        ...DOUG_GENERA.fit,
        achados_adicionais: DOUG_GENERA.fit.achados_adicionais.map((e) =>
          e.snp === 'rs9939609' ? { ...e, genotipo: 'A,A', resultado: 'Predisposição para IMC elevado' } : e
        ),
      },
    }
    const profile = parseGeneraJson(lentoGenera)
    expect(profile.metabolismo).toBe('lento')
  })

  it('recuperacaoMuscular é alta quando CHRM2 G,G (recuperação cardíaca normal)', () => {
    const altaRecuperacao = {
      ...DOUG_GENERA,
      fit: {
        ...DOUG_GENERA.fit,
        cuidados_relevantes: DOUG_GENERA.fit.cuidados_relevantes.map((e) =>
          e.snp === 'rs324640' ? { ...e, genotipo: 'G,G', resultado: 'Recuperação cardíaca normal' } : e
        ),
      },
    }
    const profile = parseGeneraJson(altaRecuperacao)
    expect(profile.recuperacaoMuscular).toBe('alta')
  })

  it('riscoCardiovascular é alto quando duas+ condições cardiovasculares em risco aumentado', () => {
    const altoRisco = {
      ...DOUG_GENERA,
      escala_risco_genetico: {
        ...DOUG_GENERA.escala_risco_genetico,
        risco_aumentado: [
          { condicao: 'Fibrilação atrial', risco_pct: 27, nivel: 'aumentado' },
          { condicao: 'Doença arterial coronariana', risco_pct: 55, nivel: 'aumentado' },
        ],
      },
    }
    const profile = parseGeneraJson(altoRisco)
    expect(profile.riscoCardiovascular).toBe('alto')
  })
})
