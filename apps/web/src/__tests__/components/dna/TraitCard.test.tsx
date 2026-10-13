import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TraitCard, levelWord } from '@/components/dna/TraitCard'

describe('levelWord (0–1 → baixo/médio/alto)', () => {
  it('maps the thresholds 0.34 and 0.67', () => {
    expect(levelWord(0)).toBe('baixo')
    expect(levelWord(0.33)).toBe('baixo')
    expect(levelWord(0.34)).toBe('médio')
    expect(levelWord(0.66)).toBe('médio')
    expect(levelWord(0.67)).toBe('alto')
    expect(levelWord(1)).toBe('alto')
  })
})

describe('TraitCard (v2, spec 012 T059)', () => {
  it('shows the gene in italic mono, the genotype, the trait and the impact', () => {
    render(<TraitCard gene="COL1A1" genotype="C,C" label="Suscetibilidade a lesão ligamentar" level={0.9} note="Joelho alinhado." />)
    const gene = screen.getByText('COL1A1')
    expect(gene).toHaveClass('gene')
    expect(screen.getByText('C,C')).toHaveClass('n-sm')
    expect(screen.getByText('Suscetibilidade a lesão ligamentar')).toBeInTheDocument()
    expect(screen.getByText('Joelho alinhado.')).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveClass('hx-card')
  })

  it('shows the level as a word with 3 neutral bars', () => {
    render(<TraitCard gene="ACTN3" label="Fibras rápidas" level={0.5} note="" />)
    const level = screen.getByLabelText('nível médio')
    expect(level).toHaveTextContent('médio')
    expect(level.querySelectorAll('i')).toHaveLength(3)
  })

  it('marks the risk with the amber square only when warn', () => {
    const { rerender, container } = render(<TraitCard gene="COL1A1" label="Lesão" level={0.9} note="Cuidado." warn />)
    expect(container.querySelector('[data-warn]')).toBeInTheDocument()
    rerender(<TraitCard gene="ACTN3" label="Fibras" level={0.5} note="Ok." />)
    expect(container.querySelector('[data-warn]')).not.toBeInTheDocument()
  })

  it('omits the genotype when there is none', () => {
    render(<TraitCard gene="WNT16" label="Densidade óssea" level={0.5} note="" />)
    expect(screen.queryByText(/,/)).not.toBeInTheDocument()
  })
})
