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
})

describe('HelixMark', () => {
  it('renders two strand paths', () => {
    const { container } = render(<HelixMark />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })
})
