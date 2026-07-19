import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Icon, HelixMark, ICONS } from '@/components/ui/icons'

describe('Icon', () => {
  it('renders the path for the given icon name', () => {
    const { container } = render(<Icon name="check" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.check)
  })

  it('renders play as a filled icon using the stroke color as fill', () => {
    const { container } = render(<Icon name="play" stroke="red" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('fill', 'red')
    expect(svg).toHaveAttribute('stroke', 'none')
  })

  it('applies size and custom style', () => {
    const { container } = render(<Icon name="dna" size={30} style={{ transform: 'rotate(180deg)' }} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveStyle({ transform: 'rotate(180deg)' })
  })

  it('includes a trophy path in the ICONS map', () => {
    expect(ICONS.trophy).toBe(
      'M7 5h10v3a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 17h4M9 20h6'
    )
  })

  it('includes an arrowUp path in the ICONS map', () => {
    expect(ICONS.arrowUp).toBe('M12 19V5M6 11l6-6 6 6')
  })

  it('renders the trophy icon as an svg path', () => {
    const { container } = render(<Icon name="trophy" size={18} stroke="var(--accent)" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.trophy)
  })

  it('renders the arrowUp icon as an svg path', () => {
    const { container } = render(<Icon name="arrowUp" size={13} stroke="var(--accent)" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.arrowUp)
  })

  it('has path data for pause, swap, and bolt', () => {
    expect(ICONS.pause).toBe('M9 5v14M15 5v14')
    expect(ICONS.swap).toBe('M7 7h11l-3-3M17 17H6l3 3')
    expect(ICONS.bolt).toBe('M13 3 5 13h6l-1 8 8-10h-6z')
  })

  it('renders the swap icon path', () => {
    const { container } = render(<Icon name="swap" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.swap)
  })
})

describe('HelixMark', () => {
  it('renders two strand paths', () => {
    const { container } = render(<HelixMark />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })
})
