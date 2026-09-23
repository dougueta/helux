import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tag, GeneTag } from '@/components/ui/Tag'

describe('Tag', () => {
  it('é um span não interativo com hx-tag', () => {
    render(<Tag>Quadríceps</Tag>)
    const t = screen.getByText('Quadríceps')
    expect(t.tagName).toBe('SPAN')
    expect(t).toHaveClass('hx-tag')
    expect(t).not.toHaveAttribute('role')
    expect(t).not.toHaveAttribute('tabindex')
  })

  it.each(['outline', 'warn'] as const)('variante %s', kind => {
    render(<Tag kind={kind}>X</Tag>)
    expect(screen.getByText('X')).toHaveClass('hx-tag', `hx-tag--${kind}`)
  })
})

describe('GeneTag', () => {
  it('símbolo em <i> e genótipo ao lado, com rótulo acessível', () => {
    render(<GeneTag symbol="COL1A1" genotype="C,C" />)
    const tag = screen.getByLabelText('marcador genético COL1A1 C,C')
    expect(tag).toHaveClass('hx-gtag')
    expect(tag).not.toHaveClass('hx-gtag--warn')
    const i = tag.querySelector('i')!
    expect(i).toHaveTextContent('COL1A1')
    expect(tag).toHaveTextContent('COL1A1C,C')
  })

  it('sem genótipo', () => {
    render(<GeneTag symbol="WNT16" />)
    expect(screen.getByLabelText('marcador genético WNT16')).toHaveTextContent('WNT16')
  })

  it('warn', () => {
    render(<GeneTag symbol="COL1A1" genotype="C,C" warn />)
    expect(screen.getByLabelText('marcador genético COL1A1 C,C')).toHaveClass('hx-gtag', 'hx-gtag--warn')
  })
})
