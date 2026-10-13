import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Helix } from '@/components/ui/Helix'
import { Fit } from '@/components/ui/Fit'

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduce && q.includes('reduce'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const lit = (rects: NodeListOf<SVGRectElement>, color: string) =>
  [...rects].filter(r => r.getAttribute('fill') === color).length

describe('Helix', () => {
  it('desenha n traços e acende round(n*value/100)', () => {
    const { container } = render(<Helix value={68} n={11} h={12} />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(11)
    expect(lit(rects, 'var(--fit-mid)')).toBe(7)
    expect(lit(rects, 'var(--rung-off)')).toBe(4)
  })

  it('alturas seguem |cos| com mínimo de 2', () => {
    const { container } = render(<Helix value={0} n={12} h={16} />)
    const rects = [...container.querySelectorAll('rect')]
    rects.forEach((r, i) => {
      const expected = Math.max(2, 16 * (0.26 + 0.74 * Math.abs(Math.cos((2 * Math.PI * i) / 10.5))))
      expect(Number(r.getAttribute('height'))).toBeCloseTo(expected)
    })
  })

  it('é aria-hidden', () => {
    const { container } = render(<Helix value={50} n={5} h={10} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('aceita a cor dos acesos', () => {
    const { container } = render(<Helix value={100} n={4} h={10} on="var(--accent)" />)
    expect(lit(container.querySelectorAll('rect'), 'var(--accent)')).toBe(4)
  })

  it('sequencial: atraso crescente por traço e acende depois de montar', () => {
    mockReducedMotion(false)
    vi.useFakeTimers()
    const { container } = render(<Helix value={100} n={5} h={20} on="var(--accent)" sequential delayMs={35} />)
    const rects = container.querySelectorAll('rect')
    expect(lit(rects, 'var(--accent)')).toBe(0)
    const delays = [...rects].map(r => r.style.transition)
    expect(delays[0]).toContain('0ms')
    expect(delays[1]).toContain('35ms')
    expect(delays[4]).toContain('140ms')
    act(() => { vi.advanceTimersByTime(300) })
    expect(lit(container.querySelectorAll('rect'), 'var(--accent)')).toBe(5)
  })

  it('sequencial com movimento reduzido: já aceso, sem atraso', () => {
    mockReducedMotion(true)
    const { container } = render(<Helix value={100} n={5} h={20} on="var(--accent)" sequential />)
    const rects = container.querySelectorAll('rect')
    expect(lit(rects, 'var(--accent)')).toBe(5)
    expect(rects[4].style.transition).toBe('')
  })
})

describe('Fit', () => {
  it('rótulo acessível com número e faixa, número na cor da faixa e "fit"', () => {
    render(<Fit value={68} />)
    const fit = screen.getByLabelText('fit genético 68 de 100, médio')
    expect(fit).toHaveClass('hx-fit', 'hx-fit--sm')
    const n = fit.querySelector('.hx-fit-n') as HTMLElement
    expect(n).toHaveTextContent('68')
    expect(n.style.color).toBe('var(--fit-mid)')
    expect(fit.querySelector('.hx-fit-u')).toHaveTextContent('fit')
  })

  it.each([
    ['sm', 11],
    ['md', 16],
    ['lg', 32],
  ] as const)('tamanho %s com %d traços', (size, n) => {
    const { container } = render(<Fit value={80} size={size} />)
    expect(container.querySelector('.hx-fit')).toHaveClass(`hx-fit--${size}`)
    expect(container.querySelectorAll('rect')).toHaveLength(n)
  })

  it('faixas alto e baixo', () => {
    render(<><Fit value={75} /><Fit value={49} /></>)
    expect(screen.getByLabelText('fit genético 75 de 100, alto')).toBeInTheDocument()
    expect(screen.getByLabelText('fit genético 49 de 100, baixo')).toBeInTheDocument()
  })

  it('sem o texto "fit" quando label=false', () => {
    const { container } = render(<Fit value={80} label={false} />)
    expect(container.querySelector('.hx-fit-u')).toBeNull()
  })
})
