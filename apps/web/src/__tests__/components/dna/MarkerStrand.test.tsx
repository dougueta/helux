import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkerStrand } from '@/components/dna/MarkerStrand'

describe('MarkerStrand (fita de marcadores, spec 012 T059)', () => {
  it('draws a static helix with one lit locus per gene and the gene names below', () => {
    const { container } = render(<MarkerStrand genes={['COL1A1', 'ACTN3', 'WNT16', 'PPARGC1A']} />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(44)
    const lit = [...rects].filter(r => r.getAttribute('fill') === 'var(--accent)')
    expect(lit).toHaveLength(4)
    for (const g of ['COL1A1', 'ACTN3', 'WNT16', 'PPARGC1A']) expect(screen.getByText(g)).toHaveClass('gene')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders nothing without genes', () => {
    const { container } = render(<MarkerStrand genes={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
