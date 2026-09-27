import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { GeneticProfileView, GeneticTrait } from '@helux/types'
import { DnaClient, strandGenes } from '@/app/dna/DnaClient'

const trait = (over: Partial<GeneticTrait>): GeneticTrait => ({
  key: 'rs1:t',
  gene: 'GENE',
  label: 'Traço',
  level: 0.5,
  note: 'Nota',
  warn: false,
  ...over,
})

const TRAITS: GeneticTrait[] = [
  trait({ key: 'a', gene: 'WNT16', genotype: 'C,T', label: 'Densidade óssea', level: 0.9, note: 'Predisposição para menor densidade óssea', warn: true }),
  trait({ key: 'b', gene: 'COL1A1', genotype: 'C,C', label: 'Lesões de ombro', note: 'Predisposição para sofrer lesões de ombro', warn: true }),
  trait({ key: 'c', gene: 'ACTN3', genotype: 'C,C', label: 'Performance atlética', note: 'Força e explosão' }),
]

const profile = (traits: GeneticTrait[]): GeneticProfileView => ({
  metabolismo: 'moderado',
  recuperacaoMuscular: 'media',
  riscoCardiovascular: 'baixo',
  predisposicao: 'misto',
  alertas: [],
  traits,
})

describe('DnaClient com marcadores (spec 017, US1)', () => {
  it('mostra um card por marcador com gene, genótipo, traço e interpretação', () => {
    render(<DnaClient state={{ status: 'ok', profile: profile(TRAITS) }} />)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByText('Densidade óssea')).toBeInTheDocument()
    expect(screen.getByText('Predisposição para menor densidade óssea')).toBeInTheDocument()
    expect(screen.getByText('C,T')).toBeInTheDocument()
    expect(screen.getByText('Performance atlética')).toBeInTheDocument()
  })

  it('põe o ponto âmbar só nos marcadores de risco', () => {
    const { container } = render(<DnaClient state={{ status: 'ok', profile: profile(TRAITS) }} />)
    expect(container.querySelectorAll('[data-warn]')).toHaveLength(2)
  })

  it('conta os marcadores no resumo e no cabeçalho', () => {
    render(<DnaClient state={{ status: 'ok', profile: profile(TRAITS) }} />)
    expect(screen.getByText('3 de 3 lidos')).toBeInTheDocument()
    expect(screen.getByText(/^3 marcadores do teste Genera/)).toBeInTheDocument()
  })

  it('não mostra estado vazio nem erro quando há marcadores', () => {
    render(<DnaClient state={{ status: 'ok', profile: profile(TRAITS) }} />)
    expect(screen.queryByText('Marcadores ainda não disponíveis')).toBeNull()
    expect(screen.queryByText('Perfil genético não carregado')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('strandGenes (FR-009)', () => {
  it('devolve no máximo 4 genes únicos, na ordem (risco primeiro)', () => {
    const many = ['WNT16', 'FTO', 'PPARD', 'FTO', 'CHRM2', 'COL1A1', 'ACTN3'].map((gene, i) => trait({ key: String(i), gene }))
    expect(strandGenes(many)).toEqual(['WNT16', 'FTO', 'PPARD', 'CHRM2'])
  })

  it('com poucos marcadores, devolve todos', () => {
    expect(strandGenes(TRAITS)).toEqual(['WNT16', 'COL1A1', 'ACTN3'])
  })
})

describe('DnaClient sem marcadores (spec 017, US2)', () => {
  it('teste não carregado → "Perfil genético não carregado"', () => {
    render(<DnaClient state={{ status: 'missing' }} />)
    expect(screen.getByText('Perfil genético não carregado')).toBeInTheDocument()
    expect(screen.queryByRole('article')).toBeNull()
  })

  it('perfil sem marcadores → "Marcadores ainda não disponíveis"', () => {
    render(<DnaClient state={{ status: 'ok', profile: profile([]) }} />)
    expect(screen.getByText('Marcadores ainda não disponíveis')).toBeInTheDocument()
  })

  it('falha ao carregar → erro distinto dos estados vazios', () => {
    render(<DnaClient state={{ status: 'error' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar seu DNA')
    expect(screen.queryByText('Perfil genético não carregado')).toBeNull()
    expect(screen.queryByText('Marcadores ainda não disponíveis')).toBeNull()
  })
})
