import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/Skeleton'

describe('Skeleton', () => {
  it('aplica largura, altura e raio', () => {
    const { container } = render(<Skeleton width={120} height={16} radius="var(--r-sm)" />)
    const style = (container.firstChild as HTMLElement).getAttribute('style') ?? ''
    expect(style).toContain('width: 120px')
    expect(style).toContain('height: 16px')
    expect(style).toContain('border-radius: var(--r-sm)')
  })

  it('ocupa a largura toda e usa o raio de cartão por padrão', () => {
    const { container } = render(<Skeleton height="4rem" />)
    const style = (container.firstChild as HTMLElement).getAttribute('style') ?? ''
    expect(style).toContain('width: 100%')
    expect(style).toContain('height: 4rem')
    expect(style).toContain('border-radius: var(--r-card)')
  })

  it('é escondido de leitores de tela', () => {
    const { container } = render(<Skeleton height={10} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('usa a superfície do tema e a animação helux-pulse', () => {
    const { container } = render(<Skeleton height={10} />)
    const style = (container.firstChild as HTMLElement).getAttribute('style') ?? ''
    expect(style).toContain('background: var(--surface-1)')
    expect(style).toContain('helux-pulse')
  })

  it('mescla o style recebido', () => {
    const { container } = render(<Skeleton height={10} style={{ marginBottom: 12 }} />)
    expect((container.firstChild as HTMLElement).getAttribute('style')).toContain('margin-bottom: 12px')
  })
})
